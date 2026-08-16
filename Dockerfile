# =========================
# Production dependencies
# =========================
FROM node:22-alpine AS dependencies

RUN npm install -g npm@11.19.0


WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev


# =========================
# Production
# =========================

FROM node:22-alpine AS production

RUN npm install -g npm@11.19.0

WORKDIR /app

ENV NODE_ENV=production

COPY --from=dependencies /app/node_modules ./node_modules

COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY public ./public
COPY server.js ./

RUN npx prisma generate

EXPOSE 3000

CMD ["node", "server.js"]