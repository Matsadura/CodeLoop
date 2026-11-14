"""Handles Categories related routes
This module requires JWT authentication for access.

Routes:
    - /categories
        - GET: List categories with their task count.
        - POST: Create a category (any authenticated user).
    - /categories/<category_id>/tasks
        - GET: List the tasks of a category.

Returns:
    JSON with appriopriate data or an error
"""
from api import validation
from api.views import app_views
from api.views.common import get_or_404
from flask import jsonify, request
from flask_jwt_extended import jwt_required
from models import storage
from models.category import CATEGORY_DIFFICULTIES, Category
from models.task import Task


def task_list_with_favorites(tasks):
    """Serialize tasks with their favorites count (one grouped query)"""
    from models.user_favorite import User_Favorite
    ids = [task.id for task in tasks]
    counts = storage.count_grouped(
        User_Favorite, 'task_id', User_Favorite.task_id.in_(ids)) \
        if ids else {}
    result = []
    for task in tasks:
        task_dict = task.to_dict()
        task_dict['favoritesCount'] = counts.get(task.id, 0)
        result.append(task_dict)
    return result


@app_views.route('/categories', methods=['GET', 'POST'])
@jwt_required()
def categories():
    """Handles Categories related routes

    - Header: Authorization Bearer <JWT> (required)

    POST:
        Input:
            - title: String (required, max 128)
            - description: String (required, max 512)
            - imageUrl: http(s) URL (required, max 512)
            - difficulty: Easy | Medium | Hard (case-insensitive)
    """
    if request.method == 'GET':
        counts = storage.count_grouped(Task, 'category_id')
        category_list = []
        for category in storage.all_list(Category):
            category_dict = category.to_dict()
            category_dict['tasksCount'] = counts.get(category.id, 0)
            category_list.append(category_dict)
        return jsonify(category_list)

    data = validation.json_body()
    title = validation.string(data, 'title', 128)
    description = validation.string(data, 'description', 512)
    image_url = validation.http_url(data, 'imageUrl', 512)
    difficulty = validation.choice(data, 'difficulty', CATEGORY_DIFFICULTIES)
    if storage.get_specific(Category, 'title', title):
        return jsonify({'error': 'Category already exists'}), 409
    category = Category(title=title, description=description,
                        imageUrl=image_url, difficulty=difficulty)
    storage.new(category)
    storage.save()
    return jsonify(category.to_dict()), 201


@app_views.route('/categories/<category_id>/tasks', methods=['GET'])
@jwt_required()
def get_category_tasks(category_id):
    """Get all tasks for a category (an empty list if it has none)"""
    get_or_404(Category, category_id, 'Category not found')
    tasks = storage.all_list_specific(Task, 'category_id', category_id)
    return jsonify(task_list_with_favorites(tasks))
