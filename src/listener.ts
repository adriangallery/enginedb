/**
 * Listener principal para eventos del contrato FloorEngine
 * Usa viem para conectarse a Base mainnet y procesar eventos
 */

import {
  createPublicClient,
  http,
  decodeEventLog,
  type Log,
} from 'viem';
import { base } from 'viem/chains';
import {
  FLOOR_ENGINE_ADDRESS,
  FLOOR_ENGINE_ABI,
  EVENT_NAMES,
} from './contracts/floorEngine.js';
import {
  getLastSyncedBlock,
  updateLastSyncedBlock,
  insertEvent,
  upsertEvent,
} from './supabase/client.js';
import type {
  FloorEngineEvent,
  ListedEvent,
  CancelledEvent,
  BoughtEvent,
  FloorSweepEvent,
  PremiumUpdatedEvent,
  MaxBuyPriceUpdatedEvent,
  CallerRewardModeUpdatedEvent,
  CallerRewardBpsUpdatedEvent,
  CallerRewardFixedUpdatedEvent,
  OwnershipTransferredEvent,
} from './types/events.js';
import { bigintToString } from './types/events.js';

/**
 * Configuración del listener
 */
// Número de bloques a procesar por lote
// Alchemy Free: máximo 10 bloques
// Alchemy Growth/Pro: hasta 2000 bloques
const BLOCKS_PER_BATCH = process.env.BLOCKS_PER_BATCH
  ? BigInt(process.env.BLOCKS_PER_BATCH)
  : 10n; // Default: 10 para Alchemy Free tier

// Número de requests paralelos para mantenernos al día con Base
// Base genera ~30 bloques/minuto, con 3 requests paralelos de 10 bloques = 30 bloques/minuto
const PARALLEL_REQUESTS = process.env.PARALLEL_REQUESTS
  ? parseInt(process.env.PARALLEL_REQUESTS)
  : 3; // Default: 3 requests paralelos

const START_BLOCK = process.env.START_BLOCK
  ? BigInt(process.env.START_BLOCK)
  : 0n;

/**
 * Crear cliente de viem para Base mainnet
 * Soporta switch entre Alchemy y RPC público/fallback
 */
export function createViemClient() {
  // Switch para usar RPC fallback (gratuito pero más lento)
  const useFallback = process.env.USE_FALLBACK_RPC === 'true';
  
  let rpcUrl: string;
  
  if (useFallback) {
    // Usar RPC fallback público de Base (hardcoded, es público)
    rpcUrl = process.env.FALLBACK_RPC_URL || 'https://mainnet.base.org';
    console.log('🔄 Modo Fallback RPC activado (solo forward, más lento)');
    console.log(`📍 Usando RPC público: ${rpcUrl}`);
  } else {
    // Usar RPC principal (Alchemy)
    const rpcUrlBase = process.env.RPC_URL_BASE;
    if (!rpcUrlBase) {
      // Si no hay RPC_URL_BASE, usar fallback automáticamente
      rpcUrl = 'https://mainnet.base.org';
      console.log('⚠️  RPC_URL_BASE no configurado, usando RPC público por defecto');
      console.log(`📍 Usando RPC: ${rpcUrl}`);
    } else {
      rpcUrl = rpcUrlBase as string;
    }
  }

  return createPublicClient({
    chain: base,
    transport: http(rpcUrl, {
      // Timeout más largo para RPC público
      timeout: useFallback ? 60000 : 30000,
    }),
  });
}

/**
 * Procesar evento Listed
 */
async function processListedEvent(event: ListedEvent, blockTimestamp?: Date): Promise<void> {
  // 1. Insertar en listing_events
  await insertEvent('listing_events', {
    event_type: 'Listed',
    token_id: Number(event.tokenId),
    seller: event.seller.toLowerCase(),
    price_wei: bigintToString(event.price),
    is_contract_owned: event.isContractOwned,
    tx_hash: event.txHash,
    log_index: event.logIndex,
    block_number: Number(event.blockNumber),
    created_at: blockTimestamp?.toISOString() || new Date().toISOString(),
  });

  // 2. Upsert en punk_listings (actualizar estado actual)
  await upsertEvent(
    'punk_listings',
    {
      token_id: Number(event.tokenId),
      seller: event.seller.toLowerCase(),
      price_wei: bigintToString(event.price),
      is_contract_owned: event.isContractOwned,
      is_listed: true,
      last_event: 'Listed',
      last_tx_hash: event.txHash,
      last_block_number: Number(event.blockNumber),
    },
    'token_id'
  );
}

