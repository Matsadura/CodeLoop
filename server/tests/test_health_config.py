import pytest
from api.config import ConfigError, load_settings
from models import storage
from sqlalchemy.exc import OperationalError

from tests.conftest import TEST_ENV


def test_status_and_health(client):
    assert client.get('/api/status').get_json() == {'status': 'OK'}
    response = client.get('/api/health')
    assert response.status_code == 200
    assert response.get_json() == {'status': 'ok', 'database': 'ok'}
    assert client.get('/health').status_code == 200


def test_health_reports_database_failure(client, monkeypatch):
    def broken():
        raise OperationalError('SELECT 1', {}, Exception('down'))
    monkeypatch.setattr(storage, 'ping', broken)
    response = client.get('/api/health')
    assert response.status_code == 503
    assert response.get_json()['database'] == 'unavailable'


def test_unknown_route_and_method_are_json(client):
    response = client.get('/api/does-not-exist')
    assert response.status_code == 404
    assert response.get_json() == {'error': 'Not found'}
    response = client.delete('/api/status')
    assert response.status_code == 405
    assert response.get_json() == {'error': 'Method not allowed'}


def test_debug_route_removed(client):
    assert client.get('/volumes').status_code == 404


def test_cors_uses_allowlist(client):
    allowed = client.get('/api/status',
                         headers={'Origin': 'http://allowed.example'})
    assert allowed.headers.get('Access-Control-Allow-Origin') == \
        'http://allowed.example'
    denied = client.get('/api/status',
                        headers={'Origin': 'http://evil.example'})
    assert 'Access-Control-Allow-Origin' not in denied.headers


def _prod_env(**overrides):
    env = {'APP_ENV': 'production', 'DATABASE_URL': 'mysql://u:p@db/x',
           'JWT_SECRET_KEY': 'x' * 40, 'JUDGE0_URL': 'https://judge0',
           'CORS_ORIGINS': 'https://app.example'}
    env.update(overrides)
    return {k: v for k, v in env.items() if v is not None}


def test_production_settings_are_valid():
    settings = load_settings(_prod_env())
    assert settings.is_production
    assert settings.database_url.startswith('mysql+pymysql://')
    assert settings.cors_origins == ('https://app.example',)


@pytest.mark.parametrize('overrides, message', [
    ({'JWT_SECRET_KEY': None}, 'JWT_SECRET_KEY is required'),
    ({'JWT_SECRET_KEY': 'short'}, 'at least 32'),
    ({'CORS_ORIGINS': '*'}, 'explicit allowlist'),
    ({'JUDGE0_URL': None}, 'JUDGE0_URL is required'),
    ({'DATABASE_URL': None}, 'Set DATABASE_URL'),
    ({'APP_ENV': 'staging'}, 'APP_ENV must be one of'),
    ({'JUDGE0_LANGUAGE_IDS': 'python'}, 'JUDGE0_LANGUAGE_IDS'),
])
def test_invalid_production_settings_fail_fast(overrides, message):
    with pytest.raises(ConfigError, match=message):
        load_settings(_prod_env(**overrides))


def test_database_url_from_parts_escapes_password():
    env = dict(TEST_ENV)
    del env['DATABASE_URL']
    env.update(CODE_DB_HOST='db', CODE_DB_USER='u',
               CODE_DB_PASSWORD='p@ss/word', CODE_DB_NAME='CODE_DB')
    url = load_settings(env).database_url
    assert url.startswith('mysql+pymysql://u:p%40ss%2Fword@db:3306/CODE_DB')


def test_app_env_defaults_to_production():
    env = _prod_env()
    del env['APP_ENV']
    assert load_settings(env).env == 'production'
