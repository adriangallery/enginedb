/**
 * Event Buffer para SQLite
 * Acumula eventos en memoria y hace batch writes a SQLite
 */
import { insertMany } from './client.js';

export class SQLiteEventBuffer {
  private buffer: Map<string, any[]> = new Map();
  private flushInterval: NodeJS.Timeout | null = null;
  private flushIntervalMinutes: number;

  constructor(flushIntervalMinutes = 30) {
    this.flushIntervalMinutes = flushIntervalMinutes;
  }

  /**
   * Agregar evento al buffer
   */
  addEvent(table: string, data: Record<string, any>): void {
    if (!this.buffer.has(table)) {
      this.buffer.set(table, []);
    }
    this.buffer.get(table)!.push(data);

    const total = this.buffer.get(table)!.length;
    if (total % 10 === 0 || total === 1) {
      console.log(`📥 Evento buffered: ${table} (total: ${total})`);
    }
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
   * Flush: Escribir todos los eventos acumulados a SQLite
   */
  async flush(): Promise<void> {
    if (this.buffer.size === 0) {
      console.log('ℹ️  Buffer vacío, nada que escribir');
      return;
    }

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📤 FLUSH: Escribiendo eventos a SQLite...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    let totalWritten = 0;
    let totalErrors = 0;

    for (const [table, events] of this.buffer) {
      if (events.length === 0) continue;

      console.log(`📝 ${table}: ${events.length} eventos...`);

      try {
        const inserted = insertMany(table, events);
        console.log(`   ✅ ${table}: ${inserted} escritos (${events.length - inserted} duplicados ignorados)`);
        totalWritten += inserted;
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
let globalBuffer: SQLiteEventBuffer | null = null;

export function initSQLiteEventBuffer(flushIntervalMinutes = 30): SQLiteEventBuffer {
  if (!globalBuffer) {
    globalBuffer = new SQLiteEventBuffer(flushIntervalMinutes);
    globalBuffer.startAutoFlush();
  }
  return globalBuffer;
}

export function getSQLiteEventBuffer(): SQLiteEventBuffer {
  if (!globalBuffer) {
    throw new Error('SQLiteEventBuffer no inicializado. Llamar a initSQLiteEventBuffer() primero.');
  }
  return globalBuffer;
}
