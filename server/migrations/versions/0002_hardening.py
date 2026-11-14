"""Hardening: constraints, wider columns and submission execution state

* Unique emails, category titles, task titles, one profile per user and one
  favorite per (user, task). The API already rejected duplicates; these
  constraints also stop races. If ``upgrade`` fails with a duplicate-key
  error, remove the duplicate rows first (see README > Database).
* ``users.password`` widened for salted PBKDF2 hashes.
* Longer category descriptions/image URLs and profile picture URLs.
* ``solution_results.stdin`` becomes TEXT (test inputs are TEXT).
* Submissions get an ``error`` status, ``status_detail`` and the Judge0
  tokens used to poll results.
* ``created_at``/``updated_at`` are NOT NULL; ``tasks.user_id`` is indexed.

Revision ID: 0002_hardening
Revises: 0001_baseline
Create Date: 2026-11-14
"""
from alembic import op
import sqlalchemy as sa

revision = '0002_hardening'
down_revision = '0001_baseline'
branch_labels = None
depends_on = None

TABLES = ('users', 'categories', 'tasks', 'user_profile', 'task_test_cases',
          'submissions', 'solution_results', 'user_favorites')
OLD_STATUS = sa.Enum('pending', 'correct', 'incorrect')
NEW_STATUS = sa.Enum('pending', 'correct', 'incorrect', 'error')


def upgrade():
    for table in TABLES:
        op.execute(f'UPDATE {table} SET created_at = CURRENT_TIMESTAMP '
                   'WHERE created_at IS NULL')
        op.execute(f'UPDATE {table} SET updated_at = created_at '
                   'WHERE updated_at IS NULL')
        with op.batch_alter_table(table) as batch:
            batch.alter_column('created_at', existing_type=sa.DateTime(),
                               nullable=False)
            batch.alter_column('updated_at', existing_type=sa.DateTime(),
                               nullable=False)

    with op.batch_alter_table('users') as batch:
        batch.alter_column('password', existing_type=sa.String(128),
                           type_=sa.String(255), existing_nullable=False)
        batch.create_unique_constraint('uq_users_email', ['email'])

    with op.batch_alter_table('categories') as batch:
        batch.alter_column('description', existing_type=sa.String(128),
                           type_=sa.String(512), existing_nullable=False)
        batch.alter_column('imageUrl', existing_type=sa.String(128),
                           type_=sa.String(512), existing_nullable=False)
        batch.create_unique_constraint('uq_categories_title', ['title'])

    with op.batch_alter_table('tasks') as batch:
        batch.create_unique_constraint('uq_tasks_title', ['title'])
        batch.create_index('ix_tasks_user_id', ['user_id'])

    with op.batch_alter_table('user_profile') as batch:
        batch.alter_column('profile_pic', existing_type=sa.String(255),
                           type_=sa.String(512), existing_nullable=True)
        batch.create_unique_constraint('uq_user_profile_user_id',
                                       ['user_id'])

    with op.batch_alter_table('submissions') as batch:
        batch.alter_column('status', existing_type=OLD_STATUS,
                           type_=NEW_STATUS, existing_nullable=False)
        batch.add_column(sa.Column('status_detail', sa.String(255),
                                   nullable=True))
        batch.add_column(sa.Column('judge0_tokens', sa.TEXT(),
                                   nullable=True))

    with op.batch_alter_table('solution_results') as batch:
        batch.alter_column('stdin', existing_type=sa.String(4096),
                           type_=sa.TEXT(), existing_nullable=True)

    with op.batch_alter_table('user_favorites') as batch:
        batch.create_unique_constraint('uq_user_favorites',
                                       ['user_id', 'task_id'])


def downgrade():
    with op.batch_alter_table('user_favorites') as batch:
        batch.drop_constraint('uq_user_favorites', type_='unique')
    with op.batch_alter_table('solution_results') as batch:
        batch.alter_column('stdin', existing_type=sa.TEXT(),
                           type_=sa.String(4096), existing_nullable=True)
    op.execute("UPDATE submissions SET status = 'pending' "
               "WHERE status = 'error'")
    with op.batch_alter_table('submissions') as batch:
        batch.drop_column('judge0_tokens')
        batch.drop_column('status_detail')
        batch.alter_column('status', existing_type=NEW_STATUS,
                           type_=OLD_STATUS, existing_nullable=False)
    with op.batch_alter_table('user_profile') as batch:
        batch.drop_constraint('uq_user_profile_user_id', type_='unique')
        batch.alter_column('profile_pic', existing_type=sa.String(512),
                           type_=sa.String(255), existing_nullable=True)
    with op.batch_alter_table('tasks') as batch:
        batch.drop_index('ix_tasks_user_id')
        batch.drop_constraint('uq_tasks_title', type_='unique')
    with op.batch_alter_table('categories') as batch:
        batch.drop_constraint('uq_categories_title', type_='unique')
        batch.alter_column('imageUrl', existing_type=sa.String(512),
                           type_=sa.String(128), existing_nullable=False)
        batch.alter_column('description', existing_type=sa.String(512),
                           type_=sa.String(128), existing_nullable=False)
    with op.batch_alter_table('users') as batch:
        batch.drop_constraint('uq_users_email', type_='unique')
        batch.alter_column('password', existing_type=sa.String(255),
                           type_=sa.String(128), existing_nullable=False)
    for table in TABLES:
        with op.batch_alter_table(table) as batch:
            batch.alter_column('created_at', existing_type=sa.DateTime(),
                               nullable=True)
            batch.alter_column('updated_at', existing_type=sa.DateTime(),
                               nullable=True)
