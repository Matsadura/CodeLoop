""" Tasks related routes
This module contains routes for managing tasks, including creating,
retrieving, updating, and deleting tasks.
This module requires JWT authentication for access control.

Routes:
    - /tasks:
        - GET: Retrieve all tasks.
        - POST: Create a new task.
    - /tasks/<task_id>:
        - GET: Retrieve a specific task.
        - PUT: Update a specific task.
        - DELETE: Delete a specific task.

Attributes:
    - Task: Class representing tasks.
    - storage: Object for interacting with the database storage.

Exceptions:
    - Invalid token: Raised when the JWT token is invalid.
    - User not found: Raised when the user is not found in the database.
    - Unauthorized: Raised when the user is not authorized to access
        or modify the data.
    - Invalid data: Raised when the request data is invalid or missing.

Returns:
    - JSON response containing the task data or appropriate error messages.
"""
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
    """Handle tasks related requests

    - Header: Authorization Bearer Token (required)

    POST:
        - Input:
            - title: String (required)
            - description: String (required)
            - difficulty: String (required)
            - category: String (required) # NOT IMPLEMENTED
    """
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
    """Handle tasks related requests

    - Header: Authorization Bearer Token (required)

    PUT:
        - Input:
            - title: String (optional)
            - description: String (optional)
            - difficulty: String (optional)
            - category: String (optional) # NOT IMPLEMENTED
    """
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
