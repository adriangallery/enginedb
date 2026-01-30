/**
 * Listener para el contrato AdrianShopv1
 * Decodifica eventos de compras y configuración de shop
 */

import { decodeEventLog, type Log } from 'viem';
import { ADRIAN_SHOP_ABI } from '../../contracts/abis/adrian-shop-abi.js';
import type { AdrianShopEvent } from '../../contracts/types/adrian-shop-events.js';

/**
 * Decodificar un log raw en un evento tipado
 */
export function decodeLog(log: Log): AdrianShopEvent | null {
  try {
    const decoded = decodeEventLog({
      abi: ADRIAN_SHOP_ABI,
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
      case 'ItemPurchased':
        return {
          ...metadata,
          eventName: 'ItemPurchased',
          buyer: args.buyer,
          assetId: args.assetId,
          quantity: args.quantity,
          unitPrice: args.unitPrice,
          totalCost: args.totalCost,
          freeAmount: args.freeAmount,
        };

      case 'BatchPurchase':
        return {
          ...metadata,
          eventName: 'BatchPurchase',
          buyer: args.buyer,
          assetIds: args.assetIds,
          quantities: args.quantities,
          totalCost: args.totalCost,
          totalFreeAmount: args.totalFreeAmount,
        };

      case 'FreeItemClaimed':
        return {
          ...metadata,
          eventName: 'FreeItemClaimed',
          user: args.user,
          assetId: args.assetId,
          quantity: args.quantity,
        };

      case 'ShopItemConfigured':
        return {
          ...metadata,
          eventName: 'ShopItemConfigured',
          assetId: args.assetId,
          price: args.price,
          quantityAvailable: args.quantityAvailable,
          active: args.active,
        };

      case 'ShopItemTimingSet':
        return {
          ...metadata,
          eventName: 'ShopItemTimingSet',
          assetId: args.assetId,
          startTime: args.startTime,
          endTime: args.endTime,
        };

      case 'ShopItemStatusChanged':
        return {
          ...metadata,
          eventName: 'ShopItemStatusChanged',
          assetId: args.assetId,
          active: args.active,
        };

      case 'ShopItemPriceChanged':
        return {
          ...metadata,
          eventName: 'ShopItemPriceChanged',
          assetId: args.assetId,
          oldPrice: args.oldPrice,
          newPrice: args.newPrice,
        };

      case 'ShopItemQuantityUpdated':
        return {
          ...metadata,
          eventName: 'ShopItemQuantityUpdated',
          assetId: args.assetId,
          newQuantity: args.newQuantity,
        };

      case 'AllowlistConfigured':
        return {
          ...metadata,
          eventName: 'AllowlistConfigured',
          assetId: args.assetId,
          freePerWallet: args.freePerWallet,
          walletsCount: args.walletsCount,
        };

      case 'WalletsAddedToAllowlist':
        return {
          ...metadata,
          eventName: 'WalletsAddedToAllowlist',
          assetId: args.assetId,
          wallets: args.wallets,
        };

      case 'WalletsRemovedFromAllowlist':
        return {
          ...metadata,
          eventName: 'WalletsRemovedFromAllowlist',
          assetId: args.assetId,
          wallets: args.wallets,
        };

      case 'ShopGlobalStatusChanged':
        return {
          ...metadata,
          eventName: 'ShopGlobalStatusChanged',
          active: args.active,
        };

      case 'TreasuryOverrideSet':
        return {
          ...metadata,
          eventName: 'TreasuryOverrideSet',
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

