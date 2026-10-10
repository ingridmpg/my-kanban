#!/usr/bin/env bash
set -e

docker rm -f my-kanban >/dev/null 2>&1 || true

echo "My Kanban stopped"
