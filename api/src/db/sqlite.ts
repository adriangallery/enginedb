/**
 * Cliente SQLite para el backend API
 * Usa better-sqlite3 para máximo rendimiento
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
    const dbPath = process.env.DB_PATH || './data/enginedb.sqlite';
    
    // Crear directorio si no existe
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Si la base de datos no existe, buscar en el repo (para Railway)
    if (!fs.existsSync(dbPath)) {
      // Posibles ubicaciones de la DB en el repo
      const possiblePaths = [
        path.join(process.cwd(), 'api', 'data', 'enginedb.sqlite'),
        path.join(process.cwd(), 'data', 'enginedb.sqlite'),
        path.join(__dirname, '..', '..', 'data', 'enginedb.sqlite'),
        path.join(__dirname, '..', 'data', 'enginedb.sqlite'),
      ];
      
      for (const repoDbPath of possiblePaths) {
        if (fs.existsSync(repoDbPath)) {
          console.log(`📦 Base de datos no encontrada en ${dbPath}`);
          console.log(`   Copiando desde repo: ${repoDbPath}`);
          fs.copyFileSync(repoDbPath, dbPath);
          console.log(`   ✅ Base de datos copiada exitosamente`);
          break;
        }
      }
    }
    
    // Crear conexión
    db = new Database(dbPath);
    
    // Configurar para mejor rendimiento y concurrencia
    db.pragma('journal_mode = WAL'); // Write-Ahead Logging
    db.pragma('synchronous = NORMAL'); // Balance entre seguridad y velocidad
    db.pragma('cache_size = -64000'); // 64MB de cache
    db.pragma('foreign_keys = ON'); // Habilitar foreign keys
    db.pragma('temp_store = MEMORY'); // Usar memoria para tablas temporales
    
    console.log(`📦 SQLite conectado: ${dbPath}`);
  }
  
  return db;
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
 * Ejecutar una query de solo lectura
 */
export function query<T = any>(sql: string, params: any[] = []): T[] {
  const database = getDatabase();
  const stmt = database.prepare(sql);
  return stmt.all(...params) as T[];
}

/**
 * Ejecutar una query que modifica datos (INSERT, UPDATE, DELETE)
 */
export function run(sql: string, params: any[] = []): Database.RunResult {
  const database = getDatabase();
  const stmt = database.prepare(sql);
  return stmt.run(...params);
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
 * Ejecutar múltiples queries en una transacción
 */
export function transaction<T>(fn: () => T): T {
  const database = getDatabase();
  return database.transaction(fn)();
}

/**
 * Insertar múltiples filas eficientemente
 */
export function insertMany(table: string, rows: Record<string, any>[]): number {
  if (rows.length === 0) return 0;
  
  const database = getDatabase();
  const columns = Object.keys(rows[0]);
  const placeholders = columns.map(() => '?').join(', ');
  const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
  
  const stmt = database.prepare(sql);
  
  let insertedCount = 0;
  const insertAll = database.transaction((items: Record<string, any>[]) => {
    for (const row of items) {
      const values = columns.map(col => {
        const val = row[col];
        // Convertir objetos/arrays a JSON string
        if (typeof val === 'object' && val !== null) {
          return JSON.stringify(val);
        }
        return val;
      });
      try {
        stmt.run(...values);
        insertedCount++;
      } catch (error: any) {
        // Ignorar errores de UNIQUE constraint (duplicados)
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
 * Verificar si la base de datos está conectada
 */
export function isConnected(): boolean {
  return db !== null && db.open;
}

/**
 * Obtener el tamaño del archivo de la base de datos
 */
export function getDatabaseSize(): number {
  const dbPath = process.env.DB_PATH || './data/enginedb.sqlite';
  try {
    const stats = fs.statSync(dbPath);
    return stats.size;
  } catch {
    return 0;
  }
}

export default {
  getDatabase,
  closeDatabase,
  query,
  run,
  get,
  transaction,
  insertMany,
  isConnected,
  getDatabaseSize,
};
