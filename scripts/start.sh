#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/.."

docker build -t my-trello .
docker rm -f my-trello >/dev/null 2>&1 || true
docker run -d --name my-trello -p 8000:8000 my-trello >/dev/null

echo "My Trello is running at http://localhost:8000"