/**
 * Procesar evento Cancelled
 */
async function processCancelledEvent(event: CancelledEvent, blockTimestamp?: Date): Promise<void> {
  // 1. Insertar en listing_events
  await insertEvent('listing_events', {
    event_type: 'Cancelled',
    token_id: Number(event.tokenId),
    seller: event.seller.toLowerCase(),
    price_wei: null,
    is_contract_owned: null,
    tx_hash: event.txHash,
    log_index: event.logIndex,
    block_number: Number(event.blockNumber),
    created_at: blockTimestamp?.toISOString() || new Date().toISOString(),
  });

  // 2. Upsert en punk_listings (marcar como no listado)
  await upsertEvent(
    'punk_listings',
    {
      token_id: Number(event.tokenId),
      seller: event.seller.toLowerCase(),
      price_wei: '0',
      is_contract_owned: false,
      is_listed: false,
      last_event: 'Cancelled',
      last_tx_hash: event.txHash,
      last_block_number: Number(event.blockNumber),
    },
    'token_id'
  );
}

/**
 * Procesar evento Bought
 */
async function processBoughtEvent(event: BoughtEvent, blockTimestamp?: Date): Promise<void> {
  // 1. Insertar en trade_events
  await insertEvent('trade_events', {
    token_id: Number(event.tokenId),
    buyer: event.buyer.toLowerCase(),
    seller: event.seller.toLowerCase(),
    price_wei: bigintToString(event.price),
    is_contract_owned: event.isContractOwned,
    tx_hash: event.txHash,
    log_index: event.logIndex,
    block_number: Number(event.blockNumber),
    created_at: blockTimestamp?.toISOString() || new Date().toISOString(),
  });

  // 2. Upsert en punk_listings (marcar como no listado)
  await upsertEvent(
    'punk_listings',
    {
      token_id: Number(event.tokenId),
      seller: event.buyer.toLowerCase(), // El comprador es el nuevo "dueño"
      price_wei: '0',
      is_contract_owned: false,
      is_listed: false,
      last_event: 'Bought',
      last_tx_hash: event.txHash,
      last_block_number: Number(event.blockNumber),
    },
    'token_id'
  );
}

/**
 * Procesar evento FloorSweep
 */
async function processFloorSweepEvent(event: FloorSweepEvent, blockTimestamp?: Date): Promise<void> {
  // 1. Insertar en sweep_events
  await insertEvent('sweep_events', {
    token_id: Number(event.tokenId),
    buy_price_wei: bigintToString(event.buyPrice),
    relist_price_wei: bigintToString(event.relistPrice),
    caller: event.caller.toLowerCase(),
    caller_reward_wei: bigintToString(event.callerReward),
    tx_hash: event.txHash,
    log_index: event.logIndex,
    block_number: Number(event.blockNumber),
    created_at: blockTimestamp?.toISOString() || new Date().toISOString(),
  });

  // 2. Upsert en punk_listings (el token se relista automáticamente)
  await upsertEvent(
    'punk_listings',
    {
      token_id: Number(event.tokenId),
      seller: FLOOR_ENGINE_ADDRESS.toLowerCase(), // El contrato es el seller
      price_wei: bigintToString(event.relistPrice),
      is_contract_owned: true,
      is_listed: true,
      last_event: 'FloorSweep',
      last_tx_hash: event.txHash,
      last_block_number: Number(event.blockNumber),
    },
    'token_id'
  );
}

/**
 * Procesar eventos de configuración
 */
