/**
 * ABI del contrato AdrianSerumModule
 * Eventos de aplicación de serums
 */

export const ADRIAN_SERUM_MODULE_ABI = [
  {
    type: 'event',
    name: 'SerumResult',
    anonymous: false,
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'serumId', type: 'uint256', indexed: true },
      { name: 'success', type: 'bool', indexed: false },
      { name: 'mutation', type: 'string', indexed: false },
    ],
  },
] as const;

