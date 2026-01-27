FROM node:18-bullseye-slim

# Instalar dependencias del sistema para better-sqlite3 (build + runtime)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    sqlite3 \
    libsqlite3-dev \
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
RUN cd api && npm rebuild better-sqlite3 --verbose

# Copiar código fuente
COPY . .

# Build TypeScript (root + api)
RUN npm run build

# Verificar que schema.sql se copió correctamente
RUN ls -la api/dist/db/ && cat api/dist/db/schema.sql | head -20

# Test de carga de better-sqlite3 antes de deployment (desde el directorio api)
RUN cd api && node -e "console.log('Testing better-sqlite3...'); const Database = require('better-sqlite3'); console.log('✅ better-sqlite3 loaded successfully'); const db = new Database(':memory:'); db.close(); console.log('✅ In-memory database test passed');" || (echo "❌ better-sqlite3 test failed" && exit 1)

# Cambiar al directorio del API para que Node resuelva node_modules correctamente
WORKDIR /app/api

# Puerto expuesto (Railway usa PORT dinámico)
EXPOSE 3000

# Health check usando el PORT de Railway (no hardcodeado)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "const port = process.env.PORT || 3000; require('http').get('http://localhost:' + port + '/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Script de inicio con logging mejorado
CMD ["sh", "-c", "echo '🚀 Starting API server...'; echo 'Node version:' && node --version; echo 'Working directory:' && pwd; echo 'Files in dist:' && ls -la dist/; echo 'Starting node process...'; exec node dist/index.js"]
