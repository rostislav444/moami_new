#!/bin/bash

DOCKER_CONTAINER_NAME="moami-db-1"
DB_NAME=$(grep "DB_NAME=" backend/.env | cut -d '=' -f2 | tr -d '[:space:]' | tr -d "'")

# Закрываем соединения и очищаем базу
docker exec -i $DOCKER_CONTAINER_NAME psql -U postgres <<EOF
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '$DB_NAME'
AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS "$DB_NAME";
CREATE DATABASE "$DB_NAME";
\q
EOF

# Конвертируем бэкап в SQL и восстанавливаем
pg_restore -f - ./backend/backups/db-backup | docker exec -i $DOCKER_CONTAINER_NAME psql -U postgres -d $DB_NAME
