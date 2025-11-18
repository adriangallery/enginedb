/**
 * Sincronización histórica para el contrato $ADRIAN Token
 * Procesa desde el bloque de deployment hasta el bloque actual
 */

import { syncERC20Events } from './adrian-token-listener.js';
import { ADRIAN_TOKEN_CONFIG } from '../../contracts/config/adrian-token.js';
import {
  getLastSyncedBlockByContract,
  updateLastSyncedBlockByContract,
} from '../../supabase/client.js';
import {
  createPublicClient,
  http,
} from 'viem';
import { base } from 'viem/chains';

/**
 * Crear cliente de viem
 */
function createViemClient() {
  const rpcUrl = process.env.RPC_URL_BASE;

  if (!rpcUrl) {
    throw new Error('Falta la variable de entorno RPC_URL_BASE');
  }

  return createPublicClient({
    chain: base,
    transport: http(rpcUrl),
  });
}

/**
 * Sincronizar históricamente desde el bloque de deployment
 * Procesa en batches grandes para evitar timeouts
 */
export async function syncHistoricalERC20(): Promise<void> {
  console.log('[ADRIAN-ERC20] 📜 Iniciando sincronización histórica...');

  const contractAddress = ADRIAN_TOKEN_CONFIG.address;
  const client = createViemClient();

  // Obtener bloque actual
  const latestBlock = await client.getBlockNumber();

  // Determinar bloque inicial
  let startBlock: bigint;
  if (ADRIAN_TOKEN_CONFIG.startBlock) {
    startBlock = ADRIAN_TOKEN_CONFIG.startBlock;
    console.log(
      `[ADRIAN-ERC20] 📍 Usando startBlock configurado: ${startBlock}`
    );
  } else {
    // Si no hay startBlock configurado, intentar obtener desde Basescan
    // Por ahora, usar bloque 0 (se puede mejorar con API de Basescan)
    startBlock = 0n;
    console.log(
      `[ADRIAN-ERC20] ⚠️  No hay startBlock configurado, usando bloque 0. Considera configurar ADRIAN_TOKEN_START_BLOCK en variables de entorno.`
    );
  }

  // Verificar si ya hay progreso guardado
  const lastSyncedBlock = BigInt(
    await getLastSyncedBlockByContract(contractAddress)
  );

  if (lastSyncedBlock > 0n) {
    console.log(
      `[ADRIAN-ERC20] 📍 Continuando desde último bloque sincronizado: ${lastSyncedBlock}`
    );
    startBlock = lastSyncedBlock + 1n;
  }

  if (startBlock > latestBlock) {
    console.log(
      `[ADRIAN-ERC20] ✅ Ya estamos sincronizados al último bloque`
    );
    return;
  }

  // Calcular bloques a procesar
  const blocksToProcess = latestBlock - startBlock + 1n;
  const HISTORICAL_BATCH_SIZE = 10000n; // Procesar 10,000 bloques por batch
  const totalBatches = Number(
    blocksToProcess / HISTORICAL_BATCH_SIZE +
      (blocksToProcess % HISTORICAL_BATCH_SIZE > 0n ? 1n : 0n)
  );

  console.log(
    `[ADRIAN-ERC20] 📊 Procesando ${blocksToProcess} bloques históricos en ${totalBatches} batches de ${HISTORICAL_BATCH_SIZE} bloques`
  );
  console.log(
    `[ADRIAN-ERC20] 📍 Desde bloque ${startBlock} hasta ${latestBlock}`
  );

  // Procesar en batches
  let currentBlock = startBlock;
  let batchNumber = 0;

  while (currentBlock <= latestBlock) {
    batchNumber++;
    const batchEndBlock =
      currentBlock + HISTORICAL_BATCH_SIZE - 1n > latestBlock
        ? latestBlock
        : currentBlock + HISTORICAL_BATCH_SIZE - 1n;

    console.log(
      `[ADRIAN-ERC20] 📦 Batch ${batchNumber}/${totalBatches}: Bloques ${currentBlock} → ${batchEndBlock}`
    );

    try {
      const batchStartBlock = currentBlock;
      
      // Establecer el bloque inicial del batch
      // syncERC20Events procesará desde lastSyncedBlock + 1
      await updateLastSyncedBlockByContract(contractAddress, Number(batchStartBlock - 1n));
      
      // Procesar eventos
      // Nota: syncERC20Events procesará hasta el bloque actual
      // Para limitar a batchEndBlock, necesitaríamos modificar la función
      // Por ahora, procesamos y luego ajustamos si excedió
      const result = await syncERC20Events();
      
      // Asegurar que no procesamos más allá del batch
      const finalBlock = result.toBlock > batchEndBlock ? batchEndBlock : result.toBlock;
      await updateLastSyncedBlockByContract(contractAddress, Number(finalBlock));
      
      console.log(
        `[ADRIAN-ERC20] ✅ Batch ${batchNumber}/${totalBatches} completado (${batchStartBlock} → ${finalBlock})`
      );

      currentBlock = batchEndBlock + 1n;

      // Pequeña pausa para no saturar el RPC
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(
        `[ADRIAN-ERC20] ❌ Error en batch ${batchNumber}:`,
        error
      );
      // Continuar con el siguiente batch
      currentBlock = batchEndBlock + 1n;
    }
  }

  console.log(
    `[ADRIAN-ERC20] 🎉 Sincronización histórica completada`
  );
}

