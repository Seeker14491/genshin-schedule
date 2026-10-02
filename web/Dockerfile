# Build context is the repository root (see captain-definition-web).
FROM node:24-alpine AS build
WORKDIR /genshin

COPY ./web/package.json ./web/package-lock.json ./
RUN npm ci

# embedded into the build. Defaults to the official sync server (see web/src/env.ts)
ARG PUBLIC_API_URL
ENV PUBLIC_API_URL=$PUBLIC_API_URL

COPY ./web/ ./
RUN npm run build

# the build is plain files, served by nginx
FROM nginx:1-alpine

COPY ./web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /genshin/build /usr/share/nginx/html

EXPOSE 3000
