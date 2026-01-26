/**
 * Script de inicio unificado para Railway
 * 
 * Este script:
 * 1. Levanta el servidor API SQLite (para los frontends) - SIEMPRE por defecto
 * 2. Inicia el bot listener (que sigue usando Supabase por ahora)
 * 
 * Variables de entorno:
 * - DISABLE_API=true     → Desactiva el servidor API SQLite (por defecto está activo)
 * - RUN_BOT=false        → No inicia el bot (solo API)
 * - API_KEY              → Clave de autenticación para el API
 * - CORS_ORIGIN          → Orígenes permitidos para CORS
 * - DB_PATH              → Ruta a la base de datos SQLite
 */

import 'dotenv/config';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('');
console.log('═══════════════════════════════════════════════════════════════════');
console.log('  🚀 enginedb - Inicio Unificado');
console.log('═══════════════════════════════════════════════════════════════════');
console.log('');

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const API_PORT = process.env.PORT || 3000;
// API se inicia por defecto, solo se desactiva si DISABLE_API=true
const RUN_API = process.env.DISABLE_API !== 'true';
const RUN_BOT = process.env.RUN_BOT !== 'false'; // Por defecto true

let apiProcess: ChildProcess | null = null;

// ============================================================================
// SERVIDOR API (como proceso separado)
// ============================================================================

async function startAPIServer(): Promise<void> {
  const apiServerPath = path.join(__dirname, '..', 'api', 'dist', 'server.js');
  
  // Verificar que existe
  if (!fs.existsSync(apiServerPath)) {
    console.error('❌ API no compilada. Ejecuta "cd api && npm run build" primero.');
    console.error(`   Buscando: ${apiServerPath}`);
    throw new Error('API not compiled');
  }
  
  console.log('📦 Iniciando servidor API SQLite...');
  console.log(`   📁 Puerto: ${API_PORT}`);
  
  return new Promise((resolve, reject) => {
    apiProcess = spawn('node', [apiServerPath], {
      env: { ...process.env },
      stdio: 'inherit',
    });
    
    apiProcess.on('error', (err) => {
      console.error('❌ Error iniciando API:', err);
      reject(err);
    });
    
    // Dar tiempo a que inicie
    setTimeout(() => {
      console.log('   ✅ API iniciada');
      resolve();
    }, 2000);
  });
}

// ============================================================================
// BOT LISTENER
// ============================================================================

async function startBotListener(): Promise<void> {
  console.log('');
  console.log('🤖 Iniciando Bot Listener...');
  
  // Importar el listener (se auto-inicia al importarlo)
  await import('./unified-listener.js');
}

// ============================================================================
// CLEANUP
// ============================================================================

function cleanup(signal: string): void {
  console.log(`\n⚠️  Recibida señal ${signal}`);
  
  if (apiProcess) {
    apiProcess.kill('SIGTERM');
  }
  
  setTimeout(() => process.exit(0), 1000);
}

process.on('SIGTERM', () => cleanup('SIGTERM'));
process.on('SIGINT', () => cleanup('SIGINT'));

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  try {
    console.log(`📋 Configuración:`);
    console.log(`   RUN_API: ${RUN_API} (API SQLite)`);
    console.log(`   RUN_BOT: ${RUN_BOT} (Bot Listener)`);
    console.log(`   PORT: ${API_PORT}`);
    console.log('');
    
    // API se inicia primero (siempre, a menos que DISABLE_API=true)
    if (RUN_API) {
      await startAPIServer();
    } else {
      console.log('ℹ️  API SQLite desactivada (DISABLE_API=true)');
    }
    
    // Bot listener
    if (RUN_BOT) {
      await startBotListener();
    } else {
      console.log('ℹ️  Bot desactivado (RUN_BOT=false)');
    }
    
    if (!RUN_API && !RUN_BOT) {
      console.log('⚠️  Nada que iniciar. Quita DISABLE_API=true o RUN_BOT=false');
      process.exit(1);
    }
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('  ✅ Servicios iniciados correctamente');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('');
    
  } catch (error) {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  }
}

main();
