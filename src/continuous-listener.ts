/**
 * Listener continuo para Railway
 * Se ejecuta en un loop infinito con intervalos configurables
 * Sincroniza eventos de TODOS los contratos usando el sistema unificado
 * Mucho más eficiente: lee cada bloque UNA SOLA VEZ para todos los contratos
 * 
 * También sincroniza la base de datos a GitHub periódicamente
 */

import { syncAllContracts } from './unified-listener.js';
import { syncDatabaseToGitHub as syncSupabaseToGitHub, isGitHubSyncEnabled as isSupabaseGitHubSyncEnabled } from './github-sync.js';
import { syncDatabaseToGitHub as syncSQLiteToGitHub, isGitHubSyncEnabled as isSQLiteGitHubSyncEnabled } from './sqlite/github-sync.js';
import { initEventBuffer, getEventBuffer } from './supabase/event-buffer.js';
import { initSQLiteEventBuffer, getSQLiteEventBuffer } from './sqlite/event-buffer.js';
import { enableBufferMode } from './supabase/client.js';
import { getDatabase as initSQLiteDB } from './sqlite/client.js';
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

// Configuración: intervalo de sincronización a GitHub (en minutos)
// Por defecto: 10 minutos. Mínimo 10 para no saturar la API de GitHub.
const GITHUB_SYNC_INTERVAL_MINUTES = (() => {
  const raw = process.env.GITHUB_SYNC_INTERVAL_MINUTES
    ? parseInt(process.env.GITHUB_SYNC_INTERVAL_MINUTES, 10)
    : 10;
  return Math.max(10, isNaN(raw) ? 10 : raw);
})();

const GITHUB_SYNC_INTERVAL_MS = GITHUB_SYNC_INTERVAL_MINUTES * 60 * 1000;

