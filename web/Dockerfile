# Build context is the repository root (see captain-definition-web).
FROM node:24-alpine AS build
WORKDIR /genshin

COPY ./web/package.json ./web/package-lock.json ./
RUN npm ci

# NEXT_PUBLIC_* variables are inlined into the JavaScript bundle at build time
ARG NEXT_PUBLIC_API_PUBLIC
ARG NEXT_PUBLIC_API_INTERNAL
ENV NEXT_PUBLIC_API_PUBLIC=$NEXT_PUBLIC_API_PUBLIC
ENV NEXT_PUBLIC_API_INTERNAL=$NEXT_PUBLIC_API_INTERNAL
ENV NEXT_TELEMETRY_DISABLED=1

COPY ./web/ ./
RUN npm run build

FROM node:24-alpine
WORKDIR /genshin

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# the standalone output contains only the files needed to run the server
COPY --from=build --chown=node:node /genshin/.next/standalone ./
COPY --from=build --chown=node:node /genshin/.next/static ./.next/static
COPY --from=build --chown=node:node /genshin/public ./public

USER node
EXPOSE 3000
CMD ["node", "server.js"]
