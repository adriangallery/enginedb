FROM node:18-bullseye-slim

# Instalar dependencias del sistema para better-sqlite3
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar package files primero (mejor caching)
COPY package*.json ./
COPY api/package*.json ./api/

# Instalar dependencias root
RUN npm ci

# Instalar dependencias del API
RUN cd api && npm ci

# Rebuild explícito de better-sqlite3 para Linux
RUN cd api && npm rebuild better-sqlite3

# Copiar código fuente
COPY . .

# Build TypeScript (root + api)
RUN npm run build

# Puerto expuesto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Iniciar servidor API directamente
CMD ["node", "api/dist/index.js"]
