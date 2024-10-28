"""Handles Categories related routes
This module requires JWT authentication for access.

Routes:
    - /categories

Returns:
    JSON with appriopriate data or an error
"""
from api.views import app_views
from flask import jsonify, request
from flask_jwt_extended import jwt_required
from models import storage
from models.category import Category
from models.task import Task


@app_views.route('/categories', methods=['GET', 'POST', 'DELETE', 'PUT'])
@jwt_required()
def categories():
    """Handles Categories related routes

    - Header: Authorization Bearer <JWT> (required)

    POST:
        Input:
            - title: String (required)
    """
    if request.method == 'GET':
        categories = storage.all_list(Category)
        category_list = []
        for category in categories:
            category = category.to_dict()
            category['tasksCount'] = storage.count_specific(Task,
                                                            'category_id',
                                                            category['id'])
            category_list.append(category)
        return jsonify(category_list)

    if request.method == 'POST':
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Not a JSON or No data provided'}), 400
        if 'title' not in data:
            return jsonify({'error': 'Missing title'}), 400
        existing_category = storage.get_specific(Category,
                                                 'title',
                                                 data['title'])
        if existing_category:
            return jsonify({'error': 'Category already exists'}), 409
        if 'imageUrl' not in data:
            return jsonify({'error': 'Missing image url'}), 400
        if 'difficulty' not in data:
            return jsonify({'error': 'Missing difficulty'}), 400
        if 'description' not in data:
            return jsonify({'error': 'Missing description'}), 400
        category = Category(**data)
        storage.new(category)
        storage.save()
        return jsonify(category.to_dict()), 201


@app_views.route('/categories/<category_id>/tasks', methods=['GET'])
@jwt_required()
def get_category_tasks(category_id):
    """Get all tasks for a category"""
    category = storage.get_specific(Category, 'id', category_id)
    if not category:
        return jsonify({'error': 'Category not found'}), 404
    tasks = storage.all_list_specific(Task, 'category_id', category_id)
    if not tasks:
        return jsonify({'error': 'No tasks found for this category'}), 404
    return jsonify([task.to_dict() for task in tasks])
