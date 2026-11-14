"""Code submission flow with a mocked Judge0 API"""
import base64
import json

import pytest
import requests
import responses

from tests.conftest import JUDGE0_URL


def b64(text):
    return base64.b64encode(text.encode()).decode()


@pytest.fixture
def judge0():
    with responses.RequestsMock(assert_all_requests_are_fired=False) as mock:
        yield mock


@pytest.fixture
def task_setup(api):
    headers = api.user()
    category = api.category(headers)
    task = api.task(headers, category['id'],
                    tests=(('[1, 2]', '3'), ('[5]', '5')))
    return headers, task


def mock_batch(judge0, statuses, stdout='3\n'):
    tokens = [f'tok{i}' for i in range(len(statuses))]
    judge0.add(responses.POST, f'{JUDGE0_URL}/submissions/batch',
               json=[{'token': t} for t in tokens], status=201)
    judge0.add(responses.GET, f'{JUDGE0_URL}/submissions/batch', json={
        'submissions': [{
            'token': token, 'stdout': b64(stdout), 'stderr': None,
            'compile_output': None, 'message': None, 'time': '0.01',
            'status': {'id': status, 'description': 'x'}}
            for token, status in zip(tokens, statuses)]})
    return tokens


def submit(client, headers, task, **body):
    payload = {'code': 'print(3)', 'language': 'python'}
    payload.update(body)
    return client.post(f'/api/tasks/{task["id"]}/submit', headers=headers,
                       json=payload)


def test_correct_submission(client, judge0, task_setup):
    headers, task = task_setup
    mock_batch(judge0, [3, 3])
    response = submit(client, headers, task)
    assert response.status_code == 201
    body = response.get_json()
    assert body['status'] == 'correct'
    assert 'judge0_tokens' not in body

    sent = json.loads(judge0.calls[0].request.body)['submissions']
    assert sent[0]['language_id'] == 71
    assert base64.b64decode(sent[0]['source_code']).decode() == 'print(3)'

    results = client.get(f'/api/submissions/{body["id"]}/results',
                         headers=headers)
    assert results.status_code == 200
    assert {r['status'] for r in results.get_json()} == {'pass'}
    assert results.get_json()[0]['stdout'] == '3\n'

    history = client.get(f'/api/tasks/{task["id"]}/submissions',
                         headers=headers).get_json()
    assert [s['status'] for s in history] == ['correct']
    stats = client.get('/api/users/statistics', headers=headers).get_json()
    assert stats['count_correct'] == 1 and stats['correct_%'] == 100


def test_incorrect_submission_reports_errors(client, judge0, task_setup):
    headers, task = task_setup
    mock_batch(judge0, [4, 11])
    response = submit(client, headers, task)
    assert response.status_code == 201
    assert response.get_json()['status'] == 'incorrect'
    results = client.get(
        f'/api/submissions/{response.get_json()["id"]}/results',
        headers=headers).get_json()
    assert sorted(r['status'] for r in results) == ['error', 'fail']


def test_pending_submission_is_refreshed_later(client, judge0, task_setup):
    headers, task = task_setup
    tokens = ['a', 'b']
    judge0.add(responses.POST, f'{JUDGE0_URL}/submissions/batch',
               json=[{'token': t} for t in tokens], status=201)
    processing = {'submissions': [
        {'token': t, 'status': {'id': 2}} for t in tokens]}
    judge0.add(responses.GET, f'{JUDGE0_URL}/submissions/batch',
               json=processing)

    response = submit(client, headers, task)
    assert response.status_code == 202
    submission = response.get_json()
    assert submission['status'] == 'pending'

    judge0.replace(responses.GET, f'{JUDGE0_URL}/submissions/batch', json={
        'submissions': [{'token': t, 'stdout': b64('3'), 'time': '0.1',
                         'status': {'id': 3}} for t in tokens]})
    refreshed = client.get(f'/api/submissions/{submission["id"]}',
                           headers=headers)
    assert refreshed.get_json()['status'] == 'correct'
    # A second refresh does not duplicate results.
    client.get(f'/api/submissions/{submission["id"]}', headers=headers)
    results = client.get(f'/api/submissions/{submission["id"]}/results',
                         headers=headers).get_json()
    assert len(results) == 2


def test_judge0_unavailable_preserves_submission(client, judge0,
                                                 task_setup):
    headers, task = task_setup
    judge0.add(responses.POST, f'{JUDGE0_URL}/submissions/batch',
               body=requests.ConnectionError('refused'))
    response = submit(client, headers, task)
    assert response.status_code == 503
    body = response.get_json()
    assert 'unavailable' in body['error']
    assert body['submission']['status'] == 'error'

    history = client.get(f'/api/tasks/{task["id"]}/submissions',
                         headers=headers).get_json()
    assert history[0]['status'] == 'error'
    assert history[0]['code'] == 'print(3)'


def test_judge0_busy_is_unavailable(client, judge0, task_setup):
    headers, task = task_setup
    judge0.add(responses.POST, f'{JUDGE0_URL}/submissions/batch',
               status=503, body='busy')
    assert submit(client, headers, task).status_code == 503


def test_submission_validation(client, task_setup, api):
    headers, task = task_setup
    response = submit(client, headers, task, language='cobol')
    assert response.status_code == 400
    assert 'Unsupported language' in response.get_json()['error']
    assert submit(client, headers, task, code='   ').status_code == 400
    assert submit(client, headers, task, code=None).status_code == 400
    assert client.post('/api/tasks/missing/submit', headers=headers,
                       json={'code': 'x', 'language': 'python'}
                       ).status_code == 404

    category = api.category(headers, title='Empty')
    empty = client.post('/api/tasks', headers=headers, json={
        'title': 'No tests', 'description': 'd', 'difficulty': 'easy',
        'category_id': category['id']}).get_json()
    response = submit(client, headers, empty)
    assert response.status_code == 409


def test_submissions_are_private(client, judge0, task_setup, api):
    headers, task = task_setup
    mock_batch(judge0, [3, 3])
    submission = submit(client, headers, task).get_json()
    other = api.user()
    for path in (f'/api/submissions/{submission["id"]}',
                 f'/api/submissions/{submission["id"]}/results'):
        assert client.get(path, headers=other).status_code == 404
    assert client.get(f'/api/tasks/{task["id"]}/submissions',
                      headers=other).get_json() == []
