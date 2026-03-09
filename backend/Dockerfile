FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .
RUN npm run build

RUN mkdir -p /data

ENV NODE_ENV=production
ENV DATABASE_URL="file:/data/app.db"

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
