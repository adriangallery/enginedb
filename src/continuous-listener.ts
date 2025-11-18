/**
 * Listener continuo para Railway
 * Se ejecuta en un loop infinito con intervalos configurables
 * Sincroniza eventos del contrato FloorEngine y $ADRIAN Token en Base mainnet
 */

import { syncEvents } from './listener.js';
import { syncERC20Events } from './listeners/erc20/adrian-token-listener.js';
import { syncHistoricalERC20 } from './listeners/erc20/historical-sync.js';
import { ADRIAN_TOKEN_CONFIG } from './contracts/config/adrian-token.js';
import { getLastSyncedBlockByContract } from './supabase/client.js';
import { createViemClient } from './listener.js';
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

    // Sincronizar FloorEngine
    try {
      const startTime = Date.now();
      const result = await syncEvents();
      const duration = Date.now() - startTime;

      console.log('');
      console.log('[FloorEngine] ✅ Sincronización completada');
      console.log(`[FloorEngine] 📊 ${result.processed} eventos procesados`);
      console.log(
        `[FloorEngine] 📍 Bloques: ${result.fromBlock} → ${result.toBlock}`
      );
      console.log(`[FloorEngine] ⏱️  Duración: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
    } catch (error) {
      console.error('');
      console.error('[FloorEngine] ❌ Error durante la sincronización:');
      console.error(error);
      console.error('');
      console.error('[FloorEngine] ⚠️  Continuando con siguiente contrato...');
    }

    // Sincronizar $ADRIAN Token (ERC20)
    try {
      const startTime = Date.now();
      
      // Detectar si hay muchos bloques pendientes (más de 100,000 bloques)
      // Si es así, usar sincronización histórica automáticamente
      const client = createViemClient();
      const contractAddress = ADRIAN_TOKEN_CONFIG.address;
      const lastSyncedBlock = BigInt(
        await getLastSyncedBlockByContract(contractAddress)
      );
      const latestBlock = await client.getBlockNumber();
      
      const startBlock =
        lastSyncedBlock === 0n && ADRIAN_TOKEN_CONFIG.startBlock
          ? ADRIAN_TOKEN_CONFIG.startBlock
          : lastSyncedBlock === 0n
            ? 0n
            : lastSyncedBlock + 1n;
      
      const blocksToProcess = latestBlock - startBlock + 1n;
      const HISTORICAL_THRESHOLD = 100000n; // 100,000 bloques
      
      let result;
      if (blocksToProcess > HISTORICAL_THRESHOLD && iteration === 1) {
        // Primera iteración y hay muchos bloques pendientes: usar sync histórico
        console.log('');
        console.log(`[ADRIAN-ERC20] 📜 Detectados ${blocksToProcess} bloques pendientes (>${HISTORICAL_THRESHOLD})`);
        console.log('[ADRIAN-ERC20] 🔄 Usando sincronización histórica automática...');
        await syncHistoricalERC20();
        result = await syncERC20Events(); // Sincronizar cualquier bloque nuevo
      } else {
        // Sincronización normal
        result = await syncERC20Events();
      }
      
      const duration = Date.now() - startTime;

      console.log('');
      console.log('[ADRIAN-ERC20] ✅ Sincronización completada');
      console.log(`[ADRIAN-ERC20] 📊 ${result.processed} eventos procesados`);
      console.log(
        `[ADRIAN-ERC20] 📍 Bloques: ${result.fromBlock} → ${result.toBlock}`
      );
      console.log(`[ADRIAN-ERC20] ⏱️  Duración: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
    } catch (error) {
      console.error('');
      console.error('[ADRIAN-ERC20] ❌ Error durante la sincronización:');
      console.error(error);
      console.error('');
      console.error('[ADRIAN-ERC20] ⚠️  Continuando con siguiente ciclo...');
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