async function processConfigEvent(
  event:
    | PremiumUpdatedEvent
    | MaxBuyPriceUpdatedEvent
    | CallerRewardModeUpdatedEvent
    | CallerRewardBpsUpdatedEvent
    | CallerRewardFixedUpdatedEvent
    | OwnershipTransferredEvent,
  blockTimestamp?: Date
): Promise<void> {
  let oldValue: string | null = null;
  let newValue: string | null = null;

  switch (event.eventName) {
    case 'PremiumUpdated':
      oldValue = event.oldPremiumBps.toString();
      newValue = event.newPremiumBps.toString();
      break;
    case 'MaxBuyPriceUpdated':
      oldValue = bigintToString(event.oldMaxBuyPrice);
      newValue = bigintToString(event.newMaxBuyPrice);
      break;
    case 'CallerRewardModeUpdated':
      newValue = event.isPercentage.toString();
      break;
    case 'CallerRewardBpsUpdated':
      oldValue = event.oldBps.toString();
      newValue = event.newBps.toString();
      break;
    case 'CallerRewardFixedUpdated':
      oldValue = bigintToString(event.oldFixed);
      newValue = bigintToString(event.newFixed);
      break;
    case 'OwnershipTransferred':
      oldValue = event.previousOwner.toLowerCase();
      newValue = event.newOwner.toLowerCase();
      break;
  }

  await insertEvent('engine_config_events', {
    event_type: event.eventName,
    old_value: oldValue,
    created_at: blockTimestamp?.toISOString() || new Date().toISOString(),
    new_value: newValue,
    tx_hash: event.txHash,
    log_index: event.logIndex,
    block_number: Number(event.blockNumber),
  });
}

/**
 * Decodificar un log raw en un evento tipado
 */
export function decodeLog(log: Log): FloorEngineEvent | null {
  try {
    const decoded = decodeEventLog({
      abi: FLOOR_ENGINE_ABI,
      data: log.data,
      topics: log.topics,
    });

    const eventName = decoded.eventName as string;
    const metadata = {
      txHash: log.transactionHash!,
      logIndex: log.logIndex!,
      blockNumber: log.blockNumber!,
    };

    switch (eventName) {
      case EVENT_NAMES.LISTED: {
        const args = decoded.args as any;
        return {
          ...metadata,
          eventName: 'Listed',
          tokenId: args.tokenId,
          seller: args.seller,
          price: args.price,
          isContractOwned: args.isContractOwned,
        };
      }

      case EVENT_NAMES.CANCELLED: {
        const args = decoded.args as any;
        return {
          ...metadata,
          eventName: 'Cancelled',
          tokenId: args.tokenId,
          seller: args.seller,
        };
      }

      case EVENT_NAMES.BOUGHT: {
        const args = decoded.args as any;
        return {
          ...metadata,
          eventName: 'Bought',
          tokenId: args.tokenId,
          buyer: args.buyer,
          seller: args.seller,
          price: args.price,
          isContractOwned: args.isContractOwned,
        };
      }

      case EVENT_NAMES.FLOOR_SWEEP: {
        const args = decoded.args as any;
        return {
          ...metadata,
          eventName: 'FloorSweep',
          tokenId: args.tokenId,
          buyPrice: args.buyPrice,
          relistPrice: args.relistPrice,
          caller: args.caller,
          callerReward: args.callerReward,
        };
      }

      case EVENT_NAMES.PREMIUM_UPDATED: {
        const args = decoded.args as any;
        return {
          ...metadata,
          eventName: 'PremiumUpdated',
          oldPremiumBps: args.oldPremiumBps,
          newPremiumBps: args.newPremiumBps,
        };
      }

      case EVENT_NAMES.MAX_BUY_PRICE_UPDATED: {
        const args = decoded.args as any;
        return {
          ...metadata,
          eventName: 'MaxBuyPriceUpdated',
          oldMaxBuyPrice: args.oldMaxBuyPrice,
          newMaxBuyPrice: args.newMaxBuyPrice,
        };
      }

      case EVENT_NAMES.CALLER_REWARD_MODE_UPDATED: {
        const args = decoded.args as any;
        return {
          ...metadata,
          eventName: 'CallerRewardModeUpdated',
          isPercentage: args.isPercentage,
        };
      }

      case EVENT_NAMES.CALLER_REWARD_BPS_UPDATED: {
        const args = decoded.args as any;
        return {
          ...metadata,
          eventName: 'CallerRewardBpsUpdated',
          oldBps: args.oldBps,
          newBps: args.newBps,
        };
      }

      case EVENT_NAMES.CALLER_REWARD_FIXED_UPDATED: {
        const args = decoded.args as any;
        return {
          ...metadata,
          eventName: 'CallerRewardFixedUpdated',
          oldFixed: args.oldFixed,
          newFixed: args.newFixed,
        };
      }

      case EVENT_NAMES.OWNERSHIP_TRANSFERRED: {
        const args = decoded.args as any;
        return {
          ...metadata,
          eventName: 'OwnershipTransferred',
          previousOwner: args.previousOwner,
          newOwner: args.newOwner,
        };
      }

      default:
        console.warn(`Evento desconocido: ${eventName}`);
        return null;
    }
  } catch (error) {
    console.error('Error al decodificar log:', error);
    return null;
  }
}

