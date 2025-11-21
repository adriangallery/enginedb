/**
 * Configuración del contrato AdrianSerumModule
 * Address: 0xEb84a51F8d59d1C55cACFd15074AeB104D82B2ec
 * Red: Base Mainnet (Chain ID: 8453)
 */

import type { ContractConfig } from './adrian-token.js';

/**
 * Configuración del contrato AdrianSerumModule
 */
export const ADRIAN_SERUM_MODULE_CONFIG: ContractConfig = {
  address: '0xEb84a51F8d59d1C55cACFd15074AeB104D82B2ec',
  name: 'AdrianSerumModule',
  type: 'custom',
  // Start block: Bloque de deployment del contrato
  // Deployment block: 26367738 (mismo que ERC20)
  startBlock: 26367738n,
  enabled: true,
};
