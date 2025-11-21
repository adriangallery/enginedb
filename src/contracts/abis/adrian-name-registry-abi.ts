/**
 * ABI del contrato AdrianNameRegistry
 * Eventos de nombres y configuración
 */

export const ADRIAN_NAME_REGISTRY_ABI = [
  {
    type: 'event',
    name: 'NameSet',
    anonymous: false,
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'newName', type: 'string', indexed: true },
      { name: 'setter', type: 'address', indexed: true },
      { name: 'paid', type: 'bool', indexed: false },
      { name: 'price', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'PriceUpdated',
    anonymous: false,
    inputs: [
      { name: 'oldPrice', type: 'uint256', indexed: false },
      { name: 'newPrice', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'TreasuryUpdated',
    anonymous: false,
    inputs: [
      { name: 'oldTreasury', type: 'address', indexed: false },
      { name: 'newTreasury', type: 'address', indexed: false },
    ],
  },
] as const;

