/**
 * Entry point para Railway - Inicia el servidor API
 * Este archivo SIEMPRE inicia el servidor sin condiciones
 */

import { startServer } from './server.js';

console.log('🚀 Entry point - Iniciando servidor API...');

startServer().catch((error) => {
  console.error('💥 Error fatal al iniciar servidor:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
});
