/**
 * Listener continuo para Railway
 * Se ejecuta en un loop infinito con intervalos configurables
 * Sincroniza eventos del contrato FloorEngine en Base mainnet
 */

import { syncEvents } from './listener.js';
import 'dotenv/config';

// Configuración del intervalo de sincronización (en milisegundos)
// Por defecto: 1 minuto (60,000 ms) - TEMPORAL para sincronización rápida
// Puedes configurarlo con la variable de entorno SYNC_INTERVAL_MINUTES
// Para operación normal, usar SYNC_INTERVAL_MINUTES=5
const SYNC_INTERVAL_MINUTES = process.env.SYNC_INTERVAL_MINUTES
  ? parseInt(process.env.SYNC_INTERVAL_MINUTES)
  : 1; // Temporal: 1 minuto para sincronización rápida

const SYNC_INTERVAL_MS = SYNC_INTERVAL_MINUTES * 60 * 1000;

/**
 * Función para esperar un tiempo determinado
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Función principal del listener continuo
 */
async function runContinuousListener() {
  console.log('🚀 FloorEngine Continuous Listener Bot');
  console.log('======================================');
  console.log(`⏰ Inicio: ${new Date().toISOString()}`);
  console.log(`🔄 Intervalo de sincronización: ${SYNC_INTERVAL_MINUTES} minutos`);
  console.log('');

  let iteration = 0;

  while (true) {
    iteration++;
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Iteración #${iteration}`);
    console.log(`⏰ ${new Date().toISOString()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    try {
      const startTime = Date.now();
      const result = await syncEvents();
      const duration = Date.now() - startTime;

      console.log('');
      console.log('✅ Sincronización completada');
      console.log(`📊 ${result.processed} eventos procesados`);
      console.log(
        `📍 Bloques: ${result.fromBlock} → ${result.toBlock}`
      );
      console.log(`⏱️  Duración: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
    } catch (error) {
      console.error('');
      console.error('❌ Error durante la sincronización:');
      console.error(error);
      console.error('');
      console.error('⚠️  Continuando con el siguiente ciclo...');
    }

    console.log('');
    console.log(`⏳ Esperando ${SYNC_INTERVAL_MINUTES} minutos hasta la próxima sincronización...`);
    console.log(`🕐 Próxima ejecución: ${new Date(Date.now() + SYNC_INTERVAL_MS).toISOString()}`);

    // Esperar antes de la próxima iteración
    await sleep(SYNC_INTERVAL_MS);
  }
}

/**
 * Manejo de señales para shutdown graceful
 */
process.on('SIGTERM', () => {
  console.log('');
  console.log('⚠️  Recibida señal SIGTERM');
  console.log('🛑 Deteniendo listener...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('');
  console.log('⚠️  Recibida señal SIGINT');
  console.log('🛑 Deteniendo listener...');
  process.exit(0);
});

// Iniciar el listener
runContinuousListener().catch((error) => {
  console.error('');
  console.error('💥 Error fatal en el listener:');
  console.error(error);
  process.exit(1);
});

