""" Task test cases related routes """
from api.views import app_views
from api.views.auth import isAuthenticated
from datetime import datetime
from flask import jsonify, request
from flask_jwt_extended import jwt_required
from models import storage
from models.task import Task
from models.task_test_cases import Task_Test_Cases


@app_views.route('/tasks/<task_id>/test_cases', methods=['POST', 'GET'])
@jwt_required()
def create_task_test_case(task_id):
    """ Create a new task test case """
    current_user = isAuthenticated()
    task = storage.get_specific(Task, 'id', task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404

    if task.user_id != current_user:
        return jsonify({
            'error': 'Not authorized to access a test case for this task'
            }), 403

    if request.method == 'POST':
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Not a JSON or No data provided'}), 400

        input_text = data.get('input')
        expected_output = data.get('expected_output')
        if not input_text or not expected_output:
            return jsonify({'error': 'Missing input or expected output'}), 400
        existing_case = storage.get_specific(
            Task_Test_Cases,
            'input',
            input_text
            )
        if existing_case:
            return jsonify({'error': 'Test case already exists'}), 400
        task_test_case = Task_Test_Cases(
            input=input_text,
            expected_output=expected_output,
            task_id=task_id
        )
        storage.new(task_test_case)
        storage.save()
        return jsonify(task_test_case.to_dict()), 201

    elif request.method == 'GET':
        task_test_cases = storage.all_list_specific(
            Task_Test_Cases,
            'task_id',
            task_id
            )
        return jsonify([
            task_test_case.to_dict() for task_test_case in task_test_cases
            ])


@app_views.route('/tasks/<task_id>/test_cases/<test_case_id>',
                 methods=['GET', 'PUT', 'DELETE'])
@jwt_required()
def handle_task_test_case(task_id, test_case_id):
    """ Get, update, or delete a task test case """
    current_user = isAuthenticated()
    task = storage.get_specific(Task, 'id', task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    if task.user_id != current_user:
        return jsonify({
            'error': 'Not authorized to access a test case for this task'
            }), 403
    task_test_case = storage.get_specific(
        Task_Test_Cases,
        'id',
        test_case_id
        )
    if not task_test_case:
        return jsonify({'error': 'Test case not found'}), 404

    if request.method == 'GET':
        return jsonify(task_test_case.to_dict())

    elif request.method == 'PUT':
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Not a JSON or No data provided'}), 400
        if 'input' in data:
            task_test_case.input = data['input']
        if 'expected_output' in data:
            task_test_case.expected_output = data['expected_output']
        task_test_case.updated_at = datetime.now()
        storage.save()
        return jsonify(task_test_case.to_dict())

    elif request.method == 'DELETE':
        storage.delete(task_test_case)
        storage.save()
        return jsonify({}), 200
