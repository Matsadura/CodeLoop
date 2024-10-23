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
            user_profile.first_name = data['first_name']
        if 'last_name' in data:
            user_profile.last_name = data['last_name']
        user_profile.updated_at = datetime.now()
        storage.save()
        return jsonify(user_profile.to_dict()), 200
    return jsonify({"error": "Invalid request method"}), 400
