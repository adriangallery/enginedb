/**
 * ABI completo del contrato $ADRIAN Token
 * Incluye eventos estándar ERC20 + eventos custom
 */

import { ERC20_STANDARD_ABI } from './erc20-standard.js';

/**
 * ABI completo de ADRIANtoken
 * Combina eventos estándar ERC20 con eventos custom
 */
export const ADRIAN_TOKEN_ABI = [
  ...ERC20_STANDARD_ABI,
  // Eventos custom de configuración de fees
  {
    type: 'event',
    name: 'TaxFeeUpdated',
    anonymous: false,
    inputs: [{ name: 'newTaxFee', type: 'uint256', indexed: false }],
  },
  {
    type: 'event',
    name: 'CreatorFeeUpdated',
    anonymous: false,
    inputs: [{ name: 'newCreatorFee', type: 'uint256', indexed: false }],
  },
  {
    type: 'event',
    name: 'BurnFeeUpdated',
    anonymous: false,
    inputs: [{ name: 'newBurnFee', type: 'uint256', indexed: false }],
  },
  {
    type: 'event',
    name: 'TaxAddressUpdated',
    anonymous: false,
    inputs: [{ name: 'newTaxAddress', type: 'address', indexed: false }],
  },
  {
    type: 'event',
    name: 'CreatorAddressUpdated',
    anonymous: false,
    inputs: [{ name: 'newCreatorAddress', type: 'address', indexed: false }],
  },
  {
    type: 'event',
    name: 'FeeExemptionUpdated',
    anonymous: false,
    inputs: [
      { name: 'account', type: 'address', indexed: true },
      { name: 'isExempt', type: 'bool', indexed: false },
    ],
  },
  // Eventos de staking
  {
    type: 'event',
    name: 'Staked',
    anonymous: false,
    inputs: [
      { name: 'staker', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'WithdrawnStake',
    anonymous: false,
    inputs: [
      { name: 'staker', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'reward', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'RewardRateUpdated',
    anonymous: false,
    inputs: [{ name: 'newRewardRate', type: 'uint256', indexed: false }],
  },
  // Evento de integración
  {
    type: 'event',
    name: 'GalleryAction',
    anonymous: false,
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'action', type: 'string', indexed: false },
    ],
  },
] as const;

