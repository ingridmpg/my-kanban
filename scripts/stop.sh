#!/usr/bin/env bash
set -e

docker rm -f my-trello >/dev/null 2>&1 || true

echo "My Trello stopped"
