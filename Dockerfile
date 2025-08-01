# syntax = docker/dockerfile:1

# 🔹 Etapa base
ARG NODE_VERSION=20.18.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="NestJS"
WORKDIR /app
ENV NODE_ENV="production"

# 🔹 Etapa de build
FROM base AS build

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

COPY package*.json ./
RUN npm ci --include=dev

# Copia todo el código fuente y los archivos necesarios
COPY . .

# ✅ Copia explícita de los archivos de credenciales (por si el .dockerignore los bloquea)
COPY speech-credentials.json ./speech-credentials.json
COPY text-to-voice.json ./text-to-voice.json

RUN npm run build

# 🔹 Etapa final
FROM base

# Copia la app compilada
COPY --from=build /app/dist /app/dist
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/package.json /app/package.json

# ✅ Copia también los archivos de credenciales a la imagen final
COPY --from=build /app/speech-credentials.json /app/speech-credentials.json
COPY --from=build /app/text-to-voice.json /app/text-to-voice.json

EXPOSE 3000
CMD [ "node", "dist/main.js" ]
