/**
 * FloorEngine Contract Configuration
 * Contrato desplegado en Base mainnet
 */

export const FLOOR_ENGINE_ADDRESS = '0x0351F7cBA83277E891D4a85Da498A7eACD764D58' as const;
export const CHAIN_ID = 8453; // Base mainnet
export const CHAIN_NAME = 'base';

/**
 * ABI del contrato FloorEngine
 * Incluye eventos y funciones view necesarias para el listener
 */
export const FLOOR_ENGINE_ABI = [
  // ============================================================================
  // EVENTOS DEL MARKETPLACE
  // ============================================================================
  {
    type: 'event',
    name: 'Listed',
    anonymous: false,
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'seller', type: 'address', indexed: true },
      { name: 'price', type: 'uint256', indexed: false },
      { name: 'isContractOwned', type: 'bool', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Cancelled',
    anonymous: false,
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'seller', type: 'address', indexed: true },
    ],
  },
  {
    type: 'event',
    name: 'Bought',
    anonymous: false,
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'buyer', type: 'address', indexed: true },
      { name: 'seller', type: 'address', indexed: true },
      { name: 'price', type: 'uint256', indexed: false },
      { name: 'isContractOwned', type: 'bool', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'FloorSweep',
    anonymous: false,
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'buyPrice', type: 'uint256', indexed: false },
      { name: 'relistPrice', type: 'uint256', indexed: false },
      { name: 'caller', type: 'address', indexed: true },
      { name: 'callerReward', type: 'uint256', indexed: false },
    ],
  },
  // ============================================================================
  // EVENTOS DE CONFIGURACIÓN
  // ============================================================================
  {
    type: 'event',
    name: 'PremiumUpdated',
    anonymous: false,
    inputs: [
      { name: 'oldPremiumBps', type: 'uint16', indexed: false },
      { name: 'newPremiumBps', type: 'uint16', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'MaxBuyPriceUpdated',
    anonymous: false,
    inputs: [
      { name: 'oldMaxBuyPrice', type: 'uint256', indexed: false },
      { name: 'newMaxBuyPrice', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'CallerRewardModeUpdated',
    anonymous: false,
    inputs: [{ name: 'isPercentage', type: 'bool', indexed: false }],
  },
  {
    type: 'event',
    name: 'CallerRewardBpsUpdated',
    anonymous: false,
    inputs: [
      { name: 'oldBps', type: 'uint16', indexed: false },
      { name: 'newBps', type: 'uint16', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'CallerRewardFixedUpdated',
    anonymous: false,
    inputs: [
      { name: 'oldFixed', type: 'uint256', indexed: false },
      { name: 'newFixed', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'OwnershipTransferred',
    anonymous: false,
    inputs: [
      { name: 'previousOwner', type: 'address', indexed: true },
      { name: 'newOwner', type: 'address', indexed: true },
    ],
  },
  // ============================================================================
  // FUNCIONES VIEW (para lecturas de estado)
  // ============================================================================
  {
    type: 'function',
    stateMutability: 'view',
    name: 'premiumBps',
    inputs: [],
    outputs: [{ name: '', type: 'uint16' }],
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'maxBuyPrice',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'callerRewardBps',
    inputs: [],
    outputs: [{ name: '', type: 'uint16' }],
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'callerRewardFixed',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'callerRewardIsPercentage',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'getListedTokenIds',
    inputs: [],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'listings',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      { name: 'seller', type: 'address' },
      { name: 'price', type: 'uint256' },
      { name: 'isContractOwned', type: 'bool' },
    ],
  },
] as const;

/**
 * Nombres de eventos para filtrado
 */
export const EVENT_NAMES = {
  LISTED: 'Listed',
  CANCELLED: 'Cancelled',
  BOUGHT: 'Bought',
  FLOOR_SWEEP: 'FloorSweep',
  PREMIUM_UPDATED: 'PremiumUpdated',
  MAX_BUY_PRICE_UPDATED: 'MaxBuyPriceUpdated',
  CALLER_REWARD_MODE_UPDATED: 'CallerRewardModeUpdated',
  CALLER_REWARD_BPS_UPDATED: 'CallerRewardBpsUpdated',
  CALLER_REWARD_FIXED_UPDATED: 'CallerRewardFixedUpdated',
  OWNERSHIP_TRANSFERRED: 'OwnershipTransferred',
} as const;

/**
 * Tipo helper para los nombres de eventos
 */
export type EventName = (typeof EVENT_NAMES)[keyof typeof EVENT_NAMES];

