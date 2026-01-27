/**
 * Servidor Express para enginedb-api
 * Backend API compatible con Supabase PostgREST
 */

import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import { initDatabase } from './db/init.js';
import { closeDatabase, getDatabaseSize, isConnected } from './db/sqlite.js';
import { authMiddleware } from './middleware/auth.js';
import { errorHandler } from './utils/errors.js';
import tablesRouter from './routes/tables.js';

// Crear app Express
const app = express();

// Configuración (PORT puede venir como string desde Railway)
const PORT = parseInt(process.env.PORT || '3000', 10);
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
    documentation: 'https://github.com/adriangallery/enginedb/tree/main/api',
  });
});

// Middleware de autenticación para rutas protegidas
app.use('/rest/v1', authMiddleware);

// Rutas de tablas
app.use('/rest/v1', tablesRouter);

// Error handler
app.use(errorHandler);

// Función para iniciar el servidor (exportada para uso externo)
export async function startServer(): Promise<void> {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  📦 enginedb-api - Backend SQLite');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  // Inicializar base de datos
  await initDatabase();

  console.log('');

  // Iniciar servidor en 0.0.0.0 para que el healthcheck de Railway pueda conectar
  const HOST = process.env.HOST || '0.0.0.0';
  const server = app.listen(PORT, HOST, () => {
    console.log(`🚀 Servidor iniciado en ${HOST}:${PORT}`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`🔒 CORS: ${CORS_ORIGIN}`);
    console.log('');
    console.log('Endpoints disponibles:');
    console.log(`   GET  http://localhost:${PORT}/health`);
    console.log(`   GET  http://localhost:${PORT}/rest/v1/:table`);
    console.log(`   POST http://localhost:${PORT}/rest/v1/:table`);
    console.log(`   PATCH http://localhost:${PORT}/rest/v1/:table`);
    console.log(`   DELETE http://localhost:${PORT}/rest/v1/:table`);
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
  });

  // Manejo de shutdown graceful
  const shutdown = async (signal: string) => {
    console.log('');
    console.log(`⚠️  Recibida señal ${signal}`);
    console.log('🛑 Cerrando servidor...');

    server.close(() => {
      console.log('✅ Servidor cerrado');
      closeDatabase();
      console.log('✅ Base de datos cerrada');
      process.exit(0);
    });

    // Forzar cierre después de 10 segundos
    setTimeout(() => {
      console.error('❌ Forzando cierre...');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Exportar app para uso externo (startServer ya exportado arriba)
export { app };
