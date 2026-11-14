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
        - PUT: Update a specific task (author only).
        - DELETE: Delete a specific task (author only).

Returns:
    - JSON response containing the task data or appropriate error messages.
"""
from api import validation
from api.views import app_views
from api.views.auth import current_user_id
from api.views.categories import task_list_with_favorites
from api.views.common import fail, get_or_404
from flask import jsonify, request
from flask_jwt_extended import jwt_required
from models import storage
from models.category import Category
from models.task import TASK_DIFFICULTIES, Task

MAX_DESCRIPTION_LENGTH = 20000


def get_owned_task(task_id):
    """Return the task if the current user authored it (403 otherwise)"""
    task = get_or_404(Task, task_id, 'Task not found')
    if task.user_id != current_user_id():
        fail(403, 'Only the author of this task can modify it')
    return task


def _check_title_available(title, task_id=None):
    existing = storage.get_specific(Task, 'title', title)
    if existing and existing.id != task_id:
        fail(409, 'Task name already exists')


@app_views.route('/tasks', methods=['GET', 'POST'])
@jwt_required()
def handle_tasks():
    """Handle tasks related requests

    - Header: Authorization Bearer Token (required)

    POST:
        - Input:
            - title: String (required, max 255)
            - description: String (required, markdown)
            - difficulty: easy | medium | hard (required)
            - category_id: String (required)
    """
    if request.method == 'GET':  # Get all tasks
        return jsonify(task_list_with_favorites(storage.all_list(Task)))

    data = validation.json_body()
    title = validation.string(data, 'title', 255)
    description = validation.string(data, 'description',
                                    MAX_DESCRIPTION_LENGTH)
    difficulty = validation.choice(data, 'difficulty', TASK_DIFFICULTIES)
    category_id = validation.string(data, 'category_id', 60)
    if storage.get(Category, category_id) is None:
        raise validation.ValidationError('Category not found',
                                         'category_id')
    _check_title_available(title)
    task = Task(title=title, description=description, difficulty=difficulty,
                category_id=category_id, user_id=current_user_id())
    storage.new(task)
    storage.save()
    return jsonify(task.to_dict()), 201


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
            - category_id: String (optional)
    """
    if request.method == 'GET':  # Get a specific task
        task = get_or_404(Task, task_id, 'Task not found')
        return jsonify(task.to_dict())

    task = get_owned_task(task_id)

    if request.method == 'DELETE':
        storage.delete(task)
        storage.save()
        return jsonify({}), 200

    data = validation.json_body()
    title = validation.string(data, 'title', 255, required=False)
    description = validation.string(data, 'description',
                                    MAX_DESCRIPTION_LENGTH, required=False)
    difficulty = validation.choice(data, 'difficulty', TASK_DIFFICULTIES,
                                   required=False)
    category_id = validation.string(data, 'category_id', 60, required=False)
    if title is not None:
        _check_title_available(title, task.id)
        task.title = title
    if description is not None:
        task.description = description
    if difficulty is not None:
        task.difficulty = difficulty
    if category_id is not None:
        if storage.get(Category, category_id) is None:
            raise validation.ValidationError('Category not found',
                                             'category_id')
        task.category_id = category_id
    task.touch()
    storage.save()
    return jsonify(task.to_dict())
