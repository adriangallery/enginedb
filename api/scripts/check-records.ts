/**
 * Script para verificar el conteo de registros en la base de datos SQLite
 */

import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta a la base de datos
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'enginedb.sqlite');

// Tablas principales a verificar
const MAIN_TABLES = [
  'listing_events',
  'trade_events',
  'sweep_events',
  'erc721_transfers',
  'erc20_transfers',
  'erc1155_transfers_single',
  'erc1155_transfers_batch',
  'punk_listings',
  'sync_state',
];

function countRecords(db: Database.Database, table: string): number {
  try {
    const result = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number };
    return result.count;
  } catch (error: any) {
    if (error.message.includes('no such table')) {
      return 0;
    }
    throw error;
  }
}

async function main(): Promise<void> {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  📊 Verificación de Registros en Base de Datos');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  
  console.log(`📍 Base de datos: ${DB_PATH}`);
  
  if (!fs.existsSync(DB_PATH)) {
    console.error(`❌ Base de datos no encontrada en: ${DB_PATH}`);
    process.exit(1);
  }
  
  const db = new Database(DB_PATH, { readonly: true });
  
  try {
    let totalRecords = 0;
    const counts: Record<string, number> = {};
    
    for (const table of MAIN_TABLES) {
      process.stdout.write(`  📦 Consultando ${table}... `);
      const count = countRecords(db, table);
      counts[table] = count;
      totalRecords += count;
      console.log(`${count} registros`);
    }
    
    // Obtener todas las tablas para un conteo completo
    const allTables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_migrations'
      ORDER BY name
    `).all() as { name: string }[];
    
    let grandTotal = 0;
    for (const table of allTables) {
      const count = countRecords(db, table.name);
      grandTotal += count;
    }
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  📊 Resumen - Tablas Principales');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    
    for (const [table, count] of Object.entries(counts)) {
      console.log(`  ${table.padEnd(30)} ${count.toString().padStart(8)} registros`);
    }
    
    console.log('');
    console.log(`  Subtotal (tablas principales): ${totalRecords} registros`);
    console.log(`  Total (todas las tablas):      ${grandTotal} registros`);
    console.log('');
    
    // Comparar con el valor inicial
    const INITIAL_COUNT = 8899;
    const newRecords = grandTotal - INITIAL_COUNT;
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  📈 Comparación con Migración Inicial');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log(`  Registros iniciales (migración): ${INITIAL_COUNT}`);
    console.log(`  Registros actuales:            ${grandTotal}`);
    console.log(`  Nuevos registros:              ${newRecords > 0 ? '+' : ''}${newRecords}`);
    console.log('');
    
    if (newRecords > 0) {
      console.log('  ✅ El bot está guardando nuevos eventos correctamente!');
    } else if (newRecords === 0) {
      console.log('  ⚠️  No se han agregado nuevos registros aún');
    } else {
      console.log('  ⚠️  Se han perdido registros (revisar)');
    }
    console.log('');
  } finally {
    db.close();
  }
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
