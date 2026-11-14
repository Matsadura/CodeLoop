"""Shared pytest fixtures: an app on in-memory SQLite and API helpers."""
import pytest
from api.app import create_app
from api.config import load_settings
from models import storage

JUDGE0_URL = 'http://judge0.test'
TEST_ENV = {
    'APP_ENV': 'testing',
    'DATABASE_URL': 'sqlite://',
    'JWT_SECRET_KEY': 'test-secret-key-that-is-long-enough-123',
    'JUDGE0_URL': JUDGE0_URL,
    'JUDGE0_SYNC_WAIT': '0.3',
    'JUDGE0_POLL_INTERVAL': '0.05',
    'JUDGE0_MAX_RETRIES': '0',
    'JUDGE0_REQUEST_TIMEOUT': '2',
    'CORS_ORIGINS': 'http://allowed.example',
}


@pytest.fixture
def settings():
    return load_settings(TEST_ENV)


@pytest.fixture
def app(settings):
    app = create_app(settings)
    storage.create_all()
    yield app
    storage.close()
    storage.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


class Api:
    """Tiny helper around the Flask test client"""

    def __init__(self, client):
        self.client = client
        self._counter = 0

    def register(self, email=None, password='password123', **extra):
        self._counter += 1
        email = email or f'user{self._counter}@example.com'
        body = {'email': email, 'password': password,
                'first_name': 'Ada', 'last_name': 'Lovelace'}
        body.update(extra)
        return self.client.post('/api/register', json=body)

    def login(self, email, password='password123'):
        return self.client.post('/api/login',
                                json={'email': email, 'password': password})

    def user(self, email=None):
        """Register + login, return auth headers"""
        response = self.register(email)
        assert response.status_code == 201, response.get_json()
        email = response.get_json()['email']
        token = self.login(email).get_json()['token']
        return {'Authorization': f'Bearer {token}'}

    def category(self, headers, title='Algorithms'):
        response = self.client.post('/api/categories', headers=headers, json={
            'title': title, 'description': 'desc',
            'imageUrl': 'https://example.com/a.png', 'difficulty': 'easy'})
        assert response.status_code == 201, response.get_json()
        return response.get_json()

    def task(self, headers, category_id, title='Sum a list',
             tests=(('[1, 2]', '3'),)):
        response = self.client.post('/api/tasks', headers=headers, json={
            'title': title, 'description': '# Sum', 'difficulty': 'easy',
            'category_id': category_id})
        assert response.status_code == 201, response.get_json()
        task = response.get_json()
        for stdin, expected in tests:
            r = self.client.post(f'/api/tasks/{task["id"]}/test_cases',
                                 headers=headers,
                                 json={'input': stdin,
                                       'expected_output': expected})
            assert r.status_code == 201, r.get_json()
        return task


@pytest.fixture
def api(client):
    return Api(client)
