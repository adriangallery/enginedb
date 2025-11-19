/**
 * Unified Multi-Contract Listener
 * Lee cada bloque UNA SOLA VEZ y procesa eventos de todos los contratos
 * Mucho más eficiente que leer cada contrato por separado
 */

import { createViemClient, decodeLog as decodeFloorEngineLog, processEvent as processFloorEngineEvent } from './listener.js';
import { getLastSyncedBlockByContract, updateLastSyncedBlockByContract } from './supabase/client.js';
import { processERC20Event } from './processors/erc20-processor.js';
import { processERC721Event } from './processors/erc721-processor.js';
import type { Log } from 'viem';

// Configuración de contratos
import { FLOOR_ENGINE_CONFIG } from './contracts/config/floor-engine.js';
import { ADRIAN_TOKEN_CONFIG } from './contracts/config/adrian-token.js';
import { ADRIAN_LAB_CORE_CONFIG } from './contracts/config/adrian-lab-core.js';
import { ADRIAN_TRAITS_CORE_CONFIG } from './contracts/config/adrian-traits-core.js';
import { ADRIAN_TRAITS_EXTENSIONS_CONFIG } from './contracts/config/adrian-traits-extensions.js';
import { ADRIAN_SHOP_CONFIG } from './contracts/config/adrian-shop.js';

// Decoders de eventos
import { decodeLog as decodeERC20Log } from './listeners/erc20/adrian-token-listener.js';
import { decodeLog as decodeERC721Log } from './listeners/erc721/adrian-lab-core-listener.js';
import { decodeLog as decodeERC1155Log } from './listeners/erc1155/adrian-traits-core-listener.js';
import { decodeLog as decodeTraitsExtensionsLog } from './listeners/custom/adrian-traits-extensions-listener.js';
import { decodeLog as decodeShopLog } from './listeners/custom/adrian-shop-listener.js';

// Procesadores
import { processERC1155Event } from './processors/erc1155-processor.js';
import { processTraitsExtensionsEvent } from './processors/traits-extensions-processor.js';
import { processShopEvent } from './processors/shop-processor.js';

// Configuración
const BLOCKS_PER_BATCH = 10n; // Bloques por batch
const PARALLEL_REQUESTS = 3; // Requests paralelos
const SAVE_PROGRESS_INTERVAL = 50; // Guardar progreso cada N batches

/**
 * Definición de un contrato que el sistema puede procesar
 */
interface ContractDefinition {
  name: string;
  address: string;
  startBlock: bigint;
  decoder: (log: Log) => any;
  processor: (event: any, address: string) => Promise<void>;
  color: string; // Para logs coloreados
}

/**
 * Registry de todos los contratos activos
 * Agregar nuevos contratos aquí para que se procesen automáticamente
 */
const CONTRACT_REGISTRY: ContractDefinition[] = [
  {
    name: 'FloorEngine',
    address: FLOOR_ENGINE_CONFIG.address,
    startBlock: FLOOR_ENGINE_CONFIG.startBlock || 0n,
    decoder: decodeFloorEngineLog,
    processor: processFloorEngineEvent,
    color: '🔷',
  },
  {
    name: 'ADRIAN-ERC20',
    address: ADRIAN_TOKEN_CONFIG.address,
    startBlock: ADRIAN_TOKEN_CONFIG.startBlock || 0n,
    decoder: decodeERC20Log,
    processor: processERC20Event,
    color: '🟡',
  },
  {
    name: 'ADRIAN-ERC721',
    address: ADRIAN_LAB_CORE_CONFIG.address,
    startBlock: ADRIAN_LAB_CORE_CONFIG.startBlock || 0n,
    decoder: decodeERC721Log,
    processor: processERC721Event,
    color: '🟣',
  },
  {
    name: 'TraitsCore',
    address: ADRIAN_TRAITS_CORE_CONFIG.address,
    startBlock: ADRIAN_TRAITS_CORE_CONFIG.startBlock || 0n,
    decoder: decodeERC1155Log,
    processor: processERC1155Event,
    color: '🔵',
  },
  {
    name: 'TraitsExtensions',
    address: ADRIAN_TRAITS_EXTENSIONS_CONFIG.address,
    startBlock: ADRIAN_TRAITS_EXTENSIONS_CONFIG.startBlock || 0n,
    decoder: decodeTraitsExtensionsLog,
    processor: processTraitsExtensionsEvent,
    color: '🟠',
  },
  {
    name: 'AdrianShop',
    address: ADRIAN_SHOP_CONFIG.address,
    startBlock: ADRIAN_SHOP_CONFIG.startBlock || 0n,
    decoder: decodeShopLog,
    processor: processShopEvent,
    color: '🛒',
  },
];

