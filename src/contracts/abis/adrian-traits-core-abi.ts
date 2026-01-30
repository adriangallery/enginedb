/**
 * ABI completo del contrato AdrianTraitsCore (ERC1155)
 * Incluye eventos estándar ERC1155 + eventos custom
 */

import { ERC1155_STANDARD_ABI } from './erc1155-standard.js';

/**
 * ABI completo de AdrianTraitsCore
 * Combina eventos estándar ERC1155 con eventos custom
 */
export const ADRIAN_TRAITS_CORE_ABI = [
  ...ERC1155_STANDARD_ABI,
  // Eventos custom de AdrianTraitsCore
  {
    type: 'event',
    name: 'AssetRegistered',
    anonymous: false,
    inputs: [
      { name: 'assetId', type: 'uint256', indexed: true },
      { name: 'category', type: 'string', indexed: false },
      { name: 'assetType', type: 'uint8', indexed: false }, // AssetType enum
    ],
  },
  {
    type: 'event',
    name: 'AssetMinted',
    anonymous: false,
    inputs: [
      { name: 'assetId', type: 'uint256', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'AssetBurned',
    anonymous: false,
    inputs: [
      { name: 'assetId', type: 'uint256', indexed: true },
      { name: 'from', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'CategoryAdded',
    anonymous: false,
    inputs: [{ name: 'category', type: 'string', indexed: true }],
  },
  {
    type: 'event',
    name: 'CategoryRemoved',
    anonymous: false,
    inputs: [{ name: 'category', type: 'string', indexed: true }],
  },
  {
    type: 'event',
    name: 'AssetTypeAdded',
    anonymous: false,
    inputs: [{ name: 'typeName', type: 'string', indexed: false }],
  },
  {
    type: 'event',
    name: 'ExtensionAdded',
    anonymous: false,
    inputs: [{ name: 'extension', type: 'address', indexed: true }],
  },
  {
    type: 'event',
    name: 'ExtensionRemoved',
    anonymous: false,
    inputs: [{ name: 'extension', type: 'address', indexed: true }],
  },
  {
    type: 'event',
    name: 'PaymentTokenUpdated',
    anonymous: false,
    inputs: [{ name: 'newToken', type: 'address', indexed: false }],
  },
  {
    type: 'event',
    name: 'AssetUpdated',
    anonymous: false,
    inputs: [
      { name: 'assetId', type: 'uint256', indexed: true },
      { name: 'field', type: 'string', indexed: false },
      { name: 'newValue', type: 'string', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'BaseURIUpdated',
    anonymous: false,
    inputs: [{ name: 'newURI', type: 'string', indexed: false }],
  },
] as const;

