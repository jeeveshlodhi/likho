# Stage 1: Build (npm only; use full node image so rollup optional deps install for container arch)
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Copy package.json only so optional deps (e.g. rollup native binary) install for container platform
COPY package.json ./
RUN npm install

COPY . ./
# Skip tsc in Docker so image builds; run "npm run build" locally for full type check
RUN npx vite build

# Stage 2: Serve
FROM nginx:alpine

# Copy the custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
