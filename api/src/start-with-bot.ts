/**
 * Script de inicio unificado para Railway
 * Levanta tanto el API SQLite como el bot listener en el mismo proceso
 */

import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Cargar .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Intentar cargar .env desde api/ primero, luego desde raíz
config({ path: path.join(__dirname, '..', '.env') });
config({ path: path.join(__dirname, '..', '..', '.env') });

import { initDatabase } from './db/init.js';
import { closeDatabase, getDatabaseSize, isConnected } from './db/sqlite.js';
import { authMiddleware } from './middleware/auth.js';
import { errorHandler } from './utils/errors.js';
import tablesRouter from './routes/tables.js';

// Crear app Express
const app = express();

// Configuración
const PORT = process.env.API_PORT || process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Middleware de CORS
const corsOptions: cors.CorsOptions = {
  origin: CORS_ORIGIN === '*' ? '*' : CORS_ORIGIN.split(',').map(o => o.trim()),
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'apikey', 'Authorization', 'Prefer', 'Range'],
  exposedHeaders: ['Content-Range', 'X-Total-Count'],
  credentials: true,
};
app.use(cors(corsOptions));

// Middleware de parsing JSON
app.use(express.json({ limit: '10mb' }));

// Health check (sin auth)
app.get('/health', (_req, res) => {
  const connected = isConnected();
  const dbSize = getDatabaseSize();
  
  res.json({
    status: connected ? 'healthy' : 'unhealthy',
    database: {
      connected,
      sizeBytes: dbSize,
      sizeMB: (dbSize / 1024 / 1024).toFixed(2),
    },
    timestamp: new Date().toISOString(),
  });
});

// Rutas públicas de información
app.get('/', (_req, res) => {
  res.json({
    name: 'enginedb-api',
    version: '1.0.0',
    description: 'Backend API SQLite compatible con Supabase PostgREST',
    endpoints: {
      health: '/health',
      tables: '/rest/v1/:table',
    },
  });
});

// Middleware de autenticación para rutas protegidas
app.use('/rest/v1', authMiddleware);

// Rutas de tablas
app.use('/rest/v1', tablesRouter);

// Error handler
app.use(errorHandler);

/**
 * Iniciar el servidor API
 */
export async function startAPIServer(): Promise<void> {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  📦 enginedb-api - Backend SQLite');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  
  // Inicializar base de datos
  await initDatabase();
  
  console.log('');
  
  // Iniciar servidor
  app.listen(PORT, () => {
    console.log(`🚀 API iniciada en puerto ${PORT}`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`🔒 CORS: ${CORS_ORIGIN}`);
    console.log('');
  });
}

// Manejo de shutdown graceful
process.on('SIGTERM', () => {
  console.log('⚠️  Recibida señal SIGTERM, cerrando...');
  closeDatabase();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('⚠️  Recibida señal SIGINT, cerrando...');
  closeDatabase();
  process.exit(0);
});

// Exportar para uso externo
export { app, initDatabase };
