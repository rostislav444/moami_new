#!/bin/bash

# Connect to the PostgreSQL container and reset the database
docker exec -i moami-db-1 psql -U postgres <<EOF
DROP DATABASE moami;
CREATE DATABASE moami;
\q
EOF


# Import the dump into your database
if [[ $(file --mime-type -b ./backend/data/dumps/moami_dump.sql) == "text/plain" ]]; then
    cat ./backend/data/dumps/moami_dump.sql | docker exec -i moami-db-1 psql -U postgres -d moami
else
    docker exec -i moami-db-1 pg_restore -U postgres -d moami < ./backend/data/dumps/moami_dump.sql
fi

