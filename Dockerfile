FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./

RUN npx prisma generate

COPY . .

CMD ["npm", "start"]
