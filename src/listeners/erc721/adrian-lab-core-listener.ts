/**
 * Listener para el contrato AdrianLABCore (ERC721)
 * Indexa eventos Transfer, Approval, ApprovalForAll y eventos custom
 */

import {
  createPublicClient,
  http,
  decodeEventLog,
  type Log,
} from 'viem';
import { base } from 'viem/chains';
import { ADRIAN_LAB_CORE_CONFIG } from '../../contracts/config/adrian-lab-core.js';
import { ADRIAN_LAB_CORE_ABI } from '../../contracts/abis/adrian-lab-core-abi.js';
import {
  getLastSyncedBlockByContract,
  updateLastSyncedBlockByContract,
} from '../../supabase/client.js';
import { processERC721Event } from '../../processors/erc721-processor.js';
import type { AdrianLabCoreEvent } from '../../contracts/types/adrian-lab-core-events.js';

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
          `[ADRIAN-ERC721] ⚠️  Rate limit detectado (intento ${attempt + 1}/${maxRetries}). Esperando ${delay}ms...`
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
      `[ADRIAN-ERC721] ❌ Error al obtener logs para bloques ${fromBlock}-${toBlock} después de retries:`,
      error
    );
    return []; // Retornar array vacío en caso de error después de todos los retries
  });
}

/**
 * Decodificar un log raw en un evento tipado
 */
export function decodeLog(log: Log): AdrianLabCoreEvent | null {
  try {
    const decoded = decodeEventLog({
      abi: ADRIAN_LAB_CORE_ABI,
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
          tokenId: args.tokenId,
        };

      case 'Approval':
        return {
          ...metadata,
          eventName: 'Approval',
          owner: args.owner,
          approved: args.approved,
          tokenId: args.tokenId,
        };

      case 'ApprovalForAll':
        return {
          ...metadata,
          eventName: 'ApprovalForAll',
          owner: args.owner,
          operator: args.operator,
          approved: args.approved,
        };

      case 'TokenMinted':
        return {
          ...metadata,
          eventName: 'TokenMinted',
          to: args.to,
          tokenId: args.tokenId,
        };

      case 'TokenBurnt':
        return {
          ...metadata,
          eventName: 'TokenBurnt',
          tokenId: args.tokenId,
          burner: args.burner,
        };

      case 'SkinCreated':
        return {
          ...metadata,
          eventName: 'SkinCreated',
          skinId: args.skinId,
          name: args.name,
          rarity: args.rarity,
        };

      case 'SkinAssigned':
        return {
          ...metadata,
          eventName: 'SkinAssigned',
          tokenId: args.tokenId,
          skinId: args.skinId,
          name: args.name,
        };

      case 'SkinUpdated':
        return {
          ...metadata,
          eventName: 'SkinUpdated',
          skinId: args.skinId,
          name: args.name,
          rarity: args.rarity,
          active: args.active,
        };

      case 'SkinRemoved':
        return {
          ...metadata,
          eventName: 'SkinRemoved',
          skinId: args.skinId,
        };

      case 'RandomSkinToggled':
        return {
          ...metadata,
          eventName: 'RandomSkinToggled',
          enabled: args.enabled,
        };

      case 'MutationAssigned':
        return {
          ...metadata,
          eventName: 'MutationAssigned',
          tokenId: args.tokenId,
        };

      case 'MutationNameAssigned':
        return {
          ...metadata,
          eventName: 'MutationNameAssigned',
          tokenId: args.tokenId,
          newMutation: args.newMutation,
        };

      case 'SerumApplied':
        return {
          ...metadata,
          eventName: 'SerumApplied',
          tokenId: args.tokenId,
          serumId: args.serumId,
        };

      case 'MutationSkinSet':
        return {
          ...metadata,
          eventName: 'MutationSkinSet',
          mutation: args.mutation,
          skinId: args.skinId,
        };

      case 'SpecialSkinApplied':
        return {
          ...metadata,
          eventName: 'SpecialSkinApplied',
          tokenId: args.tokenId,
          skinId: args.skinId,
          mutation: args.mutation,
        };

      case 'BaseURIUpdated':
        return {
          ...metadata,
          eventName: 'BaseURIUpdated',
          newURI: args.newURI,
        };

      case 'ExtensionsContractUpdated':
        return {
          ...metadata,
          eventName: 'ExtensionsContractUpdated',
          newContract: args.newContract,
        };

      case 'TraitsContractUpdated':
        return {
          ...metadata,
          eventName: 'TraitsContractUpdated',
          newContract: args.newContract,
        };

      case 'PaymentTokenUpdated':
        return {
          ...metadata,
          eventName: 'PaymentTokenUpdated',
          newToken: args.newToken,
        };

      case 'TreasuryWalletUpdated':
        return {
          ...metadata,
          eventName: 'TreasuryWalletUpdated',
          newWallet: args.newWallet,
        };

      case 'AdminContractUpdated':
        return {
          ...metadata,
          eventName: 'AdminContractUpdated',
          newAdmin: args.newAdmin,
        };

      case 'FunctionImplementationUpdated':
        return {
          ...metadata,
          eventName: 'FunctionImplementationUpdated',
          selector: args.selector,
          implementation: args.implementation,
        };

      case 'ProceedsWithdrawn':
        return {
          ...metadata,
          eventName: 'ProceedsWithdrawn',
          wallet: args.wallet,
          amount: args.amount,
        };

      case 'FirstModification':
        return {
          ...metadata,
          eventName: 'FirstModification',
          tokenId: args.tokenId,
        };

      default:
        console.warn(`[ADRIAN-ERC721] Evento desconocido: ${eventName}`);
        return null;
    }
  } catch (error) {
    console.error('[ADRIAN-ERC721] Error al decodificar log:', error);
    return null;
  }
}

