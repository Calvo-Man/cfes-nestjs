# syntax = docker/dockerfile:1

ARG NODE_VERSION=20.18.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="NestJS"
WORKDIR /app

# ✅ Variables de entorno clave
ENV NODE_ENV=production \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# ✅ Instala Chromium desde APT (más ligero y sin descargar manualmente)
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
      chromium-browser \
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
      libgbm-dev \
      libgtk-3-0 \
      libxshmfence-dev \
      libxss1 \
      libgconf-2-4 \
      xdg-utils \
      wget \
      ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 🔹 Etapa de build
FROM base AS build

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
      build-essential \
      node-gyp \
      pkg-config \
      python-is-python3 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --include=dev

COPY . .
COPY speech-credentials.json .
COPY text-to-voice.json .

RUN npm run build

# 🔹 Etapa final
FROM base

COPY --from=build /app/dist /app/dist
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/package.json /app/package.json

COPY --from=build /app/speech-credentials.json /app/speech-credentials.json
COPY --from=build /app/text-to-voice.json /app/text-to-voice.json

EXPOSE 3000
CMD ["node", "dist/main.js"]
