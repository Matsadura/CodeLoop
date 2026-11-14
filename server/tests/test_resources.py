"""Categories, tasks, test cases, favorites and profiles"""


def test_category_crud_and_validation(api, client):
    headers = api.user()
    category = api.category(headers)
    assert category['difficulty'] == 'Easy'  # normalized

    duplicate = client.post('/api/categories', headers=headers, json={
        'title': 'Algorithms', 'description': 'd',
        'imageUrl': 'https://x.y/z.png', 'difficulty': 'Easy'})
    assert duplicate.status_code == 409

    bad = client.post('/api/categories', headers=headers, json={
        'title': 'T', 'description': 'd',
        'imageUrl': 'javascript:alert(1)', 'difficulty': 'Easy'})
    assert bad.status_code == 400
    assert bad.get_json()['field'] == 'imageUrl'

    bad = client.post('/api/categories', headers=headers, json={
        'title': 'T', 'description': 'd',
        'imageUrl': 'https://x.y/z.png', 'difficulty': 'impossible'})
    assert bad.status_code == 400

    listing = client.get('/api/categories', headers=headers).get_json()
    assert listing[0]['tasksCount'] == 0
    # Undefined methods are rejected instead of crashing.
    assert client.put('/api/categories', headers=headers,
                      json={}).status_code == 405

    tasks = client.get(f'/api/categories/{category["id"]}/tasks',
                       headers=headers)
    assert tasks.status_code == 200 and tasks.get_json() == []
    assert client.get('/api/categories/missing/tasks',
                      headers=headers).status_code == 404


def test_task_creation_and_retrieval(api, client):
    headers = api.user()
    category = api.category(headers)
    task = api.task(headers, category['id'])
    assert task['difficulty'] == 'easy'

    fetched = client.get(f'/api/tasks/{task["id"]}', headers=headers)
    assert fetched.status_code == 200
    assert fetched.get_json()['title'] == 'Sum a list'

    listing = client.get('/api/tasks', headers=headers).get_json()
    assert [t['favoritesCount'] for t in listing] == [0]
    by_category = client.get(f'/api/categories/{category["id"]}/tasks',
                             headers=headers).get_json()
    assert len(by_category) == 1
    counts = client.get('/api/categories', headers=headers).get_json()
    assert counts[0]['tasksCount'] == 1
    assert client.get('/api/tasks/nope', headers=headers).status_code == 404


def test_task_validation(api, client):
    headers = api.user()
    category = api.category(headers)
    base = {'title': 'T', 'description': 'D', 'difficulty': 'easy',
            'category_id': category['id']}

    for field, value in (('title', ''), ('difficulty', 'trivial'),
                         ('category_id', 'missing'), ('description', 5)):
        body = dict(base, **{field: value})
        response = client.post('/api/tasks', headers=headers, json=body)
        assert response.status_code == 400, field
        assert response.get_json()['field'] == field

    response = client.post('/api/tasks', headers=headers,
                           json=dict(base, user_id='someone-else'))
    assert response.status_code == 201
    assert response.get_json()['user_id'] != 'someone-else'
    assert client.post('/api/tasks', headers=headers,
                       json=base).status_code == 409


def test_only_author_can_modify_task(api, client):
    author = api.user()
    other = api.user()
    category = api.category(author)
    task = api.task(author, category['id'])
    url = f'/api/tasks/{task["id"]}'

    assert client.put(url, headers=other,
                      json={'title': 'Hijacked'}).status_code == 403
    assert client.delete(url, headers=other).status_code == 403
    assert client.get(f'{url}/test_cases',
                      headers=other).status_code == 403

    updated = client.put(url, headers=author,
                         json={'title': 'Renamed', 'difficulty': 'Hard'})
    assert updated.status_code == 200
    assert updated.get_json()['difficulty'] == 'hard'


def test_task_rename_cannot_duplicate_title(api, client):
    headers = api.user()
    category = api.category(headers)
    api.task(headers, category['id'], title='First')
    second = api.task(headers, category['id'], title='Second')
    response = client.put(f'/api/tasks/{second["id"]}', headers=headers,
                          json={'title': 'First'})
    assert response.status_code == 409


