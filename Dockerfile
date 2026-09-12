# Multi-stage Dockerfile for Express + TypeScript + Prisma + pnpm backend

FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

# 1. Dependencies Stage
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/
RUN pnpm install --frozen-lockfile

# 2. Build Stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

# 3. Production Runner Stage
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 5500

CMD ["node", "dist/server.js"]
