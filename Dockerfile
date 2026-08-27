# =========================
# Production dependencies
# =========================

FROM node:22-alpine AS dependencies

RUN npm install -g npm@11.19.0

WORKDIR /app

COPY package*.json ./

RUN npm ci


# =========================
# Production
# =========================

FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=dependencies /app/node_modules ./node_modules

COPY package*.json ./

COPY prisma ./prisma

COPY prisma.config.ts ./

COPY public ./public

COPY server.js ./

COPY certs/global-bundle.pem /app/certs/global-bundle.pem

RUN npx prisma generate

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
