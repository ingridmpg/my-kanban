#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/.."

docker build -t my-kanban .
docker rm -f my-kanban >/dev/null 2>&1 || true
docker run -d --name my-kanban -p 8000:8000 -v my-kanban-data:/app/data my-kanban >/dev/null

echo "My Kanban is running at http://localhost:8000"
