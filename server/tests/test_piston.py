"""Code submission flow with a mocked Piston API (CODE_RUNNER=piston)"""
import json

import pytest
import requests
import responses
from api.app import create_app
from api.config import ConfigError, load_settings
from api.piston import grade_execution, normalize_output
from models import storage

from tests.conftest import TEST_ENV, Api

PISTON_URL = 'http://piston.test'
EXECUTE = f'{PISTON_URL}/api/v2/execute'


@pytest.fixture
def piston_app():
    env = dict(TEST_ENV, CODE_RUNNER='piston', PISTON_URL=PISTON_URL,
               PISTON_MAX_RETRIES='0', PISTON_TOTAL_TIMEOUT='5')
    app = create_app(load_settings(env))
    storage.create_all()
    yield app
    storage.close()
    storage.drop_all()


@pytest.fixture
def setup(piston_app):
    api = Api(piston_app.test_client())
    headers = api.user()
    category = api.category(headers)
    task = api.task(headers, category['id'],
                    tests=(('[1, 2]', '3'), ('[5]', '5')))
    return api.client, headers, task


@pytest.fixture
def piston():
    with responses.RequestsMock(assert_all_requests_are_fired=False) as mock:
        yield mock


def run_result(stdout='', stderr='', code=0, status=None, compile=None):
    body = {'language': 'python', 'version': '3.12.0',
            'run': {'stdout': stdout, 'stderr': stderr, 'code': code,
                    'signal': None, 'status': status, 'message': None,
                    'wall_time': 12, 'cpu_time': 10}}
    if compile is not None:
        body['compile'] = compile
    return body


def answer_by_stdin(answers):
    """Piston mock that answers according to the submitted stdin"""
    def callback(request):
        payload = json.loads(request.body)
        return 200, {}, json.dumps(answers[payload['stdin']])
    return callback


def submit(client, headers, task, **body):
    payload = {'code': 'print(sum(eval(input())))', 'language': 'python'}
    payload.update(body)
    return client.post(f'/api/tasks/{task["id"]}/submit', headers=headers,
                       json=payload)


def test_correct_submission_is_graded_immediately(setup, piston):
    client, headers, task = setup
    piston.add_callback(responses.POST, EXECUTE, callback=answer_by_stdin({
        '[1, 2]': run_result('3\n'), '[5]': run_result('5 \r\n\n')}))
    response = submit(client, headers, task)
    assert response.status_code == 201
    assert response.get_json()['status'] == 'correct'

    sent = json.loads(piston.calls[0].request.body)
    assert sent['language'] == 'python' and sent['version'] == '3.12.0'
    assert sent['files'][0]['content'] == 'print(sum(eval(input())))'
    assert sent['run_timeout'] == 3000

    results = client.get(
        f'/api/submissions/{response.get_json()["id"]}/results',
        headers=headers).get_json()
    assert [r['status'] for r in results] == ['pass', 'pass']
    assert results[0]['time'] == '0.012'


def test_wrong_answer_and_runtime_error(setup, piston):
    client, headers, task = setup
    piston.add_callback(responses.POST, EXECUTE, callback=answer_by_stdin({
        '[1, 2]': run_result('4\n'),
        '[5]': run_result('', 'Traceback...\nNameError', code=1,
                          status='RE')}))
    response = submit(client, headers, task)
    assert response.status_code == 201
    assert response.get_json()['status'] == 'incorrect'
    results = client.get(
        f'/api/submissions/{response.get_json()["id"]}/results',
        headers=headers).get_json()
    assert [r['status'] for r in results] == ['fail', 'error']
    assert 'NameError' in results[1]['stderr']


def test_piston_unavailable_preserves_submission(setup, piston):
    client, headers, task = setup
    piston.add(responses.POST, EXECUTE,
               body=requests.ConnectionError('refused'))
    response = submit(client, headers, task)
    assert response.status_code == 503
    assert response.get_json()['submission']['status'] == 'error'


def test_piston_rejection_is_reported(setup, piston):
    client, headers, task = setup
    piston.add(responses.POST, EXECUTE, status=400,
               json={'message': 'python-3.12.0 runtime is unknown'})
    response = submit(client, headers, task)
    assert response.status_code == 503
    assert 'runtime is unknown' in \
        response.get_json()['submission']['status_detail']


def test_unsupported_language_with_piston(setup):
    client, headers, task = setup
    response = submit(client, headers, task, language='c')
    assert response.status_code == 400
    assert 'Supported: python' in response.get_json()['error']


@pytest.mark.parametrize('response, expected, status', [
    (run_result('3'), '3', 'pass'),
    (run_result('3'), '4', 'fail'),
    (run_result('', '', code=None, status='TO'), '3', 'error'),
    (run_result('', '', code=None, status='SG'), '3', 'error'),
    (run_result('3', compile={'code': 1, 'stderr': 'syntax error',
                              'status': None}), '3', 'error'),
])
def test_grade_execution(response, expected, status):
    assert grade_execution(response, expected)['status'] == status


def test_timeout_message_is_explained():
    result = grade_execution(run_result('', '', code=None, status='TO'), '3')
    assert result['stderr'] == 'Time limit exceeded'
    # Piston kills timed-out programs with SIGKILL: still a timeout.
    killed = run_result('', '', code=None, status='TO')
    killed['run']['signal'] = 'SIGKILL'
    assert grade_execution(killed, '3')['stderr'] == 'Time limit exceeded'


def test_runtime_error_keeps_traceback_only():
    response = run_result('', 'SyntaxError: invalid syntax\n', code=1,
                          status='RE')
    response['run']['message'] = 'Exited with error status 1'
    assert grade_execution(response, '3')['stderr'] == \
        'SyntaxError: invalid syntax\n'


def test_memory_kill_is_explained():
    result = grade_execution(
        run_result('', 'run: line 3: Killed', code=137, status='RE'), '3')
    assert result['status'] == 'error'
    assert 'memory limit' in result['stderr']


def test_normalize_output():
    assert normalize_output('a  \r\nb\n\n') == normalize_output('a\nb')
    assert normalize_output(None) == ''


def test_piston_config():
    env = dict(TEST_ENV, CODE_RUNNER='piston')
    del env['JUDGE0_URL']
    settings = load_settings(env)
    assert settings.piston.url == 'http://localhost:2000'
    assert settings.piston.languages == {'python': ('python', '3.12.0')}

    prod = {'APP_ENV': 'production', 'DATABASE_URL': 'mysql://u:p@db/x',
            'JWT_SECRET_KEY': 'x' * 40, 'CODE_RUNNER': 'piston'}
    with pytest.raises(ConfigError, match='PISTON_URL is required'):
        load_settings(prod)
    # Judge0 is not required when Piston is the runner.
    assert load_settings(dict(prod, PISTON_URL='http://piston:2000'))
    with pytest.raises(ConfigError, match='PISTON_LANGUAGES'):
        load_settings(dict(prod, PISTON_URL='http://p',
                           PISTON_LANGUAGES='python'))
    with pytest.raises(ConfigError, match='CODE_RUNNER'):
        load_settings(dict(prod, CODE_RUNNER='docker'))
