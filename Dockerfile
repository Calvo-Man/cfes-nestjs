# syntax = docker/dockerfile:1

# 🔹 Etapa base
ARG NODE_VERSION=20.18.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="NestJS"
WORKDIR /app
ENV NODE_ENV="production"

# 🔹 Instala dependencias del sistema necesarias para Puppeteer/Chromium
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    libgbm-dev \
    libgtk-3-0 \
    libxshmfence-dev \
    libxss1 \
    libgconf-2-4 \
    libgobject-2.0-0 \
    chromium \
    --no-install-recommends && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 🔹 Etapa de build
FROM base AS build

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

COPY package*.json ./
RUN npm ci --include=dev

# Copia el código fuente y credenciales
COPY . .
COPY speech-credentials.json ./speech-credentials.json
COPY text-to-voice.json ./text-to-voice.json

RUN npm run build

# 🔹 Etapa final (ejecución)
FROM base

# Copia la app compilada
COPY --from=build /app/dist /app/dist
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/package.json /app/package.json

# Copia también las credenciales necesarias
COPY --from=build /app/speech-credentials.json /app/speech-credentials.json
COPY --from=build /app/text-to-voice.json /app/text-to-voice.json

# Exponer el puerto de la app
EXPOSE 3000

CMD ["node", "dist/main.js"]
