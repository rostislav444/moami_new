docker compose -f docker-compose.prod.yml down frontend
docker compose -f docker-compose.prod.yml up --build -d frontend
docker compose -f docker-compose.nginx.yml down nginx
docker compose -f docker-compose.nginx.yml up nginx --build -d