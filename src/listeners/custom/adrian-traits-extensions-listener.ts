/**
 * Listener para el contrato AdrianTraitsExtensions
 * Decodifica eventos custom de traits e inventario
 */

import { decodeEventLog, type Log } from 'viem';
import { ADRIAN_TRAITS_EXTENSIONS_ABI } from '../../contracts/abis/adrian-traits-extensions-abi.js';
import type { AdrianTraitsExtensionsEvent } from '../../contracts/types/adrian-traits-extensions-events.js';

/**
 * Decodificar un log raw en un evento tipado
 */
export function decodeLog(log: Log): AdrianTraitsExtensionsEvent | null {
  try {
    const decoded = decodeEventLog({
      abi: ADRIAN_TRAITS_EXTENSIONS_ABI,
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
      case 'TraitEquipped':
        return {
          ...metadata,
          eventName: 'TraitEquipped',
          tokenId: args.tokenId,
          category: args.category,
          traitId: args.traitId,
        };

      case 'TraitUnequipped':
        return {
          ...metadata,
          eventName: 'TraitUnequipped',
          tokenId: args.tokenId,
          category: args.category,
          traitId: args.traitId,
        };

      case 'TraitApplied':
        return {
          ...metadata,
          eventName: 'TraitApplied',
          tokenId: args.tokenId,
          category: args.category,
          traitId: args.traitId,
        };

      case 'TraitsAppliedBatch':
        return {
          ...metadata,
          eventName: 'TraitsAppliedBatch',
          tokenId: args.tokenId,
          traitIds: args.traitIds,
          categories: args.categories,
        };

      case 'AssetAddedToInventory':
        return {
          ...metadata,
          eventName: 'AssetAddedToInventory',
          tokenId: args.tokenId,
          assetId: args.assetId,
          amount: args.amount,
        };

      case 'AssetRemovedFromInventory':
        return {
          ...metadata,
          eventName: 'AssetRemovedFromInventory',
          tokenId: args.tokenId,
          assetId: args.assetId,
          amount: args.amount,
        };

      case 'CoreContractCallReceived':
        return {
          ...metadata,
          eventName: 'CoreContractCallReceived',
          core: args.core,
          timestamp: args.timestamp,
        };

      default:
        return null;
    }
  } catch (error) {
    // Log no corresponde a este contrato o no se pudo decodificar
    return null;
  }
}

