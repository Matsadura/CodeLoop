"""Handles Categories related routes"""
from api.views import app_views
from flask import jsonify, request
from flask_jwt_extended import jwt_required
from models import storage
from models.category import Category


@app_views.route('/categories', methods=['GET', 'POST', 'DELETE', 'PUT'])
@jwt_required()
def categories():
    """Handles Categories related routes"""
    if request.method == 'GET':
        categories = storage.all_list(Category)
        return jsonify([category.to_dict() for category in categories])

    if request.method == 'POST':
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Not a JSON or No data provided'}), 400
        if 'name' not in data:
            return jsonify({'error': 'Missing name'}), 400
        existing_category = storage.get_specific(Category,
                                                 'name',
                                                 data['name'])
        if existing_category:
            return jsonify({'error': 'Category already exists'}), 409
        category = Category(**data)
        storage.new(category)
        storage.save()
        return jsonify(category.to_dict()), 201
