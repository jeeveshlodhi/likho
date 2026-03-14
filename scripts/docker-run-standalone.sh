#!/bin/bash
# Run Likho stack with plain docker run (no compose). Use on a single host (e.g. EC2).
# Exposes frontend and backend to all interfaces (0.0.0.0) for internet access.
# Requires: docker images likho-backend:latest, likho-frontend:latest
# Optional: postgres:15-alpine, redis:7-alpine (or use existing db/redis)
# On AWS EC2: open inbound TCP ports 3000 (frontend) and 5000 (backend) in the instance Security Group.

set -e
NET=likho-network
BACKEND_NAME=backend
FRONTEND_NAME=frontend
DB_NAME=db
REDIS_NAME=redis
PG_USER=likho_user
PG_PASS="${POSTGRES_PASSWORD:-securepassword123}"
PG_DB=likhodb

echo "Creating network $NET..."
docker network create $NET 2>/dev/null || true

echo "Stopping existing containers (if any)..."
docker stop $BACKEND_NAME $FRONTEND_NAME $DB_NAME $REDIS_NAME 2>/dev/null || true
docker rm $BACKEND_NAME $FRONTEND_NAME $DB_NAME $REDIS_NAME 2>/dev/null || true

echo "Starting Postgres (db)..."
docker run -d \
  --name $DB_NAME \
  --network $NET \
  -e POSTGRES_USER=$PG_USER \
  -e POSTGRES_PASSWORD=$PG_PASS \
  -e POSTGRES_DB=$PG_DB \
  -v likho_postgres_data:/var/lib/postgresql/data \
  --restart unless-stopped \
  postgres:15-alpine

echo "Starting Redis..."
docker run -d \
  --name $REDIS_NAME \
  --network $NET \
  --restart unless-stopped \
  redis:7-alpine

echo "Waiting for Postgres to be ready..."
sleep 5

echo "Starting backend (exposed 0.0.0.0:5000)..."
docker run -d \
  --name $BACKEND_NAME \
  --network $NET \
  -p 0.0.0.0:5000:8000 \
  -e DATABASE_URL=postgresql://${PG_USER}:${PG_PASS}@${DB_NAME}:5432/${PG_DB} \
  -e REDIS_URL=redis://${REDIS_NAME}:6379/0 \
  --restart unless-stopped \
  likho-backend:latest

echo "Starting frontend (exposed 0.0.0.0:3000)..."
docker run -d \
  --name $FRONTEND_NAME \
  --network $NET \
  -p 0.0.0.0:3000:80 \
  --restart unless-stopped \
  likho-frontend:latest

echo "Done. Both exposed to all interfaces (internet)."
PRIVATE_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
# On AWS EC2, get public IP so you can open the app from your browser
PUBLIC_IP=$(curl -s -m 2 http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || true)
if [ -n "$PUBLIC_IP" ]; then
  echo "  Use these URLs from the internet (open Security Group inbound TCP 3000, 5000):"
  echo "  Frontend: http://${PUBLIC_IP}:3000"
  echo "  Backend:  http://${PUBLIC_IP}:5000"
else
  echo "  Frontend: http://${PRIVATE_IP:-localhost}:3000"
  echo "  Backend:  http://${PRIVATE_IP:-localhost}:5000"
  echo "  On AWS EC2: use the instance PUBLIC IP (not 172.31.x.x) and open Security Group ports 3000, 5000."
fi
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
