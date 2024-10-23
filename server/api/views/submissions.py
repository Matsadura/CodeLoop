""" Handle submission related routes

Routes:
    - /tasks/<task_id>/submit:
        - POST: Submit a task.
    - /tasks/<task_id>/submissions:
        - GET: Retrieve all submissions for a task.
    - /submissions/<submission_id>:
        - GET: Retrieve a specific submission.

Attributes:
    - Submission: Class representing submissions.
    - storage: Object for interacting with the database storage.
    - Task: Class representing tasks.

Exceptions:
    - Invalid token: Raised when the JWT token is invalid.
    - User not found: Raised when the user is not found in the database.
    - Unauthorized: Raised when the user is not authorized to access
        or modify the data.
    - Invalid data: Raised when the request data is invalid or missing.

Returns:
    - JSON response containing the submission data
    or appropriate error messages.
"""
from api.views import app_views
from api.views.auth import isAuthenticated
from flask import jsonify, request
from flask_jwt_extended import jwt_required
from models import storage
from models.submission import Submission
from models.task import Task


@app_views.route('/tasks/<task_id>/submit', methods=['POST'])
@jwt_required()
def submit_task(task_id):
    """Submit a task

    - Header Authorization Bearer Token (required)

    POST:
    - Input:
        - code: string (required)
        - language: string (required)

    """
    current_user = isAuthenticated()
    task = storage.get_specific(Task, 'id', task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    if not request.is_json:
        return jsonify({'error': 'Invalid JSON data'}), 400
    data = request.get_json()
    if not data.get('code'):
        return jsonify({'error': 'Code is required'}), 400
    if not data.get('language'):
        return jsonify({'error': 'Language is required'}), 400
    submission = Submission(
        user_id=current_user,
        task_id=task_id,
        code=data['code'],
        language=data['language'],
        status='pending'
    )
    storage.new(submission)
    storage.save()
    return jsonify(submission.to_dict()), 201


@app_views.route('/tasks/<task_id>/submissions', methods=['GET'])
@jwt_required()
def get_submissions(task_id):
    """Get all submissions for a task

    - Header Authorization Bearer Token (required)
    """
    current_user = isAuthenticated()
    task = storage.get_specific(Task, 'id', task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    submissions = storage.all_list_specific(Submission, 'task_id', task_id)
    for submission in submissions:
        if submission.user_id != current_user:
            return jsonify({'error': 'Unauthorized'}), 401
    return jsonify([submission.to_dict() for submission in submissions])


@app_views.route('/submissions/<submission_id>', methods=['GET'])
@jwt_required()
def get_submission(submission_id):
    """Get a submission

    - Header Authorization Bearer Token (required)
    """
    current_user = isAuthenticated()
    submission = storage.get_specific(Submission, 'id', submission_id)
    if not submission:
        return jsonify({'error': 'Submission not found'}), 404
    if submission.user_id != current_user:
        return jsonify({'error': 'Unauthorized'}), 401
    return jsonify(submission.to_dict())
