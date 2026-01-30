/**
 * Event Buffer - Acumula eventos en memoria y hace batch writes
 */
import { createClient } from '@supabase/supabase-js';

export class EventBuffer {
  private buffer: Map<string, any[]> = new Map();
  private flushInterval: NodeJS.Timeout | null = null;
  private flushIntervalMinutes: number;
  private supabase: any;

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    flushIntervalMinutes = 30
  ) {
    this.flushIntervalMinutes = flushIntervalMinutes;
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Agregar evento al buffer
   */
  addEvent(table: string, data: Record<string, any>): void {
    if (!this.buffer.has(table)) {
      this.buffer.set(table, []);
    }
    this.buffer.get(table)!.push(data);

    console.log(`📥 Evento buffered: ${table} (total: ${this.buffer.get(table)!.length})`);
  }

  /**
   * Iniciar timer automático de flush
   */
  startAutoFlush(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }

    const intervalMs = this.flushIntervalMinutes * 60 * 1000;
    console.log(`⏰ Auto-flush activado: cada ${this.flushIntervalMinutes} minutos`);

    this.flushInterval = setInterval(() => {
      this.flush().catch(error => {
        console.error('❌ Error en auto-flush:', error);
      });
    }, intervalMs);
  }

  /**
   * Flush: Escribir todos los eventos acumulados a Supabase
   */
  async flush(): Promise<void> {
    if (this.buffer.size === 0) {
      console.log('ℹ️  Buffer vacío, nada que escribir');
      return;
    }

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📤 FLUSH: Escribiendo eventos a Supabase...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    let totalWritten = 0;
    let totalErrors = 0;

    for (const [table, events] of this.buffer) {
      if (events.length === 0) continue;

      console.log(`📝 ${table}: ${events.length} eventos...`);

      try {
        // Batch insert (Supabase acepta arrays)
        const { error } = await this.supabase
          .from(table)
          .insert(events);

        if (error) {
          // Si es error de duplicados (UNIQUE constraint), no es crítico
          if (error.code === '23505') {
            console.log(`   ⚠️  ${table}: Algunos duplicados ignorados`);
            totalWritten += events.length;
          } else {
            console.error(`   ❌ ${table}: Error -`, error.message);
            totalErrors += events.length;
          }
        } else {
          console.log(`   ✅ ${table}: ${events.length} escritos`);
          totalWritten += events.length;
        }
      } catch (err: any) {
        console.error(`   ❌ ${table}: Exception -`, err.message);
        totalErrors += events.length;
      }
    }

    // Limpiar buffer
    this.buffer.clear();

    console.log('');
    console.log(`📊 Resumen del flush:`);
    console.log(`   ✅ Escritos: ${totalWritten}`);
    console.log(`   ❌ Errores: ${totalErrors}`);
    console.log(`   🕐 Próximo flush: ${new Date(Date.now() + this.flushIntervalMinutes * 60 * 1000).toISOString()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
  }

  /**
   * Obtener estadísticas del buffer
   */
  getStats(): { tables: number; totalEvents: number } {
    let totalEvents = 0;
    for (const events of this.buffer.values()) {
      totalEvents += events.length;
    }
    return {
      tables: this.buffer.size,
      totalEvents
    };
  }

  /**
   * Detener auto-flush y hacer flush final
   */
  async stop(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    await this.flush();
  }
}

// Singleton global del buffer
let globalBuffer: EventBuffer | null = null;

export function initEventBuffer(
  supabaseUrl: string,
  supabaseKey: string,
  flushIntervalMinutes = 30
): EventBuffer {
  if (!globalBuffer) {
    globalBuffer = new EventBuffer(supabaseUrl, supabaseKey, flushIntervalMinutes);
    globalBuffer.startAutoFlush();
  }
  return globalBuffer;
}

export function getEventBuffer(): EventBuffer {
  if (!globalBuffer) {
    throw new Error('EventBuffer no inicializado. Llamar a initEventBuffer() primero.');
  }
  return globalBuffer;
}
