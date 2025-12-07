/**
 * Entry point para Railway
 * Ejecuta sincronizaciones en un loop continuo
 */

import { syncAllContracts } from './unified-listener.js';
import 'dotenv/config';

// Intervalo entre sincronizaciones (en milisegundos)
// 5 minutos = 5 * 60 * 1000 = 300000ms
const SYNC_INTERVAL = process.env.SYNC_INTERVAL
  ? parseInt(process.env.SYNC_INTERVAL)
  : 5 * 60 * 1000; // 5 minutos por defecto

/**
 * Ejecutar una sincronización con manejo de errores
 */
async function runSync(): Promise<void> {
  console.log('');
  console.log('═'.repeat(80));
  console.log(`🔄 Iniciando sincronización - ${new Date().toISOString()}`);
  console.log('═'.repeat(80));

  try {
    const result = await syncAllContracts();

    console.log('');
    console.log('✅ Sincronización completada exitosamente');
    console.log(`📊 Eventos procesados: ${result.totalEventsProcessed}`);
    console.log(`⏱️  Duración: ${(result.duration / 1000).toFixed(2)}s`);
    console.log(`📍 Estado: ${result.hasMore ? 'Pendiente' : 'Completo'}`);
    console.log(
      `⏰ Próxima sincronización en ${SYNC_INTERVAL / 1000 / 60} minutos`
    );
  } catch (error) {
    console.error('');
    console.error('❌ Error durante la sincronización:');
    console.error(error);
    console.error('');
    console.error('⏰ Reintentando en la próxima iteración...');
  }
}

/**
 * Loop principal que ejecuta sincronizaciones periódicamente
 */
async function startSyncLoop(): Promise<void> {
  console.log('');
  console.log('🚀 Multi-Contract Listener Bot - Railway Mode');
  console.log('═'.repeat(80));
  console.log(`⏰ Intervalo de sincronización: ${SYNC_INTERVAL / 1000 / 60} minutos`);
  console.log(`🌐 Network: Base Mainnet`);
  console.log(`🔄 Modo: Intercalado (Forward ↔ Backward)`);
  console.log('═'.repeat(80));
  console.log('');

  // Ejecutar primera sincronización inmediatamente
  await runSync();

  // Configurar loop periódico
  setInterval(async () => {
    await runSync();
  }, SYNC_INTERVAL);

  // Mantener el proceso vivo
  console.log('✅ Bot activo - Sincronizando automáticamente');
  console.log('');
}

// Manejo de señales para shutdown graceful
process.on('SIGTERM', () => {
  console.log('');
  console.log('⚠️ Recibida señal SIGTERM - Cerrando bot...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('');
  console.log('⚠️ Recibida señal SIGINT - Cerrando bot...');
  process.exit(0);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Iniciar el bot
startSyncLoop().catch((error) => {
  console.error('❌ Error fatal al iniciar el bot:', error);
  process.exit(1);
});

// Railway redeploy trigger

