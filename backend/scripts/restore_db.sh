docker-compose exec db psql -U postgres -c "DROP DATABASE moami_db;"
docker-compose exec db psql -U postgres -c "CREATE DATABASE moami_db;"
docker-compose exec db pg_restore -U postgres -d moami_db -F c /docker-entrypoint-initdb.d/moami_dump.sql
