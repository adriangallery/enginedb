/**
 * Sincronización de base de datos SQLite a GitHub
 * Usa la GitHub API para actualizar el archivo directamente
 */

import fs from 'fs';
import path from 'path';

// Configuración
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || 'adriangallery/enginedb';
const FILE_PATH_IN_REPO = 'api/data/enginedb.sqlite';
const GITHUB_API = 'https://api.github.com';

/**
 * Obtener la ruta a la base de datos
 */
function getDatabasePath(): string {
  // Primero intentar la ruta por defecto de la API
  const possiblePaths = [
    path.join(process.cwd(), 'api', 'data', 'enginedb.sqlite'),
    path.join(process.cwd(), 'data', 'enginedb.sqlite'),
    './api/data/enginedb.sqlite',
    './data/enginedb.sqlite',
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  return process.env.DB_PATH || './api/data/enginedb.sqlite';
}

/**
 * Obtener el SHA actual del archivo en GitHub
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
      return null;
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error obteniendo SHA: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as { sha: string };
    return data.sha;
  } catch (error: any) {
    console.error('Error obteniendo SHA del archivo:', error.message);
    throw error;
  }
}

/**
 * Subir el archivo a GitHub
 */
async function uploadToGitHub(content: string, sha: string | null): Promise<boolean> {
  const body: any = {
    message: `Auto-sync database - ${new Date().toISOString()}`,
    content: content,
    branch: 'main',
  };

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
      message: 'GITHUB_TOKEN no configurado - sincronización a GitHub desactivada',
    };
  }

  const dbPath = getDatabasePath();

  // Verificar que existe la base de datos
  if (!fs.existsSync(dbPath)) {
    return {
      success: false,
      message: `Base de datos no encontrada: ${dbPath}`,
    };
  }

  try {
    const startTime = Date.now();
    
    // Leer archivo y convertir a base64
    console.log(`📤 Sincronizando DB a GitHub: ${dbPath}`);
    const fileContent = fs.readFileSync(dbPath);
    const base64Content = fileContent.toString('base64');
    const fileSize = fileContent.length;

    // Verificar límite de GitHub (100MB)
    if (fileSize > 100 * 1024 * 1024) {
      return {
        success: false,
        message: `Archivo demasiado grande (${formatSize(fileSize)}) - límite GitHub: 100MB`,
      };
    }

    // Obtener SHA actual del archivo
    const sha = await getFileSha();

    // Subir a GitHub
    await uploadToGitHub(base64Content, sha);
    
    const elapsed = Date.now() - startTime;
    const message = `✅ DB sincronizada a GitHub (${formatSize(fileSize)}) en ${elapsed}ms`;
    
    console.log(message);
    
    return {
      success: true,
      message,
    };
  } catch (error: any) {
    const message = `❌ Error sincronizando a GitHub: ${error.message}`;
    console.error(message);
    
    return {
      success: false,
      message,
    };
  }
}

/**
 * Verificar si la sincronización a GitHub está configurada
 */
export function isGitHubSyncEnabled(): boolean {
  return !!GITHUB_TOKEN;
}
