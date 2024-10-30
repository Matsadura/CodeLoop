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


def test_submission(submission, code):
    import time
    import requests
    from models.solution_result import Solution_Result
    from models.task_test_cases import Task_Test_Cases
    """Test the submission using Judge0."""
    language = {'python': 71}
    task_test_cases = storage.all_list_specific(
        Task_Test_Cases, 'task_id', submission.task_id)

    test_cases = [{
        "test_case_id": tc.id,
        "stdin": tc.input,
        "expected_output": tc.expected_output
    } for tc in task_test_cases]

    submission_result = {}
    for test in test_cases:
        json_data = {
            'source_code': code,
            'language_id': language[submission.language],
            'stdin': test['stdin'],
            'expected_output': test['expected_output']
        }

        response = requests.post('http://localhost:2358/submissions',
                                 json=json_data)

        if response.status_code != 201:
            print("Submission failed:", response.json())
            return

        token = response.json().get('token')
        print(f"Submission token: {token}")

        while True:
            result_url = f'http://localhost:2358/submissions/{token}'

            result_response = requests.get(result_url)

            if result_response.status_code != 200:
                print("Error fetching r esult:", result_response.json())
                return

            result_data = result_response.json()

            if result_data['status']['id'] in [1, 2]:
                print("Submission is still processing...")
                time.sleep(1)
            else:
                if result_data['status']['id'] == 3:
                    status = 'pass'
                elif result_data['status']['id'] == 4:
                    status = 'fail'
                else:
                    status = 'error'
                # tmp print(result_data)
                submission_result[test['test_case_id']] = {
                    'status': status,
                    'stdout': result_data['stdout'],
                    'time': result_data['time'],
                    'stderr': result_data['stderr'],
                }
                solution_result_data = {
                    'submission_id': submission.id,
                    'task_test_case_id': test['test_case_id'],
                    'stdin':  test['stdin'],
                    'status': status,
                    'stdout': result_data['stdout'],
                    'expected_output':  test['expected_output'],
                    'stderr': result_data['stderr'],
                    'time': result_data['time'],
                }
                solution_result = Solution_Result(**solution_result_data)
                storage.new(solution_result)
                storage.save()
                print(submission_result)
                break

        for value in submission_result.values():
            if value['status'] == 'fail' or value['status'] == 'error':
                submission.status = 'incorrect'
                break
            else:
                submission.status = 'correct'
        storage.save()


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
    test_submission(submission, data['code'])
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
    my_submissions = []
    for submission in submissions:
        if submission.user_id == current_user:
            my_submissions.append(submission)
    return jsonify([submission.to_dict() for submission in my_submissions])


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
