/**
 * Procesador de eventos AdrianTraitsExtensions
 * Maneja eventos de traits e inventario
 */

import { insertEvent } from '../supabase/client.js';
import type { AdrianTraitsExtensionsEvent } from '../contracts/types/adrian-traits-extensions-events.js';
import { bigintToString } from '../contracts/types/adrian-traits-extensions-events.js';

/**
 * Procesar un evento según su tipo
 */
export async function processTraitsExtensionsEvent(
  event: AdrianTraitsExtensionsEvent,
  contractAddress: string,
  blockTimestamp?: Date
): Promise<void> {
  // Convertir evento a JSONB según su tipo
  let eventData: Record<string, any> = {};

  switch (event.eventName) {
    case 'TraitEquipped':
      eventData = {
        tokenId: bigintToString(event.tokenId),
        category: event.category,
        traitId: bigintToString(event.traitId),
      };
      break;
    case 'TraitUnequipped':
      eventData = {
        tokenId: bigintToString(event.tokenId),
        category: event.category,
        traitId: bigintToString(event.traitId),
      };
      break;
    case 'TraitApplied':
      eventData = {
        tokenId: bigintToString(event.tokenId),
        category: event.category,
        traitId: bigintToString(event.traitId),
      };
      break;
    case 'TraitsAppliedBatch':
      eventData = {
        tokenId: bigintToString(event.tokenId),
        traitIds: event.traitIds.map(bigintToString),
        categories: event.categories,
      };
      break;
    case 'AssetAddedToInventory':
      eventData = {
        tokenId: bigintToString(event.tokenId),
        assetId: bigintToString(event.assetId),
        amount: bigintToString(event.amount),
      };
      break;
    case 'AssetRemovedFromInventory':
      eventData = {
        tokenId: bigintToString(event.tokenId),
        assetId: bigintToString(event.assetId),
        amount: bigintToString(event.amount),
      };
      break;
    case 'CoreContractCallReceived':
      eventData = {
        core: event.core.toLowerCase(),
        timestamp: bigintToString(event.timestamp),
      };
      break;
  }

  await insertEvent('traits_extensions_events', {
    contract_address: contractAddress.toLowerCase(),
    event_name: event.eventName,
    event_data: eventData,
    tx_hash: event.txHash,
    log_index: event.logIndex,
    block_number: Number(event.blockNumber),
    created_at: blockTimestamp?.toISOString() || new Date().toISOString(),
  });
}

