"""Alembic environment: uses the API's settings and model metadata."""
from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine, pool

import models.engine.db_storage  # noqa: F401  (registers every model)
from models.base_model import Base

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name, disable_existing_loggers=False)

target_metadata = Base.metadata


def database_url():
    url = config.attributes.get('database_url')
    if url:
        return url
    from api.config import load_settings
    from dotenv import load_dotenv
    load_dotenv()
    return load_settings().database_url


def run_migrations_offline():
    context.configure(url=database_url(), target_metadata=target_metadata,
                      literal_binds=True, render_as_batch=True,
                      compare_type=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    connection = config.attributes.get('connection')
    if connection is not None:
        _run(connection)
        return
    engine = create_engine(database_url(), poolclass=pool.NullPool)
    with engine.connect() as connection:
        _run(connection)


def _run(connection):
    # render_as_batch lets the same migrations run on SQLite (tests).
    context.configure(connection=connection, target_metadata=target_metadata,
                      render_as_batch=True, compare_type=True)
    with context.begin_transaction():
        context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