/**
 * Procesar un evento según su tipo
 */
export async function processEvent(event: FloorEngineEvent, _contractAddress?: string, blockTimestamp?: Date): Promise<void> {
  switch (event.eventName) {
    case 'Listed':
      await processListedEvent(event, blockTimestamp);
      break;
    case 'Cancelled':
      await processCancelledEvent(event, blockTimestamp);
      break;
    case 'Bought':
      await processBoughtEvent(event, blockTimestamp);
      break;
    case 'FloorSweep':
      await processFloorSweepEvent(event, blockTimestamp);
      break;
    case 'PremiumUpdated':
    case 'MaxBuyPriceUpdated':
    case 'CallerRewardModeUpdated':
    case 'CallerRewardBpsUpdated':
    case 'CallerRewardFixedUpdated':
    case 'OwnershipTransferred':
      await processConfigEvent(event, blockTimestamp);
      break;
  }
}

/**
 * Retry con backoff exponencial para manejar rate limiting
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Si es error 429 (Too Many Requests), aplicar backoff
      const isRateLimit = error?.status === 429 || 
                         error?.message?.includes('429') ||
                         error?.message?.includes('Too Many Requests');
      
      if (isRateLimit && attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt); // Backoff exponencial
        console.warn(
          `⚠️  Rate limit detectado (intento ${attempt + 1}/${maxRetries}). Esperando ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      
      // Si no es rate limit o es el último intento, lanzar error
      throw error;
    }
  }
  
  throw lastError;
}

/**
 * Procesar un rango específico de bloques con retry
 */
async function processBlockRange(
  client: ReturnType<typeof createViemClient>,
  fromBlock: bigint,
  toBlock: bigint
): Promise<Log[]> {
  return retryWithBackoff(async () => {
    const logs = await client.getLogs({
      address: FLOOR_ENGINE_ADDRESS,
      fromBlock: fromBlock,
      toBlock: toBlock,
    });
    return logs;
  }).catch((error) => {
    console.error(
      `❌ Error al obtener logs para bloques ${fromBlock}-${toBlock} después de retries:`,
      error
    );
    return []; // Retornar array vacío en caso de error después de todos los retries
  });
}

/**
 * Sincronizar eventos desde el último bloque procesado
 * Usa requests paralelos para procesar múltiples rangos simultáneamente
 * @param maxBatches - Número máximo de batches a procesar (opcional, undefined = todos)
 */
