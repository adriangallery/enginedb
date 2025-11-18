/**
 * Vercel Serverless Function - API endpoint para sincronizar eventos
 * Se ejecuta automáticamente via cron job configurado en vercel.json
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { syncEvents } from '../src/listener.js';
import 'dotenv/config';

/**
 * Handler principal para el endpoint /api/sync
 * Vercel ejecutará esta función según el cron configurado
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Verificar que sea una petición autorizada (opcional pero recomendado)
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  // Si hay un secreto configurado, validarlo
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.warn('⚠️ Intento de acceso no autorizado al endpoint de sync');
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // Logging de inicio
  console.log('🚀 Iniciando sincronización desde Vercel cron job');
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log(`📍 Method: ${req.method}`);

  try {
    // Ejecutar sincronización
    const startTime = Date.now();
    const result = await syncEvents();
    const duration = Date.now() - startTime;

    // Respuesta exitosa
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      processed: result.processed,
      fromBlock: result.fromBlock.toString(),
      toBlock: result.toBlock.toString(),
      message: `Procesados ${result.processed} eventos desde bloque ${result.fromBlock} hasta ${result.toBlock}`,
    };

    console.log('✅ Sincronización completada exitosamente');
    console.log(`📊 Estadísticas:`, response);

    res.status(200).json(response);
  } catch (error) {
    // Manejo de errores
    console.error('❌ Error durante la sincronización:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';

    res.status(500).json({
      success: false,
      timestamp: new Date().toISOString(),
      error: errorMessage,
      message: 'Error al sincronizar eventos',
    });
  }
}

