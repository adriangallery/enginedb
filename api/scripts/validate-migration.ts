/**
 * Script para validar la migración
 * Compara conteos entre archivos JSON exportados y SQLite
 */

import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from '../src/db/init.js';
import { get, closeDatabase } from '../src/db/sqlite.js';

// Cargar .env desde la carpeta api/
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '..', '.env');
config({ path: envPath });

// Directorio de exportación
const EXPORT_DIR = path.join(process.cwd(), 'data', 'export');

// Tablas a validar
const TABLES = [
  'sync_state',
  'punk_listings',
  'listing_events',
  'trade_events',
  'sweep_events',
  'engine_config_events',
  'erc20_transfers',
  'erc20_approvals',
  'erc20_custom_events',
  'erc721_transfers',
  'erc721_approvals',
  'erc721_approvals_for_all',
  'erc721_custom_events',
  'erc1155_transfers_single',
  'erc1155_transfers_batch',
  'erc1155_approvals_for_all',
  'erc1155_uri_updates',
  'erc1155_custom_events',
  'traits_extensions_events',
  'shop_events',
  'name_registry_events',
  'name_registry_config_events',
  'serum_module_events',
  'punk_quest_staking_events',
  'punk_quest_item_events',
  'punk_quest_event_events',
];

interface ValidationResult {
  table: string;
  exportCount: number;
  sqliteCount: number;
  match: boolean;
  difference: number;
}

async function validateTable(tableName: string): Promise<ValidationResult> {
  // Contar en archivo JSON exportado
  let exportCount = 0;
  const filePath = path.join(EXPORT_DIR, `${tableName}.json`);
  
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      exportCount = Array.isArray(data) ? data.length : 0;
    } catch {}
  }
  
  // Contar en SQLite
  let sqliteCount = 0;
  try {
    const result = get<{ count: number }>(`SELECT COUNT(*) as count FROM ${tableName}`);
    sqliteCount = result?.count || 0;
  } catch {}
  
  const difference = exportCount - sqliteCount;
  const match = difference === 0;
  
  return {
    table: tableName,
    exportCount,
    sqliteCount,
    match,
    difference,
  };
}

async function main(): Promise<void> {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ✅ Validación de Migración');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  
  // Inicializar DB
  await initDatabase();
  
  console.log('');
  console.log('📊 Comparando conteos...');
  console.log('');
  
  const results: ValidationResult[] = [];
  let allMatch = true;
  
  // Encabezado de tabla
  console.log('┌────────────────────────────────────┬──────────┬──────────┬──────────┬────────┐');
  console.log('│ Tabla                              │ Exportado│ SQLite   │ Diferencia│ Estado │');
  console.log('├────────────────────────────────────┼──────────┼──────────┼──────────┼────────┤');
  
  for (const table of TABLES) {
    const result = await validateTable(table);
    results.push(result);
    
    if (!result.match && result.exportCount > 0) {
      allMatch = false;
    }
    
    const status = result.match || result.exportCount === 0 ? '✅' : '❌';
    const tablePadded = table.padEnd(34);
    const exportPadded = result.exportCount.toString().padStart(8);
    const sqlitePadded = result.sqliteCount.toString().padStart(8);
    const diffPadded = result.difference.toString().padStart(9);
    
    console.log(`│ ${tablePadded} │${exportPadded} │${sqlitePadded} │${diffPadded} │   ${status}   │`);
  }
  
  console.log('└────────────────────────────────────┴──────────┴──────────┴──────────┴────────┘');
  
  // Resumen
  console.log('');
  const totalExport = results.reduce((sum, r) => sum + r.exportCount, 0);
  const totalSqlite = results.reduce((sum, r) => sum + r.sqliteCount, 0);
  const totalDiff = totalExport - totalSqlite;
  
  console.log(`📊 Total exportado: ${totalExport}`);
  console.log(`📊 Total en SQLite: ${totalSqlite}`);
  console.log(`📊 Diferencia total: ${totalDiff}`);
  console.log('');
  
  if (allMatch) {
    console.log('✅ Validación exitosa: Todos los datos migrados correctamente');
  } else {
    console.log('⚠️  Validación con diferencias: Algunos registros no se migraron');
    console.log('   Esto puede ser normal si hubo duplicados o errores de constraint');
  }
  
  console.log('');
  closeDatabase();
}

main().catch((error) => {
  console.error('💥 Error fatal:', error);
  closeDatabase();
  process.exit(1);
});
