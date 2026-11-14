"""Auth routes

This module contains routes for user authentication and registration.
Routes:
    - /register:
        - POST: Register a new user.
    - /login:
        - POST: Log in a user and generate a JWT token.
Exceptions:
    - Invalid data: Raised when the request data is invalid or missing.
    - User already exists: Raised when the email is already registered.
Returns:
    - JSON response containing the user data or appropriate error messages.
"""
from api import validation
from api.views import app_views
from flask import jsonify
from flask_jwt_extended import (JWTManager, create_access_token,
                                get_jwt_identity)
from models import storage
from models.user import User
from sqlalchemy import func


jwt = JWTManager()


@jwt.user_identity_loader
def user_identity_lookup(user):
    """Tokens store the user id as subject"""
    return user.id if isinstance(user, User) else str(user)


@jwt.user_lookup_loader
def user_lookup_callback(_jwt_header, jwt_data):
    """Reject tokens whose user no longer exists"""
    return storage.get(User, jwt_data["sub"])


def _jwt_error(message):
    return jsonify({'error': message}), 401


@jwt.expired_token_loader
def expired_token_callback(_jwt_header, _jwt_data):
    return _jwt_error('Session expired, please log in again')


@jwt.invalid_token_loader
def invalid_token_callback(_reason):
    return _jwt_error('Invalid token')


@jwt.unauthorized_loader
def missing_token_callback(_reason):
    return _jwt_error('Missing authorization token')


@jwt.user_lookup_error_loader
def user_lookup_error_callback(_jwt_header, _jwt_data):
    return _jwt_error('User no longer exists')


def current_user_id():
    """Id of the authenticated user (requires ``@jwt_required``)"""
    return get_jwt_identity()


# Backward compatible name used by older views.
isAuthenticated = current_user_id


def find_user_by_email(email):
    """Case-insensitive email lookup"""
    return storage.query(User).filter(
        func.lower(User.email) == email.lower()).first()


@app_views.route('/register', methods=['POST'])
def register_user():
    """Register a new user
    POST
        Input:
        - email: String (required)
        - password: String (required, min 8 characters)
        - first_name: String (required)
        - last_name: String (required)
    """
    data = validation.json_body()
    email = validation.email(data)
    password = validation.password(data)
    first_name = validation.string(data, 'first_name', 128)
    last_name = validation.string(data, 'last_name', 128)

    if find_user_by_email(email):
        return jsonify({'error': 'User already exists'}), 409

    new_user = User(email=email, password=password,
                    first_name=first_name, last_name=last_name)
    storage.new(new_user)
    storage.save()

    return jsonify(new_user.to_dict()), 201


@app_views.route('/login', methods=['POST'])
def login():
    """Sign in an user

    POST:
        Input:
            - email: String (required)
            - password: String (required)
        Returns:
            - {"token": "<JWT>"} or an error message.
    """
    data = validation.json_body()
    email = validation.string(data, 'email', 128)
    password = validation.string(data, 'password', 128, strip=False)

    user = find_user_by_email(email)
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid email or password'}), 401

    if user.password_needs_rehash:
        # Transparently upgrade legacy unsalted hashes.
        user.set_password(password)
        storage.save()

    token = create_access_token(identity=user)
    return jsonify({'token': token})
