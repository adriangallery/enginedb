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
const BLOCKS_PER_BATCH = 10n; // Bloques por batch
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

  console.log('🌐 Sincronización Unificada Multi-Contrato (Intercalada)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // 1. Obtener estado de sincronización de cada contrato
  const contractStates: ContractSyncState[] = [];
  const currentBlock = await client.getBlockNumber();
  
  for (const contract of CONTRACT_REGISTRY) {
    let lastSyncedBlock = BigInt(
      await getLastSyncedBlockByContract(contract.address)
    );
    
    let lastHistoricalBlock = await getLastHistoricalBlockByContract(contract.address);
    
    // Inicializar lastHistoricalBlock con el bloque actual si es null
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
    
    const forwardStartBlock = lastSyncedBlock + 1n;
    
    const backwardStartBlock = BigInt(lastHistoricalBlock) - 1n;

    contractStates.push({
      name: contract.name,
      address: contract.address,
      lastSyncedBlock,
      lastHistoricalBlock: BigInt(lastHistoricalBlock),
      startBlock: contract.startBlock,
      eventsProcessed: 0,
      hasMoreForward: forwardStartBlock <= currentBlock,
      hasMoreBackward: backwardStartBlock >= contract.startBlock,
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
  let hasBackwardWork = contractStates.some((s) => s.hasMoreBackward);

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
  console.log(`📦 Modo: Intercalado (Forward ↔ Backward)`);
  console.log(`⚡ Batch size: ${BLOCKS_PER_BATCH} bloques`);
  console.log('');

  // 3. Procesar en modo intercalado
  let totalEventsProcessed = 0;
  let batchCounter = 0;
  let isForwardMode = true; // Empezar con forward (tiempo real tiene prioridad)

  // Procesar batches intercalados
  while ((hasForwardWork || hasBackwardWork) && (!maxBatches || batchCounter < maxBatches)) {
    const mode = isForwardMode ? 'FORWARD' : 'BACKWARD';
    console.log(`\n🔄 Batch ${batchCounter + 1} - Modo: ${mode}`);

    let batchEvents = 0;

    if (isForwardMode && hasForwardWork) {
      // Modo FORWARD: sincronizar hacia adelante
      const activeStates = contractStates.filter((s) => s.hasMoreForward);
      
      if (activeStates.length > 0) {
        // Determinar rango a procesar
        const minForwardBlock = activeStates.reduce(
          (min, s) => {
            const forwardStart = s.lastSyncedBlock + 1n;
            return forwardStart < min ? forwardStart : min;
          },
          currentBlock + 1n
        );

        const fromBlock = minForwardBlock;
        const toBlock = fromBlock + BLOCKS_PER_BATCH - 1n > currentBlock
          ? currentBlock
          : fromBlock + BLOCKS_PER_BATCH - 1n;

        if (fromBlock <= currentBlock) {
          const activeAddresses = activeStates.map((s) => s.address);
          const logs = await processBlockRange(client, activeAddresses, fromBlock, toBlock);

          // Procesar logs
          for (const log of logs) {
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
          for (const state of activeStates) {
            if (state.lastSyncedBlock < toBlock) {
              state.lastSyncedBlock = toBlock;
              state.hasMoreForward = state.lastSyncedBlock < currentBlock;
            }
          }

          console.log(`  ✅ Forward: ${fromBlock} → ${toBlock} (${logs.length} eventos)`);
        }
      }
    } else if (!isForwardMode && hasBackwardWork) {
      // Modo BACKWARD: sincronizar hacia atrás
      const activeStates = contractStates.filter((s) => s.hasMoreBackward);
      
      if (activeStates.length > 0) {
        // Determinar rango a procesar (hacia atrás)
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

        const toBlock = maxBackwardBlock;
        const fromBlock = toBlock - BLOCKS_PER_BATCH + 1n < minStartBlock
          ? minStartBlock
          : toBlock - BLOCKS_PER_BATCH + 1n;

        if (fromBlock <= toBlock && toBlock >= minStartBlock) {
          const activeAddresses = activeStates.map((s) => s.address);
          const logs = await processBlockRange(client, activeAddresses, fromBlock, toBlock);

          // Procesar logs
          for (const log of logs) {
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

          // Actualizar estados backward
          for (const state of activeStates) {
            if (state.lastHistoricalBlock !== null && state.lastHistoricalBlock > fromBlock) {
              state.lastHistoricalBlock = fromBlock;
              state.hasMoreBackward = state.lastHistoricalBlock > state.startBlock;
            }
          }

          console.log(`  ✅ Backward: ${fromBlock} → ${toBlock} (${logs.length} eventos)`);
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

    // Alternar modo
    isForwardMode = !isForwardMode;
    batchCounter++;

    // Recalcular si hay más trabajo
    hasForwardWork = contractStates.some((s) => s.hasMoreForward);
    hasBackwardWork = contractStates.some((s) => s.hasMoreBackward);

    // Pequeña pausa entre batches
    if (hasForwardWork || hasBackwardWork) {
      await new Promise((resolve) => setTimeout(resolve, 500));
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

