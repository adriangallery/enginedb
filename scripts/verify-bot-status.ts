#!/usr/bin/env tsx
/**
 * Script para verificar el estado del bot y Supabase
 * Uso: tsx scripts/verify-bot-status.ts
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variables de entorno faltantes:');
  console.error('   SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 VERIFICACIÓN DE ESTADO DEL BOT');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

// Tablas a verificar
const tables = [
  'erc20_transfers',
  'erc721_transfers',
  'erc1155_single_transfers',
  'trade_events',
  'listing_events',
  'sweep_events',
  'sync_state'
];

async function checkTable(tableName: string) {
  try {
    // Contar registros totales
    const { count: totalCount, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log(`❌ ${tableName}: Error - ${countError.message}`);
      return;
    }

    // Obtener los últimos 5 registros
    const { data: recent, error: recentError } = await supabase
      .from(tableName)
      .select('created_at, block_number')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentError) {
      console.log(`⚠️  ${tableName}: ${totalCount} registros (error obteniendo recientes)`);
      return;
    }

    console.log(`📦 ${tableName}: ${totalCount} registros totales`);

    if (recent && recent.length > 0) {
      const mostRecent = recent[0];
      const timeDiff = Date.now() - new Date(mostRecent.created_at).getTime();
      const minutesAgo = Math.floor(timeDiff / 60000);

      console.log(`   📅 Último evento: hace ${minutesAgo} minutos`);
      console.log(`   🔢 Bloque: ${mostRecent.block_number || 'N/A'}`);

      // Verificar si hay eventos recientes (últimos 60 minutos)
      if (minutesAgo <= 60) {
        console.log(`   ✅ Bot activo (eventos recientes)`);
      } else {
        console.log(`   ⚠️  Sin eventos recientes (> 60 min)`);
      }
    } else {
      console.log(`   ℹ️  Tabla vacía`);
    }

    console.log('');
  } catch (error: any) {
    console.log(`❌ ${tableName}: Error - ${error.message}`);
    console.log('');
  }
}

async function checkSyncState() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 ESTADO DE SINCRONIZACIÓN');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  try {
    const { data, error } = await supabase
      .from('sync_state')
      .select('contract_address, last_synced_block, last_historical_block, updated_at')
      .order('updated_at', { ascending: false });

    if (error) {
      console.log(`❌ Error obteniendo sync_state: ${error.message}`);
      return;
    }

    if (!data || data.length === 0) {
      console.log('ℹ️  No hay contratos sincronizados aún');
      return;
    }

    for (const contract of data) {
      console.log(`📝 Contrato: ${contract.contract_address}`);
      console.log(`   Bloque forward: ${contract.last_synced_block}`);
      console.log(`   Bloque backward: ${contract.last_historical_block || 'N/A'}`);

      const timeDiff = Date.now() - new Date(contract.updated_at).getTime();
      const minutesAgo = Math.floor(timeDiff / 60000);
      console.log(`   Última actualización: hace ${minutesAgo} minutos`);

      if (minutesAgo <= 15) {
        console.log(`   ✅ Sincronización activa`);
      } else {
        console.log(`   ⚠️  Sin actualizaciones recientes`);
      }
      console.log('');
    }
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function main() {
  // Verificar cada tabla
  for (const table of tables) {
    await checkTable(table);
  }

  // Verificar sync_state
  await checkSyncState();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RESUMEN');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('Si ves "✅ Bot activo" en las tablas:');
  console.log('  → El bot está funcionando correctamente');
  console.log('  → Los eventos se están escribiendo a Supabase');
  console.log('');
  console.log('Si ves "⚠️ Sin eventos recientes":');
  console.log('  → Verifica los logs de Railway');
  console.log('  → Verifica las variables de entorno en Railway');
  console.log('  → El bot puede estar detenido o con errores');
  console.log('');
}

main().catch(console.error);
