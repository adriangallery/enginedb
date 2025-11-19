/**
 * ABI completo del contrato AdrianTraitsExtensions
 * Eventos custom para gestión de traits e inventario
 */

export const ADRIAN_TRAITS_EXTENSIONS_ABI = [
  {
    type: 'event',
    name: 'TraitEquipped',
    anonymous: false,
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'category', type: 'string', indexed: false },
      { name: 'traitId', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'TraitUnequipped',
    anonymous: false,
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'category', type: 'string', indexed: false },
      { name: 'traitId', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'TraitApplied',
    anonymous: false,
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'category', type: 'string', indexed: false },
      { name: 'traitId', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'TraitsAppliedBatch',
    anonymous: false,
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'traitIds', type: 'uint256[]', indexed: false },
      { name: 'categories', type: 'string[]', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'AssetAddedToInventory',
    anonymous: false,
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'assetId', type: 'uint256', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'AssetRemovedFromInventory',
    anonymous: false,
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'assetId', type: 'uint256', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'CoreContractCallReceived',
    anonymous: false,
    inputs: [
      { name: 'core', type: 'address', indexed: true },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
] as const;

