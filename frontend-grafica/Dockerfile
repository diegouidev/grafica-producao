# Estágio 1: Build
FROM node:18-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
# Gera o build de produção
RUN npm run build

# Estágio 2: Produção
FROM node:18-alpine
WORKDIR /app

ENV NODE_ENV=production

# Copia os arquivos do build standalone
# (Isso só funciona se 'output: "standalone"' estiver no next.config.ts)
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Expõe a porta 3000
EXPOSE 3000

# Roda o servidor de produção
CMD ["node", "server.js"]