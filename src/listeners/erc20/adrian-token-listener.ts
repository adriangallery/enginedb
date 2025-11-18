/**
 * Listener para el contrato $ADRIAN Token (ERC20)
 * Indexa eventos Transfer, Approval y eventos custom
 */

import {
  createPublicClient,
  http,
  decodeEventLog,
  type Log,
} from 'viem';
import { base } from 'viem/chains';
import { ADRIAN_TOKEN_CONFIG } from '../../contracts/config/adrian-token.js';
import { ADRIAN_TOKEN_ABI } from '../../contracts/abis/adrian-token-abi.js';
import {
  getLastSyncedBlockByContract,
  updateLastSyncedBlockByContract,
} from '../../supabase/client.js';
import { processERC20Event } from '../../processors/erc20-processor.js';
import type { AdrianTokenEvent } from '../../contracts/types/adrian-token-events.js';

/**
 * Configuración del listener
 */
const BLOCKS_PER_BATCH = process.env.BLOCKS_PER_BATCH
  ? BigInt(process.env.BLOCKS_PER_BATCH)
  : 10n; // Default: 10 para Alchemy Free tier

const PARALLEL_REQUESTS = process.env.PARALLEL_REQUESTS
  ? parseInt(process.env.PARALLEL_REQUESTS)
  : 3; // Default: 3 requests paralelos

/**
 * Crear cliente de viem para Base mainnet
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
          `[ADRIAN-ERC20] ⚠️  Rate limit detectado (intento ${attempt + 1}/${maxRetries}). Esperando ${delay}ms...`
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
  contractAddress: string,
  fromBlock: bigint,
  toBlock: bigint
): Promise<Log[]> {
  return retryWithBackoff(async () => {
    const logs = await client.getLogs({
      address: contractAddress as `0x${string}`,
      fromBlock: fromBlock,
      toBlock: toBlock,
    });
    return logs;
  }).catch((error) => {
    console.error(
      `[ADRIAN-ERC20] ❌ Error al obtener logs para bloques ${fromBlock}-${toBlock} después de retries:`,
      error
    );
    return []; // Retornar array vacío en caso de error después de todos los retries
  });
}

/**
 * Decodificar un log raw en un evento tipado
 */
function decodeLog(log: Log): AdrianTokenEvent | null {
  try {
    const decoded = decodeEventLog({
      abi: ADRIAN_TOKEN_ABI,
      data: log.data,
      topics: log.topics,
    });

    const eventName = decoded.eventName as string;
    const metadata = {
      txHash: log.transactionHash!,
      logIndex: log.logIndex!,
      blockNumber: log.blockNumber!,
    };

    const args = decoded.args as any;

    switch (eventName) {
      case 'Transfer':
        return {
          ...metadata,
          eventName: 'Transfer',
          from: args.from,
          to: args.to,
          value: args.value,
        };

      case 'Approval':
        return {
          ...metadata,
          eventName: 'Approval',
          owner: args.owner,
          spender: args.spender,
          value: args.value,
        };

      case 'TaxFeeUpdated':
        return {
          ...metadata,
          eventName: 'TaxFeeUpdated',
          newTaxFee: args.newTaxFee,
        };

      case 'CreatorFeeUpdated':
        return {
          ...metadata,
          eventName: 'CreatorFeeUpdated',
          newCreatorFee: args.newCreatorFee,
        };

      case 'BurnFeeUpdated':
        return {
          ...metadata,
          eventName: 'BurnFeeUpdated',
          newBurnFee: args.newBurnFee,
        };

      case 'TaxAddressUpdated':
        return {
          ...metadata,
          eventName: 'TaxAddressUpdated',
          newTaxAddress: args.newTaxAddress,
        };

      case 'CreatorAddressUpdated':
        return {
          ...metadata,
          eventName: 'CreatorAddressUpdated',
          newCreatorAddress: args.newCreatorAddress,
        };

      case 'FeeExemptionUpdated':
        return {
          ...metadata,
          eventName: 'FeeExemptionUpdated',
          account: args.account,
          isExempt: args.isExempt,
        };

      case 'Staked':
        return {
          ...metadata,
          eventName: 'Staked',
          staker: args.staker,
          amount: args.amount,
        };

      case 'WithdrawnStake':
        return {
          ...metadata,
          eventName: 'WithdrawnStake',
          staker: args.staker,
          amount: args.amount,
          reward: args.reward,
        };

      case 'RewardRateUpdated':
        return {
          ...metadata,
          eventName: 'RewardRateUpdated',
          newRewardRate: args.newRewardRate,
        };

      case 'GalleryAction':
        return {
          ...metadata,
          eventName: 'GalleryAction',
          from: args.from,
          to: args.to,
          amount: args.amount,
          action: args.action,
        };

      default:
        console.warn(`[ADRIAN-ERC20] Evento desconocido: ${eventName}`);
        return null;
    }
  } catch (error) {
    console.error('[ADRIAN-ERC20] Error al decodificar log:', error);
    return null;
  }
}

