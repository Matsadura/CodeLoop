""" Users related routes
This module contains routes for managing user-related data, including
retrieving, updating, and deleting the authenticated user's account.
This module requires JWT authentication for access control.

Routes:
    - /users:
        - GET: Retrieve the current user's account.
        - DELETE: Delete the current user's account.
        - PUT: Update the current user's first/last name.
    - /users/statistics:
        - GET: Submission statistics of the current user.
    - /users/statistics/categories:
        - GET: Submission statistics of the current user per category.

Returns:
    - JSON response containing the user data or appropriate error messages.
"""
from api import validation
from api.views import app_views
from api.views.auth import current_user_id
from api.views.common import get_or_404
from flask import jsonify, request
from flask_jwt_extended import jwt_required
from models import storage
from models.user import User
from sqlalchemy import func

STATUSES = ('incorrect', 'correct', 'pending')


@app_views.route('/users', methods=['GET'])
@jwt_required()
def get_user_profile():
    """Get current user data

    GET
        - Header: Authorization Bearer Token (required)
    """
    user = get_or_404(User, current_user_id(), 'User not found')
    return jsonify(user.to_dict())


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
    user = get_or_404(User, current_user_id(), 'User not found')

    if request.method == 'DELETE':
        storage.delete(user)
        storage.save()
        return jsonify({"message": "User profile deleted"}), 200

    data = validation.json_body()
    first_name = validation.string(data, 'first_name', 128, required=False)
    last_name = validation.string(data, 'last_name', 128, required=False)
    if first_name is not None:
        user.first_name = first_name
    if last_name is not None:
        user.last_name = last_name
    user.touch()
    storage.save()
    return jsonify(user.to_dict()), 200


def _with_percentages(stats):
    total = stats['count_submissions']
    for status in STATUSES:
        stats[f'{status}_%'] = (
            stats[f'count_{status}'] / total * 100) if total else 0
    return stats


@app_views.route('/users/statistics', methods=['GET'])
@jwt_required()
def get_user_statistics():
    """Get user statistics"""
    from models.submission import Submission
    from models.task import Task
    from models.user_favorite import User_Favorite

    user_id = current_user_id()
    by_status = storage.count_grouped(Submission, 'status',
                                      Submission.user_id == user_id)
    statistics = {
        'count_favorites': storage.count_specific(
            User_Favorite, 'user_id', user_id),
        'count_tasks': storage.count_specific(Task, 'user_id', user_id),
        'count_submissions': sum(by_status.values()),
        'count_error': by_status.get('error', 0),
    }
    for status in STATUSES:
        statistics[f'count_{status}'] = by_status.get(status, 0)
    return jsonify(_with_percentages(statistics))


@app_views.route('/users/statistics/categories', methods=['GET'])
@jwt_required()
def get_user_statistics_categories():
    """Get user statistics per category including
        submission counts and percentages"""
    from models.category import Category
    from models.submission import Submission
    from models.task import Task
    from models.user_favorite import User_Favorite

    user_id = current_user_id()
    session = storage.session

    favorites = dict(session.query(
        Task.category_id, func.count(User_Favorite.id))
        .join(Task, User_Favorite.task_id == Task.id)
        .filter(User_Favorite.user_id == user_id)
        .group_by(Task.category_id).all())

    submissions = {}
    rows = session.query(
        Task.category_id, Submission.status, func.count(Submission.id)) \
        .join(Task, Submission.task_id == Task.id) \
        .filter(Submission.user_id == user_id) \
        .group_by(Task.category_id, Submission.status).all()
    for category_id, status, count in rows:
        submissions.setdefault(category_id, {})[status] = count

    statistics = {}
    for category in storage.all_list(Category):
        by_status = submissions.get(category.id, {})
        category_stats = {
            'count_favorites': favorites.get(category.id, 0),
            'count_submissions': sum(by_status.values()),
        }
        for status in STATUSES:
            category_stats[f'count_{status}'] = by_status.get(status, 0)
        statistics[category.title] = _with_percentages(category_stats)
    return jsonify(statistics)