def test_delete_task_with_related_rows(api, client, app):
    from models import storage
    from models.submission import Submission

    headers = api.user()
    category = api.category(headers)
    task = api.task(headers, category['id'])
    client.post('/api/users/favorites', headers=headers,
                json={'task_id': task['id']})
    user_id = client.get('/api/users', headers=headers).get_json()['id']
    storage.new(Submission(user_id=user_id, task_id=task['id'], code='x',
                           language='python', status='correct'))
    storage.save()

    response = client.delete(f'/api/tasks/{task["id"]}', headers=headers)
    assert response.status_code == 200
    assert storage.count(Submission) == 0


def test_test_case_management(api, client):
    headers = api.user()
    category = api.category(headers)
    task = api.task(headers, category['id'])
    url = f'/api/tasks/{task["id"]}/test_cases'

    cases = client.get(url, headers=headers).get_json()
    assert len(cases) == 1
    case_id = cases[0]['id']

    assert client.post(url, headers=headers, json={
        'input': '[1, 2]', 'expected_output': '3'}).status_code == 409
    assert client.post(url, headers=headers, json={
        'input': '   ', 'expected_output': '3'}).status_code == 400

    updated = client.put(f'{url}/{case_id}', headers=headers,
                         json={'expected_output': '4'})
    assert updated.get_json()['expected_output'] == '4'
    assert client.get(f'{url}/missing', headers=headers).status_code == 404
    assert client.delete(f'{url}/{case_id}',
                         headers=headers).status_code == 200
    assert client.get(url, headers=headers).get_json() == []


def test_test_case_must_belong_to_task(api, client):
    headers = api.user()
    category = api.category(headers)
    first = api.task(headers, category['id'], title='One')
    second = api.task(headers, category['id'], title='Two')
    case_id = client.get(f'/api/tasks/{first["id"]}/test_cases',
                         headers=headers).get_json()[0]['id']
    response = client.get(f'/api/tasks/{second["id"]}/test_cases/{case_id}',
                          headers=headers)
    assert response.status_code == 404


def test_favorites_are_per_user(api, client):
    alice = api.user()
    bob = api.user()
    category = api.category(alice)
    task = api.task(alice, category['id'])

    for headers in (alice, bob):
        response = client.post('/api/users/favorites', headers=headers,
                               json={'title': task['title']})
        assert response.status_code == 201
    assert client.post('/api/users/favorites', headers=bob,
                       json={'task_id': task['id']}).status_code == 409

    # Removing Bob's favorite must not touch Alice's.
    response = client.delete('/api/users/favorites', headers=bob,
                             json={'title': task['title']})
    assert response.status_code == 200
    assert len(client.get('/api/users/favorites',
                          headers=alice).get_json()) == 1
    assert client.get('/api/users/favorites', headers=bob).get_json() == []
    assert client.delete('/api/users/favorites', headers=bob,
                         json={'title': task['title']}).status_code == 404
    listing = client.get('/api/tasks', headers=alice).get_json()
    assert listing[0]['favoritesCount'] == 1


def test_profile_lifecycle(api, client):
    headers = api.user()
    assert client.get('/api/users/profile', headers=headers).status_code \
        == 404
    bad = client.post('/api/users/profile', headers=headers,
                      json={'bio': 'hi', 'profile_pic': 'ftp://x'})
    assert bad.status_code == 400
    created = client.post('/api/users/profile', headers=headers,
                          json={'bio': '', 'profile_pic': 'https://x.y/p'})
    assert created.status_code == 201
    assert client.post('/api/users/profile', headers=headers, json={
        'bio': 'x', 'profile_pic': 'https://x.y/p'}).status_code == 409
    updated = client.put('/api/users/profile', headers=headers,
                         json={'bio': 'Hello'})
    assert updated.get_json()['bio'] == 'Hello'


def test_statistics(api, client):
    headers = api.user()
    stats = client.get('/api/users/statistics', headers=headers).get_json()
    assert stats['count_submissions'] == 0
    assert stats['correct_%'] == 0
    category = api.category(headers)
    per_category = client.get('/api/users/statistics/categories',
                              headers=headers).get_json()
    assert per_category[category['title']]['count_submissions'] == 0
