#!/usr/bin/env python3
"""Operational commands for the CodeLoop API.

    python manage.py check-config   validate environment variables
    python manage.py wait-db        block until the database accepts queries
    python manage.py migrate        apply database migrations (Alembic)
    python manage.py seed           create demo data (idempotent)
    python manage.py check-schema   fail if the database differs from models

All commands read the same environment variables as the API.
"""
import argparse
import os
import sys
import time

from dotenv import load_dotenv
from sqlalchemy import inspect
from sqlalchemy.exc import OperationalError

from api.config import ConfigError, load_settings
from models import storage

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BASELINE_REVISION = '0001_baseline'


def _settings():
    load_dotenv()
    try:
        return load_settings()
    except ConfigError as error:
        print(error, file=sys.stderr)
        sys.exit(2)


def _alembic_config(database_url):
    from alembic.config import Config
    config = Config(os.path.join(BASE_DIR, 'alembic.ini'))
    config.set_main_option('script_location',
                           os.path.join(BASE_DIR, 'migrations'))
    config.attributes['database_url'] = database_url
    return config


def check_config(_args):
    settings = _settings()
    print(f'Configuration OK (APP_ENV={settings.env})')


def wait_db(args):
    settings = _settings()
    storage.configure(settings.database_url)
    deadline = time.monotonic() + args.timeout
    attempt = 0
    while True:
        attempt += 1
        try:
            storage.ping()
            print(f'Database is ready (attempt {attempt})')
            return
        except OperationalError as error:
            if time.monotonic() >= deadline:
                print(f'Database not ready after {args.timeout}s: '
                      f'{error.__class__.__name__}', file=sys.stderr)
                sys.exit(1)
            print(f'Waiting for database (attempt {attempt})...')
            time.sleep(args.interval)


def migrate(_args):
    """Upgrade to the latest revision.

    Databases created before migrations existed (tables present, no
    ``alembic_version`` table) are stamped at the baseline first.
    """
    from alembic import command
    settings = _settings()
    config = _alembic_config(settings.database_url)
    storage.configure(settings.database_url)
    tables = set(inspect(storage.engine).get_table_names())
    if 'users' in tables and 'alembic_version' not in tables:
        print('Existing schema without migration history: stamping '
              f'{BASELINE_REVISION}')
        command.stamp(config, BASELINE_REVISION)
    command.upgrade(config, 'head')
    print('Database schema is up to date')


def check_schema(_args):
    """Compare the live schema with the SQLAlchemy models (used in CI)"""
    from alembic.autogenerate import compare_metadata
    from alembic.migration import MigrationContext
    import models.engine.db_storage  # noqa: F401  (registers every model)
    from models.base_model import Base

    settings = _settings()
    storage.configure(settings.database_url)
    with storage.engine.connect() as connection:
        context = MigrationContext.configure(
            connection, opts={'compare_type': True})
        diff = compare_metadata(context, Base.metadata)
    for item in diff:
        print(item)
    if diff:
        print(f'Schema differs from models ({len(diff)} differences)',
              file=sys.stderr)
        sys.exit(1)
    print('Schema matches the models')


def seed(_args):
    """Create a demo account, a category, a task and its test cases"""
    from models.category import Category
    from models.task import Task
    from models.task_test_cases import Task_Test_Cases
    from models.user import User

    settings = _settings()
    storage.configure(settings.database_url)
    email = os.getenv('SEED_USER_EMAIL', 'demo@codeloop.dev')
    password = os.getenv('SEED_USER_PASSWORD')

    user = storage.get_specific(User, 'email', email)
    if user is None:
        if not password:
            print('Set SEED_USER_PASSWORD (min 8 characters) to create the '
                  'demo user', file=sys.stderr)
            sys.exit(2)
        if len(password) < 8:
            print('SEED_USER_PASSWORD must be at least 8 characters',
                  file=sys.stderr)
            sys.exit(2)
        user = User(email=email, password=password, first_name='Demo',
                    last_name='User')
        storage.new(user)
        print(f'Created user {email}')

    category = storage.get_specific(Category, 'title', 'Python Basics')
    if category is None:
        category = Category(
            title='Python Basics', difficulty='Easy',
            description='Warm-up exercises with lists, strings and loops.',
            imageUrl='https://images.unsplash.com/photo-1526379095098-'
                     'd400fd0bf935?w=640')
        storage.new(category)
        print('Created category "Python Basics"')

    title = 'Sum of a list'
    if storage.get_specific(Task, 'title', title) is None:
        task = Task(
            title=title, difficulty='easy', category_id=category.id,
            user_id=user.id,
            description=(
                '# Sum of a list\n\n'
                'Complete `solution(inputs)` so it returns the sum of the '
                'numbers in `inputs`.\n\n'
                '```\n[1, 2, 3] -> 6\n```\n'))
        storage.new(task)
        for stdin, expected in (('[1, 2, 3]', '6'), ('[]', '0'),
                                ('[-5, 5, 10]', '10')):
            storage.new(Task_Test_Cases(task_id=task.id, input=stdin,
                                        expected_output=expected))
        print(f'Created task "{title}" with 3 test cases')
    storage.save()
    print('Seed complete')


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    sub = parser.add_subparsers(dest='command', required=True)
    sub.add_parser('check-config').set_defaults(func=check_config)
    wait = sub.add_parser('wait-db')
    wait.add_argument('--timeout', type=float, default=90)
    wait.add_argument('--interval', type=float, default=2)
    wait.set_defaults(func=wait_db)
    sub.add_parser('migrate').set_defaults(func=migrate)
    sub.add_parser('seed').set_defaults(func=seed)
    sub.add_parser('check-schema').set_defaults(func=check_schema)
    args = parser.parse_args(argv)
    args.func(args)


if __name__ == '__main__':
    main()
