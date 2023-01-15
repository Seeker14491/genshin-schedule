#!/bin/sh
# Builds docker images for release.
touch './.env'
set -a; . './.env'; set +a

docker build sync -t 'genshin-sync'
docker build web -t 'genshin-web' --build-arg NEXT_PUBLIC_UMAMI_URL --build-arg NEXT_PUBLIC_API_PUBLIC --build-arg NEXT_PUBLIC_API_INTERNAL
