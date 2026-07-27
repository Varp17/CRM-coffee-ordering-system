
# FROM node:22-alpine

# RUN npm install -g pnpm@latest

# WORKDIR /app

# COPY package.json /app

# COPY package-lock.json /app

# RUN pnpm install

# COPY . /app

# RUN pnpm build

# EXPOSE 8022

# HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
#   CMD wget -q --spider http://localhost:8022/ || exit 1

# CMD ["npm", "run", "dev"]


FROM node:22-alpine

RUN apk add --no-cache wget
RUN npm install -g pnpm

WORKDIR /app

COPY package.json package-lock.json ./

COPY pnpm-workspace.yaml ./

COPY pnpm-lock.yaml ./

RUN pnpm install

COPY . .

RUN pnpm build

EXPOSE 8022

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -q --spider http://localhost:8022/ || exit 1

CMD ["pnpm", "start"]