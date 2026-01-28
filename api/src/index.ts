/**
 * Entry point para Railway - Inicia el servidor API
 * Este archivo SIEMPRE inicia el servidor sin condiciones
 */

import { startServer } from './server.js';

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('  🚀 enginedb-api - Iniciando...');
console.log('═══════════════════════════════════════════════════════════');
console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
console.log(`📂 Working directory: ${process.cwd()}`);
console.log(`🔧 Node version: ${process.version}`);
console.log(`🌐 PORT: ${process.env.PORT || 'no configurado'}`);
console.log(`🔒 CORS: ${process.env.CORS_ORIGIN || '*'}`);
console.log(`💾 DB_PATH: ${process.env.DB_PATH || './data/enginedb.sqlite'}`);
console.log('');

startServer().catch((error) => {
  console.error('');
  console.error('═══════════════════════════════════════════════════════════');
  console.error('  💥 ERROR FATAL AL INICIAR SERVIDOR');
  console.error('═══════════════════════════════════════════════════════════');
  console.error('Error:', error);
  console.error('Stack trace:', error.stack);
  console.error('');
  process.exit(1);
});