/**
 * Sincronizar eventos del contrato AdrianLABCore
 * @param maxBatches - Número máximo de batches a procesar (opcional, undefined = todos)
 */
export async function syncERC721Events(maxBatches?: number): Promise<{
  processed: number;
  fromBlock: bigint;
  toBlock: bigint;
  hasMore: boolean; // Indica si hay más batches pendientes
}> {
  console.log('[ADRIAN-ERC721] 🔄 Iniciando sincronización de eventos...');

  const client = createViemClient();
  const contractAddress = ADRIAN_LAB_CORE_CONFIG.address;

  // Obtener último bloque procesado
  const lastSyncedBlock = BigInt(
    await getLastSyncedBlockByContract(contractAddress)
  );
  const startBlock =
    lastSyncedBlock === 0n && ADRIAN_LAB_CORE_CONFIG.startBlock
      ? ADRIAN_LAB_CORE_CONFIG.startBlock
      : lastSyncedBlock === 0n
        ? 0n
        : lastSyncedBlock + 1n;

  // Obtener bloque actual
  const latestBlock = await client.getBlockNumber();

  if (startBlock > latestBlock) {
    console.log('[ADRIAN-ERC721] ✅ Ya estamos sincronizados al último bloque');
    return { processed: 0, fromBlock: startBlock, toBlock: latestBlock, hasMore: false };
  }

  // Calcular cuántos bloques hay que procesar
  const blocksToProcess = latestBlock - startBlock + 1n;
  const totalBatches = Number(
    blocksToProcess / BLOCKS_PER_BATCH +
      (blocksToProcess % BLOCKS_PER_BATCH > 0n ? 1n : 0n)
  );

  console.log(
    `[ADRIAN-ERC721] 📊 Procesando ${blocksToProcess} bloques (${totalBatches} batches de ${BLOCKS_PER_BATCH}) desde ${startBlock} hasta ${latestBlock}`
  );
  console.log(
    `[ADRIAN-ERC721] ⚡ Usando ${PARALLEL_REQUESTS} requests paralelos para procesar ${PARALLEL_REQUESTS * Number(BLOCKS_PER_BATCH)} bloques por ciclo`
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
        await processERC721Event(event, contractAddress);
        processedEvents++;
      }
    }

    console.log(
      `[ADRIAN-ERC721] 📦 Procesados ${processedBatches}/${totalBatches} batches (${allLogs.length} eventos encontrados, ${processedEvents} procesados)`
    );

    // Guardar progreso cada SAVE_PROGRESS_INTERVAL batches
    if (processedBatches % SAVE_PROGRESS_INTERVAL === 0 || i + PARALLEL_REQUESTS >= batchesToProcess) {
      await updateLastSyncedBlockByContract(contractAddress, Number(lastProcessedBlock));
      console.log(
        `[ADRIAN-ERC721] 💾 Progreso guardado: bloque ${lastProcessedBlock} (${processedBatches}/${totalBatches} batches)`
      );
    }

    // Delay entre batches para evitar rate limiting (excepto en el último batch)
    if (i + PARALLEL_REQUESTS < batchesToProcess) {
      const delay = 500; // 500ms entre batches
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  console.log(
    `[ADRIAN-ERC721] 📝 Total de eventos encontrados: ${allLogs.length}, procesados: ${processedEvents}`
  );

  // Asegurar que el progreso final esté guardado
  await updateLastSyncedBlockByContract(contractAddress, Number(lastProcessedBlock));

  // Recalcular hasMore al final comparando con el bloque actual (puede haber cambiado durante el procesamiento)
  const currentLatestBlock = await client.getBlockNumber();
  const hasMore = lastProcessedBlock < currentLatestBlock;

  console.log(
    `[ADRIAN-ERC721] 🎉 Sincronización completada: ${processedEvents} eventos procesados de ${allLogs.length} logs encontrados`
  );
  console.log(
    `[ADRIAN-ERC721] 📍 Bloques procesados: ${startBlock} → ${lastProcessedBlock} (${Number(lastProcessedBlock - startBlock + 1n)} bloques)`
  );

  return {
    processed: processedEvents,
    fromBlock: startBlock,
    toBlock: lastProcessedBlock,
    hasMore,
  };
}

