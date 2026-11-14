"""Grade submissions by running them against a task's test cases.

Flow:
1. ``start`` sends every test case to Judge0 in one batch and stores the
   returned tokens on the submission (status ``pending``).
2. ``refresh`` fetches the batch results once; when every execution has
   finished it stores one ``Solution_Result`` per test case and marks the
   submission ``correct`` or ``incorrect``.
3. ``wait`` calls ``refresh`` until the results are ready or a deadline
   passes. The HTTP request therefore never blocks for longer than
   ``JUDGE0_SYNC_WAIT``; clients poll ``GET /api/submissions/<id>``
   afterwards, which refreshes pending submissions.

If Judge0 cannot be reached when a submission is created, the submission
is kept with status ``error`` and a ``status_detail`` explaining why, so no
work is silently lost or wrongly graded.
"""
import json
import logging
import time

from api.judge0 import (PENDING_STATUSES, STATUS_ACCEPTED,
                        STATUS_WRONG_ANSWER, Judge0Error, Judge0Unavailable)
from models import storage
from models.solution_result import Solution_Result
from models.submission import Submission

logger = logging.getLogger(__name__)

UNAVAILABLE_DETAIL = 'Code execution service is unavailable; please retry.'
STILL_RUNNING_DETAIL = 'Waiting for the code execution service.'


def _result_status(judge0_status_id):
    if judge0_status_id == STATUS_ACCEPTED:
        return 'pass'
    if judge0_status_id == STATUS_WRONG_ANSWER:
        return 'fail'
    return 'error'


def _stderr(result):
    """Best explanation of a failed execution for the learner"""
    parts = [result.get('compile_output'), result.get('stderr')]
    text = '\n'.join(p for p in parts if p)
    if not text and _result_status(
            (result.get('status') or {}).get('id')) == 'error':
        status = result.get('status') or {}
        text = result.get('message') or status.get('description') or ''
    return text or None


def start(client, submission, test_cases):
    """Send ``submission`` to Judge0. Commits the submission state."""
    language_id = client.language_id(submission.language)
    items = [{
        'source_code': submission.code,
        'language_id': language_id,
        'stdin': tc.input,
        'expected_output': tc.expected_output,
    } for tc in test_cases]
    try:
        tokens = client.submit_batch(items)
    except Judge0Unavailable:
        submission.status = 'error'
        submission.status_detail = UNAVAILABLE_DETAIL
        storage.save()
        return False
    except Judge0Error as error:
        submission.status = 'error'
        submission.status_detail = str(error)[:255]
        storage.save()
        return False
    submission.judge0_tokens = json.dumps([{
        'test_case_id': tc.id,
        'token': token,
        'stdin': tc.input,
        'expected_output': tc.expected_output,
    } for tc, token in zip(test_cases, tokens)])
    submission.status = 'pending'
    submission.status_detail = STILL_RUNNING_DETAIL
    storage.save()
    return True


def refresh(client, submission):
    """Fetch results once. Returns True when the submission is graded."""
    if submission.status != 'pending' or not submission.judge0_tokens:
        return submission.status != 'pending'
    executions = json.loads(submission.judge0_tokens)
    try:
        results = client.get_batch([e['token'] for e in executions])
    except Judge0Error as error:
        logger.info('Could not refresh submission %s: %s', submission.id,
                    error)
        return False
    for execution in executions:
        result = results.get(execution['token'])
        if result is None or \
                (result.get('status') or {}).get('id') in PENDING_STATUSES:
            return False

    # Lock the row so concurrent refreshes cannot store results twice.
    locked = storage.query(Submission).filter(
        Submission.id == submission.id).with_for_update() \
        .populate_existing().one()
    if locked.status != 'pending':
        storage.save()
        return True
    all_passed = True
    for execution in executions:
        result = results[execution['token']]
        status = _result_status((result.get('status') or {}).get('id'))
        all_passed = all_passed and status == 'pass'
        storage.new(Solution_Result(
            submission_id=locked.id,
            task_test_case_id=execution['test_case_id'],
            stdin=execution['stdin'],
            expected_output=execution['expected_output'],
            status=status,
            stdout=result.get('stdout'),
            stderr=_stderr(result),
            time=result.get('time'),
        ))
    locked.status = 'correct' if all_passed else 'incorrect'
    locked.status_detail = None
    locked.touch()
    storage.save()
    return True


def wait(client, submission, timeout, poll_interval):
    """Refresh until graded or ``timeout`` seconds elapsed"""
    deadline = time.monotonic() + timeout
    while True:
        if refresh(client, submission):
            return True
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            return False
        time.sleep(min(poll_interval, remaining))
