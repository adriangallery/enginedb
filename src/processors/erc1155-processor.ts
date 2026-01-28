/**
 * Procesador de eventos ERC1155
 * Maneja TransferSingle, TransferBatch, ApprovalForAll y eventos custom
 */

import { insertEvent } from '../supabase/client.js';
import type {
  AdrianTraitsCoreEvent,
  TransferSingleEvent,
  TransferBatchEvent,
  ApprovalForAllEvent,
  URIEvent,
  AssetRegisteredEvent,
  AssetMintedEvent,
  AssetBurnedEvent,
  CategoryAddedEvent,
  CategoryRemovedEvent,
  AssetTypeAddedEvent,
  ExtensionAddedEvent,
  ExtensionRemovedEvent,
  PaymentTokenUpdatedEvent,
  AssetUpdatedEvent,
  BaseURIUpdatedEvent,
} from '../contracts/types/adrian-traits-core-events.js';
import { bigintToString } from '../contracts/types/adrian-traits-core-events.js';

/**
 * Procesar evento TransferSingle (estándar ERC1155)
 */
async function processTransferSingleEvent(
  event: TransferSingleEvent,
  contractAddress: string,
  blockTimestamp?: Date
): Promise<void> {
  await insertEvent('erc1155_transfers_single', {
    contract_address: contractAddress.toLowerCase(),
    operator: event.operator.toLowerCase(),
    from_address: event.from.toLowerCase(),
    to_address: event.to.toLowerCase(),
    token_id: bigintToString(event.id),
    value: bigintToString(event.value),
    tx_hash: event.txHash,
    log_index: event.logIndex,
    block_number: Number(event.blockNumber),
    created_at: blockTimestamp?.toISOString() || new Date().toISOString(),
  });
}

/**
 * Procesar evento TransferBatch (estándar ERC1155)
 */
async function processTransferBatchEvent(
  event: TransferBatchEvent,
  contractAddress: string,
  blockTimestamp?: Date
): Promise<void> {
  await insertEvent('erc1155_transfers_batch', {
    contract_address: contractAddress.toLowerCase(),
    operator: event.operator.toLowerCase(),
    from_address: event.from.toLowerCase(),
    to_address: event.to.toLowerCase(),
    token_ids: event.ids.map(bigintToString),
    values: event.values.map(bigintToString),
    tx_hash: event.txHash,
    log_index: event.logIndex,
    block_number: Number(event.blockNumber),
    created_at: blockTimestamp?.toISOString() || new Date().toISOString(),
  });
}

/**
 * Procesar evento ApprovalForAll (estándar ERC1155)
 */
async function processApprovalForAllEvent(
  event: ApprovalForAllEvent,
  contractAddress: string,
  blockTimestamp?: Date
): Promise<void> {
  await insertEvent('erc1155_approvals_for_all', {
    contract_address: contractAddress.toLowerCase(),
    account: event.account.toLowerCase(),
    operator: event.operator.toLowerCase(),
    approved: event.approved,
    tx_hash: event.txHash,
    log_index: event.logIndex,
    block_number: Number(event.blockNumber),
    created_at: blockTimestamp?.toISOString() || new Date().toISOString(),
  });
}

/**
 * Procesar evento URI (estándar ERC1155)
 */
async function processURIEvent(
  event: URIEvent,
  contractAddress: string,
  blockTimestamp?: Date
): Promise<void> {
  await insertEvent('erc1155_uri_updates', {
    contract_address: contractAddress.toLowerCase(),
    token_id: bigintToString(event.id),
    uri: event.value,
    tx_hash: event.txHash,
    log_index: event.logIndex,
    block_number: Number(event.blockNumber),
    created_at: blockTimestamp?.toISOString() || new Date().toISOString(),
  });
}

/**
 * Procesar eventos custom de AdrianTraitsCore
 */
async function processCustomEvent(
  event:
    | AssetRegisteredEvent
    | AssetMintedEvent
    | AssetBurnedEvent
    | CategoryAddedEvent
    | CategoryRemovedEvent
    | AssetTypeAddedEvent
    | ExtensionAddedEvent
    | ExtensionRemovedEvent
    | PaymentTokenUpdatedEvent
    | AssetUpdatedEvent
    | BaseURIUpdatedEvent,
  contractAddress: string,
  blockTimestamp?: Date
): Promise<void> {
  // Convertir evento a JSONB según su tipo
  let eventData: Record<string, any> = {};

  switch (event.eventName) {
    case 'AssetRegistered':
      eventData = {
        assetId: bigintToString(event.assetId),
        category: event.category,
        assetType: event.assetType,
      };
      break;
    case 'AssetMinted':
      eventData = {
        assetId: bigintToString(event.assetId),
        to: event.to.toLowerCase(),
        amount: bigintToString(event.amount),
      };
      break;
    case 'AssetBurned':
      eventData = {
        assetId: bigintToString(event.assetId),
        from: event.from.toLowerCase(),
        amount: bigintToString(event.amount),
      };
      break;
    case 'CategoryAdded':
      eventData = {
        category: event.category,
      };
      break;
    case 'CategoryRemoved':
      eventData = {
        category: event.category,
      };
      break;
    case 'AssetTypeAdded':
      eventData = {
        typeName: event.typeName,
      };
      break;
    case 'ExtensionAdded':
      eventData = {
        extension: event.extension.toLowerCase(),
      };
      break;
    case 'ExtensionRemoved':
      eventData = {
        extension: event.extension.toLowerCase(),
      };
      break;
    case 'PaymentTokenUpdated':
      eventData = {
        newToken: event.newToken.toLowerCase(),
      };
      break;
    case 'AssetUpdated':
      eventData = {
        assetId: bigintToString(event.assetId),
        field: event.field,
        newValue: event.newValue,
      };
      break;
    case 'BaseURIUpdated':
      eventData = {
        newURI: event.newURI,
      };
      break;
  }

  await insertEvent('erc1155_custom_events', {
    contract_address: contractAddress.toLowerCase(),
    event_name: event.eventName,
    event_data: eventData,
    tx_hash: event.txHash,
    log_index: event.logIndex,
    block_number: Number(event.blockNumber),
    created_at: blockTimestamp?.toISOString() || new Date().toISOString(),
  });
}

/**
 * Procesar un evento según su tipo
 */
export async function processERC1155Event(
  event: AdrianTraitsCoreEvent,
  contractAddress: string,
  blockTimestamp?: Date
): Promise<void> {
  switch (event.eventName) {
    case 'TransferSingle':
      await processTransferSingleEvent(event, contractAddress, blockTimestamp);
      break;
    case 'TransferBatch':
      await processTransferBatchEvent(event, contractAddress, blockTimestamp);
      break;
    case 'ApprovalForAll':
      await processApprovalForAllEvent(event, contractAddress, blockTimestamp);
      break;
    case 'URI':
      await processURIEvent(event, contractAddress, blockTimestamp);
      break;
    default:
      await processCustomEvent(event, contractAddress, blockTimestamp);
      break;
  }
}

