""" Handle user_profile related routes

Routes:
    - /users/profile:
        - GET: Retrieve the current user's profile.
        - POST: Create the current user's profile.
        - PUT: Update the current user's profile.

Returns:
    - JSON response containing the profile data or appropriate error
      messages.
"""
from api import validation
from api.views import app_views
from api.views.auth import current_user_id
from flask import jsonify, request
from flask_jwt_extended import jwt_required
from models import storage
from models.user_profile import User_Profile

MAX_BIO_LENGTH = 2000


@app_views.route('/users/profile', methods=['GET', 'POST', 'PUT'])
@jwt_required()
def user_profile_routes():
    """Handle user_profile related routes

    - Header Authorization Bearer Token (required)

    POST:
    - Input:
        - bio: string (required, may be empty)
        - profile_pic: http(s) URL (required)

    PUT:
    - Input:
        - bio: string (Optional)
        - profile_pic: http(s) URL (Optional)
    """
    user_id = current_user_id()
    user_profile = storage.get_specific(User_Profile, 'user_id', user_id)

    if request.method == 'GET':
        if not user_profile:
            return jsonify({"error": "User profile not found"}), 404
        return jsonify(user_profile.to_dict())

    if request.method == 'POST':
        if user_profile:
            return jsonify({"error": "User profile already exists"}), 409
        data = validation.json_body()
        bio = validation.string(data, 'bio', MAX_BIO_LENGTH, allow_blank=True)
        profile_pic = validation.http_url(data, 'profile_pic', 512)
        user_profile = User_Profile(user_id=user_id, bio=bio,
                                    profile_pic=profile_pic)
        storage.new(user_profile)
        storage.save()
        return jsonify(user_profile.to_dict()), 201

    if not user_profile:
        return jsonify({"error": "User profile not found"}), 404
    data = validation.json_body()
    bio = validation.string(data, 'bio', MAX_BIO_LENGTH, required=False,
                            allow_blank=True)
    profile_pic = validation.http_url(data, 'profile_pic', 512,
                                      required=False)
    if bio is not None:
        user_profile.bio = bio
    if profile_pic is not None:
        user_profile.profile_pic = profile_pic
    user_profile.touch()
    storage.save()
    return jsonify(user_profile.to_dict())
