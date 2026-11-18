# =========================
# Build / dependency stage
# =========================
FROM node:22-alpine AS dependencies

RUN apk update && apk upgrade
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate

# =========================
# Production dependencies
# =========================
FROM node:22-alpine AS production-dependencies

RUN apk update && apk upgrade
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# =========================
# Production
# =========================
FROM node:22-alpine AS production

RUN apk update && apk upgrade
WORKDIR /app

ENV NODE_ENV=production

COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=dependencies /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=dependencies /app/node_modules/prisma ./node_modules/prisma

COPY package.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY public ./public
COPY server.js ./
COPY admin-server.js ./
COPY start.js ./
COPY private ./private
COPY certs/global-bundle.pem /app/certs/global-bundle.pem

RUN rm -rf /usr/local/lib/node_modules/npm \
    /usr/local/bin/npm \
    /usr/local/bin/npx

EXPOSE 3000 3001

CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node start.js"]
