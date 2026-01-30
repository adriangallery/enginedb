/**
 * Listener para el contrato AdrianTraitsCore (ERC1155)
 * Decodifica eventos estándar ERC1155 y eventos custom
 */

import { decodeEventLog, type Log } from 'viem';
import { ADRIAN_TRAITS_CORE_ABI } from '../../contracts/abis/adrian-traits-core-abi.js';
import type { AdrianTraitsCoreEvent } from '../../contracts/types/adrian-traits-core-events.js';

/**
 * Decodificar un log raw en un evento tipado
 */
export function decodeLog(log: Log): AdrianTraitsCoreEvent | null {
  try {
    const decoded = decodeEventLog({
      abi: ADRIAN_TRAITS_CORE_ABI,
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
      // Eventos estándar ERC1155
      case 'TransferSingle':
        return {
          ...metadata,
          eventName: 'TransferSingle',
          operator: args.operator,
          from: args.from,
          to: args.to,
          id: args.id,
          value: args.value,
        };

      case 'TransferBatch':
        return {
          ...metadata,
          eventName: 'TransferBatch',
          operator: args.operator,
          from: args.from,
          to: args.to,
          ids: args.ids,
          values: args.values,
        };

      case 'ApprovalForAll':
        return {
          ...metadata,
          eventName: 'ApprovalForAll',
          account: args.account,
          operator: args.operator,
          approved: args.approved,
        };

      case 'URI':
        return {
          ...metadata,
          eventName: 'URI',
          value: args.value,
          id: args.id,
        };

      // Eventos custom
      case 'AssetRegistered':
        return {
          ...metadata,
          eventName: 'AssetRegistered',
          assetId: args.assetId,
          category: args.category,
          assetType: Number(args.assetType),
        };

      case 'AssetMinted':
        return {
          ...metadata,
          eventName: 'AssetMinted',
          assetId: args.assetId,
          to: args.to,
          amount: args.amount,
        };

      case 'AssetBurned':
        return {
          ...metadata,
          eventName: 'AssetBurned',
          assetId: args.assetId,
          from: args.from,
          amount: args.amount,
        };

      case 'CategoryAdded':
        return {
          ...metadata,
          eventName: 'CategoryAdded',
          category: args.category,
        };

      case 'CategoryRemoved':
        return {
          ...metadata,
          eventName: 'CategoryRemoved',
          category: args.category,
        };

      case 'AssetTypeAdded':
        return {
          ...metadata,
          eventName: 'AssetTypeAdded',
          typeName: args.typeName,
        };

      case 'ExtensionAdded':
        return {
          ...metadata,
          eventName: 'ExtensionAdded',
          extension: args.extension,
        };

      case 'ExtensionRemoved':
        return {
          ...metadata,
          eventName: 'ExtensionRemoved',
          extension: args.extension,
        };

      case 'PaymentTokenUpdated':
        return {
          ...metadata,
          eventName: 'PaymentTokenUpdated',
          newToken: args.newToken,
        };

      case 'AssetUpdated':
        return {
          ...metadata,
          eventName: 'AssetUpdated',
          assetId: args.assetId,
          field: args.field,
          newValue: args.newValue,
        };

      case 'BaseURIUpdated':
        return {
          ...metadata,
          eventName: 'BaseURIUpdated',
          newURI: args.newURI,
        };

      default:
        return null;
    }
  } catch (error) {
    // Log no corresponde a este contrato o no se pudo decodificar
    return null;
  }
}