/**
 * Estado de sincronización de cada contrato
 */
interface ContractSyncState {
  name: string;
  address: string;
  lastSyncedBlock: bigint;
  startBlock: bigint;
  eventsProcessed: number;
  hasMore: boolean;
}

/**
 * Procesar un rango de bloques con retry logic
 */
async function processBlockRange(
  client: ReturnType<typeof createViemClient>,
  addresses: string[],
  fromBlock: bigint,
  toBlock: bigint,
  retries = 3
): Promise<Log[]> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const logs = await client.getLogs({
        address: addresses as `0x${string}`[],
        fromBlock,
        toBlock,
      });
      return logs;
    } catch (error: any) {
      if (attempt === retries) {
        console.error(`❌ Error después de ${retries} intentos:`, error.message);
        throw error;
      }
      console.warn(`⚠️  Intento ${attempt}/${retries} falló, reintentando...`);
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
  return [];
}

/**
 * Sincronización unificada de todos los contratos
 * Lee cada bloque UNA SOLA VEZ y procesa eventos de todos los contratos
 */
export async function syncAllContracts(maxBatches?: number): Promise<{
  contractStates: ContractSyncState[];
  totalEventsProcessed: number;
  hasMore: boolean;
  duration: number;
}> {
  const startTime = Date.now();
  const client = createViemClient();

  console.log('🌐 Sincronización Unificada Multi-Contrato');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // 1. Obtener estado de sincronización de cada contrato
  const contractStates: ContractSyncState[] = [];
  
  for (const contract of CONTRACT_REGISTRY) {
    const lastSyncedBlock = BigInt(
      await getLastSyncedBlockByContract(contract.address)
    );
    const startBlock =
      lastSyncedBlock === 0n ? contract.startBlock : lastSyncedBlock + 1n;

    contractStates.push({
      name: contract.name,
      address: contract.address,
      lastSyncedBlock,
      startBlock,
      eventsProcessed: 0,
      hasMore: false,
    });

    console.log(
      `${contract.color} [${contract.name}] Último bloque: ${lastSyncedBlock}`
    );
  }

  // 2. Determinar rango global de bloques a procesar
  const currentBlock = await client.getBlockNumber();
  const minStartBlock = contractStates.reduce(
    (min, state) => (state.startBlock < min ? state.startBlock : min),
    currentBlock
  );

  console.log('');
  console.log(`📍 Bloque actual: ${currentBlock}`);
  console.log(`📊 Rango global: ${minStartBlock} → ${currentBlock}`);
  console.log(
    `🔄 Contratos activos: ${CONTRACT_REGISTRY.map((c) => c.name).join(', ')}`
  );

  if (minStartBlock > currentBlock) {
    console.log('✅ Todos los contratos están sincronizados');
    return {
      contractStates,
      totalEventsProcessed: 0,
      hasMore: false,
      duration: Date.now() - startTime,
    };
  }

  // 3. Calcular batches a procesar
  const blocksToProcess = currentBlock - minStartBlock + 1n;
  const totalBatches = Number(
    (blocksToProcess / BLOCKS_PER_BATCH) +
      (blocksToProcess % BLOCKS_PER_BATCH > 0n ? 1n : 0n)
  );
  const batchesToProcess = maxBatches ? Math.min(totalBatches, maxBatches) : totalBatches;

  console.log('');
  console.log(
    `📦 Procesando ${batchesToProcess}/${totalBatches} batches (${BLOCKS_PER_BATCH} bloques/batch)`
  );
  console.log(
    `⚡ Usando ${PARALLEL_REQUESTS} requests paralelos = ${PARALLEL_REQUESTS * Number(BLOCKS_PER_BATCH)} bloques/ciclo`
  );
  console.log('');

  // 4. Procesar bloques en batches paralelos
  let processedBatches = 0;
  let totalEventsProcessed = 0;

  for (let i = 0; i < batchesToProcess; i += PARALLEL_REQUESTS) {
    // Crear batch de requests paralelos
    const batchPromises: Promise<Log[]>[] = [];

    for (let j = 0; j < PARALLEL_REQUESTS && i + j < batchesToProcess; j++) {
      const batchIndex = i + j;
      const fromBlock = minStartBlock + BigInt(batchIndex) * BLOCKS_PER_BATCH;
      const toBlock =
        fromBlock + BLOCKS_PER_BATCH - 1n > currentBlock
          ? currentBlock
          : fromBlock + BLOCKS_PER_BATCH - 1n;

      // Filtrar solo contratos que necesitan procesar este rango
      const activeAddresses = CONTRACT_REGISTRY.filter((contract) => {
        const state = contractStates.find((s) => s.address === contract.address)!;
        return state.startBlock <= toBlock;
      }).map((c) => c.address);

      if (activeAddresses.length > 0) {
        batchPromises.push(
          processBlockRange(client, activeAddresses, fromBlock, toBlock)
        );
      }
    }

    // Ejecutar batch en paralelo
    const batchResults = await Promise.all(batchPromises);
    const allLogs = batchResults.flat();

    // Procesar cada log según su contrato
    for (const log of allLogs) {
      const contract = CONTRACT_REGISTRY.find(
        (c) => c.address.toLowerCase() === log.address.toLowerCase()
      );

      if (contract) {
        try {
          const event = contract.decoder(log);
          if (event) {
            // Siempre pasar el address como segundo parámetro
            // FloorEngine lo ignora, pero los demás lo necesitan
            await contract.processor(event, contract.address);
            
            const state = contractStates.find(
              (s) => s.address === contract.address
            )!;
            state.eventsProcessed++;
            totalEventsProcessed++;
          }
        } catch (error) {
          console.error(
            `${contract.color} [${contract.name}] Error procesando evento:`,
            error
          );
        }
      }
    }

    processedBatches += batchPromises.length;
    
    // Actualizar último bloque procesado para cada contrato
    const lastProcessedBlock =
      minStartBlock + BigInt(processedBatches) * BLOCKS_PER_BATCH - 1n;
    const finalBlock = lastProcessedBlock > currentBlock ? currentBlock : lastProcessedBlock;

    // Actualizar estados
    for (const state of contractStates) {
      if (state.startBlock <= finalBlock) {
        state.lastSyncedBlock = finalBlock;
      }
    }

    // Log de progreso
    if (processedBatches % 10 === 0 || i + PARALLEL_REQUESTS >= batchesToProcess) {
      console.log(
        `📦 Batch ${processedBatches}/${totalBatches}: ${allLogs.length} eventos (Total: ${totalEventsProcessed})`
      );
    }

    // Guardar progreso cada N batches
    if (
      processedBatches % SAVE_PROGRESS_INTERVAL === 0 ||
      i + PARALLEL_REQUESTS >= batchesToProcess
    ) {
      for (const state of contractStates) {
        if (state.startBlock <= finalBlock) {
          await updateLastSyncedBlockByContract(
            state.address,
            Number(state.lastSyncedBlock)
          );
        }
      }
      console.log(`💾 Progreso guardado: bloque ${finalBlock}`);
    }

    // Delay entre batches
    if (i + PARALLEL_REQUESTS < batchesToProcess) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  // 5. Determinar si hay más trabajo pendiente
  const hasMore = contractStates.some(
    (state) => state.lastSyncedBlock < currentBlock
  );

  // 6. Actualizar estados finales
  for (const state of contractStates) {
    state.hasMore = state.lastSyncedBlock < currentBlock;
  }

  const duration = Date.now() - startTime;

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Resumen de Sincronización');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  for (const state of contractStates) {
    const contract = CONTRACT_REGISTRY.find((c) => c.address === state.address)!;
    console.log(
      `${contract.color} [${state.name}] ${state.eventsProcessed} eventos | Bloque: ${state.lastSyncedBlock} | ${state.hasMore ? '⏸️  Pendiente' : '✅ Sincronizado'}`
    );
  }
  
  console.log('');
  console.log(`🎉 Total: ${totalEventsProcessed} eventos procesados`);
  console.log(`⏱️  Duración: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
  console.log(`📍 Bloques: ${minStartBlock} → ${currentBlock}`);

  return {
    contractStates,
    totalEventsProcessed,
    hasMore,
    duration,
  };
}

/**
 * Exportar función para retrocompatibilidad
 * Ahora solo llama al sistema unificado
 */
export async function syncEventsUnified(maxBatches?: number) {
  const result = await syncAllContracts(maxBatches);
  
  return {
    processed: result.totalEventsProcessed,
    fromBlock: result.contractStates.reduce(
      (min, s) => (s.startBlock < min ? s.startBlock : min),
      BigInt(Number.MAX_SAFE_INTEGER)
    ),
    toBlock: result.contractStates.reduce(
      (max, s) => (s.lastSyncedBlock > max ? s.lastSyncedBlock : max),
      0n
    ),
    hasMore: result.hasMore,
  };
}

