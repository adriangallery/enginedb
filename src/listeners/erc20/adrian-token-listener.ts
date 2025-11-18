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
 * Procesar un rango específico de bloques
 */
async function processBlockRange(
  client: ReturnType<typeof createViemClient>,
  contractAddress: string,
  fromBlock: bigint,
  toBlock: bigint
): Promise<Log[]> {
  try {
    const logs = await client.getLogs({
      address: contractAddress as `0x${string}`,
      fromBlock: fromBlock,
      toBlock: toBlock,
    });
    return logs;
  } catch (error) {
    console.error(
      `[ADRIAN-ERC20] Error al obtener logs para bloques ${fromBlock}-${toBlock}:`,
      error
    );
    return []; // Retornar array vacío en caso de error
  }
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
 */
export async function syncERC20Events(): Promise<{
  processed: number;
  fromBlock: bigint;
  toBlock: bigint;
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

  // Procesar en batches paralelos
  let allLogs: Log[] = [];
  let processedBatches = 0;
  let lastProcessedBlock = startBlock - 1n;

  for (let i = 0; i < totalBatches; i += PARALLEL_REQUESTS) {
    // Crear batch de requests paralelos
    const batchPromises: Promise<Log[]>[] = [];

    for (let j = 0; j < PARALLEL_REQUESTS && i + j < totalBatches; j++) {
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
    for (const logs of batchResults) {
      allLogs = allLogs.concat(logs);
    }

    processedBatches += batchPromises.length;
    lastProcessedBlock =
      startBlock + BigInt(processedBatches) * BLOCKS_PER_BATCH - 1n;
    if (lastProcessedBlock > latestBlock) {
      lastProcessedBlock = latestBlock;
    }

    console.log(
      `[ADRIAN-ERC20] 📦 Procesados ${processedBatches}/${totalBatches} batches (${allLogs.length} eventos encontrados hasta ahora)`
    );
  }

  console.log(
    `[ADRIAN-ERC20] 📝 Total de eventos encontrados: ${allLogs.length}`
  );

  // Procesar todos los eventos encontrados
  let processed = 0;
  for (const log of allLogs) {
    const event = decodeLog(log);
    if (event) {
      await processERC20Event(event, contractAddress);
      processed++;
      console.log(
        `[ADRIAN-ERC20] ✅ Procesado evento ${event.eventName} en bloque ${event.blockNumber}`
      );
    }
  }

  // Actualizar último bloque sincronizado
  await updateLastSyncedBlockByContract(contractAddress, Number(lastProcessedBlock));

  console.log(
    `[ADRIAN-ERC20] 🎉 Sincronización completada: ${processed} eventos procesados de ${allLogs.length} logs encontrados`
  );
  console.log(
    `[ADRIAN-ERC20] 📍 Bloques procesados: ${startBlock} → ${lastProcessedBlock} (${Number(lastProcessedBlock - startBlock + 1n)} bloques)`
  );

  return {
    processed,
    fromBlock: startBlock,
    toBlock: lastProcessedBlock,
  };
}

