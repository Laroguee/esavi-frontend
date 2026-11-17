# ==============================================================================
# Stage 1: Instalación determinista de dependencias (desde package-lock.json)
# ==============================================================================
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ==============================================================================
# Stage 2: Compilación y empaquetado de producción (Vite + TypeScript)
# ==============================================================================
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables inyectadas en build para contenedor SRS (valores por defecto seguros)
ARG VITE_BASE_PATH=/
ARG VITE_ROUTER_MODE=browser
ARG VITE_USE_API=true
ARG VITE_DATA_PROVIDER=firebase

ENV VITE_BASE_PATH=${VITE_BASE_PATH}
ENV VITE_ROUTER_MODE=${VITE_ROUTER_MODE}
ENV VITE_USE_API=${VITE_USE_API}
ENV VITE_DATA_PROVIDER=${VITE_DATA_PROVIDER}

RUN npm run build

# ==============================================================================
# Stage 3: Runtime ligero e inmutable (Stateless Nginx)
# ==============================================================================
FROM nginx:stable-alpine AS runtime

# Eliminar configuración por defecto de Nginx
RUN rm -f /etc/nginx/conf.d/default.conf

# Copiar configuración hardening + /health + logs a stdout/stderr
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copiar únicamente artefactos compilados de producción
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
