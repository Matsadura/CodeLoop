#!/bin/sh
# Validate configuration, wait for the database and apply migrations, then
# start the given command. Set RUN_MIGRATIONS=0 when several replicas start
# at once and migrations are run separately (e.g. a release command).
set -e

python manage.py check-config
python manage.py wait-db --timeout "${DB_WAIT_TIMEOUT:-90}"
if [ "${RUN_MIGRATIONS:-1}" = "1" ]; then
    python manage.py migrate
fi

exec "$@"
