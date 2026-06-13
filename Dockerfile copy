# Build Stage
FROM node:20-alpine AS build

ARG VITE_API_URL=/api/v1

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Production Stage
FROM nginx:alpine

# Copy custom nginx config with SPA routing + API/WS proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets to Nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
