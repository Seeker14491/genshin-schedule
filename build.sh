#!/bin/sh
# Builds docker images for release. Build arguments are read from .env if it exists.
set -e
cd "$(dirname "$0")"

if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

docker build -f sync/Dockerfile -t genshin-sync .
docker build -f web/Dockerfile -t genshin-web --build-arg NEXT_PUBLIC_API_PUBLIC --build-arg NEXT_PUBLIC_API_INTERNAL .
