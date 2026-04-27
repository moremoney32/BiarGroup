FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && cp src/db/migrations/*.sql dist/db/migrations/

# Production image
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

# Dossier pour les images uploadées
RUN mkdir -p public/uploads

EXPOSE 5000
CMD ["sh", "entrypoint.sh"]
