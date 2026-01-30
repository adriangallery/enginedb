/**
 * Script para importar datos exportados a SQLite
 * Lee archivos JSON y los inserta en SQLite
 */

import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from '../src/db/init.js';
import { getDatabase, closeDatabase, insertMany, transaction } from '../src/db/sqlite.js';

// Cargar .env desde la carpeta api/
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '..', '.env');
config({ path: envPath });

// Directorio de entrada
const INPUT_DIR = path.join(process.cwd(), 'data', 'export');

// Tablas en orden de importación (respetando dependencias)
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

/**
 * Importar una tabla desde JSON
 */
async function importTable(tableName: string): Promise<number> {
  const filePath = path.join(INPUT_DIR, `${tableName}.json`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`  ⏭️  ${tableName}: No hay archivo de exportación, saltando...`);
    return 0;
  }
  
  console.log(`  📥 Importando ${tableName}...`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    if (!Array.isArray(data) || data.length === 0) {
      console.log(`     ⚠️  ${tableName}: Sin datos para importar`);
      return 0;
    }
    
    // Preparar datos: convertir booleans a integers para SQLite
    const preparedData = data.map((row: any) => {
      const prepared: any = {};
      for (const [key, value] of Object.entries(row)) {
        // Saltear el id para que SQLite genere uno nuevo
        if (key === 'id') continue;
        
        // Convertir booleans a integers
        if (typeof value === 'boolean') {
          prepared[key] = value ? 1 : 0;
        }
        // Convertir objetos a JSON string
        else if (typeof value === 'object' && value !== null) {
          prepared[key] = JSON.stringify(value);
        }
        // Convertir BigInt a string si es necesario
        else if (typeof value === 'bigint') {
          prepared[key] = value.toString();
        }
        else {
          prepared[key] = value;
        }
      }
      return prepared;
    });
    
    // Insertar en batches para mejor rendimiento
    const BATCH_SIZE = 1000;
    let totalInserted = 0;
    
    for (let i = 0; i < preparedData.length; i += BATCH_SIZE) {
      const batch = preparedData.slice(i, i + BATCH_SIZE);
      const inserted = insertMany(tableName, batch);
      totalInserted += inserted;
      
      // Mostrar progreso
      if (preparedData.length > BATCH_SIZE) {
        const progress = Math.min(100, Math.round(((i + batch.length) / preparedData.length) * 100));
        process.stdout.write(`\r     📊 Progreso: ${progress}% (${totalInserted}/${preparedData.length})`);
      }
    }
    
    if (preparedData.length > BATCH_SIZE) {
      process.stdout.write('\n');
    }
    
    console.log(`     ✅ ${totalInserted}/${data.length} registros importados`);
    return totalInserted;
  } catch (error: any) {
    console.error(`     ❌ Error importando ${tableName}:`, error.message);
    return 0;
  }
}

async function main(): Promise<void> {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  📥 Importación a SQLite');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log(`📁 Directorio de entrada: ${INPUT_DIR}`);
  console.log('');
  
  // Verificar directorio de entrada
  if (!fs.existsSync(INPUT_DIR)) {
    console.error('❌ Directorio de exportación no encontrado');
    console.error(`   Ejecuta primero: npm run export-supabase`);
    process.exit(1);
  }
  
  // Inicializar DB
  await initDatabase();
  
  console.log('');
  console.log('📥 Importando tablas...');
  console.log('');
  
  let totalRecords = 0;
  let tablesImported = 0;
  
  for (const table of TABLES) {
    const count = await importTable(table);
    totalRecords += count;
    if (count > 0) tablesImported++;
  }
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`✅ Importación completada`);
  console.log(`   📊 ${tablesImported} tablas importadas`);
  console.log(`   📊 ${totalRecords} registros totales`);
  console.log('═══════════════════════════════════════════════════════════');
  
  closeDatabase();
}

main().catch((error) => {
  console.error('💥 Error fatal:', error);
  closeDatabase();
  process.exit(1);
});
