docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up --build -d
docker compose -f docker-compose.nginx.yml down nginx
docker compose -f docker-compose.nginx.yml up nginx --build -d