""" Users related routes
This module contains routes for managing user-related data, including
creating, retrieving, updating, and deleting user profiles.
This module requires JWT authentication for access control.

Routes:
    - /users:
        - GET: Retrieve the current user's profile.
        - DELETE: Delete the current user's profile.
        - PUT: Update the current user's profile.

Attributes:
    - User: Class representing users.
    - storage: Object for interacting with the database storage.

Exceptions:
    - Invalid token: Raised when the JWT token is invalid.
    - User not found: Raised when the user is not found in the database.
    - Unauthorized: Raised when the user is not authorized to access
        or modify the data.
    - Invalid data: Raised when the request data is invalid or missing.

Returns:
    - JSON response containing the user data or appropriate error messages.
"""
from api.views import app_views
from api.views.auth import isAuthenticated
from datetime import datetime
from flask import jsonify, request
from flask_jwt_extended import jwt_required
from models import storage
from models.user import User


@app_views.route('/users', methods=['GET'])
@jwt_required()
def get_user_profile():
    """Get current user data

    GET
        - Header: Authorization Bearer Token (required)
    """
    current_user = isAuthenticated()
    user_profile = storage.get_specific(User, 'id', current_user)
    if not user_profile:
        return jsonify({"error": "User not found"}), 404
    return jsonify(user_profile.to_dict())


@app_views.route('/users', methods=['DELETE', 'PUT'])
@jwt_required()
def update_user_profile():
    """Update user profile or delete user profile

    - Header: Authorization Bearer Token (required)

    DELETE:
        Output:
            - Message: "User profile deleted"
    PUT:
        - Input:
            - first_name: String (optional)
            - last_name: String (optional)
        Output:
            - User profile data
    """
    current_user = isAuthenticated()
    user_profile = storage.get_specific(User, 'id', current_user)
    if not user_profile:
        return jsonify({"error": "User not found"}), 404

    if request.method == 'DELETE':
        storage.delete(user_profile)
        storage.save()
        return jsonify({"message": "User profile deleted"}), 200

    if request.method == 'PUT':
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        if 'first_name' in data:
            user_profile.first.title = data['first_name']
        if 'last_name' in data:
            user_profile.last.title = data['last_name']
        user_profile.updated_at = datetime.now()
        storage.save()
        return jsonify(user_profile.to_dict()), 200
    return jsonify({"error": "Invalid request method"}), 400


@app_views.route('/users/statistics', methods=['GET'])
@jwt_required()
def get_user_statistics():
    """Get user statistics"""
    from models.submission import Submission
    from models.task import Task
    from models.user_favorite import User_Favorite

    current_user = isAuthenticated()
    statistics = {}
    statistics['count_favorites'] = storage.count_specific(
        User_Favorite, 'user_id', current_user)
    statistics['count_tasks'] = storage.count_specific(
        Task, 'user_id', current_user)
    statistics['count_submissions'] = storage.count_specific(
        Submission, 'user_id', current_user)
    statistics['count_incorrect'] = storage.count_specific_double(
        Submission, 'user_id', current_user, 'status', 'incorrect')
    statistics['count_correct'] = storage.count_specific_double(
        Submission, 'user_id', current_user, 'status', 'correct')
    statistics['count_pending'] = storage.count_specific_double(
        Submission, 'user_id', current_user, 'status', 'pending')
    if statistics['count_submissions'] == 0:
        statistics['incorrect_%'] = 0
        statistics['correct_%'] = 0
        statistics['pending_%'] = 0
    else:
        statistics['incorrect_%'] = (statistics['count_incorrect'] /
                                     statistics['count_submissions']) * 100
        statistics['correct_%'] = (statistics['count_correct'] /
                                   statistics['count_submissions']) * 100
        statistics['pending_%'] = (statistics['count_pending'] /
                                   statistics['count_submissions']) * 100
    return jsonify(statistics)


@app_views.route('/users/statistics/categories', methods=['GET'])
@jwt_required()
def get_user_statistics_categories():
    """Get user statistics per category including
        submission counts and percentages"""
    from flask import jsonify
    from models.category import Category
    from models.submission import Submission
    from models.task import Task
    from models.user_favorite import User_Favorite

    current_user = isAuthenticated()
    statistics = {}
    categories = storage.all_list(Category)

    for category in categories:
        category_stats = {
            'count_favorites': 0,
            'count_submissions': 0,
            'count_incorrect': 0,
            'count_correct': 0,
            'count_pending': 0,
            'incorrect_%': 0,
            'correct_%': 0,
            'pending_%': 0
        }

        tasks = storage.all_list_specific(Task, 'category_id', category.id)

        for task in tasks:
            category_stats['count_favorites'] += storage.count_specific_double(
                User_Favorite, 'user_id', current_user, 'task_id', task.id)
            category_stats['count_submissions'] += storage.count_specific_double(  # nopep8
                Submission, 'user_id', current_user, 'task_id', task.id)
            category_stats['count_incorrect'] += storage.count_specific_triple(
                Submission, 'user_id', current_user, 'task_id', task.id,
                'status', 'incorrect')
            category_stats['count_correct'] += storage.count_specific_triple(
                Submission, 'user_id', current_user, 'task_id', task.id,
                'status', 'correct')
            category_stats['count_pending'] += storage.count_specific_triple(
                Submission, 'user_id', current_user, 'task_id', task.id,
                'status', 'pending')

        if category_stats['count_submissions'] > 0:
            category_stats['incorrect_%'] = (category_stats['count_incorrect'] /  # nopep8
                                             category_stats['count_submissions']) * 100  # nopep8
            category_stats['correct_%'] = (category_stats['count_correct'] /
                                           category_stats['count_submissions']) * 100  # nopep8
            category_stats['pending_%'] = (category_stats['count_pending'] /
                                           category_stats['count_submissions']) * 100  # nopep8
        statistics[category.title] = category_stats
    return jsonify(statistics)
