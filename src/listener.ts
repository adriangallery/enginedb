/**
 * Listener principal para eventos del contrato FloorEngine
 * Usa viem para conectarse a Base mainnet y procesar eventos
 */

import {
  createPublicClient,
  http,
  parseAbiItem,
  decodeEventLog,
  type PublicClient,
  type Log,
} from 'viem';
import { base } from 'viem/chains';
import {
  FLOOR_ENGINE_ADDRESS,
  FLOOR_ENGINE_ABI,
  EVENT_NAMES,
} from './contracts/floorEngine.js';
import {
  getSupabaseClient,
  getLastSyncedBlock,
  updateLastSyncedBlock,
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
const BLOCKS_PER_BATCH = 2000n; // Número de bloques a procesar por lote
const START_BLOCK = process.env.START_BLOCK
  ? BigInt(process.env.START_BLOCK)
  : 0n;

/**
 * Crear cliente de viem para Base mainnet
 */
export function createViemClient(): PublicClient {
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
 * Procesar evento Listed
 */
async function processListedEvent(event: ListedEvent): Promise<void> {
  const supabase = getSupabaseClient();

  // 1. Insertar en listing_events
  const { error: listingError } = await supabase.from('listing_events').insert({
    event_type: 'Listed',
    token_id: Number(event.tokenId),
    seller: event.seller.toLowerCase(),
    price_wei: bigintToString(event.price),
    is_contract_owned: event.isContractOwned,
    tx_hash: event.txHash,
    log_index: event.logIndex,
    block_number: Number(event.blockNumber),
  });

  if (listingError && !listingError.message.includes('duplicate key')) {
    console.error('Error al insertar Listed event:', listingError);
    throw listingError;
  }

  // 2. Upsert en punk_listings (actualizar estado actual)
  const { error: upsertError } = await supabase
    .from('punk_listings')
    .upsert(
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
      { onConflict: 'token_id' }
    );

  if (upsertError) {
    console.error('Error al hacer upsert en punk_listings:', upsertError);
    throw upsertError;
  }
}

/**
 * Procesar evento Cancelled
 */
async function processCancelledEvent(event: CancelledEvent): Promise<void> {
  const supabase = getSupabaseClient();

  // 1. Insertar en listing_events
  const { error: listingError } = await supabase.from('listing_events').insert({
    event_type: 'Cancelled',
    token_id: Number(event.tokenId),
    seller: event.seller.toLowerCase(),
    price_wei: null,
    is_contract_owned: null,
    tx_hash: event.txHash,
    log_index: event.logIndex,
    block_number: Number(event.blockNumber),
  });

  if (listingError && !listingError.message.includes('duplicate key')) {
    console.error('Error al insertar Cancelled event:', listingError);
    throw listingError;
  }

  // 2. Upsert en punk_listings (marcar como no listado)
  const { error: upsertError } = await supabase
    .from('punk_listings')
    .upsert(
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
      { onConflict: 'token_id' }
    );

  if (upsertError) {
    console.error('Error al hacer upsert en punk_listings:', upsertError);
    throw upsertError;
  }
}

/**
 * Procesar evento Bought
 */
async function processBoughtEvent(event: BoughtEvent): Promise<void> {
  const supabase = getSupabaseClient();

  // 1. Insertar en trade_events
  const { error: tradeError } = await supabase.from('trade_events').insert({
    token_id: Number(event.tokenId),
    buyer: event.buyer.toLowerCase(),
    seller: event.seller.toLowerCase(),
    price_wei: bigintToString(event.price),
    is_contract_owned: event.isContractOwned,
    tx_hash: event.txHash,
    log_index: event.logIndex,
    block_number: Number(event.blockNumber),
  });

  if (tradeError && !tradeError.message.includes('duplicate key')) {
    console.error('Error al insertar Bought event:', tradeError);
    throw tradeError;
  }

  // 2. Upsert en punk_listings (marcar como no listado)
  const { error: upsertError } = await supabase
    .from('punk_listings')
    .upsert(
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
      { onConflict: 'token_id' }
    );

  if (upsertError) {
    console.error('Error al hacer upsert en punk_listings:', upsertError);
    throw upsertError;
  }
}

/**
 * Procesar evento FloorSweep
 */
async function processFloorSweepEvent(event: FloorSweepEvent): Promise<void> {
  const supabase = getSupabaseClient();

  // 1. Insertar en sweep_events
  const { error: sweepError } = await supabase.from('sweep_events').insert({
    token_id: Number(event.tokenId),
    buy_price_wei: bigintToString(event.buyPrice),
    relist_price_wei: bigintToString(event.relistPrice),
    caller: event.caller.toLowerCase(),
    caller_reward_wei: bigintToString(event.callerReward),
    tx_hash: event.txHash,
    log_index: event.logIndex,
    block_number: Number(event.blockNumber),
  });

  if (sweepError && !sweepError.message.includes('duplicate key')) {
    console.error('Error al insertar FloorSweep event:', sweepError);
    throw sweepError;
  }

  // 2. Upsert en punk_listings (el token se relista automáticamente)
  const { error: upsertError } = await supabase
    .from('punk_listings')
    .upsert(
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
      { onConflict: 'token_id' }
    );

  if (upsertError) {
    console.error('Error al hacer upsert en punk_listings:', upsertError);
    throw upsertError;
  }
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
    | OwnershipTransferredEvent
): Promise<void> {
  const supabase = getSupabaseClient();

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

  const { error } = await supabase.from('engine_config_events').insert({
    event_type: event.eventName,
    old_value: oldValue,
    new_value: newValue,
    tx_hash: event.txHash,
    log_index: event.logIndex,
    block_number: Number(event.blockNumber),
  });

  if (error && !error.message.includes('duplicate key')) {
    console.error('Error al insertar config event:', error);
    throw error;
  }
}

/**
 * Decodificar un log raw en un evento tipado
 */
function decodeLog(log: Log): FloorEngineEvent | null {
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
async function processEvent(event: FloorEngineEvent): Promise<void> {
  switch (event.eventName) {
    case 'Listed':
      await processListedEvent(event);
      break;
    case 'Cancelled':
      await processCancelledEvent(event);
      break;
    case 'Bought':
      await processBoughtEvent(event);
      break;
    case 'FloorSweep':
      await processFloorSweepEvent(event);
      break;
    case 'PremiumUpdated':
    case 'MaxBuyPriceUpdated':
    case 'CallerRewardModeUpdated':
    case 'CallerRewardBpsUpdated':
    case 'CallerRewardFixedUpdated':
    case 'OwnershipTransferred':
      await processConfigEvent(event);
      break;
  }
}

/**
 * Sincronizar eventos desde el último bloque procesado
 */
export async function syncEvents(): Promise<{
  processed: number;
  fromBlock: bigint;
  toBlock: bigint;
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
    return { processed: 0, fromBlock: startBlock, toBlock: latestBlock };
  }

  // Calcular rango a procesar (máximo BLOCKS_PER_BATCH por vez)
  const toBlock =
    startBlock + BLOCKS_PER_BATCH > latestBlock
      ? latestBlock
      : startBlock + BLOCKS_PER_BATCH - 1n;

  console.log(
    `📊 Procesando bloques ${startBlock} a ${toBlock} (latest: ${latestBlock})`
  );

  // Obtener logs del contrato
  const logs = await client.getLogs({
    address: FLOOR_ENGINE_ADDRESS,
    fromBlock: startBlock,
    toBlock: toBlock,
  });

  console.log(`📝 Encontrados ${logs.length} eventos`);

  // Procesar cada log
  let processed = 0;
  for (const log of logs) {
    const event = decodeLog(log);
    if (event) {
      await processEvent(event);
      processed++;
      console.log(
        `✅ Procesado evento ${event.eventName} en bloque ${event.blockNumber}`
      );
    }
  }

  // Actualizar último bloque sincronizado
  await updateLastSyncedBlock(Number(toBlock));

  console.log(
    `🎉 Sincronización completada: ${processed} eventos procesados`
  );

  return { processed, fromBlock: startBlock, toBlock };
}

