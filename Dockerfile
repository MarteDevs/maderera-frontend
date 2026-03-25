# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm ci

# Copiar el proyecto y compilar
COPY . .
# Se puede pasar la URL de la API mediante build-args si se requiere dinámico
# ARG VITE_API_URL
# ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ─── Stage 2: Production Server ───────────────────────────────────────────────
FROM nginx:alpine

# Copiar configuración de Nginx para SPA (Vue Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los estáticos compilados desde la etapa de build
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
