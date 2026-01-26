/**
 * Script de migración de Supabase a SQLite
 * Ejecuta todas las migraciones necesarias
 */

import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from '../src/db/init.js';
import { closeDatabase } from '../src/db/sqlite.js';

// Cargar .env desde la carpeta api/
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '..', '.env');
config({ path: envPath });

async function main(): Promise<void> {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  📦 Migración de Base de Datos');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  
  try {
    // Inicializar DB (crea tablas si no existen)
    await initDatabase();
    
    console.log('');
    console.log('✅ Migración completada exitosamente');
    console.log('');
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  } finally {
    closeDatabase();
  }
}

main();
