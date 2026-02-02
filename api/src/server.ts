/**
 * Servidor Express para enginedb-api
 * Backend API compatible con Supabase PostgREST
 */

import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import { initDatabase } from './db/init.js';
import { closeDatabase, getDatabaseSize, isConnected, getDatabase } from './db/sqlite.js';
import { authMiddleware } from './middleware/auth.js';
import { errorHandler } from './utils/errors.js';
import tablesRouter from './routes/tables.js';
import queryRouter from './routes/query.js';

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

// Logging middleware simple para debugging en Railway
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check (sin auth)
app.get('/health', (_req, res) => {
  console.log('🏥 Health check recibido');
  const connected = isConnected();
  const dbSize = getDatabaseSize();

  const response = {
    status: connected ? 'healthy' : 'unhealthy',
    database: {
      connected,
      sizeBytes: dbSize,
      sizeMB: (dbSize / 1024 / 1024).toFixed(2),
    },
    timestamp: new Date().toISOString(),
  };

  console.log('🏥 Health check response:', JSON.stringify(response));
  res.json(response);
});

// Debug endpoint - Muestra estado detallado del sistema
app.get('/debug/status', (_req, res) => {
  console.log('🔍 Debug status solicitado');

  try {
    const db = getDatabase();
    const connected = isConnected();
    const dbSize = getDatabaseSize();

    // Obtener última sincronización de cada contrato
    const syncState = db.prepare(`
      SELECT * FROM sync_state ORDER BY updated_at DESC LIMIT 5
    `).all();

    // Contar eventos totales
    const eventCounts: Record<string, number> = {};
    const tables = ['trade_events', 'listing_events', 'punk_listings', 'erc721_transfers', 'erc20_transfers'];

    for (const table of tables) {
      try {
        const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number };
        eventCounts[table] = count.count;
      } catch {
        eventCounts[table] = 0;
      }
    }

    const response = {
      status: 'debug',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      nodeVersion: process.version,
      database: {
        connected,
        sizeBytes: dbSize,
        sizeMB: (dbSize / 1024 / 1024).toFixed(2),
        path: process.env.DB_PATH || './data/enginedb.sqlite',
      },
      syncState: syncState,
      eventCounts: eventCounts,
      environment: {
        PORT: process.env.PORT,
        CORS_ORIGIN: process.env.CORS_ORIGIN,
        NODE_ENV: process.env.NODE_ENV,
      },
    };

    console.log('🔍 Debug status response:', JSON.stringify(response, null, 2));
    res.json(response);
  } catch (error: any) {
    console.error('❌ Error en debug status:', error);
    res.status(500).json({ error: error.message });
  }
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
      query: 'POST /query',
      listTables: 'GET /query/tables',
      tableSchema: 'GET /query/schema/:table',
    },
    documentation: 'https://github.com/adriangallery/enginedb/tree/main/api',
  });
});

// Rutas de query directas (públicas por ahora, puedes protegerlas agregando authMiddleware)
app.use('/', queryRouter);

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
    console.log(`   POST http://localhost:${PORT}/query`);
    console.log(`   GET  http://localhost:${PORT}/query/tables`);
    console.log(`   GET  http://localhost:${PORT}/query/schema/:table`);
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
