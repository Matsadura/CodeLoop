"""Client for a self-hosted Piston code execution engine.

https://github.com/engineer-man/piston

Piston runs one program per HTTP request and answers when it finished, so
grading is synchronous: every test case is executed (a few in parallel)
and compared with its expected output here. Each request has a timeout and
the whole submission has an overall time budget, so an API request cannot
hang indefinitely.
"""
import logging
import time
from concurrent.futures import ThreadPoolExecutor, wait

import requests
from api.execution import ExecutionError, ExecutionUnavailable
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

logger = logging.getLogger(__name__)

# Piston stage status codes (README: "status" of the run/compile stage).
STATUS_MESSAGES = {
    'TO': 'Time limit exceeded',
    'SG': 'Killed by a signal (memory limit or crash)',
    'OL': 'Output limit exceeded',
    'EL': 'Error output limit exceeded',
    'XX': 'Internal error in the execution engine',
}
BUDGET_EXCEEDED = ('Not executed: the submission exceeded its overall time '
                   'budget.')


def normalize_output(text):
    """Compare outputs like an online judge: ignore trailing whitespace on
    each line, trailing blank lines and Windows line endings."""
    lines = (text or '').replace('\r\n', '\n').split('\n')
    return '\n'.join(line.rstrip() for line in lines).rstrip('\n')


def grade_execution(response, expected_output):
    """Turn a Piston /execute response into a test case result dict"""
    compile_stage = response.get('compile') or {}
    run_stage = response.get('run') or {}

    if compile_stage and (compile_stage.get('code') not in (0, None) or
                          compile_stage.get('status')):
        detail = compile_stage.get('stderr') or compile_stage.get(
            'output') or STATUS_MESSAGES.get(compile_stage.get('status'),
                                             'Compilation failed')
        return {'status': 'error', 'stdout': None, 'stderr': detail,
                'time': None}

    stdout = run_stage.get('stdout')
    stderr = run_stage.get('stderr') or None
    wall_time = run_stage.get('wall_time')
    elapsed = f'{wall_time / 1000:.3f}' if isinstance(
        wall_time, (int, float)) else None
    status = run_stage.get('status')

    if status or run_stage.get('code') not in (0, None):
        if status in STATUS_MESSAGES:
            message = STATUS_MESSAGES[status]
        elif run_stage.get('code') == 137 or run_stage.get('signal') in (
                'SIGKILL', 9):
            # Killed by the sandbox without a timeout: the memory limit.
            message = 'Killed: memory limit exceeded'
        else:
            # Generic "Exited with error status N" only when nothing else
            # explains the failure.
            message = None if stderr else run_stage.get('message')
        if message and message not in (stderr or ''):
            stderr = f'{stderr}\n{message}' if stderr else message
        return {'status': 'error', 'stdout': stdout, 'stderr': stderr,
                'time': elapsed}

    passed = normalize_output(stdout) == normalize_output(expected_output)
    return {'status': 'pass' if passed else 'fail', 'stdout': stdout,
            'stderr': stderr, 'time': elapsed}


class PistonClient:
    """Runs code on Piston and grades it against test cases"""

    # Results are available as soon as run_test_cases returns.
    synchronous = True

    def __init__(self, settings):
        self.settings = settings

    def _session(self):
        # One session per call: requests sessions are not guaranteed to be
        # thread safe and test cases run in parallel.
        session = requests.Session()
        retry = Retry(total=self.settings.max_retries,
                      connect=self.settings.max_retries, read=0, status=0,
                      backoff_factor=0.3)
        adapter = HTTPAdapter(max_retries=retry)
        session.mount('http://', adapter)
        session.mount('https://', adapter)
        return session

    def language_id(self, language):
        """(Piston language, version) for ``language`` or None"""
        return self.settings.languages.get(language)

    def supported_languages(self):
        """CodeLoop language names this backend can run"""
        return set(self.settings.languages)

    def execute(self, language, code, stdin):
        """Run ``code`` once and return Piston's JSON response"""
        target = self.language_id(language)
        if target is None:
            raise ExecutionError(f'Unsupported language "{language}"')
        piston_language, version = target
        payload = {
            'language': piston_language,
            'version': version,
            'files': [{'name': 'main', 'content': code}],
            'stdin': stdin or '',
            'run_timeout': self.settings.run_timeout_ms,
            'compile_timeout': self.settings.compile_timeout_ms,
            'run_memory_limit': self.settings.memory_limit_bytes,
            'compile_memory_limit': self.settings.memory_limit_bytes,
        }
        try:
            with self._session() as session:
                response = session.post(
                    f'{self.settings.url}/api/v2/execute', json=payload,
                    timeout=self.settings.request_timeout)
        except requests.RequestException as error:
            logger.warning('Piston request failed: %s',
                           error.__class__.__name__)
            raise ExecutionUnavailable(
                'Code execution service is unreachable') from error
        if response.status_code in (429, 502, 503, 504):
            raise ExecutionUnavailable(
                f'Code execution service is busy (HTTP '
                f'{response.status_code})')
        try:
            data = response.json()
        except ValueError as error:
            raise ExecutionError(
                'Code execution service returned invalid JSON') from error
        if response.status_code >= 400:
            message = data.get('message') if isinstance(data, dict) else None
            logger.warning('Piston rejected a request (HTTP %s): %s',
                           response.status_code, message)
            raise ExecutionError(
                f'Code execution service rejected the request: '
                f'{message or response.status_code}')
        if not isinstance(data, dict) or 'run' not in data:
            raise ExecutionError('Unexpected response from Piston')
        return data

    def run_test_cases(self, language, code, test_cases):
        """Execute ``code`` for every test case.

        Returns one result dict per test case, in order, with ``status``
        (pass/fail/error), ``stdout``, ``stderr`` and ``time``. Raises
        ``ExecutionUnavailable``/``ExecutionError`` if Piston cannot run
        the code at all.
        """
        deadline = time.monotonic() + self.settings.total_timeout
        pool = ThreadPoolExecutor(max_workers=self.settings.concurrency)
        try:
            futures = [pool.submit(self.execute, language, code, tc.input)
                       for tc in test_cases]
            wait(futures, timeout=max(0, deadline - time.monotonic()))
            results = []
            for tc, future in zip(test_cases, futures):
                if not future.done():
                    future.cancel()
                    results.append({'status': 'error', 'stdout': None,
                                    'stderr': BUDGET_EXCEEDED, 'time': None})
                    continue
                # Re-raises ExecutionError/ExecutionUnavailable.
                response = future.result()
                results.append(grade_execution(response, tc.expected_output))
            return results
        finally:
            pool.shutdown(wait=False, cancel_futures=True)
