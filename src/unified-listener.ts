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
import { ADRIAN_NAME_REGISTRY_CONFIG } from './contracts/config/adrian-name-registry.js';
import { ADRIAN_SERUM_MODULE_CONFIG } from './contracts/config/adrian-serum-module.js';
import { PUNK_QUEST_CONFIG } from './contracts/config/punk-quest.js';
import { ADRIAN_PUNKS_CONFIG } from './contracts/config/adrian-punks.js';

// Decoders de eventos
import { decodeLog as decodeERC20Log } from './listeners/erc20/adrian-token-listener.js';
import { decodeLog as decodeERC721Log } from './listeners/erc721/adrian-lab-core-listener.js';
import { decodeLog as decodeERC1155Log } from './listeners/erc1155/adrian-traits-core-listener.js';
import { decodeLog as decodeTraitsExtensionsLog } from './listeners/custom/adrian-traits-extensions-listener.js';
import { decodeLog as decodeShopLog } from './listeners/custom/adrian-shop-listener.js';
import { decodeLog as decodeNameRegistryLog } from './listeners/custom/adrian-name-registry-listener.js';
import { decodeLog as decodeSerumModuleLog } from './listeners/custom/adrian-serum-module-listener.js';
import { decodeLog as decodePunkQuestLog } from './listeners/custom/punk-quest-listener.js';

// Procesadores
import { processERC1155Event } from './processors/erc1155-processor.js';
import { processTraitsExtensionsEvent } from './processors/traits-extensions-processor.js';
import { processShopEvent } from './processors/shop-processor.js';
import { processNameRegistryEvent } from './processors/name-registry-processor.js';
import { processSerumModuleEvent } from './processors/serum-module-processor.js';
import { processPunkQuestEvent } from './processors/punk-quest-processor.js';

// Configuración
const BLOCKS_PER_BATCH = process.env.BLOCKS_PER_BATCH
  ? BigInt(process.env.BLOCKS_PER_BATCH)
  : 10n; // Bloques por batch

// Número de requests paralelos - se define dentro de syncAllContracts basado en el modo
// Valores optimizados: 20 en normal, 10 en fallback (para procesar ~75k bloques/día)

const SAVE_PROGRESS_INTERVAL = 50; // Guardar progreso cada N batches

/**
 * Definición de un contrato que el sistema puede procesar
 */
