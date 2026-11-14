""" Handle submission related routes

Routes:
    - /tasks/<task_id>/submit:
        - POST: Submit code for a task and grade it with Judge0.
    - /tasks/<task_id>/submissions:
        - GET: Retrieve the current user's submissions for a task.
    - /submissions/<submission_id>:
        - GET: Retrieve one of the current user's submissions. Pending
          submissions are refreshed from Judge0 (without waiting).

Submit responses:
    - 201: graded; ``status`` is ``correct`` or ``incorrect``.
    - 202: accepted but still running; poll ``GET /submissions/<id>``.
    - 503: the execution service is unavailable; the submission is stored
      with status ``error`` and can be resubmitted later.
"""
from api import grading, validation
from api.views import app_views
from api.views.auth import current_user_id
from api.views.common import fail, get_or_404
from flask import current_app, jsonify
from flask_jwt_extended import jwt_required
from models import storage
from models.submission import Submission
from models.task import Task
from models.task_test_cases import Task_Test_Cases

MAX_CODE_LENGTH = 65000


def judge0_client():
    """The configured code runner (Judge0 or Piston client)"""
    return current_app.extensions['judge0_client']


def judge0_settings():
    return current_app.extensions['codeloop_settings'].judge0


def get_owned_submission(submission_id):
    """Return the submission if it belongs to the current user"""
    submission = get_or_404(Submission, submission_id,
                            'Submission not found')
    if submission.user_id != current_user_id():
        # 404 rather than 403 so submission ids cannot be probed.
        fail(404, 'Submission not found')
    return submission


@app_views.route('/tasks/<task_id>/submit', methods=['POST'])
@jwt_required()
def submit_task(task_id):
    """Submit a task

    - Header Authorization Bearer Token (required)

    POST:
    - Input:
        - code: string (required)
        - language: string (required, e.g. "python")
    """
    get_or_404(Task, task_id, 'Task not found')
    data = validation.json_body()
    code = validation.string(data, 'code', MAX_CODE_LENGTH, strip=False)
    if not code.strip():
        raise validation.ValidationError('Code is required', 'code')
    language = validation.string(data, 'language', 32).lower()
    client = judge0_client()
    supported = sorted(client.supported_languages() &
                       set(Submission.language.type.enums))
    if language not in supported:
        raise validation.ValidationError(
            f'Unsupported language "{language}". Supported: '
            f'{", ".join(supported)}', 'language')

    test_cases = storage.all_list_specific(Task_Test_Cases, 'task_id',
                                           task_id)
    if not test_cases:
        fail(409, 'This task has no test cases yet')

    submission = Submission(
        user_id=current_user_id(),
        task_id=task_id,
        code=code,
        language=language,
        status='pending'
    )
    storage.new(submission)
    storage.save()

    if not grading.start(client, submission, test_cases):
        return jsonify({'error': submission.status_detail,
                        'submission': submission.to_dict()}), 503

    settings = judge0_settings()
    done = grading.wait(client, submission, settings.sync_wait,
                        settings.poll_interval)
    return jsonify(submission.to_dict()), 201 if done else 202


@app_views.route('/tasks/<task_id>/submissions', methods=['GET'])
@jwt_required()
def get_submissions(task_id):
    """Get the current user's submissions for a task, newest first

    - Header Authorization Bearer Token (required)
    """
    get_or_404(Task, task_id, 'Task not found')
    submissions = storage.query(Submission).filter(
        Submission.task_id == task_id,
        Submission.user_id == current_user_id(),
    ).order_by(Submission.created_at.desc()).all()
    return jsonify([submission.to_dict() for submission in submissions])


@app_views.route('/submissions/<submission_id>', methods=['GET'])
@jwt_required()
def get_submission(submission_id):
    """Get a submission, refreshing it from Judge0 if still pending

    - Header Authorization Bearer Token (required)
    """
    submission = get_owned_submission(submission_id)
    if submission.status == 'pending':
        grading.refresh(judge0_client(), submission)
    return jsonify(submission.to_dict())
