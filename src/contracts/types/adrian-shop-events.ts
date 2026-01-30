/**
 * Tipos TypeScript para eventos del contrato AdrianShopv1
 */

/**
 * Metadata común a todos los eventos
 */
export interface EventMetadata {
  txHash: string;
  logIndex: number;
  blockNumber: bigint;
}

/**
 * Helper para convertir bigint a string (para JSON)
 */
export function bigintToString(value: bigint | number): string {
  return value.toString();
}

/**
 * Evento: ItemPurchased
 */
export interface ItemPurchasedEvent extends EventMetadata {
  eventName: 'ItemPurchased';
  buyer: string;
  assetId: bigint;
  quantity: bigint;
  unitPrice: bigint;
  totalCost: bigint;
  freeAmount: bigint;
}

/**
 * Evento: BatchPurchase
 */
export interface BatchPurchaseEvent extends EventMetadata {
  eventName: 'BatchPurchase';
  buyer: string;
  assetIds: bigint[];
  quantities: bigint[];
  totalCost: bigint;
  totalFreeAmount: bigint;
}

/**
 * Evento: FreeItemClaimed
 */
export interface FreeItemClaimedEvent extends EventMetadata {
  eventName: 'FreeItemClaimed';
  user: string;
  assetId: bigint;
  quantity: bigint;
}

/**
 * Evento: ShopItemConfigured
 */
export interface ShopItemConfiguredEvent extends EventMetadata {
  eventName: 'ShopItemConfigured';
  assetId: bigint;
  price: bigint;
  quantityAvailable: bigint;
  active: boolean;
}

/**
 * Evento: ShopItemTimingSet
 */
export interface ShopItemTimingSetEvent extends EventMetadata {
  eventName: 'ShopItemTimingSet';
  assetId: bigint;
  startTime: bigint;
  endTime: bigint;
}

/**
 * Evento: ShopItemStatusChanged
 */
export interface ShopItemStatusChangedEvent extends EventMetadata {
  eventName: 'ShopItemStatusChanged';
  assetId: bigint;
  active: boolean;
}

/**
 * Evento: ShopItemPriceChanged
 */
export interface ShopItemPriceChangedEvent extends EventMetadata {
  eventName: 'ShopItemPriceChanged';
  assetId: bigint;
  oldPrice: bigint;
  newPrice: bigint;
}

/**
 * Evento: ShopItemQuantityUpdated
 */
export interface ShopItemQuantityUpdatedEvent extends EventMetadata {
  eventName: 'ShopItemQuantityUpdated';
  assetId: bigint;
  newQuantity: bigint;
}

/**
 * Evento: AllowlistConfigured
 */
export interface AllowlistConfiguredEvent extends EventMetadata {
  eventName: 'AllowlistConfigured';
  assetId: bigint;
  freePerWallet: bigint;
  walletsCount: bigint;
}

/**
 * Evento: WalletsAddedToAllowlist
 */
export interface WalletsAddedToAllowlistEvent extends EventMetadata {
  eventName: 'WalletsAddedToAllowlist';
  assetId: bigint;
  wallets: string[];
}

/**
 * Evento: WalletsRemovedFromAllowlist
 */
export interface WalletsRemovedFromAllowlistEvent extends EventMetadata {
  eventName: 'WalletsRemovedFromAllowlist';
  assetId: bigint;
  wallets: string[];
}

/**
 * Evento: ShopGlobalStatusChanged
 */
export interface ShopGlobalStatusChangedEvent extends EventMetadata {
  eventName: 'ShopGlobalStatusChanged';
  active: boolean;
}

/**
 * Evento: TreasuryOverrideSet
 */
export interface TreasuryOverrideSetEvent extends EventMetadata {
  eventName: 'TreasuryOverrideSet';
  newTreasury: string;
}

/**
 * Union type de todos los eventos de AdrianShopv1
 */
export type AdrianShopEvent =
  | ItemPurchasedEvent
  | BatchPurchaseEvent
  | FreeItemClaimedEvent
  | ShopItemConfiguredEvent
  | ShopItemTimingSetEvent
  | ShopItemStatusChangedEvent
  | ShopItemPriceChangedEvent
  | ShopItemQuantityUpdatedEvent
  | AllowlistConfiguredEvent
  | WalletsAddedToAllowlistEvent
  | WalletsRemovedFromAllowlistEvent
  | ShopGlobalStatusChangedEvent
  | TreasuryOverrideSetEvent;

