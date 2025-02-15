#!/bin/bash

# Загружаем настройки из .env файла
DB_NAME=$(grep "DB_NAME=" backend/.env | cut -d '=' -f2 | tr -d '[:space:]' | tr -d "'")
DUMP_FOLDER=$(grep "DUMP_FOLDER=" backend/.env | cut -d '=' -f2 | tr -d '[:space:]' | tr -d "'")

# Создаем директорию для бекапов если её нет
mkdir -p $DUMP_FOLDER

# Формируем имя файла с текущей датой
BACKUP_FILENAME="db-backup-$(date +%Y-%m-%d)"
BACKUP_PATH="$DUMP_FOLDER/$BACKUP_FILENAME"

echo "Создаем бекап базы данных $DB_NAME..."

# Делаем бекап используя docker-compose exec
if docker compose exec db pg_dump -U postgres -Fc $DB_NAME > "$BACKUP_PATH"; then
    echo "Бекап успешно создан: $BACKUP_PATH"
else
    echo "Ошибка при создании бекапа"
    rm -f "$BACKUP_PATH"  # Удаляем неполный файл бекапа
    exit 1
fi
