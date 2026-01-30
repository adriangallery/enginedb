/**
 * Script para verificar el conteo de registros en Railway
 * Consulta la API pública de Railway directamente
 */

import 'dotenv/config';

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

// URL de Railway - puede ser:
// 1. Variable de entorno RAILWAY_PUBLIC_URL
// 2. Argumento de línea de comandos
// 3. Prompt para ingresar manualmente
const RAILWAY_URL = process.env.RAILWAY_PUBLIC_URL || process.argv[2];

async function countRecords(url: string, table: string, apiKey?: string): Promise<number> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Prefer': 'count=exact',
    };
    
    if (apiKey) {
      headers['apikey'] = apiKey;
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    
    const response = await fetch(`${url}/rest/v1/${table}?limit=1`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`  ❌ Error HTTP ${response.status} en ${table}: ${errorText.substring(0, 100)}`);
      return 0;
    }
    
    // Obtener el conteo del header Content-Range
    const contentRange = response.headers.get('Content-Range');
    if (contentRange) {
      // Formato: "0-0/1234" -> extraer el último número
      const match = contentRange.match(/\/(\d+)$/);
      if (match) {
        return parseInt(match[1], 10);
      }
    }
    
    // Si no hay Content-Range, contar los resultados
    const data = await response.json();
    return Array.isArray(data) ? data.length : 0;
  } catch (error: any) {
    console.error(`  ❌ Error consultando ${table}:`, error.message);
    return 0;
  }
}

async function main(): Promise<void> {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  📊 Verificación de Registros en Railway');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  
  let railwayUrl = RAILWAY_URL;
  
  if (!railwayUrl) {
    console.log('⚠️  No se proporcionó URL de Railway');
    console.log('');
    console.log('Opciones:');
    console.log('  1. Establecer variable: RAILWAY_PUBLIC_URL=https://tu-dominio.railway.app');
    console.log('  2. Pasar como argumento: npm run check-railway https://tu-dominio.railway.app');
    console.log('');
    console.log('Para obtener la URL pública:');
    console.log('  - Railway Dashboard → Tu servicio → Settings → Networking');
    console.log('  - Busca "Public Networking" → "Generate Domain"');
    console.log('');
    process.exit(1);
  }
  
  // Asegurar que la URL no termine en /
  railwayUrl = railwayUrl.replace(/\/$/, '');
  
  console.log(`📍 Railway URL: ${railwayUrl}`);
  
  // Verificar que el endpoint /health funcione
  try {
    const healthResponse = await fetch(`${railwayUrl}/health`);
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log(`✅ API disponible - Estado: ${health.status}`);
      if (health.database) {
        console.log(`   Base de datos: ${health.database.connected ? '✅ Conectada' : '❌ Desconectada'}`);
        console.log(`   Tamaño: ${health.database.sizeMB} MB`);
      }
    } else {
      console.log(`⚠️  Health check falló (${healthResponse.status}), pero continuando...`);
    }
  } catch (error: any) {
    console.log(`⚠️  No se pudo verificar health check: ${error.message}`);
    console.log('   Continuando con la consulta de registros...');
  }
  
  console.log('');
  
  const apiKey = process.env.DB_API_KEY || process.env.API_KEY;
  if (apiKey) {
    console.log('🔑 API Key configurada');
  } else {
    console.log('⚠️  No se encontró API Key (puede que algunas consultas fallen)');
  }
  console.log('');
  
  let totalRecords = 0;
  const counts: Record<string, number> = {};
  
  for (const table of MAIN_TABLES) {
    process.stdout.write(`  📦 Consultando ${table}... `);
    const count = await countRecords(railwayUrl, table, apiKey);
    counts[table] = count;
    totalRecords += count;
    console.log(`${count} registros`);
  }
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  📊 Resumen');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  
  for (const [table, count] of Object.entries(counts)) {
    console.log(`  ${table.padEnd(30)} ${count.toString().padStart(8)} registros`);
  }
  
  console.log('');
  console.log(`  Total (tablas principales): ${totalRecords} registros`);
  console.log('');
  
  // Comparar con el valor inicial
  const INITIAL_COUNT = 8899;
  const newRecords = totalRecords - INITIAL_COUNT;
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  📈 Comparación con Migración Inicial');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log(`  Registros iniciales (migración): ${INITIAL_COUNT}`);
  console.log(`  Registros actuales (Railway):   ${totalRecords}`);
  console.log(`  Nuevos registros:                ${newRecords > 0 ? '+' : ''}${newRecords}`);
  console.log('');
  
  if (newRecords > 0) {
    console.log('  ✅ El bot está guardando nuevos eventos correctamente!');
  } else if (newRecords === 0) {
    console.log('  ⚠️  No se han agregado nuevos registros aún');
    console.log('      (Puede ser que el bot esté procesando pero aún no ha guardado)');
  } else {
    console.log('  ⚠️  Se han perdido registros (revisar)');
  }
  console.log('');
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
