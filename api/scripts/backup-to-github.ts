/**
 * Script para hacer backup de SQLite a GitHub
 * Comprime la DB y la sube como release o a un branch
 */

import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { createGzip } from 'zlib';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

// Cargar .env desde la carpeta api/
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '..', '.env');
config({ path: envPath });

// Configuración
const DB_PATH = process.env.DB_PATH || './data/enginedb.sqlite';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || 'adriangallery/enginedb';
const BACKUP_DIR = path.join(process.cwd(), 'data', 'backups');

/**
 * Comprimir archivo con gzip
 */
async function compressFile(inputPath: string, outputPath: string): Promise<void> {
  const source = createReadStream(inputPath);
  const destination = createWriteStream(outputPath);
  const gzip = createGzip({ level: 9 });
  
  await pipeline(source, gzip, destination);
}

/**
 * Obtener tamaño de archivo formateado
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/**
 * Crear backup local
 */
async function createLocalBackup(): Promise<{ path: string; size: number; compressedSize: number }> {
  console.log('📦 Creando backup local...');
  
  // Verificar que existe la DB
  if (!fs.existsSync(DB_PATH)) {
    throw new Error(`Base de datos no encontrada: ${DB_PATH}`);
  }
  
  // Crear directorio de backups
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  // Generar nombre con timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `enginedb-backup-${timestamp}`;
  const backupPath = path.join(BACKUP_DIR, `${backupName}.sqlite`);
  const compressedPath = path.join(BACKUP_DIR, `${backupName}.sqlite.gz`);
  
  // Copiar DB
  console.log(`   📄 Copiando ${DB_PATH} → ${backupPath}`);
  fs.copyFileSync(DB_PATH, backupPath);
  
  const originalSize = fs.statSync(backupPath).size;
  console.log(`   📊 Tamaño original: ${formatSize(originalSize)}`);
  
  // Comprimir
  console.log(`   🗜️  Comprimiendo...`);
  await compressFile(backupPath, compressedPath);
  
  const compressedSize = fs.statSync(compressedPath).size;
  const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
  console.log(`   📊 Tamaño comprimido: ${formatSize(compressedSize)} (${ratio}% reducción)`);
  
  // Eliminar archivo sin comprimir
  fs.unlinkSync(backupPath);
  
  return {
    path: compressedPath,
    size: originalSize,
    compressedSize,
  };
}

/**
 * Subir a GitHub como Release
 */
async function uploadToGitHubRelease(backupPath: string): Promise<void> {
  if (!GITHUB_TOKEN) {
    console.log('⚠️  GITHUB_TOKEN no configurado, saltando subida a GitHub');
    return;
  }
  
  console.log('');
  console.log('📤 Subiendo a GitHub Releases...');
  
  const fileName = path.basename(backupPath);
  const tagName = `backup-${new Date().toISOString().split('T')[0]}`;
  const releaseName = `Database Backup ${new Date().toLocaleDateString()}`;
  
  try {
    // Crear release usando GitHub CLI (gh)
    const createReleaseCmd = `gh release create ${tagName} "${backupPath}" --repo ${GITHUB_REPO} --title "${releaseName}" --notes "Backup automático de la base de datos SQLite"`;
    
    console.log(`   🏷️  Creando release: ${tagName}`);
    execSync(createReleaseCmd, { 
      env: { ...process.env, GITHUB_TOKEN },
      stdio: 'pipe' 
    });
    
    console.log(`   ✅ Release creado: https://github.com/${GITHUB_REPO}/releases/tag/${tagName}`);
  } catch (error: any) {
    // Si el tag ya existe, subir a ese release
    if (error.message.includes('already exists')) {
      console.log(`   ⚠️  Release ${tagName} ya existe, actualizando...`);
      
      const uploadCmd = `gh release upload ${tagName} "${backupPath}" --repo ${GITHUB_REPO} --clobber`;
      execSync(uploadCmd, { 
        env: { ...process.env, GITHUB_TOKEN },
        stdio: 'pipe' 
      });
      
      console.log(`   ✅ Archivo actualizado en release existente`);
    } else {
      console.error(`   ❌ Error subiendo a GitHub:`, error.message);
      console.log('   💡 Asegúrate de tener gh CLI instalado y autenticado');
    }
  }
}

/**
 * Limpiar backups antiguos (mantener últimos N)
 */
function cleanOldBackups(keepCount: number = 30): void {
  console.log('');
  console.log(`🧹 Limpiando backups antiguos (mantener últimos ${keepCount})...`);
  
  if (!fs.existsSync(BACKUP_DIR)) return;
  
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.sqlite.gz'))
    .map(f => ({
      name: f,
      path: path.join(BACKUP_DIR, f),
      time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime(),
    }))
    .sort((a, b) => b.time - a.time); // Más recientes primero
  
  if (files.length <= keepCount) {
    console.log(`   ✅ ${files.length} backups, nada que limpiar`);
    return;
  }
  
  const toDelete = files.slice(keepCount);
  for (const file of toDelete) {
    fs.unlinkSync(file.path);
    console.log(`   🗑️  Eliminado: ${file.name}`);
  }
  
  console.log(`   ✅ ${toDelete.length} backups eliminados`);
}

async function main(): Promise<void> {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  💾 Backup de Base de Datos');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log(`📍 DB: ${DB_PATH}`);
  console.log(`📁 Backups: ${BACKUP_DIR}`);
  console.log('');
  
  try {
    // Crear backup local
    const backup = await createLocalBackup();
    
    // Subir a GitHub
    await uploadToGitHubRelease(backup.path);
    
    // Limpiar backups antiguos
    cleanOldBackups(30);
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Backup completado exitosamente');
    console.log(`   📦 Archivo: ${backup.path}`);
    console.log(`   📊 Tamaño: ${formatSize(backup.compressedSize)}`);
    console.log('═══════════════════════════════════════════════════════════');
  } catch (error: any) {
    console.error('');
    console.error('❌ Error durante el backup:', error.message);
    process.exit(1);
  }
}

main();
