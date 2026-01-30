/**
 * Cliente SQLite para el bot
 * Escribe eventos directamente a SQLite en lugar de Supabase
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Singleton de la base de datos
let db: Database.Database | null = null;

/**
 * Obtener la instancia de la base de datos (singleton)
 */
export function getDatabase(): Database.Database {
  if (!db) {
    // Railway: escribir en /app/api/data para que esté en el repo
    const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'api', 'data', 'enginedb.sqlite');

    // Crear directorio si no existe
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Directorio creado: ${dir}`);
    }

    // Verificar si la DB ya existe
    const exists = fs.existsSync(dbPath);

    // Crear conexión
    db = new Database(dbPath);

    // Configurar para mejor rendimiento
    db.pragma('journal_mode = WAL'); // Write-Ahead Logging
    db.pragma('synchronous = NORMAL'); // Balance entre seguridad y velocidad
    db.pragma('cache_size = -64000'); // 64MB de cache
    db.pragma('foreign_keys = ON'); // Habilitar foreign keys
    db.pragma('temp_store = MEMORY'); // Usar memoria para tablas temporales

    if (exists) {
      console.log(`📦 SQLite conectado: ${dbPath}`);
    } else {
      console.log(`📦 SQLite creado: ${dbPath}`);
      // Inicializar schema
      initSchema();
    }
  }

  return db;
}

/**
 * Inicializar schema de la base de datos
 */
function initSchema(): void {
  const database = getDatabase();

  // Leer schema.sql del API
  const schemaPath = path.join(process.cwd(), 'api', 'src', 'db', 'schema.sql');

  if (!fs.existsSync(schemaPath)) {
    console.error(`❌ Schema no encontrado: ${schemaPath}`);
    throw new Error('Schema file not found');
  }

  const schema = fs.readFileSync(schemaPath, 'utf-8');

  try {
    database.exec(schema);
    console.log('✅ Schema aplicado correctamente');
  } catch (error: any) {
    // Ignorar errores de "already exists"
    if (!error.message.includes('already exists')) {
      console.error('❌ Error aplicando schema:', error);
      throw error;
    }
    console.log('✅ Tablas ya existían');
  }
}

/**
 * Cerrar la conexión a la base de datos
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    console.log('📦 SQLite desconectado');
  }
}

/**
 * Insertar un evento en SQLite
 */
export function insertEvent(table: string, data: Record<string, any>): void {
  const database = getDatabase();

  const columns = Object.keys(data);
  const placeholders = columns.map(() => '?').join(', ');
  const sql = `INSERT OR IGNORE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

  const values = columns.map(col => {
    const val = data[col];
    // Convertir objetos/arrays a JSON string
    if (typeof val === 'object' && val !== null) {
      return JSON.stringify(val);
    }
    // Convertir booleanos a integers
    if (typeof val === 'boolean') {
      return val ? 1 : 0;
    }
    return val;
  });

  try {
    const stmt = database.prepare(sql);
    stmt.run(...values);
  } catch (error: any) {
    // Ignorar errores de UNIQUE constraint (duplicados)
    if (!error.message.includes('UNIQUE constraint failed')) {
      console.error(`❌ Error insertando en ${table}:`, error.message);
      throw error;
    }
  }
}

/**
 * Upsert (insertar o actualizar) un registro
 */
export function upsertEvent(table: string, data: Record<string, any>, conflictColumn: string): void {
  const database = getDatabase();

  const columns = Object.keys(data);
  const placeholders = columns.map(() => '?').join(', ');

  // Construir SET clause para UPDATE
  const updateColumns = columns.filter(col => col !== conflictColumn);
  const setClause = updateColumns.map(col => `${col} = excluded.${col}`).join(', ');

  const sql = `
    INSERT INTO ${table} (${columns.join(', ')})
    VALUES (${placeholders})
    ON CONFLICT(${conflictColumn}) DO UPDATE SET ${setClause}
  `;

  const values = columns.map(col => {
    const val = data[col];
    if (typeof val === 'object' && val !== null) {
      return JSON.stringify(val);
    }
    if (typeof val === 'boolean') {
      return val ? 1 : 0;
    }
    return val;
  });

  try {
    const stmt = database.prepare(sql);
    stmt.run(...values);
  } catch (error: any) {
    console.error(`❌ Error en upsert de ${table}:`, error.message);
    throw error;
  }
}

/**
 * Insertar múltiples eventos en una transacción
 */
export function insertMany(table: string, rows: Record<string, any>[]): number {
  if (rows.length === 0) return 0;

  const database = getDatabase();
  const columns = Object.keys(rows[0]);
  const placeholders = columns.map(() => '?').join(', ');
  const sql = `INSERT OR IGNORE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

  const stmt = database.prepare(sql);

  let insertedCount = 0;
  const insertAll = database.transaction((items: Record<string, any>[]) => {
    for (const row of items) {
      const values = columns.map(col => {
        const val = row[col];
        if (typeof val === 'object' && val !== null) {
          return JSON.stringify(val);
        }
        if (typeof val === 'boolean') {
          return val ? 1 : 0;
        }
        return val;
      });
      try {
        stmt.run(...values);
        insertedCount++;
      } catch (error: any) {
        // Ignorar errores de UNIQUE constraint
        if (!error.message.includes('UNIQUE constraint failed')) {
          throw error;
        }
      }
    }
  });

  insertAll(rows);
  return insertedCount;
}

/**
 * Ejecutar query SELECT
 */
export function query<T = any>(sql: string, params: any[] = []): T[] {
  const database = getDatabase();
  const stmt = database.prepare(sql);
  return stmt.all(...params) as T[];
}

/**
 * Obtener una sola fila
 */
export function get<T = any>(sql: string, params: any[] = []): T | undefined {
  const database = getDatabase();
  const stmt = database.prepare(sql);
  return stmt.get(...params) as T | undefined;
}

/**
 * Ejecutar comando (INSERT, UPDATE, DELETE)
 */
export function run(sql: string, params: any[] = []): Database.RunResult {
  const database = getDatabase();
  const stmt = database.prepare(sql);
  return stmt.run(...params);
}

/**
 * Checkpoint WAL para consolidar cambios
 */
export function checkpoint(): void {
  const database = getDatabase();
  database.pragma('wal_checkpoint(TRUNCATE)');
}

/**
 * Obtener estadísticas de la base de datos
 */
export function getStats(): {
  tables: number;
  totalRows: number;
  sizeBytes: number;
} {
  const database = getDatabase();
  const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'api', 'data', 'enginedb.sqlite');

  // Obtener lista de tablas
  const tables = database.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
  `).all() as { name: string }[];

  // Contar filas totales
  let totalRows = 0;
  for (const table of tables) {
    const count = database.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get() as { count: number };
    totalRows += count.count;
  }

  // Tamaño del archivo
  let sizeBytes = 0;
  try {
    sizeBytes = fs.statSync(dbPath).size;
  } catch {}

  return {
    tables: tables.length,
    totalRows,
    sizeBytes,
  };
}

export default {
  getDatabase,
  closeDatabase,
  insertEvent,
  upsertEvent,
  insertMany,
  query,
  get,
  run,
  checkpoint,
  getStats,
};
