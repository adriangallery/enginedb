#!/usr/bin/env tsx
/**
 * Script de prueba para verificar el bot SQLite
 * NO hace push a GitHub, solo verifica que todo funcione localmente
 */

import { getDatabase, insertEvent, checkpoint, getStats, closeDatabase } from '../src/sqlite/client.js';
import { initSQLiteEventBuffer, getSQLiteEventBuffer } from '../src/sqlite/event-buffer.js';
import 'dotenv/config';

console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🧪 TEST: Sistema SQLite Bot');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

async function test() {
  try {
    // Test 1: Inicializar base de datos
    console.log('📝 Test 1: Inicializar base de datos...');
    const db = getDatabase();
    console.log('   ✅ Base de datos inicializada');
    console.log('');

    // Test 2: Insertar evento directo
    console.log('📝 Test 2: Insertar evento directo...');
    insertEvent('trade_events', {
      token_id: 999,
      buyer: '0xtest123',
      seller: '0xtest456',
      price_wei: '1000000000000000000',
      is_contract_owned: false,
      tx_hash: '0xtest_' + Date.now(),
      log_index: 0,
      block_number: 12345678,
      created_at: new Date().toISOString(),
    });
    console.log('   ✅ Evento insertado directamente');
    console.log('');

    // Test 3: Inicializar buffer
    console.log('📝 Test 3: Inicializar event buffer...');
    const buffer = initSQLiteEventBuffer(1); // 1 minuto para test
    console.log('   ✅ Buffer inicializado');
    console.log('');

    // Test 4: Agregar eventos al buffer
    console.log('📝 Test 4: Agregar eventos al buffer...');
    for (let i = 0; i < 5; i++) {
      buffer.addEvent('erc20_transfers', {
        contract_address: '0xtest',
        from_address: '0xfrom' + i,
        to_address: '0xto' + i,
        value_wei: '100' + i,
        tx_hash: '0xtx_' + Date.now() + '_' + i,
        log_index: i,
        block_number: 12345678 + i,
        created_at: new Date().toISOString(),
      });
    }
    const stats = buffer.getStats();
    console.log(`   ✅ ${stats.totalEvents} eventos en buffer`);
    console.log('');

    // Test 5: Flush manual
    console.log('📝 Test 5: Flush manual del buffer...');
    await buffer.flush();
    console.log('   ✅ Flush completado');
    console.log('');

    // Test 6: Checkpoint
    console.log('📝 Test 6: Checkpoint WAL...');
    checkpoint();
    console.log('   ✅ Checkpoint completado');
    console.log('');

    // Test 7: Estadísticas
    console.log('📝 Test 7: Obtener estadísticas...');
    const dbStats = getStats();
    console.log(`   📊 Tablas: ${dbStats.tables}`);
    console.log(`   📦 Registros: ${dbStats.totalRows}`);
    console.log(`   💾 Tamaño: ${(dbStats.sizeBytes / 1024).toFixed(2)} KB`);
    console.log('   ✅ Estadísticas obtenidas');
    console.log('');

    // Test 8: Cerrar base de datos
    console.log('📝 Test 8: Cerrar base de datos...');
    closeDatabase();
    console.log('   ✅ Base de datos cerrada');
    console.log('');

    // Resumen
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ TODOS LOS TESTS PASARON');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📋 Próximos pasos:');
    console.log('   1. Commit estos cambios a GitHub');
    console.log('   2. Configurar variables en Railway:');
    console.log('      USE_SUPABASE=false');
    console.log('      GITHUB_TOKEN=ghp_xxxxx');
    console.log('      FLUSH_INTERVAL_MINUTES=30');
    console.log('   3. Deploy a Railway');
    console.log('');

  } catch (error: any) {
    console.error('');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ TEST FALLIDO');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('');
    console.error('Error:', error.message);
    console.error('');
    console.error('Stack:', error.stack);
    console.error('');
    process.exit(1);
  }
}

test();
