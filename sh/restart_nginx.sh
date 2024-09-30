docker compose -f docker-compose.nginx.yml down nginx
docker compose -f docker-compose.nginx.yml up nginx --build -d
docker compose -f docker-compose.nginx.yml logs nginx -f