/**
 * Sincronizar eventos del contrato $ADRIAN Token
 * @param maxBatches - Número máximo de batches a procesar (opcional, undefined = todos)
 */
export async function syncERC20Events(maxBatches?: number): Promise<{
  processed: number;
  fromBlock: bigint;
  toBlock: bigint;
  hasMore: boolean; // Indica si hay más batches pendientes
}> {
  console.log('[ADRIAN-ERC20] 🔄 Iniciando sincronización de eventos...');

  const client = createViemClient();
  const contractAddress = ADRIAN_TOKEN_CONFIG.address;

  // Obtener último bloque procesado
  const lastSyncedBlock = BigInt(
    await getLastSyncedBlockByContract(contractAddress)
  );
  const startBlock =
    lastSyncedBlock === 0n && ADRIAN_TOKEN_CONFIG.startBlock
      ? ADRIAN_TOKEN_CONFIG.startBlock
      : lastSyncedBlock === 0n
        ? 0n
        : lastSyncedBlock + 1n;

  // Obtener bloque actual
  const latestBlock = await client.getBlockNumber();

  if (startBlock > latestBlock) {
    console.log('[ADRIAN-ERC20] ✅ Ya estamos sincronizados al último bloque');
    return { processed: 0, fromBlock: startBlock, toBlock: latestBlock };
  }

  // Calcular cuántos bloques hay que procesar
  const blocksToProcess = latestBlock - startBlock + 1n;
  const totalBatches = Number(
    blocksToProcess / BLOCKS_PER_BATCH +
      (blocksToProcess % BLOCKS_PER_BATCH > 0n ? 1n : 0n)
  );

  console.log(
    `[ADRIAN-ERC20] 📊 Procesando ${blocksToProcess} bloques (${totalBatches} batches de ${BLOCKS_PER_BATCH}) desde ${startBlock} hasta ${latestBlock}`
  );
  console.log(
    `[ADRIAN-ERC20] ⚡ Usando ${PARALLEL_REQUESTS} requests paralelos para procesar ${PARALLEL_REQUESTS * Number(BLOCKS_PER_BATCH)} bloques por ciclo`
  );

  // Configuración: guardar progreso cada N batches
  const SAVE_PROGRESS_INTERVAL = 100; // Guardar progreso cada 100 batches

  // Limitar batches si se especifica maxBatches
  const batchesToProcess = maxBatches ? Math.min(totalBatches, maxBatches) : totalBatches;
  const hasMore = maxBatches ? totalBatches > maxBatches : false;

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

      batchPromises.push(
        processBlockRange(client, contractAddress, fromBlock, toBlock)
      );
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
        await processERC20Event(event, contractAddress);
        processedEvents++;
      }
    }

    console.log(
      `[ADRIAN-ERC20] 📦 Procesados ${processedBatches}/${totalBatches} batches (${allLogs.length} eventos encontrados, ${processedEvents} procesados)`
    );

    // Guardar progreso cada SAVE_PROGRESS_INTERVAL batches
    if (processedBatches % SAVE_PROGRESS_INTERVAL === 0 || i + PARALLEL_REQUESTS >= batchesToProcess) {
      await updateLastSyncedBlockByContract(contractAddress, Number(lastProcessedBlock));
      console.log(
        `[ADRIAN-ERC20] 💾 Progreso guardado: bloque ${lastProcessedBlock} (${processedBatches}/${totalBatches} batches)`
      );
    }

    // Delay entre batches para evitar rate limiting (excepto en el último batch)
    if (i + PARALLEL_REQUESTS < batchesToProcess) {
      const delay = 500; // 500ms entre batches
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  console.log(
    `[ADRIAN-ERC20] 📝 Total de eventos encontrados: ${allLogs.length}, procesados: ${processedEvents}`
  );

  // Asegurar que el progreso final esté guardado
  await updateLastSyncedBlockByContract(contractAddress, Number(lastProcessedBlock));

  console.log(
    `[ADRIAN-ERC20] 🎉 Sincronización completada: ${processedEvents} eventos procesados de ${allLogs.length} logs encontrados`
  );
  console.log(
    `[ADRIAN-ERC20] 📍 Bloques procesados: ${startBlock} → ${lastProcessedBlock} (${Number(lastProcessedBlock - startBlock + 1n)} bloques)`
  );

  return {
    processed: processedEvents,
    fromBlock: startBlock,
    toBlock: lastProcessedBlock,
    hasMore,
  };
}

