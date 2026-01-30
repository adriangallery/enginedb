/**
 * Script para exportar datos de Supabase
 * Exporta todas las tablas a archivos JSON
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Cargar .env desde la carpeta api/
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '..', '.env');
config({ path: envPath });

// Verificar variables de entorno
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Faltan variables de entorno: SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY');
  console.error('   Configura estas variables en api/.env');
  process.exit(1);
}

// Crear cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Tablas a exportar
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

// Directorio de salida
const OUTPUT_DIR = path.join(process.cwd(), 'data', 'export');

async function exportTable(tableName: string): Promise<number> {
  console.log(`  📤 Exportando ${tableName}...`);
  
  try {
    // Obtener todos los datos (con paginación para tablas grandes)
    let allData: any[] = [];
    let page = 0;
    const pageSize = 10000;
    
    while (true) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .order('id', { ascending: true });
      
      if (error) {
        // Si la tabla no existe, continuar
        if (error.message.includes('does not exist') || error.code === 'PGRST200') {
          console.log(`     ⚠️  Tabla ${tableName} no existe, saltando...`);
          return 0;
        }
        throw error;
      }
      
      if (!data || data.length === 0) break;
      
      allData = [...allData, ...data];
      
      if (data.length < pageSize) break;
      
      page++;
    }
    
    // Guardar a archivo
    const outputPath = path.join(OUTPUT_DIR, `${tableName}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2));
    
    console.log(`     ✅ ${allData.length} registros exportados`);
    return allData.length;
  } catch (error: any) {
    console.error(`     ❌ Error exportando ${tableName}:`, error.message);
    return 0;
  }
}

async function main(): Promise<void> {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  📤 Exportación de Supabase');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  console.log(`📁 Directorio de salida: ${OUTPUT_DIR}`);
  console.log('');
  
  // Crear directorio de salida
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  let totalRecords = 0;
  let tablesExported = 0;
  
  for (const table of TABLES) {
    const count = await exportTable(table);
    totalRecords += count;
    if (count > 0) tablesExported++;
  }
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`✅ Exportación completada`);
  console.log(`   📊 ${tablesExported} tablas exportadas`);
  console.log(`   📊 ${totalRecords} registros totales`);
  console.log(`   📁 Archivos en: ${OUTPUT_DIR}`);
  console.log('═══════════════════════════════════════════════════════════');
}

main().catch((error) => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
