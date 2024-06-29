#!/bin/sh

if [ "$DATABASE" = "postgres" ]
then
    echo "Waiting for postgres..."

    while ! nc -z $SQL_HOST $SQL_PORT; do
      sleep 0.1
    done

    echo "PostgreSQL started"
fi

python manage.py migrate

# change owner of celerybeat-schedule file to app user
chown app:app /home/app/web/celerybeat-schedule
chown -R app:app /home/app/web
chmod -R 775 /home/app/web/media

exec "$@"