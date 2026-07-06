# Optimized lightweight build configuration for GCP Cloud Run
FROM node:24-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
RUN npx tsc

FROM node:24-alpine AS runner

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --only=production

COPY --from=builder /usr/src/app/dist ./dist
# Also copy shared package models to resolve relative imports
COPY --from=builder /usr/src/app/../apps/mobile/src/shared ./apps/mobile/src/shared

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "dist/server.js"]
