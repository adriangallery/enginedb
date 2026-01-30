/**
 * Script de inicio unificado para Railway
 *
 * Este script:
 * 1. Levanta el servidor API SQLite (para los frontends) - SIEMPRE por defecto
 * 2. Inicia el bot listener (opcional, con RUN_BOT=true)
 *
 * Variables de entorno:
 * - DISABLE_API=true     → Desactiva el servidor API SQLite (por defecto está activo)
 * - RUN_BOT=true         → Inicia el bot (por defecto false, más seguro)
 * - API_KEY              → Clave de autenticación para el API
 * - CORS_ORIGIN          → Orígenes permitidos para CORS
 * - DB_PATH              → Ruta a la base de datos SQLite
 */

import 'dotenv/config';
import path from 'path';

console.log('');
console.log('═══════════════════════════════════════════════════════════════════');
console.log('  🚀 enginedb - Inicio Unificado');
console.log('═══════════════════════════════════════════════════════════════════');
console.log('');

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const API_PORT = process.env.PORT || 3000;
const RUN_API = process.env.DISABLE_API !== 'true';
const RUN_BOT = process.env.RUN_BOT === 'true';

console.log(`📋 Configuración:`);
console.log(`   RUN_API: ${RUN_API} (API SQLite)`);
console.log(`   RUN_BOT: ${RUN_BOT} (Bot Listener)`);
console.log(`   PORT: ${API_PORT}`);
console.log(`   DB_PATH: ${process.env.DB_PATH || './data/enginedb.sqlite'}`);
console.log(`   CWD: ${process.cwd()}`);
console.log('');

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  try {
    // Verificar que al menos uno esté activo
    if (!RUN_API && !RUN_BOT) {
      console.log('⚠️  Nada que iniciar. Quita DISABLE_API=true o agrega RUN_BOT=true');
      process.exit(1);
    }

    // API se inicia primero (en el mismo proceso, importando directamente)
    if (RUN_API) {
      console.log('📦 Iniciando servidor API SQLite...');

      // Importar el servidor API dinámicamente
      // La ruta es relativa a dist/src/start-unified.js
      const apiServerPath = path.join(process.cwd(), 'api', 'dist', 'server.js');
      console.log(`   📁 Importando desde: ${apiServerPath}`);

      try {
        const { startServer } = await import(apiServerPath);
        await startServer();
        console.log('   ✅ API iniciada correctamente');
      } catch (error) {
        console.error('   ❌ Error importando/iniciando API:', error);
        throw error;
      }
    } else {
      console.log('ℹ️  API SQLite desactivada (DISABLE_API=true)');
    }

    // Bot listener (en el mismo proceso)
    if (RUN_BOT) {
      console.log('');
      console.log('🤖 Iniciando Bot Listener...');

      try {
        // Importar el continuous listener
        await import('./continuous-listener.js');
        console.log('   ✅ Bot iniciado correctamente');
      } catch (error) {
        console.error('   ❌ Error importando/iniciando Bot:', error);
        throw error;
      }
    } else {
      console.log('ℹ️  Bot desactivado (RUN_BOT=false por defecto)');
      console.log('   💡 Para activar: RUN_BOT=true');
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('  ✅ Servicios iniciados correctamente');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('═══════════════════════════════════════════════════════════════════');
    console.error('  💥 Error fatal al iniciar');
    console.error('═══════════════════════════════════════════════════════════════════');
    console.error(error);
    console.error('');
    process.exit(1);
  }
}

main();
