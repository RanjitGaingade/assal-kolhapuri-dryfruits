# =========================
# Build stage
# =========================

FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./

RUN npx prisma generate

COPY server.js ./


# =========================
# Production stage
# =========================

FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --omit=dev

COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
COPY public ./public
COPY server.js ./server.js

# Generate Prisma Client inside production image
RUN npx prisma generate

EXPOSE 3000

CMD ["node", "server.js"]
