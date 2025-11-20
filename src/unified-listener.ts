/**
 * Unified Multi-Contract Listener
 * Lee cada bloque UNA SOLA VEZ y procesa eventos de todos los contratos
 * Mucho más eficiente que leer cada contrato por separado
 */

import { createViemClient, decodeLog as decodeFloorEngineLog, processEvent as processFloorEngineEvent } from './listener.js';
import { 
  getLastSyncedBlockByContract, 
  updateLastSyncedBlockByContract,
  getLastHistoricalBlockByContract,
  updateLastHistoricalBlockByContract
} from './supabase/client.js';
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
const BLOCKS_PER_BATCH = process.env.BLOCKS_PER_BATCH
  ? BigInt(process.env.BLOCKS_PER_BATCH)
  : 10n; // Bloques por batch

// Número de requests paralelos para procesar múltiples rangos simultáneamente
// Para histórico: usar valores más altos (5-10) para acelerar
// Para tiempo real: 3-5 es suficiente
// Nota: Alchemy Free tier tiene límites de rate, usar con moderación
// En modo fallback (RPC público), usar menos paralelismo
const PARALLEL_REQUESTS = process.env.PARALLEL_REQUESTS
  ? parseInt(process.env.PARALLEL_REQUESTS)
  : (process.env.USE_FALLBACK_RPC === 'true' ? 2 : 5); // Default: 2 en fallback, 5 en modo normal

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
  lastHistoricalBlock: bigint | null;
  startBlock: bigint;
  eventsProcessed: number;
  hasMoreForward: boolean;
  hasMoreBackward: boolean;
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
      // Detectar errores 429 (Too Many Requests) y usar backoff más largo
      const isRateLimit = error?.status === 429 || 
                         error?.message?.includes('429') ||
                         error?.details?.includes('Too Many Requests');
      
      if (attempt === retries) {
        console.error(`❌ Error después de ${retries} intentos:`, error.message);
        throw error;
      }
      
      // Backoff exponencial más largo para rate limits
      const delay = isRateLimit 
        ? Math.min(5000 * Math.pow(2, attempt - 1), 30000) // Hasta 30 segundos para rate limits
        : 1000 * attempt; // Delay normal para otros errores
      
      console.warn(`⚠️  Intento ${attempt}/${retries} falló${isRateLimit ? ' (Rate Limit)' : ''}, reintentando en ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  return [];
}

/**
 * Sincronización unificada de todos los contratos con intercalación
 * Alterna entre sincronización forward (tiempo real) y backward (histórico)
 */
export async function syncAllContracts(maxBatches?: number): Promise<{
  contractStates: ContractSyncState[];
  totalEventsProcessed: number;
  hasMore: boolean;
  duration: number;
}> {
  const startTime = Date.now();
  const client = createViemClient();

  // Detectar modo fallback (solo forward, más lento)
  const useFallback = process.env.USE_FALLBACK_RPC === 'true';
  const fallbackStartBlock = process.env.FALLBACK_START_BLOCK
    ? BigInt(process.env.FALLBACK_START_BLOCK)
    : null;

  if (useFallback) {
    console.log('🔄 Modo Fallback RPC - Solo Forward (sin histórico)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (fallbackStartBlock) {
      console.log(`📍 Bloque de inicio configurado: ${fallbackStartBlock}`);
    }
  } else {
    console.log('🌐 Sincronización Unificada Multi-Contrato (Intercalada)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  // 1. Obtener estado de sincronización de cada contrato
  const contractStates: ContractSyncState[] = [];
  const currentBlock = await client.getBlockNumber();
  
  for (const contract of CONTRACT_REGISTRY) {
    let lastSyncedBlock = BigInt(
      await getLastSyncedBlockByContract(contract.address)
    );
    
    let lastHistoricalBlock = await getLastHistoricalBlockByContract(contract.address);
    
    // En modo fallback, deshabilitar backward sync
    if (useFallback) {
      // No procesar histórico en modo fallback
      lastHistoricalBlock = null;
      
      // Si no tiene registro forward, usar bloque de inicio configurado o bloque actual - 1
      if (lastSyncedBlock === 0n) {
        const initialBlock = fallbackStartBlock || (currentBlock - 1n);
        await updateLastSyncedBlockByContract(
          contract.address,
          Number(initialBlock)
        );
        lastSyncedBlock = initialBlock;
      }
    } else {
      // Modo normal: inicializar lastHistoricalBlock con el bloque actual si es null
      if (lastHistoricalBlock === null) {
        lastHistoricalBlock = Number(currentBlock);
        await updateLastHistoricalBlockByContract(
          contract.address,
          lastHistoricalBlock
        );
      }
      
      // Si no tiene registro forward, inicializar con bloque actual - 1 para empezar desde ahora
      // (después de limpiar datos, queremos priorizar tiempo real)
      if (lastSyncedBlock === 0n) {
        const initialBlock = currentBlock - 1n;
        await updateLastSyncedBlockByContract(
          contract.address,
          Number(initialBlock)
        );
        lastSyncedBlock = initialBlock;
      }
    }
    
    const forwardStartBlock = lastSyncedBlock + 1n;
    
    // En modo fallback, no hay backward sync
    const backwardStartBlock = useFallback ? null : (lastHistoricalBlock ? BigInt(lastHistoricalBlock) - 1n : null);

    contractStates.push({
      name: contract.name,
      address: contract.address,
      lastSyncedBlock,
      lastHistoricalBlock: lastHistoricalBlock ? BigInt(lastHistoricalBlock) : null,
      startBlock: contract.startBlock,
      eventsProcessed: 0,
      hasMoreForward: forwardStartBlock <= currentBlock,
      hasMoreBackward: useFallback ? false : (backwardStartBlock !== null && backwardStartBlock >= contract.startBlock),
    });

    console.log(
      `${contract.color} [${contract.name}] Forward: ${lastSyncedBlock} → ${currentBlock} | Backward: ${backwardStartBlock} → ${contract.startBlock}`
    );
  }

  console.log('');
  console.log(`📍 Bloque actual: ${currentBlock}`);
  console.log(
    `🔄 Contratos activos: ${CONTRACT_REGISTRY.map((c) => c.name).join(', ')}`
  );

  // 2. Verificar si hay trabajo pendiente
  let hasForwardWork = contractStates.some((s) => s.hasMoreForward);
  let hasBackwardWork = useFallback ? false : contractStates.some((s) => s.hasMoreBackward);

  if (!hasForwardWork && !hasBackwardWork) {
    console.log('✅ Todos los contratos están completamente sincronizados');
    return {
      contractStates,
      totalEventsProcessed: 0,
      hasMore: false,
      duration: Date.now() - startTime,
    };
  }

  console.log('');
  if (useFallback) {
    console.log(`📦 Modo: Fallback RPC (Solo Forward)`);
    console.log(`⚡ Batch size: ${BLOCKS_PER_BATCH} bloques`);
    console.log(`🚀 Paralelismo: ${PARALLEL_REQUESTS} requests simultáneos (${PARALLEL_REQUESTS * Number(BLOCKS_PER_BATCH)} bloques por ciclo)`);
    console.log(`⚠️  Nota: Modo más lento, solo sincroniza hacia adelante`);
  } else {
    console.log(`📦 Modo: Intercalado (Forward ↔ Backward)`);
    console.log(`⚡ Batch size: ${BLOCKS_PER_BATCH} bloques`);
    console.log(`🚀 Paralelismo: ${PARALLEL_REQUESTS} requests simultáneos (${PARALLEL_REQUESTS * Number(BLOCKS_PER_BATCH)} bloques por ciclo)`);
  }
  console.log('');

  // 3. Procesar en modo intercalado (o solo forward en fallback)
  let totalEventsProcessed = 0;
  let batchCounter = 0;
  let isForwardMode = true; // Empezar con forward (tiempo real tiene prioridad)

  // Procesar batches intercalados (o solo forward en modo fallback)
  while ((hasForwardWork || hasBackwardWork) && (!maxBatches || batchCounter < maxBatches)) {
    // En modo fallback, solo procesar forward
    if (useFallback && !isForwardMode) {
      isForwardMode = true; // Forzar forward en modo fallback
    }
    
    const mode = isForwardMode ? 'FORWARD' : 'BACKWARD';
    console.log(`\n🔄 Batch ${batchCounter + 1} - Modo: ${mode}`);

    let batchEvents = 0;

    if (isForwardMode && hasForwardWork) {
      // Modo FORWARD: sincronizar hacia adelante con paralelismo
      const activeStates = contractStates.filter((s) => s.hasMoreForward);
      
      if (activeStates.length > 0) {
        // Determinar el bloque inicial más bajo
        const minForwardBlock = activeStates.reduce(
          (min, s) => {
            const forwardStart = s.lastSyncedBlock + 1n;
            return forwardStart < min ? forwardStart : min;
          },
          currentBlock + 1n
        );

        // Calcular cuántos batches podemos procesar en paralelo
        const maxBlockToProcess = activeStates.reduce(
          (max, s) => {
            const forwardStart = s.lastSyncedBlock + 1n;
            const maxPossible = forwardStart + BigInt(PARALLEL_REQUESTS) * BLOCKS_PER_BATCH - 1n;
            return maxPossible > max ? maxPossible : max;
          },
          minForwardBlock
        );

        const effectiveEndBlock = maxBlockToProcess > currentBlock ? currentBlock : maxBlockToProcess;
        const totalBlocksToProcess = effectiveEndBlock - minForwardBlock + 1n;
        const batchesToProcess = Number(
          totalBlocksToProcess / BLOCKS_PER_BATCH + 
          (totalBlocksToProcess % BLOCKS_PER_BATCH > 0n ? 1n : 0n)
        );
        const parallelBatches = Math.min(batchesToProcess, PARALLEL_REQUESTS);

        if (minForwardBlock <= currentBlock && parallelBatches > 0) {
          const activeAddresses = activeStates.map((s) => s.address);
          
          // Crear múltiples requests paralelos con delay entre ellos para evitar rate limiting
          const parallelPromises: Promise<Log[]>[] = [];
          const blockRanges: { from: bigint; to: bigint }[] = [];

          for (let i = 0; i < parallelBatches; i++) {
            const fromBlock = minForwardBlock + BigInt(i) * BLOCKS_PER_BATCH;
            const toBlock = fromBlock + BLOCKS_PER_BATCH - 1n > currentBlock
              ? currentBlock
              : fromBlock + BLOCKS_PER_BATCH - 1n;

            if (fromBlock <= currentBlock) {
              blockRanges.push({ from: fromBlock, to: toBlock });
              // Agregar delay progresivo entre requests para evitar rate limiting
              // Delay de 100ms entre cada request paralelo
              const delay = i * 100;
              parallelPromises.push(
                (async () => {
                  if (delay > 0) {
                    await new Promise((resolve) => setTimeout(resolve, delay));
                  }
                  return processBlockRange(client, activeAddresses, fromBlock, toBlock);
                })()
              );
            }
          }

          // Ejecutar todos los requests en paralelo (con delays internos)
          const parallelResults = await Promise.all(parallelPromises);
          const allLogs: Log[] = [];
          for (const logs of parallelResults) {
            allLogs.push(...logs);
          }

          // Procesar logs
          for (const log of allLogs) {
            const contract = CONTRACT_REGISTRY.find(
              (c) => c.address.toLowerCase() === log.address.toLowerCase()
            );

            if (contract) {
              try {
                const event = contract.decoder(log);
                if (event) {
                  await contract.processor(event, contract.address);
                  const state = contractStates.find((s) => s.address === contract.address)!;
                  state.eventsProcessed++;
                  batchEvents++;
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

          // Actualizar estados forward
          const lastProcessedBlock = blockRanges.length > 0 
            ? blockRanges[blockRanges.length - 1].to 
            : minForwardBlock - 1n;
          
          for (const state of activeStates) {
            if (state.lastSyncedBlock < lastProcessedBlock) {
              state.lastSyncedBlock = lastProcessedBlock;
              state.hasMoreForward = state.lastSyncedBlock < currentBlock;
            }
          }

          const firstBlock = blockRanges[0]?.from || minForwardBlock;
          const lastBlock = lastProcessedBlock;
          console.log(`  ✅ Forward: ${firstBlock} → ${lastBlock} (${parallelBatches} batches, ${allLogs.length} eventos)`);
        }
      }
    } else if (!isForwardMode && hasBackwardWork) {
      // Modo BACKWARD: sincronizar hacia atrás con paralelismo
      const activeStates = contractStates.filter((s) => s.hasMoreBackward);
      
      if (activeStates.length > 0) {
        // Determinar el bloque más alto a procesar (hacia atrás)
        const maxBackwardBlock = activeStates.reduce(
          (max, s) => {
            if (s.lastHistoricalBlock === null) return max;
            const backwardStart = s.lastHistoricalBlock - 1n;
            return backwardStart > max ? backwardStart : max;
          },
          0n
        );

        const minStartBlock = activeStates.reduce(
          (min, s) => s.startBlock < min ? s.startBlock : min,
          maxBackwardBlock + 1n
        );

        if (maxBackwardBlock >= minStartBlock) {
          // Calcular cuántos batches podemos procesar en paralelo hacia atrás
          const totalBlocksToProcess = maxBackwardBlock - minStartBlock + 1n;
          const batchesToProcess = Number(
            totalBlocksToProcess / BLOCKS_PER_BATCH + 
            (totalBlocksToProcess % BLOCKS_PER_BATCH > 0n ? 1n : 0n)
          );
          const parallelBatches = Math.min(batchesToProcess, PARALLEL_REQUESTS);

          if (parallelBatches > 0) {
            const activeAddresses = activeStates.map((s) => s.address);
            
            // Crear múltiples requests paralelos (hacia atrás) con delay entre ellos
            const parallelPromises: Promise<Log[]>[] = [];
            const blockRanges: { from: bigint; to: bigint }[] = [];

            for (let i = 0; i < parallelBatches; i++) {
              // Procesar desde el más alto hacia abajo
              const toBlock = maxBackwardBlock - BigInt(i) * BLOCKS_PER_BATCH;
              const fromBlock = toBlock - BLOCKS_PER_BATCH + 1n < minStartBlock
                ? minStartBlock
                : toBlock - BLOCKS_PER_BATCH + 1n;

              if (fromBlock <= toBlock && toBlock >= minStartBlock) {
                blockRanges.push({ from: fromBlock, to: toBlock });
                // Agregar delay progresivo entre requests para evitar rate limiting
                // Delay de 100ms entre cada request paralelo
                const delay = i * 100;
                parallelPromises.push(
                  (async () => {
                    if (delay > 0) {
                      await new Promise((resolve) => setTimeout(resolve, delay));
                    }
                    return processBlockRange(client, activeAddresses, fromBlock, toBlock);
                  })()
                );
              }
            }

            // Ejecutar todos los requests en paralelo (con delays internos)
            const parallelResults = await Promise.all(parallelPromises);
            const allLogs: Log[] = [];
            for (const logs of parallelResults) {
              allLogs.push(...logs);
            }

            // Procesar logs
            for (const log of allLogs) {
              const contract = CONTRACT_REGISTRY.find(
                (c) => c.address.toLowerCase() === log.address.toLowerCase()
              );

              if (contract) {
                try {
                  const event = contract.decoder(log);
                  if (event) {
                    await contract.processor(event, contract.address);
                    const state = contractStates.find((s) => s.address === contract.address)!;
                    state.eventsProcessed++;
                    batchEvents++;
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

            // Actualizar estados backward (usar el bloque más bajo procesado)
            const firstProcessedBlock = blockRanges.length > 0 
              ? blockRanges[blockRanges.length - 1].from 
              : maxBackwardBlock + 1n;
            
            for (const state of activeStates) {
              if (state.lastHistoricalBlock !== null && state.lastHistoricalBlock > firstProcessedBlock) {
                state.lastHistoricalBlock = firstProcessedBlock;
                state.hasMoreBackward = state.lastHistoricalBlock > state.startBlock;
              }
            }

            const firstBlock = blockRanges[0]?.from || maxBackwardBlock;
            const lastBlock = blockRanges.length > 0 
              ? blockRanges[blockRanges.length - 1].to 
              : maxBackwardBlock;
            console.log(`  ✅ Backward: ${firstBlock} → ${lastBlock} (${parallelBatches} batches, ${allLogs.length} eventos)`);
          }
        }
      }
    }

    // Guardar progreso periódicamente
    if (batchCounter % SAVE_PROGRESS_INTERVAL === 0 || batchEvents > 0) {
      for (const state of contractStates) {
        await updateLastSyncedBlockByContract(
          state.address,
          Number(state.lastSyncedBlock)
        );
        await updateLastHistoricalBlockByContract(
          state.address,
          Number(state.lastHistoricalBlock)
        );
      }
      if (batchEvents > 0) {
        console.log(`  💾 Progreso guardado`);
      }
    }

    // Alternar modo (solo si no estamos en modo fallback)
    if (!useFallback) {
      isForwardMode = !isForwardMode;
    }
    // En modo fallback, siempre forward
    batchCounter++;

    // Recalcular si hay más trabajo
    hasForwardWork = contractStates.some((s) => s.hasMoreForward);
    hasBackwardWork = contractStates.some((s) => s.hasMoreBackward);

    // Pausa entre batches para evitar rate limiting
    // En modo fallback, usar delay más largo (RPC público es más lento)
    if (hasForwardWork || hasBackwardWork) {
      const delay = useFallback ? 2000 : 1000; // 2 segundos en fallback, 1 segundo en normal
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // 4. Determinar si hay más trabajo pendiente
  const hasMore = contractStates.some(
    (s) => s.hasMoreForward || s.hasMoreBackward
  );

  const duration = Date.now() - startTime;

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Resumen de Sincronización');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  for (const state of contractStates) {
    const contract = CONTRACT_REGISTRY.find((c) => c.address === state.address)!;
    const status = state.hasMoreForward || state.hasMoreBackward ? '⏸️  Pendiente' : '✅ Sincronizado';
    console.log(
      `${contract.color} [${state.name}] ${state.eventsProcessed} eventos | Forward: ${state.lastSyncedBlock} | Backward: ${state.lastHistoricalBlock} | ${status}`
    );
  }
  
  console.log('');
  console.log(`🎉 Total: ${totalEventsProcessed} eventos procesados`);
  console.log(`⏱️  Duración: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
  console.log(`📍 Bloques procesados: ${batchCounter} batches`);

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

