"""Migrations must produce exactly the schema described by the models."""
import os

from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from sqlalchemy import create_engine

from manage import _alembic_config
from models.base_model import Base


def test_migrations_match_models(tmp_path):
    url = f'sqlite:///{os.path.join(tmp_path, "schema.db")}'
    config = _alembic_config(url)
    command.upgrade(config, 'head')

    engine = create_engine(url)
    with engine.connect() as connection:
        context = MigrationContext.configure(
            connection, opts={'compare_type': True})
        diff = compare_metadata(context, Base.metadata)
    engine.dispose()
    assert diff == []

    command.downgrade(config, 'base')
