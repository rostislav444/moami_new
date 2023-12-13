#!/bin/bash

# Extract password and user from .env
PASSWORD=$(grep "PASSWORD=" /var/www/moami/backend/.env | cut -d '=' -f2 | tr -d '[:space:]' | tr -d "'")
USER=$(grep "DB_USER=" /var/www/moami/backend/.env | cut -d '=' -f2 | tr -d '[:space:]' | tr -d "'")

# Print out values for debugging
echo "Extracted Password: $PASSWORD"
echo "Extracted User: $USER"

PGPASSWORD="$PASSWORD" pg_dump -h localhost -U "$USER" -p 5432 -d moami -F c > /var/www/moami/backend/media/moami_dump.sql