// Timestamp de la última sincronización a GitHub
// Inicializar con Date.now() para evitar sync inmediato en primer ciclo
let lastGitHubSync = Date.now();

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
  console.log(`🔄 Intervalo de sincronización blockchain: ${SYNC_INTERVAL_MINUTES} minutos (${SYNC_INTERVAL_MS}ms)`);
  console.log(`📊 Batches por contrato: ${BATCHES_PER_CONTRACT}`);

  const FLUSH_INTERVAL_MINUTES = process.env.FLUSH_INTERVAL_MINUTES
    ? parseInt(process.env.FLUSH_INTERVAL_MINUTES, 10)
    : 30; // Default: 30 minutos

  // Inicializar Event Buffer según el backend
  if (process.env.USE_SUPABASE === 'true') {
    // Modo Supabase
    console.log(`📦 Inicializando Supabase Event Buffer (flush cada ${FLUSH_INTERVAL_MINUTES} min)...`);

    initEventBuffer(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      FLUSH_INTERVAL_MINUTES
    );

    enableBufferMode();
    console.log('✅ Modo: Supabase + Buffer');
    console.log('');
  } else {
    // Modo SQLite directo
    console.log(`📦 Inicializando SQLite Event Buffer (flush cada ${FLUSH_INTERVAL_MINUTES} min)...`);

    // Inicializar base de datos SQLite
    initSQLiteDB();

    // Inicializar buffer
    initSQLiteEventBuffer(FLUSH_INTERVAL_MINUTES);

    enableBufferMode();
    console.log('✅ Modo: SQLite local + GitHub sync');
    console.log('');
  }

  // Mostrar estado de GitHub sync
  const isGitHubEnabled = process.env.USE_SUPABASE === 'true'
    ? isSupabaseGitHubSyncEnabled()
    : isSQLiteGitHubSyncEnabled();

  if (isGitHubEnabled) {
    const requested = process.env.GITHUB_SYNC_INTERVAL_MINUTES;
    const clamped = requested && parseInt(requested, 10) < 10;
    const syncType = process.env.USE_SUPABASE === 'true' ? 'Supabase → GitHub' : 'SQLite → GitHub';
    console.log(
      `📤 GitHub Sync: Activado - ${syncType} (cada ${GITHUB_SYNC_INTERVAL_MINUTES} min${clamped ? ', mínimo 10 para no saturar GitHub' : ''})`
    );
    console.log(`   Próximo sync a GitHub: ${new Date(lastGitHubSync + GITHUB_SYNC_INTERVAL_MS).toISOString()}`);
  } else {
    console.log('📤 GitHub Sync: Desactivado (GITHUB_TOKEN no configurado)');
  }
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

    // Sistema Unificado: Lee cada bloque UNA SOLA VEZ para todos los contratos
    // Mucho más eficiente que leer cada contrato por separado
    let hasAnyWork = true;
    let round = 0;
    const MAX_ROUNDS = 1000; // Límite de seguridad
    
    console.log('🌐 Iniciando sincronización unificada multi-contrato...');
    console.log('💡 Sistema optimizado: cada bloque se lee UNA SOLA VEZ');
    console.log('');

    // Procesar en rondas hasta que todos los contratos estén sincronizados
    while (hasAnyWork && round < MAX_ROUNDS) {
      round++;
      
      console.log(`🔄 Ronda #${round} - Procesando todos los contratos simultáneamente...`);
      console.log('');
      
      try {
        const result = await syncAllContracts(BATCHES_PER_CONTRACT);
        
        // Verificar si algún contrato tiene más trabajo
        hasAnyWork = result.hasMore;
        
        console.log('');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📊 Ronda #${round} completada`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        // Mostrar estado de cada contrato
        for (const state of result.contractStates) {
          const hasMore = state.hasMoreForward || state.hasMoreBackward;
          console.log(
            `   ${hasMore ? '📦' : '✅'} ${state.name}: ${state.eventsProcessed} eventos | Forward: ${state.lastSyncedBlock} | Backward: ${state.lastHistoricalBlock || 'N/A'}`
          );
        }
        
        if (hasAnyWork) {
          console.log('');
          console.log('⏸️  Hay trabajo pendiente, continuando en 1 segundo...');
          await sleep(1000);
        } else {
          console.log('');
          console.log('✅ Todos los contratos están sincronizados');
        }
      } catch (error) {
        console.error('');
        console.error('❌ Error durante la sincronización unificada:');
        console.error(error);
        console.error('');
        console.error('⚠️  Reintentando en siguiente iteración...');
        hasAnyWork = false; // Salir del loop en caso de error
      }
    }

    if (round >= MAX_ROUNDS) {
      console.log('');
      console.log('⚠️  Alcanzado límite de rounds, reiniciando ciclo...');
    }

    // Sincronizar base de datos a GitHub si ha pasado el intervalo
    const isGitHubEnabled = process.env.USE_SUPABASE === 'true'
      ? isSupabaseGitHubSyncEnabled()
      : isSQLiteGitHubSyncEnabled();

    if (isGitHubEnabled) {
      const timeSinceLastSync = Date.now() - lastGitHubSync;
      if (timeSinceLastSync >= GITHUB_SYNC_INTERVAL_MS) {
        const syncResult = process.env.USE_SUPABASE === 'true'
          ? await syncSupabaseToGitHub()
          : await syncSQLiteToGitHub();

        lastGitHubSync = Date.now();

        if (syncResult.success) {
          console.log(`🕐 Próxima sincronización a GitHub: ${new Date(lastGitHubSync + GITHUB_SYNC_INTERVAL_MS).toISOString()}`);
        }
      }
    }

    console.log(`⏳ Esperando ${SYNC_INTERVAL_MINUTES} minutos hasta la próxima sincronización...`);
    console.log(`🕐 Próxima ejecución: ${new Date(Date.now() + SYNC_INTERVAL_MS).toISOString()}`);

    // Esperar antes de la próxima iteración
    await sleep(SYNC_INTERVAL_MS);
  }
}

/**
 * Manejo de señales para shutdown graceful
 */
const shutdown = async (signal: string) => {
  console.log('');
  console.log(`⚠️  Recibida señal ${signal}`);
  console.log('🛑 Deteniendo listener...');

  // Flush final del buffer
  console.log('📤 Haciendo flush final del buffer...');
  try {
    if (process.env.USE_SUPABASE === 'true') {
      const buffer = getEventBuffer();
      await buffer.stop();
    } else {
      const buffer = getSQLiteEventBuffer();
      await buffer.stop();
    }
  } catch (error) {
    console.error('Error en flush final:', error);
  }

  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Iniciar el listener
runContinuousListener().catch((error) => {
  console.error('');
  console.error('💥 Error fatal en el listener:');
  console.error(error);
  process.exit(1);
});

