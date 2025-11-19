/**
 * Procesador de eventos AdrianShopv1
 * Maneja eventos de compras y configuración de shop
 */

import { getSupabaseClient } from '../supabase/client.js';
import type { AdrianShopEvent } from '../contracts/types/adrian-shop-events.js';
import { bigintToString } from '../contracts/types/adrian-shop-events.js';

/**
 * Procesar un evento según su tipo
 */
export async function processShopEvent(
  event: AdrianShopEvent,
  contractAddress: string
): Promise<void> {
  const supabase = getSupabaseClient();

  // Convertir evento a JSONB según su tipo
  let eventData: Record<string, any> = {};

  switch (event.eventName) {
    case 'ItemPurchased':
      eventData = {
        buyer: event.buyer.toLowerCase(),
        assetId: bigintToString(event.assetId),
        quantity: bigintToString(event.quantity),
        unitPrice: bigintToString(event.unitPrice),
        totalCost: bigintToString(event.totalCost),
        freeAmount: bigintToString(event.freeAmount),
      };
      break;
    case 'BatchPurchase':
      eventData = {
        buyer: event.buyer.toLowerCase(),
        assetIds: event.assetIds.map(bigintToString),
        quantities: event.quantities.map(bigintToString),
        totalCost: bigintToString(event.totalCost),
        totalFreeAmount: bigintToString(event.totalFreeAmount),
      };
      break;
    case 'FreeItemClaimed':
      eventData = {
        user: event.user.toLowerCase(),
        assetId: bigintToString(event.assetId),
        quantity: bigintToString(event.quantity),
      };
      break;
    case 'ShopItemConfigured':
      eventData = {
        assetId: bigintToString(event.assetId),
        price: bigintToString(event.price),
        quantityAvailable: bigintToString(event.quantityAvailable),
        active: event.active,
      };
      break;
    case 'ShopItemTimingSet':
      eventData = {
        assetId: bigintToString(event.assetId),
        startTime: bigintToString(event.startTime),
        endTime: bigintToString(event.endTime),
      };
      break;
    case 'ShopItemStatusChanged':
      eventData = {
        assetId: bigintToString(event.assetId),
        active: event.active,
      };
      break;
    case 'ShopItemPriceChanged':
      eventData = {
        assetId: bigintToString(event.assetId),
        oldPrice: bigintToString(event.oldPrice),
        newPrice: bigintToString(event.newPrice),
      };
      break;
    case 'ShopItemQuantityUpdated':
      eventData = {
        assetId: bigintToString(event.assetId),
        newQuantity: bigintToString(event.newQuantity),
      };
      break;
    case 'AllowlistConfigured':
      eventData = {
        assetId: bigintToString(event.assetId),
        freePerWallet: bigintToString(event.freePerWallet),
        walletsCount: bigintToString(event.walletsCount),
      };
      break;
    case 'WalletsAddedToAllowlist':
      eventData = {
        assetId: bigintToString(event.assetId),
        wallets: event.wallets.map((w) => w.toLowerCase()),
      };
      break;
    case 'WalletsRemovedFromAllowlist':
      eventData = {
        assetId: bigintToString(event.assetId),
        wallets: event.wallets.map((w) => w.toLowerCase()),
      };
      break;
    case 'ShopGlobalStatusChanged':
      eventData = {
        active: event.active,
      };
      break;
    case 'TreasuryOverrideSet':
      eventData = {
        newTreasury: event.newTreasury.toLowerCase(),
      };
      break;
  }

  const { error } = await supabase.from('shop_events').insert({
    contract_address: contractAddress.toLowerCase(),
    event_name: event.eventName,
    event_data: eventData,
    tx_hash: event.txHash,
    log_index: event.logIndex,
    block_number: Number(event.blockNumber),
  });

  if (error) {
    if (error.code === '23505') {
      return;
    }
    console.error(
      `[Shop] Error al insertar evento ${event.eventName}:`,
      error,
      event
    );
    throw error;
  }
}

