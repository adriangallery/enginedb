/**
 * ABI completo del contrato AdrianShopv1
 * Eventos de compras y configuración de shop
 */

export const ADRIAN_SHOP_ABI = [
  {
    type: 'event',
    name: 'ItemPurchased',
    anonymous: false,
    inputs: [
      { name: 'buyer', type: 'address', indexed: true },
      { name: 'assetId', type: 'uint256', indexed: true },
      { name: 'quantity', type: 'uint256', indexed: false },
      { name: 'unitPrice', type: 'uint256', indexed: false },
      { name: 'totalCost', type: 'uint256', indexed: false },
      { name: 'freeAmount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'BatchPurchase',
    anonymous: false,
    inputs: [
      { name: 'buyer', type: 'address', indexed: true },
      { name: 'assetIds', type: 'uint256[]', indexed: false },
      { name: 'quantities', type: 'uint256[]', indexed: false },
      { name: 'totalCost', type: 'uint256', indexed: false },
      { name: 'totalFreeAmount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'FreeItemClaimed',
    anonymous: false,
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'assetId', type: 'uint256', indexed: true },
      { name: 'quantity', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ShopItemConfigured',
    anonymous: false,
    inputs: [
      { name: 'assetId', type: 'uint256', indexed: true },
      { name: 'price', type: 'uint256', indexed: false },
      { name: 'quantityAvailable', type: 'uint256', indexed: false },
      { name: 'active', type: 'bool', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ShopItemTimingSet',
    anonymous: false,
    inputs: [
      { name: 'assetId', type: 'uint256', indexed: true },
      { name: 'startTime', type: 'uint256', indexed: false },
      { name: 'endTime', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ShopItemStatusChanged',
    anonymous: false,
    inputs: [
      { name: 'assetId', type: 'uint256', indexed: true },
      { name: 'active', type: 'bool', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ShopItemPriceChanged',
    anonymous: false,
    inputs: [
      { name: 'assetId', type: 'uint256', indexed: true },
      { name: 'oldPrice', type: 'uint256', indexed: false },
      { name: 'newPrice', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ShopItemQuantityUpdated',
    anonymous: false,
    inputs: [
      { name: 'assetId', type: 'uint256', indexed: true },
      { name: 'newQuantity', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'AllowlistConfigured',
    anonymous: false,
    inputs: [
      { name: 'assetId', type: 'uint256', indexed: true },
      { name: 'freePerWallet', type: 'uint256', indexed: false },
      { name: 'walletsCount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'WalletsAddedToAllowlist',
    anonymous: false,
    inputs: [
      { name: 'assetId', type: 'uint256', indexed: true },
      { name: 'wallets', type: 'address[]', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'WalletsRemovedFromAllowlist',
    anonymous: false,
    inputs: [
      { name: 'assetId', type: 'uint256', indexed: true },
      { name: 'wallets', type: 'address[]', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ShopGlobalStatusChanged',
    anonymous: false,
    inputs: [{ name: 'active', type: 'bool', indexed: false }],
  },
  {
    type: 'event',
    name: 'TreasuryOverrideSet',
    anonymous: false,
    inputs: [{ name: 'newTreasury', type: 'address', indexed: false }],
  },
] as const;

