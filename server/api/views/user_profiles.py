""" Handle user_profile related routes

Routes:
    - /users/profile:
        - GET: Retrieve the current user's profile.
        - POST: Create a new user profile.
        - PUT: Update the current user's profile.

Attributes:
    - User_Profile: Class representing user profiles.
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
from models.user_profile import User_Profile


@app_views.route('/users/profile', methods=['GET', 'POST', 'PUT'])
@jwt_required()
def user_profile_routes():
    """Handle user_profile related routes

    - Header Authorization Bearer Token (required)

    POST:
    - Input:
        - bio: string (required)
        - profile_pic: string (required)

    PUT:
    - Input:
        - bio: string (Optional)
        - profile_pic: string (Optional)
    """
    current_user = isAuthenticated()
    user_profile = storage.get_specific(User_Profile, 'user_id', current_user)

    if request.method == 'GET':  # GET Current user profile
        if not user_profile:
            return jsonify({"error": "User profile not found"}), 404
        return jsonify(user_profile.to_dict())

    elif request.method == 'POST':  # Create new user profile
        if user_profile:
            return jsonify({"error": "User profile already exists"}), 400
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid data"}), 400
        if 'bio' not in data:
            return jsonify({"error": "Missing bio"}), 400
        if 'profile_pic' not in data:
            return jsonify({"error": "Missing profile_pic"}), 400
        user_profile = User_Profile(user_id=current_user, **data)
        storage.new(user_profile)
        storage.save()
        return jsonify(user_profile.to_dict()), 201

    elif request.method == 'PUT':  # Update user profile
        if not user_profile:
            return jsonify({"error": "User profile not found"}), 404
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid data"}), 400
        if 'bio' in data:
            user_profile.bio = data['bio']
        if 'profile_pic' in data:
            user_profile.profile_pic = data['profile_pic']
        user_profile.updated_at = datetime.now()
        storage.save()
        return jsonify(user_profile.to_dict())
