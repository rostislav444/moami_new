#!/bin/bash

DOCKER_CONTAINER_NAME="moami_new-db-1"
BACKUP_FILE_PATH="./backend/backups/db-backup"  # Укажем формат custom
PASSWORD=$(grep "DB_PASSWORD=" backend/.env | cut -d '=' -f2 | tr -d '[:space:]' | tr -d "'")
USER=$(grep "DB_USER=" backend/.env | cut -d '=' -f2 | tr -d '[:space:]' | tr -d "'")
DB_NAME=$(grep "DB_NAME=" backend/.env | cut -d '=' -f2 | tr -d '[:space:]' | tr -d "'")

# Подключаемся к контейнеру PostgreSQL и удаляем базу данных
docker exec -i $DOCKER_CONTAINER_NAME psql -U postgres <<EOF
REVOKE CONNECT ON DATABASE "$DB_NAME" FROM PUBLIC;
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = '$DB_NAME' AND pid <> pg_backend_pid();
DROP DATABASE "$DB_NAME";
CREATE DATABASE "$DB_NAME";
\q
EOF

# Проверяем, существует ли файл резервной копии
if [[ ! -f $BACKUP_FILE_PATH ]]; then
    echo "Файл резервной копии не найден: $BACKUP_FILE_PATH"
    exit 1
fi

# Проверяем, что файл является форматом custom и восстанавливаем базу данных
if [[ $(file --mime-type -b $BACKUP_FILE_PATH) == "application/octet-stream" ]]; then
    docker exec -i $DOCKER_CONTAINER_NAME pg_restore -U $USER -d $DB_NAME --clean --if-exists --no-owner < $BACKUP_FILE_PATH
else
    echo "Неподдерживаемый формат файла: $BACKUP_FILE_PATH"
    exit 1
fi