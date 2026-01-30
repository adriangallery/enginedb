/**
 * Script para sincronizar la base de datos SQLite a GitHub
 * Usa la GitHub API para actualizar el archivo directamente
 * Diseñado para ejecutarse periódicamente desde Railway
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || 'adriangallery/enginedb';
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'enginedb.sqlite');
const FILE_PATH_IN_REPO = 'api/data/enginedb.sqlite';

// GitHub API base URL
const GITHUB_API = 'https://api.github.com';

/**
 * Obtener el SHA actual del archivo en GitHub (necesario para actualizarlo)
 */
async function getFileSha(): Promise<string | null> {
  try {
    const response = await fetch(
      `${GITHUB_API}/repos/${GITHUB_REPO}/contents/${FILE_PATH_IN_REPO}`,
      {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'enginedb-sync',
        },
      }
    );

    if (response.status === 404) {
      // Archivo no existe, se creará nuevo
      return null;
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error obteniendo SHA: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.sha;
  } catch (error: any) {
    console.error('Error obteniendo SHA del archivo:', error.message);
    throw error;
  }
}

/**
 * Subir el archivo de base de datos a GitHub
 */
async function uploadToGitHub(content: string, sha: string | null): Promise<boolean> {
  const body: any = {
    message: `Auto-sync database - ${new Date().toISOString()}`,
    content: content,
    branch: 'main',
  };

  // Si el archivo ya existe, necesitamos el SHA
  if (sha) {
    body.sha = sha;
  }

  const response = await fetch(
    `${GITHUB_API}/repos/${GITHUB_REPO}/contents/${FILE_PATH_IN_REPO}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'enginedb-sync',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error subiendo a GitHub: ${response.status} - ${errorText}`);
  }

  return true;
}

/**
 * Formatear tamaño de archivo
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/**
 * Sincronizar base de datos a GitHub
 */
export async function syncDatabaseToGitHub(): Promise<{ success: boolean; message: string }> {
  // Verificar configuración
  if (!GITHUB_TOKEN) {
    return {
      success: false,
      message: 'GITHUB_TOKEN no configurado - sincronización desactivada',
    };
  }

  // Verificar que existe la base de datos
  if (!fs.existsSync(DB_PATH)) {
    return {
      success: false,
      message: `Base de datos no encontrada: ${DB_PATH}`,
    };
  }

  try {
    const startTime = Date.now();
    
    // Leer archivo y convertir a base64
    console.log(`📦 Leyendo base de datos: ${DB_PATH}`);
    const fileContent = fs.readFileSync(DB_PATH);
    const base64Content = fileContent.toString('base64');
    const fileSize = fileContent.length;
    
    console.log(`   Tamaño: ${formatSize(fileSize)}`);

    // Verificar límite de GitHub (100MB)
    if (fileSize > 100 * 1024 * 1024) {
      return {
        success: false,
        message: `Archivo demasiado grande (${formatSize(fileSize)}) - límite GitHub: 100MB`,
      };
    }

    // Obtener SHA actual del archivo
    console.log('🔍 Obteniendo SHA actual del archivo...');
    const sha = await getFileSha();
    
    if (sha) {
      console.log(`   SHA encontrado: ${sha.substring(0, 7)}...`);
    } else {
      console.log('   Archivo no existe, se creará nuevo');
    }

    // Subir a GitHub
    console.log('📤 Subiendo a GitHub...');
    await uploadToGitHub(base64Content, sha);
    
    const elapsed = Date.now() - startTime;
    const message = `Base de datos sincronizada a GitHub (${formatSize(fileSize)}) en ${elapsed}ms`;
    
    console.log(`✅ ${message}`);
    
    return {
      success: true,
      message,
    };
  } catch (error: any) {
    const message = `Error sincronizando a GitHub: ${error.message}`;
    console.error(`❌ ${message}`);
    
    return {
      success: false,
      message,
    };
  }
}

/**
 * Ejecutar como script independiente
 */
async function main(): Promise<void> {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🔄 Sincronización de Base de Datos a GitHub');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log(`📍 DB: ${DB_PATH}`);
  console.log(`📁 Repo: ${GITHUB_REPO}`);
  console.log(`📄 Archivo: ${FILE_PATH_IN_REPO}`);
  console.log('');

  const result = await syncDatabaseToGitHub();
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  if (result.success) {
    console.log('✅ Sincronización completada');
  } else {
    console.log('❌ Sincronización fallida');
    console.log(`   ${result.message}`);
  }
  console.log('═══════════════════════════════════════════════════════════');
  
  if (!result.success) {
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
