""" Tasks related routes """
from api.views import app_views
from api.views.auth import isAuthenticated
from datetime import datetime
from flask import jsonify, request
from flask_jwt_extended import jwt_required
from models import storage
from models.task import Task


@app_views.route('/tasks', methods=['GET', 'POST'])
@jwt_required()
def handle_tasks():
    """Handle tasks related requests"""
    current_user = isAuthenticated()
    if request.method == 'GET':  # Get all tasks
        tasks = storage.all_list(Task)
        if not tasks:
            return jsonify([])
        tasks = [task.to_dict() for task in tasks]
        return jsonify(tasks)

    elif request.method == 'POST':  # Create a new task
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        if not data.get('title') or not data.get('description'):
            return jsonify({"error": "Invalid request"}), 400
        existing_task = storage.get_specific(Task, 'title', data['title'])
        if existing_task:
            return jsonify({'error': "Task name already exists"}), 409
        task = Task(user_id=current_user, **data)
        storage.new(task)
        storage.save()
        return jsonify(task.to_dict()), 201

    return jsonify({"error": "Invalid request"}), 400


@app_views.route('/tasks/<task_id>', methods=['GET', 'PUT', 'DELETE'])
@jwt_required()
def handle_specific_tasks(task_id):
    """Handle tasks related requests"""
    current_user = isAuthenticated()

    if request.method == 'GET':  # Get a specific task
        task = storage.get_specific(Task, 'id', task_id)
        if not task:
            return jsonify({"error": "Task not found"}), 404
        return jsonify(task.to_dict())

    elif request.method == 'PUT':  # Update a specific task
        task = storage.get_specific(Task, 'id', task_id)
        if not task:
            return jsonify({"error": "Task not found"}), 404
        if task.user_id != current_user:
            return jsonify({"error": "Unauthorized"}), 401
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        valid_attributes = ['title', 'description', 'difficulty']
        for k, v in data.items():
            if k in valid_attributes:
                setattr(task, k, v)
        task.updated_at = datetime.now()
        storage.save()
        return jsonify(task.to_dict())

    elif request.method == 'DELETE':  # Delete a specific task
        task = storage.get_specific(Task, 'id', task_id)
        if not task:
            return jsonify({"error": "Task not found"}), 404
        if task.user_id != current_user:
            return jsonify({"error": "Unauthorized"}), 401
        storage.delete(task)
        storage.save()
        return jsonify({}), 200
