""" Handle user_favorites related routes

This module contains routes for managing user_favorites tasks.
These routes require JWT authentication for access control.

Routes:
    - /users/favorites:
        - GET: Retrieve all user_favorites tasks.
        - POST: Create a new user_favorite task.
        - DELETE: Delete all user_favorite tasks.

Exceptions:
    - Invalid token: Raised when the JWT token is invalid.
    - User not found: Raised when the user is not found in the database.
    - Unauthorized: Raised when the user is not authorized to access
        or modify the data.
    - Invalid data: Raised when the request data is invalid or missing.

Returns:
    - JSON response containing the user_favorite data
    or appropriate error messages.
"""

from api.views import app_views
from api.views.auth import isAuthenticated
from flask import jsonify, request
from flask_jwt_extended import jwt_required
from models import storage
from models.user_favorite import User_Favorite
from models.task import Task


@app_views.route('/users/favorites', methods=['GET', 'POST', 'DELETE'])
@jwt_required()
def handle_user_favorites():
    """Handle user_favorites related requests

    - Header: Authorization Bearer Token (required)
    POST & DELETE Input:
        - title: String (required)
    """
    current_user = isAuthenticated()
    if request.method == 'GET':  # Get all user_favorite tasks
        favorites = storage.all_list_specific(User_Favorite,
                                              'user_id',
                                              current_user)
        if not favorites:
            return jsonify([])
        favorites = [favorite.to_dict() for favorite in favorites]
        return jsonify(favorites)

    elif request.method == 'POST':  # Create a new user_favorite
        data = request.get_json()
        if not data:
            return jsonify({"error": "Not a JSON or No data provided"}), 400
        if not data.get('title'):
            return jsonify({"error": "No title provided"}), 400
        task = storage.get_specific(Task, 'title', data['title'])
        if not task:
            return jsonify({"error": "Task not found"}), 404
        existing_favorite = storage.get_specific_double(User_Favorite,
                                                 'task_id',
                                                 task.id,
                                                 'user_id',
                                                 current_user)
        if existing_favorite:
            return jsonify({'error': "Task already favorited"}), 409
        user_favorite = User_Favorite(user_id=current_user, task_id=task.id)
        storage.new(user_favorite)
        storage.save()
        return jsonify(user_favorite.to_dict()), 201

    elif request.method == 'DELETE':  # Delete a user_favorite
        data = request.get_json()
        if not data:
            return jsonify({"error": "Not a JSON or No data provided"}), 400
        if not data.get('title'):
            return jsonify({"error": "No title provided"}), 400
        task = storage.get_specific(Task, 'title', data['title'])
        if not task:
            return jsonify({"error": "Task not found"}), 404
        existing_favorite = storage.get_specific(User_Favorite,
                                                 'task_id',
                                                 task.id)
        if not existing_favorite:
            return jsonify({'error': "Task not favorited"}), 404
        storage.delete(existing_favorite)
        storage.save()
        return jsonify({}), 200
    return jsonify({"error": "Invalid request"}), 400
