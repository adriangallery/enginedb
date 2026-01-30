/**
 * Inicialización de la base de datos SQLite
 * Crea las tablas si no existen
 */

import { getDatabase } from './sqlite.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Ejecutar el schema SQL para crear las tablas
 */
export async function initDatabase(): Promise<void> {
  console.log('📦 Inicializando base de datos SQLite...');
  
  const db = getDatabase();
  
  // Leer el archivo schema.sql
  const schemaPath = path.join(__dirname, 'schema.sql');
  
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found: ${schemaPath}`);
  }
  
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  
  // Ejecutar el schema
  try {
    db.exec(schema);
    console.log('✅ Schema aplicado correctamente');
  } catch (error: any) {
    // Ignorar errores de "already exists" 
    if (!error.message.includes('already exists')) {
      throw error;
    }
    console.log('✅ Tablas ya existían, schema actualizado');
  }
  
  // Verificar que las tablas principales existan
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `).all() as { name: string }[];
  
  console.log(`📊 Tablas disponibles (${tables.length}):`);
  for (const table of tables) {
    // Obtener conteo de cada tabla
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get() as { count: number };
    console.log(`   - ${table.name}: ${count.count} registros`);
  }
}

/**
 * Verificar la integridad de la base de datos
 */
export function checkDatabaseIntegrity(): boolean {
  const db = getDatabase();
  
  try {
    const result = db.pragma('integrity_check') as { integrity_check: string }[];
    const isOk = result[0]?.integrity_check === 'ok';
    
    if (isOk) {
      console.log('✅ Integridad de la base de datos: OK');
    } else {
      console.error('❌ Problemas de integridad:', result);
    }
    
    return isOk;
  } catch (error) {
    console.error('❌ Error verificando integridad:', error);
    return false;
  }
}

/**
 * Obtener estadísticas de la base de datos
 */
export function getDatabaseStats(): {
  tables: number;
  totalRows: number;
  sizeBytes: number;
  walSizeBytes: number;
} {
  const db = getDatabase();
  const dbPath = process.env.DB_PATH || './data/enginedb.sqlite';
  
  // Obtener lista de tablas
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_migrations'
  `).all() as { name: string }[];
  
  // Contar filas totales
  let totalRows = 0;
  for (const table of tables) {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get() as { count: number };
    totalRows += count.count;
  }
  
  // Tamaño del archivo
  let sizeBytes = 0;
  let walSizeBytes = 0;
  
  try {
    sizeBytes = fs.statSync(dbPath).size;
  } catch {}
  
  try {
    walSizeBytes = fs.statSync(`${dbPath}-wal`).size;
  } catch {}
  
  return {
    tables: tables.length,
    totalRows,
    sizeBytes,
    walSizeBytes,
  };
}

export default {
  initDatabase,
  checkDatabaseIntegrity,
  getDatabaseStats,
};
