/**
 * Entry point principal para ejecución local del listener
 * Para usar en desarrollo o como proceso standalone
 */

import { syncEvents } from './listener.js';
import 'dotenv/config';

/**
 * Función principal que ejecuta una sincronización
 */
async function main() {
  console.log('🚀 FloorEngine Listener Bot');
  console.log('================================');
  console.log(`⏰ Inicio: ${new Date().toISOString()}`);
  console.log('');

  try {
    const result = await syncEvents();

    console.log('');
    console.log('================================');
    console.log('✅ Sincronización completada');
    console.log(
      `📊 ${result.processed} eventos procesados (bloques ${result.fromBlock} - ${result.toBlock})`
    );
  } catch (error) {
    console.error('');
    console.error('================================');
    console.error('❌ Error durante la sincronización:');
    console.error(error);
    process.exit(1);
  }
}

// Ejecutar si este archivo se corre directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };

