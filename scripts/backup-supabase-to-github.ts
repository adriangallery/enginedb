/**
 * Backup Supabase → GitHub
 *
 * Este script:
 * 1. Exporta datos de Supabase (PostgreSQL) a SQLite local
 * 2. Optimiza SQLite (VACUUM)
 * 3. Sube SQLite a GitHub
 *
 * Uso:
 *   npm run backup
 *
 * Variables requeridas:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GITHUB_TOKEN, GITHUB_REPO
 */

import { createClient } from '@supabase/supabase-js';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

// Configuración
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const GITHUB_REPO = process.env.GITHUB_REPO || 'adriangallery/enginedb';
const SQLITE_PATH = path.join(process.cwd(), 'api/data/enginedb.sqlite');
const FILE_PATH_IN_REPO = 'api/data/enginedb.sqlite';

// Tablas a exportar
const TABLES_TO_EXPORT = [
  'trade_events',
  'listing_events',
  'punk_listings',
  'erc721_transfers',
  'erc20_transfers',
  'erc721_approvals',
  'erc20_approvals',
  'punk_quest_staking_events',
  'shop_events',
  'sweep_events',
  // ... agregar todas las tablas necesarias
];

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Exportar tabla de Supabase a SQLite
 */
async function exportTable(db: Database.Database, tableName: string): Promise<number> {
  console.log(`📥 Exportando ${tableName}...`);

  // Obtener todos los datos de Supabase
  let totalExported = 0;
  let page = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error(`❌ Error exportando ${tableName}:`, error);
      break;
    }

    if (!data || data.length === 0) break;

    // Insertar en SQLite
    for (const row of data) {
      const columns = Object.keys(row);
      const placeholders = columns.map(() => '?').join(', ');
      const sql = `INSERT OR REPLACE INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

      try {
        const stmt = db.prepare(sql);
        const values = columns.map(col => {
          const val = row[col];
          // Convertir objetos a JSON
          return typeof val === 'object' && val !== null ? JSON.stringify(val) : val;
        });
        stmt.run(...values);
        totalExported++;
      } catch (err: any) {
        // Ignorar duplicados
        if (!err.message.includes('UNIQUE')) {
          console.error(`Error insertando en ${tableName}:`, err);
        }
      }
    }

    page++;
    if (data.length < pageSize) break;
  }

  console.log(`   ✅ ${tableName}: ${totalExported} registros`);
  return totalExported;
}

/**
 * Optimizar SQLite (VACUUM)
 */
function optimizeDatabase(db: Database.Database): void {
  console.log('🔧 Optimizando base de datos...');

  const sizeBefore = fs.statSync(SQLITE_PATH).size;
  db.exec('VACUUM');
  db.exec('ANALYZE');
  const sizeAfter = fs.statSync(SQLITE_PATH).size;

  const savedMB = ((sizeBefore - sizeAfter) / 1024 / 1024).toFixed(2);
  console.log(`   ✅ Optimizado: ${(sizeAfter / 1024 / 1024).toFixed(2)} MB (ahorrado: ${savedMB} MB)`);
}

/**
 * Subir SQLite a GitHub
 */
async function uploadToGitHub(): Promise<void> {
  console.log('📤 Subiendo a GitHub...');

  // Leer archivo SQLite como base64
  const fileContent = fs.readFileSync(SQLITE_PATH).toString('base64');

  // Obtener SHA actual (si existe)
  let currentSha: string | null = null;
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH_IN_REPO}`,
      {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      currentSha = data.sha;
    }
  } catch (err) {
    console.log('   ℹ️  Archivo no existe en GitHub, creando nuevo...');
  }

  // Subir/actualizar archivo
  const body: any = {
    message: `Backup automático - ${new Date().toISOString()}`,
    content: fileContent,
    branch: 'main',
  };

  if (currentSha) {
    body.sha = currentSha;
  }

  const uploadResponse = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH_IN_REPO}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`GitHub upload failed: ${uploadResponse.status} - ${errorText}`);
  }

  console.log('   ✅ Subido a GitHub exitosamente');
}

/**
 * Main
 */
async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  📦 Backup: Supabase → GitHub');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`⏰ Inicio: ${new Date().toISOString()}`);
  console.log('');

  try {
    // Verificar variables
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error('SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas');
    }
    if (!GITHUB_TOKEN || !GITHUB_REPO) {
      throw new Error('GITHUB_TOKEN y GITHUB_REPO son requeridas');
    }

    // Crear directorio si no existe
    const dir = path.dirname(SQLITE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Abrir/crear SQLite
    const db = new Database(SQLITE_PATH);

    // Exportar todas las tablas
    let totalExported = 0;
    for (const table of TABLES_TO_EXPORT) {
      const count = await exportTable(db, table);
      totalExported += count;
    }

    console.log('');
    console.log(`📊 Total exportado: ${totalExported} registros`);
    console.log('');

    // Optimizar
    optimizeDatabase(db);
    db.close();

    console.log('');

    // Subir a GitHub
    await uploadToGitHub();

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  ✅ Backup completado exitosamente');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
  } catch (error) {
    console.error('');
    console.error('═══════════════════════════════════════════════════════════');
    console.error('  ❌ Error durante el backup');
    console.error('═══════════════════════════════════════════════════════════');
    console.error(error);
    console.error('');
    process.exit(1);
  }
}

main();