export async function syncEvents(maxBatches?: number): Promise<{
  processed: number;
  fromBlock: bigint;
  toBlock: bigint;
  hasMore: boolean; // Indica si hay más batches pendientes
}> {
  console.log('🔄 Iniciando sincronización de eventos...');

  const client = createViemClient();

  // Obtener último bloque procesado
  const lastSyncedBlock = BigInt(await getLastSyncedBlock());
  const startBlock = lastSyncedBlock === 0n ? START_BLOCK : lastSyncedBlock + 1n;

  // Obtener bloque actual
  const latestBlock = await client.getBlockNumber();

  if (startBlock > latestBlock) {
    console.log('✅ Ya estamos sincronizados al último bloque');
    return { processed: 0, fromBlock: startBlock, toBlock: latestBlock, hasMore: false };
  }

  // Calcular cuántos bloques hay que procesar
  const blocksToProcess = latestBlock - startBlock + 1n;
  const totalBatches = Number(
    blocksToProcess / BLOCKS_PER_BATCH +
      (blocksToProcess % BLOCKS_PER_BATCH > 0n ? 1n : 0n)
  );

  console.log(
    `📊 Procesando ${blocksToProcess} bloques (${totalBatches} batches de ${BLOCKS_PER_BATCH}) desde ${startBlock} hasta ${latestBlock}`
  );
  console.log(
    `⚡ Usando ${PARALLEL_REQUESTS} requests paralelos para procesar ${PARALLEL_REQUESTS * Number(BLOCKS_PER_BATCH)} bloques por ciclo`
  );

  // Configuración: guardar progreso cada N batches
  const SAVE_PROGRESS_INTERVAL = 100; // Guardar progreso cada 100 batches

  // Limitar batches si se especifica maxBatches
  const batchesToProcess = maxBatches ? Math.min(totalBatches, maxBatches) : totalBatches;

  // Procesar en batches paralelos con guardado incremental
  let allLogs: Log[] = [];
  let processedBatches = 0;
  let lastProcessedBlock = startBlock - 1n;
  let processedEvents = 0;

  for (let i = 0; i < batchesToProcess; i += PARALLEL_REQUESTS) {
    // Crear batch de requests paralelos
    const batchPromises: Promise<Log[]>[] = [];

    for (let j = 0; j < PARALLEL_REQUESTS && i + j < batchesToProcess; j++) {
      const batchIndex = i + j;
      const fromBlock = startBlock + BigInt(batchIndex) * BLOCKS_PER_BATCH;
      const toBlock =
        fromBlock + BLOCKS_PER_BATCH - 1n > latestBlock
          ? latestBlock
          : fromBlock + BLOCKS_PER_BATCH - 1n;

      batchPromises.push(processBlockRange(client, fromBlock, toBlock));
    }

    // Ejecutar batch en paralelo
    const batchResults = await Promise.all(batchPromises);

    // Combinar todos los logs
    const batchLogs: Log[] = [];
    for (const logs of batchResults) {
      batchLogs.push(...logs);
      allLogs.push(...logs);
    }

    processedBatches += batchPromises.length;
    lastProcessedBlock =
      startBlock + BigInt(processedBatches) * BLOCKS_PER_BATCH - 1n;
    if (lastProcessedBlock > latestBlock) {
      lastProcessedBlock = latestBlock;
    }

    // Procesar eventos de este batch inmediatamente
    for (const log of batchLogs) {
      const event = decodeLog(log);
      if (event) {
        await processEvent(event);
        processedEvents++;
      }
    }

    console.log(
      `📦 Procesados ${processedBatches}/${totalBatches} batches (${allLogs.length} eventos encontrados, ${processedEvents} procesados)`
    );

    // Guardar progreso cada SAVE_PROGRESS_INTERVAL batches
    if (processedBatches % SAVE_PROGRESS_INTERVAL === 0 || i + PARALLEL_REQUESTS >= batchesToProcess) {
      await updateLastSyncedBlock(Number(lastProcessedBlock));
      console.log(
        `💾 Progreso guardado: bloque ${lastProcessedBlock} (${processedBatches}/${totalBatches} batches)`
      );
    }

    // Delay entre batches para evitar rate limiting (excepto en el último batch)
    if (i + PARALLEL_REQUESTS < batchesToProcess) {
      const delay = 500; // 500ms entre batches
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  console.log(`📝 Total de eventos encontrados: ${allLogs.length}, procesados: ${processedEvents}`);

  // Asegurar que el progreso final esté guardado
  await updateLastSyncedBlock(Number(lastProcessedBlock));

  // Recalcular hasMore al final comparando con el bloque actual (puede haber cambiado durante el procesamiento)
  const currentLatestBlock = await client.getBlockNumber();
  const hasMore = lastProcessedBlock < currentLatestBlock;

  console.log(
    `🎉 Sincronización completada: ${processedEvents} eventos procesados de ${allLogs.length} logs encontrados`
  );
  console.log(
    `📍 Bloques procesados: ${startBlock} → ${lastProcessedBlock} (${Number(lastProcessedBlock - startBlock + 1n)} bloques)`
  );

  return {
    processed: processedEvents,
    fromBlock: startBlock,
    toBlock: lastProcessedBlock,
    hasMore,
  };
}

