/**
 * Listener para el contrato AdrianSerumModule
 * Decodifica eventos de aplicación de serums
 */

import { decodeEventLog, type Log } from 'viem';
import { ADRIAN_SERUM_MODULE_ABI } from '../../contracts/abis/adrian-serum-module-abi.js';
import type { AdrianSerumModuleEvent } from '../../contracts/types/adrian-serum-module-events.js';

/**
 * Decodificar un log raw en un evento tipado
 */
export function decodeLog(log: Log): AdrianSerumModuleEvent | null {
  try {
    const decoded = decodeEventLog({
      abi: ADRIAN_SERUM_MODULE_ABI,
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
      case 'SerumResult':
        return {
          ...metadata,
          eventName: 'SerumResult',
          user: args.user,
          tokenId: args.tokenId,
          serumId: args.serumId,
          success: args.success,
          mutation: args.mutation,
        };

      default:
        return null;
    }
  } catch (error) {
    // Log no corresponde a este contrato o no se pudo decodificar
    return null;
  }
}

