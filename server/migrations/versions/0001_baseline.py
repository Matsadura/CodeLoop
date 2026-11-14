"""Baseline: the schema previously created by Base.metadata.create_all()

Existing databases created before migrations were introduced already have
these tables; ``python manage.py migrate`` detects that and stamps this
revision instead of running it.

Revision ID: 0001_baseline
Revises:
Create Date: 2026-11-14
"""
from alembic import op
import sqlalchemy as sa

revision = '0001_baseline'
down_revision = None
branch_labels = None
depends_on = None


def _base_columns():
    return [
        sa.Column('id', sa.String(60), primary_key=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
    ]


def upgrade():
    op.create_table(
        'users', *_base_columns(),
        sa.Column('email', sa.String(128), nullable=False),
        sa.Column('password', sa.String(128), nullable=False),
        sa.Column('first_name', sa.String(128), nullable=False),
        sa.Column('last_name', sa.String(128), nullable=False))
    op.create_table(
        'categories', *_base_columns(),
        sa.Column('title', sa.String(128), nullable=False),
        sa.Column('difficulty', sa.Enum('Easy', 'Medium', 'Hard'),
                  nullable=False),
        sa.Column('description', sa.String(128), nullable=False),
        sa.Column('imageUrl', sa.String(128), nullable=False))
    op.create_table(
        'tasks', *_base_columns(),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('category_id', sa.String(60),
                  sa.ForeignKey('categories.id'), nullable=False),
        sa.Column('description', sa.TEXT(), nullable=False),
        sa.Column('difficulty', sa.Enum('easy', 'medium', 'hard'),
                  nullable=False),
        sa.Column('user_id', sa.String(60), nullable=False))
    op.create_table(
        'user_profile', *_base_columns(),
        sa.Column('user_id', sa.String(128),
                  sa.ForeignKey('users.id', ondelete='CASCADE'),
                  nullable=False),
        sa.Column('bio', sa.TEXT(), nullable=True),
        sa.Column('profile_pic', sa.String(255), nullable=True))
    op.create_table(
        'task_test_cases', *_base_columns(),
        sa.Column('task_id', sa.String(128),
                  sa.ForeignKey('tasks.id', ondelete='CASCADE'),
                  nullable=False),
        sa.Column('input', sa.TEXT(), nullable=False),
        sa.Column('expected_output', sa.TEXT(), nullable=False))
    op.create_table(
        'submissions', *_base_columns(),
        sa.Column('user_id', sa.String(128),
                  sa.ForeignKey('users.id', ondelete='CASCADE'),
                  nullable=False),
        sa.Column('task_id', sa.String(128),
                  sa.ForeignKey('tasks.id', ondelete='CASCADE'),
                  nullable=False),
        sa.Column('code', sa.TEXT(), nullable=False),
        sa.Column('language', sa.Enum('python', 'c'), nullable=False),
        sa.Column('status', sa.Enum('pending', 'correct', 'incorrect'),
                  nullable=False))
    op.create_table(
        'solution_results', *_base_columns(),
        sa.Column('submission_id', sa.String(128),
                  sa.ForeignKey('submissions.id', ondelete='CASCADE'),
                  nullable=False),
        sa.Column('task_test_case_id', sa.String(128), nullable=False),
        sa.Column('status', sa.Enum('pass', 'fail', 'error'),
                  nullable=False),
        sa.Column('stdout', sa.TEXT(), nullable=True),
        sa.Column('expected_output', sa.TEXT(), nullable=True),
        sa.Column('stderr', sa.TEXT(), nullable=True),
        sa.Column('stdin', sa.String(4096), nullable=True),
        sa.Column('time', sa.String(128), nullable=True))
    op.create_table(
        'user_favorites', *_base_columns(),
        sa.Column('user_id', sa.String(128),
                  sa.ForeignKey('users.id', ondelete='CASCADE'),
                  nullable=False),
        sa.Column('task_id', sa.String(128),
                  sa.ForeignKey('tasks.id', ondelete='CASCADE'),
                  nullable=False))


def downgrade():
    for table in ('user_favorites', 'solution_results', 'submissions',
                  'task_test_cases', 'user_profile', 'tasks', 'categories',
                  'users'):
        op.drop_table(table)
