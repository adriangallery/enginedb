/**
 * Script para corregir timestamps de eventos existentes
 * Obtiene los timestamps reales de los bloques desde la blockchain
 * y actualiza las fechas en la base de datos
 */

import { createViemClient } from '../src/listener.js';
import { getSupabaseClient } from '../src/supabase/client.js';

interface EventToFix {
  id: number;
  block_number: number;
  current_created_at: string;
  table_name: string;
}

/**
 * Obtener eventos con fechas sospechosas (muy recientes)
 */
async function getEventsToFix(): Promise<EventToFix[]> {
  const supabase = getSupabaseClient();
  const events: EventToFix[] = [];

  // Obtener eventos de trade_events
  const { data: tradeEvents, error: tradeError } = await supabase
    .from('trade_events')
    .select('id, block_number, created_at')
    .gte('created_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()) // Últimos 3 días
    .order('block_number', { ascending: false })
    .limit(1000);

  if (tradeError) {
    console.error('Error obteniendo trade_events:', tradeError);
  } else if (tradeEvents) {
    tradeEvents.forEach((event) => {
      events.push({
        id: event.id,
        block_number: event.block_number,
        current_created_at: event.created_at,
        table_name: 'trade_events',
      });
    });
  }

  // Obtener eventos de listing_events
  const { data: listingEvents, error: listingError } = await supabase
    .from('listing_events')
    .select('id, block_number, created_at')
    .gte('created_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())
    .order('block_number', { ascending: false })
    .limit(1000);

  if (listingError) {
    console.error('Error obteniendo listing_events:', listingError);
  } else if (listingEvents) {
    listingEvents.forEach((event) => {
      events.push({
        id: event.id,
        block_number: event.block_number,
        current_created_at: event.created_at,
        table_name: 'listing_events',
      });
    });
  }

  return events;
}

/**
 * Obtener timestamps de bloques desde la blockchain
 */
async function getBlockTimestamps(
  client: ReturnType<typeof createViemClient>,
  blockNumbers: number[]
): Promise<Map<number, Date>> {
  const timestamps = new Map<number, Date>();
  const uniqueBlocks = [...new Set(blockNumbers)];

  console.log(`📅 Obteniendo timestamps para ${uniqueBlocks.length} bloques únicos...`);

  // Procesar en batches para no sobrecargar
  const BATCH_SIZE = 50;
  for (let i = 0; i < uniqueBlocks.length; i += BATCH_SIZE) {
    const batch = uniqueBlocks.slice(i, i + BATCH_SIZE);
    
    await Promise.all(
      batch.map(async (blockNumber) => {
        try {
          const block = await client.getBlock({ blockNumber: BigInt(blockNumber) });
          const timestamp = new Date(Number(block.timestamp) * 1000);
          timestamps.set(blockNumber, timestamp);
        } catch (error) {
          console.error(`⚠️  Error obteniendo timestamp del bloque ${blockNumber}:`, error);
        }
      })
    );

    // Pequeño delay entre batches
    if (i + BATCH_SIZE < uniqueBlocks.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  console.log(`✅ Obtenidos ${timestamps.size}/${uniqueBlocks.length} timestamps`);
  return timestamps;
}

/**
 * Actualizar fechas en la base de datos
 */
async function updateEventTimestamps(
  events: EventToFix[],
  timestamps: Map<number, Date>
): Promise<void> {
  const supabase = getSupabaseClient();
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const event of events) {
    const correctTimestamp = timestamps.get(event.block_number);
    
    if (!correctTimestamp) {
      console.warn(`⚠️  No se encontró timestamp para bloque ${event.block_number}, saltando evento ${event.id}`);
      skipped++;
      continue;
    }

    const currentDate = new Date(event.current_created_at);
    const correctDate = correctTimestamp;

    // Solo actualizar si la fecha es diferente (más de 1 hora de diferencia)
    const diffHours = Math.abs(currentDate.getTime() - correctDate.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 1) {
      console.log(`✓ Evento ${event.id} ya tiene fecha correcta`);
      skipped++;
      continue;
    }

    try {
      const { error } = await supabase
        .from(event.table_name)
        .update({ created_at: correctDate.toISOString() })
        .eq('id', event.id);

      if (error) {
        console.error(`❌ Error actualizando evento ${event.id} (${event.table_name}):`, error);
        errors++;
      } else {
        console.log(
          `✓ Actualizado evento ${event.id} (${event.table_name}): ` +
          `${currentDate.toISOString()} → ${correctDate.toISOString()}`
        );
        updated++;
      }
    } catch (error) {
      console.error(`❌ Error actualizando evento ${event.id}:`, error);
      errors++;
    }

    // Pequeño delay para no sobrecargar la base de datos
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  console.log('\n📊 Resumen:');
  console.log(`  ✅ Actualizados: ${updated}`);
  console.log(`  ⏭️  Saltados: ${skipped}`);
  console.log(`  ❌ Errores: ${errors}`);
}

/**
 * Función principal
 */
async function main() {
  console.log('🔧 Iniciando corrección de timestamps de eventos...\n');

  try {
    // 1. Obtener eventos que necesitan corrección
    console.log('📋 Obteniendo eventos con fechas sospechosas...');
    const events = await getEventsToFix();
    console.log(`✅ Encontrados ${events.length} eventos para revisar\n`);

    if (events.length === 0) {
      console.log('✨ No hay eventos que necesiten corrección');
      return;
    }

    // 2. Obtener timestamps de bloques
    const client = createViemClient();
    const blockNumbers = events.map((e) => e.block_number);
    const timestamps = await getBlockTimestamps(client, blockNumbers);

    if (timestamps.size === 0) {
      console.error('❌ No se pudieron obtener timestamps de bloques');
      return;
    }

    // 3. Actualizar fechas
    console.log('\n💾 Actualizando fechas en la base de datos...\n');
    await updateEventTimestamps(events, timestamps);

    console.log('\n✨ Corrección completada');
  } catch (error) {
    console.error('❌ Error en la corrección:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
main().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});

export { main as fixEventTimestamps };

