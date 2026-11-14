import hashlib
from datetime import timedelta

from flask_jwt_extended import create_access_token
from models import storage
from models.user import User


def test_register_and_login(api):
    response = api.register('Ada@Example.com')
    assert response.status_code == 201
    body = response.get_json()
    assert body['email'] == 'ada@example.com'
    assert 'password' not in body

    login = api.login('ada@example.com')
    assert login.status_code == 200
    assert login.get_json()['token']
    # Email lookup is case-insensitive.
    assert api.login('ADA@example.com').status_code == 200


def test_password_is_salted_hash(api):
    api.register('a@example.com')
    user = storage.get_specific(User, 'email', 'a@example.com')
    assert user.password.startswith('pbkdf2:sha256:')
    assert 'password123' not in user.password


def test_duplicate_registration_conflicts(api):
    assert api.register('a@example.com').status_code == 201
    response = api.register('A@example.com')
    assert response.status_code == 409
    assert response.get_json() == {'error': 'User already exists'}


def test_register_validation(api, client):
    assert api.register('not-an-email').status_code == 400
    response = api.register('b@example.com', password='short')
    assert response.status_code == 400
    assert response.get_json()['field'] == 'password'
    response = client.post('/api/register', data='nope',
                           content_type='text/plain')
    assert response.status_code == 400
    response = client.post('/api/register', json={'email': 'x@y.z'})
    assert response.status_code == 400


def test_register_ignores_unexpected_fields(api):
    response = api.register('c@example.com', id='attacker-id',
                            created_at='2000-01-01T00:00:00.000000')
    assert response.status_code == 201
    assert response.get_json()['id'] != 'attacker-id'


def test_login_rejects_bad_credentials(api):
    api.register('a@example.com')
    response = api.login('a@example.com', 'wrong-password')
    assert response.status_code == 401
    assert response.get_json() == {'error': 'Invalid email or password'}
    assert api.login('nobody@example.com').status_code == 401


def test_legacy_sha256_password_is_upgraded(app, api):
    legacy = User(email='old@example.com', first_name='O', last_name='L')
    legacy.password = hashlib.sha256(b'legacy-pass').hexdigest()
    storage.new(legacy)
    storage.save()

    assert api.login('old@example.com', 'wrong').status_code == 401
    assert api.login('old@example.com', 'legacy-pass').status_code == 200
    storage.close()
    upgraded = storage.get(User, legacy.id)
    assert upgraded.password.startswith('pbkdf2:sha256:')
    assert api.login('old@example.com', 'legacy-pass').status_code == 200


def test_protected_routes_require_token(client):
    for path in ('/api/users', '/api/tasks', '/api/categories',
                 '/api/users/favorites', '/api/users/profile'):
        response = client.get(path)
        assert response.status_code == 401
        assert response.get_json() == {'error': 'Missing authorization token'}


def test_invalid_and_expired_tokens(app, api, client):
    response = client.get('/api/users',
                          headers={'Authorization': 'Bearer garbage'})
    assert response.status_code == 401
    assert response.get_json() == {'error': 'Invalid token'}

    api.register('a@example.com')
    user = storage.get_specific(User, 'email', 'a@example.com')
    with app.app_context():
        expired = create_access_token(identity=user,
                                      expires_delta=timedelta(seconds=-1))
    response = client.get('/api/users',
                          headers={'Authorization': f'Bearer {expired}'})
    assert response.status_code == 401
    assert 'expired' in response.get_json()['error']


def test_deleted_user_token_is_rejected(api, client):
    headers = api.user()
    assert client.delete('/api/users', headers=headers).status_code == 200
    response = client.get('/api/users', headers=headers)
    assert response.status_code == 401
    assert response.get_json() == {'error': 'User no longer exists'}


def test_update_user(api, client):
    headers = api.user()
    response = client.put('/api/users', headers=headers,
                          json={'first_name': 'Grace', 'email': 'x@y.z'})
    assert response.status_code == 200
    body = response.get_json()
    assert body['first_name'] == 'Grace'
    assert body['email'] != 'x@y.z'
