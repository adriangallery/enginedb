/**
 * Utilidades de backup para el servidor
 * Scheduler de backups automáticos
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

let backupInterval: NodeJS.Timeout | null = null;

/**
 * Ejecutar backup manualmente
 */
export async function runBackup(): Promise<boolean> {
  console.log('');
  console.log('📦 Ejecutando backup programado...');
  
  return new Promise((resolve) => {
    const backupScript = path.join(process.cwd(), 'scripts', 'backup-to-github.ts');
    
    if (!fs.existsSync(backupScript)) {
      console.error('❌ Script de backup no encontrado:', backupScript);
      resolve(false);
      return;
    }
    
    const child = spawn('npx', ['tsx', backupScript], {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: process.env,
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Backup completado');
        resolve(true);
      } else {
        console.error(`❌ Backup falló con código ${code}`);
        resolve(false);
      }
    });
    
    child.on('error', (error) => {
      console.error('❌ Error ejecutando backup:', error);
      resolve(false);
    });
  });
}

/**
 * Iniciar scheduler de backups
 */
export function startBackupScheduler(): void {
  const intervalHours = parseInt(process.env.BACKUP_INTERVAL_HOURS || '6', 10);
  
  if (intervalHours <= 0) {
    console.log('⏸️  Backup scheduler deshabilitado (BACKUP_INTERVAL_HOURS=0)');
    return;
  }
  
  const intervalMs = intervalHours * 60 * 60 * 1000;
  
  console.log(`⏰ Backup scheduler iniciado: cada ${intervalHours} horas`);
  
  // Ejecutar primer backup después de 1 minuto
  setTimeout(() => {
    runBackup().catch(console.error);
  }, 60 * 1000);
  
  // Scheduler periódico
  backupInterval = setInterval(() => {
    runBackup().catch(console.error);
  }, intervalMs);
}

/**
 * Detener scheduler de backups
 */
export function stopBackupScheduler(): void {
  if (backupInterval) {
    clearInterval(backupInterval);
    backupInterval = null;
    console.log('⏹️  Backup scheduler detenido');
  }
}

export default {
  runBackup,
  startBackupScheduler,
  stopBackupScheduler,
};
