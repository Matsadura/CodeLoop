""" Task test cases related routes """
from api.views import app_views
from api.views.auth import isAuthenticated
from datetime import datetime
from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from models import storage
from models.task import Task
from models.task_test_cases import Task_Test_Cases


@app_views.route('/tasks/<task_id>/test_cases', methods=['POST'])
@jwt_required()
def create_task_test_case(task_id):
    """ Create a new task test case """
    current_user = isAuthenticated()
    task = storage.get_specific(Task, 'id', task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    if task.user_id != current_user:
        return jsonify({'error': 'You are not authorized to create a test case for this task'}), 403
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Not a JSON or No data provided'}), 400
    
    input_text = data.get('input')
    expected_output = data.get('expected_output')
    if not input_text or not expected_output:
        return jsonify({'error': 'Missing input or expected output'}), 400
    task_test_case = Task_Test_Cases(
        input=input_text,
        expected_output=expected_output,
        task_id=task_id
    )
    storage.new(task_test_case)
    storage.save()
    return jsonify(task_test_case.to_dict()), 201


@app_views.route('/tasks/<task_id>/test_cases', methods=['GET'])
@jwt_required()
def get_task_test_cases(task_id):
    """ Get all test cases for a task """
    current_user = isAuthenticated()
    task = storage.get_specific(Task, 'id', task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    if task.user_id != current_user:
        return jsonify({'error': 'You are not authorized to view test cases for this task'}), 403

    task_test_cases = storage.all_list_specific(Task_Test_Cases, 'task_id', task_id)
    return jsonify([task_test_case.to_dict() for task_test_case in task_test_cases]), 200
