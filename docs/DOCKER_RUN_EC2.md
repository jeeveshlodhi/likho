# Run Likho with `docker run` on EC2 (no compose)

Use this when you only have the two images (`likho-backend:latest`, `likho-frontend:latest`) and want to run everything with `docker run`. Both **frontend** and **backend** are exposed to the internet so the app and API are reachable from outside.

## Expose to internet (AWS Security Group)

For EC2, open these **inbound** rules in the instance Security Group so both services are reachable:

| Type | Port | Source    | Use        |
|------|------|-----------|------------|
| TCP  | 3000 | 0.0.0.0/0 | Frontend (app) |
| TCP  | 5000 | 0.0.0.0/0 | Backend (API)  |

(To restrict access, set Source to your IP or a VPN CIDR instead of `0.0.0.0/0`.)

## Why frontend failed before

- Nginx in the frontend image proxies to `http://backend:8000`. The hostname **`backend`** is resolved at **nginx startup**.
- So the frontend container must be on the **same Docker network** as the backend, and the backend container must be named **`backend`**.
- You also need **Postgres** and **Redis** on that network; otherwise the backend will fail when it tries to connect.

## One-time: create network and pull base images

```bash
docker network create likho-network 2>/dev/null || true
docker pull postgres:15-alpine
docker pull redis:7-alpine
```

## 1. Clean up existing containers

```bash
docker stop backend frontend db redis 2>/dev/null || true
docker rm backend frontend db redis 2>/dev/null || true
```

## 2. Start in this order (all on `likho-network`)

**Postgres (must be named `db` – backend expects it):**

```bash
docker run -d \
  --name db \
  --network likho-network \
  -e POSTGRES_USER=likho_user \
  -e POSTGRES_PASSWORD=securepassword123 \
  -e POSTGRES_DB=likhodb \
  -v likho_postgres_data:/var/lib/postgresql/data \
  --restart unless-stopped \
  postgres:15-alpine
```

**Redis (must be named `redis`):**

```bash
docker run -d \
  --name redis \
  --network likho-network \
  --restart unless-stopped \
  redis:7-alpine
```

**Wait for Postgres, then backend (exposed to internet on port 5000):**

```bash
sleep 5
docker run -d \
  --name backend \
  --network likho-network \
  -p 0.0.0.0:5000:8000 \
  -e DATABASE_URL=postgresql://likho_user:securepassword123@db:5432/likhodb \
  -e REDIS_URL=redis://redis:6379/0 \
  --restart unless-stopped \
  likho-backend:latest
```

**Frontend (exposed to internet on port 3000; same network so nginx can resolve `backend`):**

```bash
docker run -d \
  --name frontend \
  --network likho-network \
  -p 0.0.0.0:3000:80 \
  --restart unless-stopped \
  likho-frontend:latest
```

## 3. Check

```bash
docker ps
docker logs backend
docker logs frontend
```

- **App (frontend):** `http://<EC2_PUBLIC_IP>:3000` — exposed to internet
- **Backend API:** `http://<EC2_PUBLIC_IP>:5000` — exposed to internet (open Security Group ports 3000 and 5000)

## 4. Optional: use the script

From the repo root (e.g. after cloning on EC2):

```bash
chmod +x scripts/docker-run-standalone.sh
./scripts/docker-run-standalone.sh
```

This starts db → redis → backend → frontend on `likho-network` with the correct names and env.
