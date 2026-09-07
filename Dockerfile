# Playback Frontend - static build served via nginx
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci 2>/dev/null || npm install
COPY . .
# Build-time env: VITE_API_BASE_URL and theme (VITE_THEME / VITE_THEME_PRIMARY) are baked.
# Override with --build-arg per client: docker build --build-arg VITE_THEME=ocean -t playback-fe:ocean .
ARG VITE_API_BASE_URL
ARG VITE_THEME
ARG VITE_THEME_PRIMARY
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_THEME=$VITE_THEME
ENV VITE_THEME_PRIMARY=$VITE_THEME_PRIMARY
RUN npm run build

FROM nginx:stable-alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
# SPA fallback: all non-file routes serve index.html
RUN printf 'server {\n  listen 80;\n  root /usr/share/nginx/html;\n  index index.html;\n  location / { try_files $uri $uri/ /index.html; }\n  # Optional: proxy /api to BE if same container - configure via env at runtime\n}\n' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
