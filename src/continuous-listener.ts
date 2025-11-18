/**
 * Listener continuo para Railway
 * Se ejecuta en un loop infinito con intervalos configurables
 * Sincroniza eventos del contrato FloorEngine y $ADRIAN Token en Base mainnet
 */

import { syncEvents } from './listener.js';
import { syncERC20Events } from './listeners/erc20/adrian-token-listener.js';
import 'dotenv/config';

// Configuración del intervalo de sincronización (en milisegundos)
// Por defecto: 1 minuto (60,000 ms) - TEMPORAL para sincronización rápida
// Puedes configurarlo con la variable de entorno SYNC_INTERVAL_MINUTES
// Para operación normal, usar SYNC_INTERVAL_MINUTES=5
const SYNC_INTERVAL_MINUTES = process.env.SYNC_INTERVAL_MINUTES
  ? parseInt(process.env.SYNC_INTERVAL_MINUTES)
  : 1; // Temporal: 1 minuto para sincronización rápida

const SYNC_INTERVAL_MS = SYNC_INTERVAL_MINUTES * 60 * 1000;

// Configuración: batches a procesar por contrato antes de alternar
// Procesa 50 batches de cada contrato antes de cambiar
const BATCHES_PER_CONTRACT = process.env.BATCHES_PER_CONTRACT
  ? parseInt(process.env.BATCHES_PER_CONTRACT)
  : 50;

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
  console.log('🚀 Multi-Contract Continuous Listener Bot');
  console.log('==========================================');
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

    // Intercalar entre contratos: procesar batches limitados de cada uno
    let floorEngineHasMore = true;
    let erc20HasMore = true;

    // Continuar mientras alguno de los contratos tenga trabajo pendiente
    while (floorEngineHasMore || erc20HasMore) {
      // Procesar FloorEngine (si tiene trabajo pendiente)
      if (floorEngineHasMore) {
        try {
          const startTime = Date.now();
          const result = await syncEvents(BATCHES_PER_CONTRACT);
          const duration = Date.now() - startTime;

          floorEngineHasMore = result.hasMore;

          console.log('');
          console.log(`[FloorEngine] ${result.hasMore ? '⏸️  Pausado' : '✅ Completado'}`);
          console.log(`[FloorEngine] 📊 ${result.processed} eventos procesados`);
          console.log(
            `[FloorEngine] 📍 Bloques: ${result.fromBlock} → ${result.toBlock}`
          );
          console.log(`[FloorEngine] ⏱️  Duración: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
          if (result.hasMore) {
            console.log(`[FloorEngine] 🔄 Continuará en siguiente ciclo...`);
          }
        } catch (error) {
          console.error('');
          console.error('[FloorEngine] ❌ Error durante la sincronización:');
          console.error(error);
          console.error('');
          console.error('[FloorEngine] ⚠️  Continuando con siguiente contrato...');
          floorEngineHasMore = false; // En caso de error, pasar al siguiente
        }
      }

      // Procesar $ADRIAN Token (ERC20) (si tiene trabajo pendiente)
      if (erc20HasMore) {
        try {
          const startTime = Date.now();
          const result = await syncERC20Events(BATCHES_PER_CONTRACT);
          const duration = Date.now() - startTime;

          erc20HasMore = result.hasMore;

          console.log('');
          console.log(`[ADRIAN-ERC20] ${result.hasMore ? '⏸️  Pausado' : '✅ Completado'}`);
          console.log(`[ADRIAN-ERC20] 📊 ${result.processed} eventos procesados`);
          console.log(
            `[ADRIAN-ERC20] 📍 Bloques: ${result.fromBlock} → ${result.toBlock}`
          );
          console.log(`[ADRIAN-ERC20] ⏱️  Duración: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
          if (result.hasMore) {
            console.log(`[ADRIAN-ERC20] 🔄 Continuará en siguiente ciclo...`);
          }
        } catch (error) {
          console.error('');
          console.error('[ADRIAN-ERC20] ❌ Error durante la sincronización:');
          console.error(error);
          console.error('');
          console.error('[ADRIAN-ERC20] ⚠️  Continuando con siguiente contrato...');
          erc20HasMore = false; // En caso de error, pasar al siguiente
        }
      }

      // Si ambos contratos tienen más trabajo, continuar el ciclo
      if (floorEngineHasMore || erc20HasMore) {
        console.log('');
        console.log('🔄 Alternando entre contratos...');
        // Pequeña pausa antes de continuar
        await sleep(1000);
      }
    }

    console.log('');
    console.log('✅ Ambos contratos están sincronizados');
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

