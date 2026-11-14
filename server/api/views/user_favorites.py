""" Handle user_favorites related routes

This module contains routes for managing user_favorites tasks.
These routes require JWT authentication for access control.

Routes:
    - /users/favorites:
        - GET: Retrieve the current user's favorite tasks.
        - POST: Favorite a task.
        - DELETE: Remove a task from the current user's favorites.

POST and DELETE identify the task by ``task_id`` or, for backward
compatibility, by its unique ``title``.

Returns:
    - JSON response containing the user_favorite data
    or appropriate error messages.
"""

from api import validation
from api.views import app_views
from api.views.auth import current_user_id
from api.views.common import fail
from flask import jsonify, request
from flask_jwt_extended import jwt_required
from models import storage
from models.user_favorite import User_Favorite
from models.task import Task


def _task_from_body():
    data = validation.json_body()
    task_id = validation.string(data, 'task_id', 60, required=False)
    if task_id is not None:
        task = storage.get(Task, task_id)
    else:
        title = data.get('title')
        if not title:
            raise validation.ValidationError('No title provided', 'title')
        title = validation.string(data, 'title', 255)
        task = storage.get_specific(Task, 'title', title)
    if task is None:
        fail(404, 'Task not found')
    return task


@app_views.route('/users/favorites', methods=['GET', 'POST', 'DELETE'])
@jwt_required()
def handle_user_favorites():
    """Handle user_favorites related requests

    - Header: Authorization Bearer Token (required)
    POST & DELETE Input:
        - task_id: String, or
        - title: String
    """
    user_id = current_user_id()
    if request.method == 'GET':
        favorites = storage.all_list_specific(User_Favorite, 'user_id',
                                              user_id)
        return jsonify([favorite.to_dict() for favorite in favorites])

    task = _task_from_body()
    existing_favorite = storage.get_specific_double(
        User_Favorite, 'task_id', task.id, 'user_id', user_id)

    if request.method == 'POST':
        if existing_favorite:
            return jsonify({'error': "Task already favorited"}), 409
        user_favorite = User_Favorite(user_id=user_id, task_id=task.id)
        storage.new(user_favorite)
        storage.save()
        return jsonify(user_favorite.to_dict()), 201

    if not existing_favorite:
        return jsonify({'error': "Task not favorited"}), 404
    storage.delete(existing_favorite)
    storage.save()
    return jsonify({}), 200