interface ContractDefinition {
  name: string;
  address: string;
  startBlock: bigint;
  decoder: (log: Log) => any;
  processor: (event: any, address: string, blockTimestamp?: Date) => Promise<void>;
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
  {
    name: 'AdrianNameRegistry',
    address: ADRIAN_NAME_REGISTRY_CONFIG.address,
    startBlock: ADRIAN_NAME_REGISTRY_CONFIG.startBlock || 0n,
    decoder: decodeNameRegistryLog,
    processor: processNameRegistryEvent,
    color: '📝',
  },
  {
    name: 'AdrianSerumModule',
    address: ADRIAN_SERUM_MODULE_CONFIG.address,
    startBlock: ADRIAN_SERUM_MODULE_CONFIG.startBlock || 0n,
    decoder: decodeSerumModuleLog,
    processor: processSerumModuleEvent,
    color: '🧪',
  },
  {
    name: 'PunkQuest',
    address: PUNK_QUEST_CONFIG.address,
    startBlock: PUNK_QUEST_CONFIG.startBlock || 0n,
    decoder: decodePunkQuestLog,
    processor: processPunkQuestEvent,
    color: '⚔️',
  },
  {
    name: 'AdrianPunks',
    address: ADRIAN_PUNKS_CONFIG.address,
    startBlock: ADRIAN_PUNKS_CONFIG.startBlock || 0n,
    decoder: decodeERC721Log,
    processor: processERC721Event,
    color: '🟥',
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
// Variable global para detectar si Alchemy está agotado
let alchemyExhausted = false;

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
      // Detectar errores 429 (Too Many Requests) - Alchemy agotado
      const isRateLimit = error?.status === 429 || 
                         error?.message?.includes('429') ||
                         error?.details?.includes('Too Many Requests') ||
                         error?.details?.includes('Monthly capacity limit exceeded');
      
      // Si es error 429 de Alchemy, marcar como agotado
      if (isRateLimit && error?.url?.includes('alchemy.com')) {
        alchemyExhausted = true;
        console.error('🚨 Alchemy límite mensual agotado - Cambiando a modo fallback automáticamente');
        console.error('💡 Para activar manualmente: USE_FALLBACK_RPC=true');
      }
      
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
  
  // Si Alchemy está agotado, recrear cliente con fallback
  let client = createViemClient();
  
  // Intentar obtener bloque actual, si falla con 429, cambiar a fallback
  try {
    await client.getBlockNumber();
  } catch (error: any) {
    const isRateLimit = error?.status === 429 || 
                       error?.message?.includes('429') ||
                       error?.details?.includes('Monthly capacity limit exceeded');
    if (isRateLimit && error?.url?.includes('alchemy.com')) {
      alchemyExhausted = true;
      console.error('🚨 Alchemy agotado detectado al inicio - Cambiando a modo fallback');
      // Forzar modo fallback recreando cliente
      process.env.USE_FALLBACK_RPC = 'true';
      client = createViemClient();
    } else {
      throw error;
    }
  }

  // Detectar modo fallback (solo forward, más lento)
  // Si no hay RPC_URL_BASE configurado o Alchemy está agotado, usar fallback automáticamente
  const useFallback = process.env.USE_FALLBACK_RPC === 'true' || 
                      !process.env.RPC_URL_BASE || 
                      alchemyExhausted;
  
  // Mostrar información de la API key de Alchemy (parcialmente oculta por seguridad)
  if (process.env.RPC_URL_BASE) {
    const rpcUrl = process.env.RPC_URL_BASE;
    if (rpcUrl.includes('alchemy.com')) {
      // Extraer y mostrar parcialmente la API key
      const match = rpcUrl.match(/\/v2\/([^\/\?]+)/);
      if (match) {
        const apiKey = match[1];
        const maskedKey = apiKey.length > 8 
          ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`
          : '***';
        console.log(`🔑 Alchemy API Key configurada: ${maskedKey}`);
        console.log(`📍 URL completa: ${rpcUrl.replace(/\/v2\/[^\/\?]+/, '/v2/***')}`);
      }
    } else {
      console.log(`📍 RPC URL configurada: ${rpcUrl}`);
    }
  }
  // Bloque de inicio para fallback (hardcoded, valor público)
  const fallbackStartBlock = process.env.FALLBACK_START_BLOCK
    ? BigInt(process.env.FALLBACK_START_BLOCK)
    : 38293582n; // Bloque de inicio por defecto (público)

  // Paralelismo adaptativo según backlog
  // Calcular backlog promedio de todos los contratos
  let totalBacklog = 0n;
  let contractCount = 0;
  
  // Primero obtener el bloque actual para calcular backlog
  const currentBlock = await client.getBlockNumber();
  
  for (const contract of CONTRACT_REGISTRY) {
    const lastSynced = BigInt(await getLastSyncedBlockByContract(contract.address));
    if (lastSynced < currentBlock) {
      totalBacklog += currentBlock - lastSynced;
      contractCount++;
    }
  }
  
  const avgBacklog = contractCount > 0 ? totalBacklog / BigInt(contractCount) : 0n;
  
  // Velocidad adaptativa según backlog:
  // - >1000 bloques: Alta velocidad (20 paralelos) - Necesitamos ponernos al día rápido
  // - 100-1000 bloques: Velocidad media (10 paralelos) - Backlog moderado
  // - 10-100 bloques: Velocidad normal (3-5 paralelos) - Pequeño backlog, mantener ritmo
  // - <10 bloques: Velocidad baja (2 paralelos) - Casi al día, no sobrecargar
  let adaptiveParallelism: number;
  let adaptiveDelay: number;
  
  if (avgBacklog > 1000n) {
    adaptiveParallelism = useFallback ? 10 : 20; // Alta velocidad
    adaptiveDelay = useFallback ? 1000 : 500; // Delay corto
    console.log(`⚡ Modo: Alta velocidad (backlog: ~${avgBacklog} bloques)`);
  } else if (avgBacklog > 100n) {
    adaptiveParallelism = useFallback ? 5 : 10; // Velocidad media
    adaptiveDelay = useFallback ? 1500 : 1000; // Delay medio
    console.log(`⚡ Modo: Velocidad media (backlog: ~${avgBacklog} bloques)`);
  } else if (avgBacklog > 10n) {
    adaptiveParallelism = useFallback ? 3 : 5; // Velocidad normal - suficiente para mantenerse al día
    adaptiveDelay = useFallback ? 1000 : 500; // Delay corto para reducir backlog
    console.log(`⚡ Modo: Velocidad normal (backlog: ~${avgBacklog} bloques) - Manteniendo ritmo`);
  } else {
    adaptiveParallelism = useFallback ? 2 : 5; // Velocidad baja
    adaptiveDelay = useFallback ? 2000 : 2000; // Delay largo para no sobrecargar
    console.log(`⚡ Modo: Velocidad baja (backlog: ~${avgBacklog} bloques) - Casi al día`);
  }
  
  const PARALLEL_REQUESTS = process.env.PARALLEL_REQUESTS
    ? parseInt(process.env.PARALLEL_REQUESTS)
    : adaptiveParallelism;

  // Backward sync activado - Procesa histórico hacia atrás mientras mantiene forward
  const DISABLE_BACKWARD = false; // Backward sync habilitado
  
  // En modo fallback, limitar backward sync a 1 de cada 5 veces para no sobrecargar el RPC público
  // Esto permite procesar histórico gradualmente sin saturar el RPC público de Base
  const FALLBACK_BACKWARD_RATIO = 5; // Solo 1 de cada 5 batches será backward en fallback

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
  // currentBlock ya se obtuvo arriba para calcular backlog
  
  for (const contract of CONTRACT_REGISTRY) {
    let lastSyncedBlock = BigInt(
      await getLastSyncedBlockByContract(contract.address)
    );
    
    let lastHistoricalBlock = await getLastHistoricalBlockByContract(contract.address);
    
    // Bloque de inicio objetivo (38293582)
    const targetStartBlock = fallbackStartBlock || 38293582n;
    
    // En modo fallback, permitir backward limitado (1 de cada 5 veces)
    if (useFallback) {
      // Inicializar lastHistoricalBlock si es null para permitir backward limitado
      if (lastHistoricalBlock === null) {
        lastHistoricalBlock = Number(currentBlock);
        await updateLastHistoricalBlockByContract(
          contract.address,
          lastHistoricalBlock
        );
      }
      
      // Si no tiene registro forward O si está muy atrás del bloque objetivo, resetear
      if (lastSyncedBlock === 0n || lastSyncedBlock < targetStartBlock) {
        const initialBlock = targetStartBlock - 1n; // Un bloque antes para que el siguiente sea targetStartBlock
        console.log(`${contract.color} [${contract.name}] Resetear forward: ${lastSyncedBlock} → ${initialBlock} (objetivo: ${targetStartBlock})`);
        await updateLastSyncedBlockByContract(
          contract.address,
          Number(initialBlock)
        );
        lastSyncedBlock = initialBlock;
      }
      
      // Si lastHistoricalBlock está muy adelante del bloque objetivo, resetear también
      if (lastHistoricalBlock !== null && BigInt(lastHistoricalBlock) > targetStartBlock) {
        console.log(`${contract.color} [${contract.name}] Resetear backward: ${lastHistoricalBlock} → ${targetStartBlock}`);
        lastHistoricalBlock = Number(targetStartBlock);
        await updateLastHistoricalBlockByContract(
          contract.address,
          lastHistoricalBlock
        );
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
      
      // Si no tiene registro forward O si está muy atrás del bloque objetivo, resetear
      if (lastSyncedBlock === 0n || lastSyncedBlock < targetStartBlock) {
        const initialBlock = targetStartBlock - 1n; // Un bloque antes para que el siguiente sea targetStartBlock
        console.log(`${contract.color} [${contract.name}] Resetear forward: ${lastSyncedBlock} → ${initialBlock} (objetivo: ${targetStartBlock})`);
      await updateLastSyncedBlockByContract(
        contract.address,
        Number(initialBlock)
      );
      lastSyncedBlock = initialBlock;
    }
    
      // Si lastHistoricalBlock está muy adelante del bloque objetivo, resetear también
      if (lastHistoricalBlock !== null && BigInt(lastHistoricalBlock) > targetStartBlock) {
        console.log(`${contract.color} [${contract.name}] Resetear backward: ${lastHistoricalBlock} → ${targetStartBlock}`);
        lastHistoricalBlock = Number(targetStartBlock);
        await updateLastHistoricalBlockByContract(
          contract.address,
          lastHistoricalBlock
        );
      }
    }
    
    const forwardStartBlock = lastSyncedBlock + 1n;
    
    // En modo fallback, permitir backward pero limitado (1 de cada 5 veces)
    // Si backward está deshabilitado completamente, no hay backward sync
    let backwardStartBlock: bigint | null = null;
    if (!DISABLE_BACKWARD) {
      if (useFallback) {
        // En fallback, permitir backward pero será limitado por el contador más abajo
        backwardStartBlock = lastHistoricalBlock ? BigInt(lastHistoricalBlock) - 1n : null;
      } else {
        // Modo normal con Alchemy, backward sin restricciones
        backwardStartBlock = lastHistoricalBlock ? BigInt(lastHistoricalBlock) - 1n : null;
      }
    }

    contractStates.push({
      name: contract.name,
      address: contract.address,
      lastSyncedBlock,
      lastHistoricalBlock: lastHistoricalBlock ? BigInt(lastHistoricalBlock) : null,
      startBlock: contract.startBlock,
      eventsProcessed: 0,
      hasMoreForward: forwardStartBlock <= currentBlock,
      hasMoreBackward: DISABLE_BACKWARD ? false : (backwardStartBlock !== null && backwardStartBlock >= contract.startBlock),
    });

    console.log(
      `${contract.color} [${contract.name}] Forward: ${lastSyncedBlock} → ${currentBlock} | Backward: ${backwardStartBlock} → ${contract.startBlock}`
    );
  }

  // 1.5. Lógica de Catch-Up: Detectar contratos nuevos y calcular target historical block
  // Calcular el last_historical_block más avanzado de todos los contratos (target para catch-up)
  let targetHistoricalBlock: bigint | null = null;
  for (const state of contractStates) {
    if (state.lastHistoricalBlock !== null) {
      if (targetHistoricalBlock === null || state.lastHistoricalBlock < targetHistoricalBlock) {
        targetHistoricalBlock = state.lastHistoricalBlock;
      }
    }
  }

  // Detectar contratos que necesitan catch-up (lastHistoricalBlock es null o está muy atrás del target)
  const contractsNeedingCatchUp: string[] = [];
  if (targetHistoricalBlock !== null && !DISABLE_BACKWARD) {
    for (const state of contractStates) {
      const needsCatchUp = state.lastHistoricalBlock === null || 
                           (state.lastHistoricalBlock !== null && state.lastHistoricalBlock > targetHistoricalBlock!);
      if (needsCatchUp) {
        contractsNeedingCatchUp.push(state.address);
        // Inicializar lastHistoricalBlock al target si es null para comenzar catch-up
        if (state.lastHistoricalBlock === null) {
          const contract = CONTRACT_REGISTRY.find(c => c.address === state.address);
          if (contract) {
            console.log(`${contract.color} [${contract.name}] 🆕 Contrato nuevo detectado - Iniciando catch-up hasta bloque ${targetHistoricalBlock}`);
            await updateLastHistoricalBlockByContract(state.address, Number(targetHistoricalBlock));
            // Actualizar el estado
            state.lastHistoricalBlock = targetHistoricalBlock;
            // Recalcular backwardStartBlock
            const backwardStart = targetHistoricalBlock - 1n;
            state.hasMoreBackward = backwardStart >= state.startBlock;
          }
        } else {
          const contract = CONTRACT_REGISTRY.find(c => c.address === state.address);
          const gap = state.lastHistoricalBlock! - targetHistoricalBlock!;
          if (contract && gap > 0n) {
            console.log(`${contract.color} [${contract.name}] 📊 Gap detectado: ${gap} bloques - Priorizando catch-up hasta bloque ${targetHistoricalBlock}`);
            // Actualizar lastHistoricalBlock al target para comenzar catch-up desde ahí
            await updateLastHistoricalBlockByContract(state.address, Number(targetHistoricalBlock));
            state.lastHistoricalBlock = targetHistoricalBlock;
            const backwardStart = targetHistoricalBlock - 1n;
            state.hasMoreBackward = backwardStart >= state.startBlock;
          }
        }
      }
    }
  }

  if (contractsNeedingCatchUp.length > 0) {
    const catchUpNames = contractsNeedingCatchUp
      .map(addr => CONTRACT_REGISTRY.find(c => c.address === addr)?.name)
      .filter(Boolean)
      .join(', ');
    console.log(`🚀 Modo Catch-Up activado para: ${catchUpNames}`);
    console.log(`📍 Target historical block: ${targetHistoricalBlock}`);
  }

  console.log('');
  console.log(`📍 Bloque actual: ${currentBlock}`);
  console.log(
    `🔄 Contratos activos: ${CONTRACT_REGISTRY.map((c) => c.name).join(', ')}`
  );

  // 2. Verificar si hay trabajo pendiente
  let hasForwardWork = contractStates.some((s) => s.hasMoreForward);
  let hasBackwardWork = DISABLE_BACKWARD ? false : contractStates.some((s) => s.hasMoreBackward);

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
  
  if (DISABLE_BACKWARD) {
    console.log(`📦 Modo: Solo Forward (Backward deshabilitado)`);
    console.log(`⚡ Batch size: ${BLOCKS_PER_BATCH} bloques`);
    console.log(`🚀 Paralelismo: ${PARALLEL_REQUESTS} requests simultáneos (${PARALLEL_REQUESTS * Number(BLOCKS_PER_BATCH)} bloques por ciclo)`);
  } else if (useFallback) {
    console.log(`📦 Modo: Intercalado Limitado (Forward ↔ Backward 1:${FALLBACK_BACKWARD_RATIO})`);
    console.log(`⚡ Batch size: ${BLOCKS_PER_BATCH} bloques`);
    console.log(`🚀 Paralelismo: ${PARALLEL_REQUESTS} requests simultáneos (${PARALLEL_REQUESTS * Number(BLOCKS_PER_BATCH)} bloques por ciclo)`);
    console.log(`⚠️  Nota: Backward limitado a 1 de cada ${FALLBACK_BACKWARD_RATIO} batches en modo fallback`);
  } else {
    console.log(`📦 Modo: Intercalado (Forward ↔ Backward)`);
    console.log(`⚡ Batch size: ${BLOCKS_PER_BATCH} bloques`);
    console.log(`🚀 Paralelismo: ${PARALLEL_REQUESTS} requests simultáneos (${PARALLEL_REQUESTS * Number(BLOCKS_PER_BATCH)} bloques por ciclo)`);
  }
  console.log('');

  // 3. Procesar con alternancia forward/backward (limitado en fallback)
  let totalEventsProcessed = 0;
  let batchCounter = 0;
  let isForwardMode = true;
  let backwardCounter = 0; // Contador para limitar backward en fallback

  // Procesar con alternancia forward/backward
  while ((hasForwardWork || hasBackwardWork) && (!maxBatches || batchCounter < maxBatches)) {
    // Verificar si hay contratos en catch-up que necesitan backward sync prioritario
    const catchUpStates = contractStates.filter(
      (s) => contractsNeedingCatchUp.includes(s.address) && s.hasMoreBackward
    );
    const hasCatchUpBackwardWork = catchUpStates.length > 0;

    // Lógica de alternancia: priorizar catch-up, luego normal
    if (DISABLE_BACKWARD) {
      // Backward completamente deshabilitado
      isForwardMode = true;
    } else if (hasCatchUpBackwardWork) {
      // Priorizar backward sync para contratos en catch-up
      isForwardMode = false;
      const catchUpNames = catchUpStates.map(s => {
        const contract = CONTRACT_REGISTRY.find(c => c.address === s.address);
        return contract?.name || s.address;
      }).join(', ');
      console.log(`  🚀 Priorizando catch-up backward para: ${catchUpNames}`);
    } else if (!hasForwardWork && hasBackwardWork) {
      // Solo hay trabajo backward (sin catch-up)
      if (useFallback) {
        // En fallback, limitar frecuencia de backward
        backwardCounter++;
        if (backwardCounter % FALLBACK_BACKWARD_RATIO !== 0) {
          // Saltar este batch backward
          isForwardMode = true;
          console.log(`  ⏭️  Backward limitado en fallback (${backwardCounter}/${FALLBACK_BACKWARD_RATIO}), saltando este batch`);
        } else {
          isForwardMode = false;
        }
      } else {
        // Modo normal, procesar backward
        isForwardMode = false;
      }
    } else if (hasForwardWork && !hasBackwardWork) {
      // Solo hay trabajo forward, procesarlo
      isForwardMode = true;
    } else if (hasForwardWork && hasBackwardWork) {
      // Hay ambos trabajos, decidir según modo
      if (useFallback) {
        // En fallback, priorizar forward (4 de cada 5 veces)
        backwardCounter++;
        isForwardMode = backwardCounter % FALLBACK_BACKWARD_RATIO !== 0;
        if (!isForwardMode) {
          console.log(`  ✅ Backward permitido en fallback (${backwardCounter}/${FALLBACK_BACKWARD_RATIO})`);
        }
      } else {
        // Modo normal, alternar normalmente
        isForwardMode = !isForwardMode;
      }
    }
    
    const mode = isForwardMode ? 'FORWARD' : 'BACKWARD';
    let modeNote = '';
    if (DISABLE_BACKWARD) {
      modeNote = ' (Backward deshabilitado)';
    } else if (useFallback && !isForwardMode) {
      modeNote = ` (Backward limitado en fallback: ${backwardCounter}/${FALLBACK_BACKWARD_RATIO})`;
    }
    console.log(`\n🔄 Batch ${batchCounter + 1} - Modo: ${mode}${modeNote}`);

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

        const effectiveEndBlock: bigint = maxBlockToProcess > currentBlock ? currentBlock : maxBlockToProcess;
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
              // Reducir delay a 50ms para mayor velocidad (antes 100ms)
              const delay = i * 50;
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

          // Obtener timestamps de bloques únicos para usar en created_at
          // Filtrar logs sin blockNumber (no debería pasar, pero por seguridad)
          const validLogs = allLogs.filter(log => log.blockNumber !== null);
          const uniqueBlockNumbers = [...new Set(validLogs.map(log => log.blockNumber!))];
          const blockTimestamps = new Map<bigint, Date>();
          
          // Obtener timestamps de bloques en paralelo (con límite para no sobrecargar)
          const blockPromises = uniqueBlockNumbers.map(async (blockNumber) => {
            try {
              const block = await client.getBlock({ blockNumber });
              const timestamp = new Date(Number(block.timestamp) * 1000);
              blockTimestamps.set(blockNumber, timestamp);
            } catch (error) {
              console.error(`⚠️  Error obteniendo timestamp del bloque ${blockNumber}:`, error);
              // Usar fecha actual como fallback (esto indica un problema)
              const fallbackDate = new Date();
              blockTimestamps.set(blockNumber, fallbackDate);
              console.warn(`⚠️  Usando fecha fallback (NOW) para bloque ${blockNumber}: ${fallbackDate.toISOString()}`);
            }
          });
          
          await Promise.all(blockPromises);
          
          // Log resumen de timestamps obtenidos (solo si hay eventos)
          if (uniqueBlockNumbers.length > 0 && validLogs.length > 0) {
            const timestamps = Array.from(blockTimestamps.values());
            const minTimestamp = new Date(Math.min(...timestamps.map(d => d.getTime())));
            const maxTimestamp = new Date(Math.max(...timestamps.map(d => d.getTime())));
            console.log(`📅 Timestamps obtenidos: ${blockTimestamps.size}/${uniqueBlockNumbers.length} bloques | Rango: ${minTimestamp.toISOString()} - ${maxTimestamp.toISOString()}`);
          }

          // Procesar logs (solo los que tienen blockNumber)
    for (const log of validLogs) {
      const contract = CONTRACT_REGISTRY.find(
        (c) => c.address.toLowerCase() === log.address.toLowerCase()
      );

      if (contract) {
        try {
          const event = contract.decoder(log);
          if (event) {
            // Obtener timestamp del bloque para este evento
            const blockTimestamp = blockTimestamps.get(log.blockNumber!);
            if (!blockTimestamp) {
              console.error(`❌ ERROR: No se encontró timestamp para bloque ${log.blockNumber}, usando fecha actual como fallback`);
            }
            const finalTimestamp = blockTimestamp || new Date();
            await contract.processor(event, contract.address, finalTimestamp);
                  const state = contractStates.find((s) => s.address === contract.address)!;
            state.eventsProcessed++;
                  batchEvents++;
            totalEventsProcessed++;
          }
              } catch (error: any) {
                // Log detallado del error para debugging
          console.error(
            `${contract.color} [${contract.name}] Error procesando evento:`,
                  error?.message || error
                );
                // No lanzar error, continuar con otros eventos
              }
            }
          }
          
          // Log si hay logs pero no se procesaron eventos
          if (allLogs.length > 0 && batchEvents === 0) {
            console.warn(`  ⚠️  Se encontraron ${allLogs.length} logs pero no se procesaron eventos`);
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
                // Reducir delay a 50ms para mayor velocidad (antes 100ms)
                const delay = i * 50;
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

          // Obtener timestamps de bloques únicos para usar en created_at
          // Filtrar logs sin blockNumber (no debería pasar, pero por seguridad)
          const validLogs = allLogs.filter(log => log.blockNumber !== null);
          const uniqueBlockNumbers = [...new Set(validLogs.map(log => log.blockNumber!))];
          const blockTimestamps = new Map<bigint, Date>();
          
          // Obtener timestamps de bloques en paralelo (con límite para no sobrecargar)
          const blockPromises = uniqueBlockNumbers.map(async (blockNumber) => {
            try {
              const block = await client.getBlock({ blockNumber });
              const timestamp = new Date(Number(block.timestamp) * 1000);
              blockTimestamps.set(blockNumber, timestamp);
            } catch (error) {
              console.error(`⚠️  Error obteniendo timestamp del bloque ${blockNumber}:`, error);
              // Usar fecha actual como fallback (esto indica un problema)
              const fallbackDate = new Date();
              blockTimestamps.set(blockNumber, fallbackDate);
              console.warn(`⚠️  Usando fecha fallback (NOW) para bloque ${blockNumber}: ${fallbackDate.toISOString()}`);
            }
          });
          
          await Promise.all(blockPromises);
          
          // Log resumen de timestamps obtenidos (solo si hay eventos)
          if (uniqueBlockNumbers.length > 0 && validLogs.length > 0) {
            const timestamps = Array.from(blockTimestamps.values());
            const minTimestamp = new Date(Math.min(...timestamps.map(d => d.getTime())));
            const maxTimestamp = new Date(Math.max(...timestamps.map(d => d.getTime())));
            console.log(`📅 Timestamps obtenidos: ${blockTimestamps.size}/${uniqueBlockNumbers.length} bloques | Rango: ${minTimestamp.toISOString()} - ${maxTimestamp.toISOString()}`);
          }

          // Procesar logs (solo los que tienen blockNumber)
          for (const log of validLogs) {
            const contract = CONTRACT_REGISTRY.find(
              (c) => c.address.toLowerCase() === log.address.toLowerCase()
            );

            if (contract) {
              try {
                const event = contract.decoder(log);
                if (event) {
                  // Obtener timestamp del bloque para este evento
                  const blockTimestamp = blockTimestamps.get(log.blockNumber!);
                  if (!blockTimestamp) {
                    console.error(`❌ ERROR: No se encontró timestamp para bloque ${log.blockNumber}, usando fecha actual como fallback`);
                  }
                  const finalTimestamp = blockTimestamp || new Date();
                  await contract.processor(event, contract.address, finalTimestamp);
                  const state = contractStates.find((s) => s.address === contract.address)!;
                  state.eventsProcessed++;
                  batchEvents++;
                  totalEventsProcessed++;
                }
              } catch (error: any) {
                // Log detallado del error para debugging
                console.error(
                  `${contract.color} [${contract.name}] Error procesando evento:`,
                  error?.message || error
                );
                // No lanzar error, continuar con otros eventos
              }
            }
          }
          
          // Log si hay logs pero no se procesaron eventos
          if (allLogs.length > 0 && batchEvents === 0) {
            console.warn(`  ⚠️  Se encontraron ${allLogs.length} logs pero no se procesaron eventos`);
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

    // Guardar progreso periódicamente (cada batch o cada SAVE_PROGRESS_INTERVAL)
    // Guardar siempre al final de cada batch para no perder progreso
    const shouldSave = batchCounter % SAVE_PROGRESS_INTERVAL === 0 || batchEvents > 0 || batchCounter > 0;
    
    if (shouldSave) {
      try {
      for (const state of contractStates) {
          await updateLastSyncedBlockByContract(
            state.address,
            Number(state.lastSyncedBlock)
          );
          if (state.lastHistoricalBlock !== null) {
            await updateLastHistoricalBlockByContract(
              state.address,
              Number(state.lastHistoricalBlock)
            );
          }
        }
        console.log(`  💾 Progreso guardado (Batch ${batchCounter})`);
      } catch (error) {
        console.error('  ❌ Error al guardar progreso:', error);
        // No lanzar error, continuar procesando
      }
    }

    // No alternar automáticamente, la lógica de priorización lo maneja arriba
    batchCounter++;

    // Recalcular si hay más trabajo
    hasForwardWork = contractStates.some((s) => s.hasMoreForward);
    hasBackwardWork = contractStates.some((s) => s.hasMoreBackward);

    // Pausa entre batches adaptativa según backlog
    // Usar delay adaptativo calculado arriba
    if (hasForwardWork || hasBackwardWork) {
      await new Promise((resolve) => setTimeout(resolve, adaptiveDelay));
    }
    
    // Recalcular backlog periódicamente para ajustar velocidad
    if (batchCounter % 10 === 0) {
      let newTotalBacklog = 0n;
      let newContractCount = 0;
      const newCurrentBlock = await client.getBlockNumber();
      
      for (const state of contractStates) {
        if (state.lastSyncedBlock < newCurrentBlock) {
          newTotalBacklog += newCurrentBlock - state.lastSyncedBlock;
          newContractCount++;
        }
      }
      
      const newAvgBacklog = newContractCount > 0 ? newTotalBacklog / BigInt(newContractCount) : 0n;
      
      // Ajustar velocidad si el backlog cambió significativamente
      if (newAvgBacklog > avgBacklog + 500n || newAvgBacklog < avgBacklog - 500n) {
        console.log(`📊 Backlog actualizado: ~${newAvgBacklog} bloques (antes: ~${avgBacklog})`);
        // Nota: El paralelismo se ajustará en la próxima ejecución de syncAllContracts
      }
    }
  }

  // 4. Guardar progreso final antes de terminar
  try {
    for (const state of contractStates) {
      await updateLastSyncedBlockByContract(
        state.address,
        Number(state.lastSyncedBlock)
      );
      if (state.lastHistoricalBlock !== null) {
        await updateLastHistoricalBlockByContract(
          state.address,
          Number(state.lastHistoricalBlock)
        );
      }
    }
    console.log('  💾 Progreso final guardado');
  } catch (error) {
    console.error('  ❌ Error al guardar progreso final:', error);
  }

  // 5. Determinar si hay más trabajo pendiente
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

