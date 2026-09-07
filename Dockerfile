# =========================
# Build / dependency stage
# =========================
FROM node:22-alpine AS dependencies

# Patch Alpine OS packages
RUN apk update && apk upgrade

WORKDIR /app

COPY package*.json ./

# Install all dependencies for Prisma generation
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./

RUN npx prisma generate

# =========================
# Production dependencies
# =========================
FROM node:22-alpine AS production-dependencies

# Patch Alpine OS packages
RUN apk update && apk upgrade

WORKDIR /app

COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# =========================
# Production
# =========================
FROM node:22-alpine AS production

# Patch Alpine OS packages
RUN apk update && apk upgrade

WORKDIR /app

ENV NODE_ENV=production

# Copy only production dependencies
COPY --from=production-dependencies /app/node_modules ./node_modules

# Copy generated Prisma client
COPY --from=dependencies /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=dependencies /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Prisma CLI is needed for migrations at container startup
COPY --from=dependencies /app/node_modules/prisma ./node_modules/prisma

COPY package*.json ./

COPY prisma ./prisma

COPY prisma.config.ts ./

COPY public ./public

COPY server.js ./

COPY certs/global-bundle.pem /app/certs/global-bundle.pem

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
