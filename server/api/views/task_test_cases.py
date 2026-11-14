""" Task test cases related routes
This module contains routes for managing task test cases, including
creating, retrieving, updating, and deleting test cases.
Only the author of a task can see or change its test cases.

Routes:
    - /tasks/<task_id>/test_cases:
        - POST: Create a new task test case.
        - GET: Retrieve all test cases for a specific task.
    - /tasks/<task_id>/test_cases/<test_case_id>:
        - GET: Retrieve a specific task test case.
        - PUT: Update a specific task test case.
        - DELETE: Delete a specific task test case.

Returns:
    - JSON response containing the task test case data or appropriate error
        messages.
"""
from api import validation
from api.views import app_views
from api.views.auth import current_user_id
from api.views.common import fail, get_or_404
from flask import jsonify, request
from flask_jwt_extended import jwt_required
from models import storage
from models.task import Task
from models.task_test_cases import Task_Test_Cases

# TEXT columns hold 65,535 bytes; 16,000 characters fit even in 4-byte UTF-8.
MAX_TEST_DATA_LENGTH = 16000
MAX_TEST_CASES_PER_TASK = 50


def _test_data(data, field, required):
    value = validation.string(data, field, MAX_TEST_DATA_LENGTH,
                              required=required, strip=False)
    if value is not None and not value.strip():
        raise validation.ValidationError(
            f'{field} must not be empty (use "None" when no input is '
            'needed)', field)
    return value


def _owned_task(task_id):
    task = get_or_404(Task, task_id, 'Task not found')
    if task.user_id != current_user_id():
        fail(403, 'Not authorized to access a test case for this task')
    return task


def _check_duplicate(task_id, input_text, test_case_id=None):
    existing = storage.get_specific_double(
        Task_Test_Cases, 'input', input_text, 'task_id', task_id)
    if existing and existing.id != test_case_id:
        fail(409, 'Test case already exists')


@app_views.route('/tasks/<task_id>/test_cases', methods=['POST', 'GET'])
@jwt_required()
def create_task_test_case(task_id):
    """ Create or retrieve task test cases
    - Header: Authorization: Bearer <JWT>

    POST:
        - Input:
            - input: String (required)
            - expected_output: String (required)
    GET:
        - Output:
            - List of task test cases for the specified task.
    """
    _owned_task(task_id)

    if request.method == 'GET':
        task_test_cases = storage.all_list_specific(
            Task_Test_Cases, 'task_id', task_id)
        return jsonify([tc.to_dict() for tc in task_test_cases])

    data = validation.json_body()
    input_text = _test_data(data, 'input', required=True)
    expected_output = _test_data(data, 'expected_output', required=True)
    if storage.count_specific(Task_Test_Cases, 'task_id', task_id) >= \
            MAX_TEST_CASES_PER_TASK:
        fail(422, f'A task can have at most {MAX_TEST_CASES_PER_TASK} '
             'test cases')
    _check_duplicate(task_id, input_text)
    task_test_case = Task_Test_Cases(
        input=input_text,
        expected_output=expected_output,
        task_id=task_id
    )
    storage.new(task_test_case)
    storage.save()
    return jsonify(task_test_case.to_dict()), 201


@app_views.route('/tasks/<task_id>/test_cases/<test_case_id>',
                 methods=['GET', 'PUT', 'DELETE'])
@jwt_required()
def handle_task_test_case(task_id, test_case_id):
    """ Get, update, or delete a task test case

    - Header: Authorization: Bearer <JWT>
    PUT:
        - Input:
            - input: String (optional)
            - expected_output: String (optional)
    """
    _owned_task(task_id)
    task_test_case = storage.get(Task_Test_Cases, test_case_id)
    if task_test_case is None or task_test_case.task_id != task_id:
        fail(404, 'Test case not found')

    if request.method == 'GET':
        return jsonify(task_test_case.to_dict())

    if request.method == 'DELETE':
        storage.delete(task_test_case)
        storage.save()
        return jsonify({}), 200

    data = validation.json_body()
    input_text = _test_data(data, 'input', required=False)
    expected_output = _test_data(data, 'expected_output', required=False)
    if input_text is not None:
        _check_duplicate(task_id, input_text, task_test_case.id)
        task_test_case.input = input_text
    if expected_output is not None:
        task_test_case.expected_output = expected_output
    task_test_case.touch()
    storage.save()
    return jsonify(task_test_case.to_dict())
