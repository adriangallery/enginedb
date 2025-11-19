/**
 * ABI completo del contrato AdrianLABCore (ERC721)
 * Incluye eventos estándar ERC721 + eventos custom
 */

import { ERC721_STANDARD_ABI } from './erc721-standard.js';

/**
 * ABI completo de AdrianLABCore
 * Combina eventos estándar ERC721 con eventos custom
 */
export const ADRIAN_LAB_CORE_ABI = [
  ...ERC721_STANDARD_ABI,
  // Eventos custom de minting y tokens
  {
    type: 'event',
    name: 'TokenMinted',
    anonymous: false,
    inputs: [
      { name: 'to', type: 'address', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: true },
    ],
  },
  {
    type: 'event',
    name: 'TokenBurnt',
    anonymous: false,
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'burner', type: 'address', indexed: true },
    ],
  },
  // Eventos de sistema de skins
  {
    type: 'event',
    name: 'SkinCreated',
    anonymous: false,
    inputs: [
      { name: 'skinId', type: 'uint256', indexed: true },
      { name: 'name', type: 'string', indexed: false },
      { name: 'rarity', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'SkinAssigned',
    anonymous: false,
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'skinId', type: 'uint256', indexed: true },
      { name: 'name', type: 'string', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'SkinUpdated',
    anonymous: false,
    inputs: [
      { name: 'skinId', type: 'uint256', indexed: true },
      { name: 'name', type: 'string', indexed: false },
      { name: 'rarity', type: 'uint256', indexed: false },
      { name: 'active', type: 'bool', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'SkinRemoved',
    anonymous: false,
    inputs: [{ name: 'skinId', type: 'uint256', indexed: true }],
  },
  {
    type: 'event',
    name: 'RandomSkinToggled',
    anonymous: false,
    inputs: [{ name: 'enabled', type: 'bool', indexed: false }],
  },
  // Eventos de mutaciones
  {
    type: 'event',
    name: 'MutationAssigned',
    anonymous: false,
    inputs: [{ name: 'tokenId', type: 'uint256', indexed: true }],
  },
  {
    type: 'event',
    name: 'MutationNameAssigned',
    anonymous: false,
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'newMutation', type: 'string', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'SerumApplied',
    anonymous: false,
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'serumId', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'MutationSkinSet',
    anonymous: false,
    inputs: [
      { name: 'mutation', type: 'string', indexed: true },
      { name: 'skinId', type: 'uint256', indexed: true },
    ],
  },
  {
    type: 'event',
    name: 'SpecialSkinApplied',
    anonymous: false,
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'skinId', type: 'uint256', indexed: true },
      { name: 'mutation', type: 'string', indexed: false },
    ],
  },
  // Eventos de configuración
  {
    type: 'event',
    name: 'BaseURIUpdated',
    anonymous: false,
    inputs: [{ name: 'newURI', type: 'string', indexed: false }],
  },
  {
    type: 'event',
    name: 'ExtensionsContractUpdated',
    anonymous: false,
    inputs: [{ name: 'newContract', type: 'address', indexed: false }],
  },
  {
    type: 'event',
    name: 'TraitsContractUpdated',
    anonymous: false,
    inputs: [{ name: 'newContract', type: 'address', indexed: false }],
  },
  {
    type: 'event',
    name: 'PaymentTokenUpdated',
    anonymous: false,
    inputs: [{ name: 'newToken', type: 'address', indexed: false }],
  },
  {
    type: 'event',
    name: 'TreasuryWalletUpdated',
    anonymous: false,
    inputs: [{ name: 'newWallet', type: 'address', indexed: false }],
  },
  {
    type: 'event',
    name: 'AdminContractUpdated',
    anonymous: false,
    inputs: [{ name: 'newAdmin', type: 'address', indexed: false }],
  },
  {
    type: 'event',
    name: 'FunctionImplementationUpdated',
    anonymous: false,
    inputs: [
      { name: 'selector', type: 'bytes4', indexed: true },
      { name: 'implementation', type: 'address', indexed: true },
    ],
  },
  // Eventos de operaciones
  {
    type: 'event',
    name: 'ProceedsWithdrawn',
    anonymous: false,
    inputs: [
      { name: 'wallet', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'FirstModification',
    anonymous: false,
    inputs: [{ name: 'tokenId', type: 'uint256', indexed: true }],
  },
] as const;

