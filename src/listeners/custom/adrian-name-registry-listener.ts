/**
 * Listener para el contrato AdrianNameRegistry
 * Decodifica eventos de nombres y configuración
 */

import { decodeEventLog, type Log } from 'viem';
import { ADRIAN_NAME_REGISTRY_ABI } from '../../contracts/abis/adrian-name-registry-abi.js';
import type { AdrianNameRegistryEvent } from '../../contracts/types/adrian-name-registry-events.js';

/**
 * Decodificar un log raw en un evento tipado
 */
export function decodeLog(log: Log): AdrianNameRegistryEvent | null {
  try {
    const decoded = decodeEventLog({
      abi: ADRIAN_NAME_REGISTRY_ABI,
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
      case 'NameSet':
        return {
          ...metadata,
          eventName: 'NameSet',
          tokenId: args.tokenId,
          newName: args.newName,
          setter: args.setter,
          paid: args.paid,
          price: args.price,
        };

      case 'PriceUpdated':
        return {
          ...metadata,
          eventName: 'PriceUpdated',
          oldPrice: args.oldPrice,
          newPrice: args.newPrice,
        };

      case 'TreasuryUpdated':
        return {
          ...metadata,
          eventName: 'TreasuryUpdated',
          oldTreasury: args.oldTreasury,
          newTreasury: args.newTreasury,
        };

      default:
        return null;
    }
  } catch (error) {
    // Log no corresponde a este contrato o no se pudo decodificar
    return null;
  }
}

