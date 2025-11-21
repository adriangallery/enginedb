/**
 * Configuración del contrato AdrianNameRegistry
 * Address: 0xaeC5ED33c88c1943BB7452aC4B571ad0b4c4068C
 * Red: Base Mainnet (Chain ID: 8453)
 */

import type { ContractConfig } from './adrian-token.js';

/**
 * Configuración del contrato AdrianNameRegistry
 */
export const ADRIAN_NAME_REGISTRY_CONFIG: ContractConfig = {
  address: '0xaeC5ED33c88c1943BB7452aC4B571ad0b4c4068C',
  name: 'AdrianNameRegistry',
  type: 'custom',
  // Start block: Bloque de deployment del contrato
  // Deployment block: 26367738 (mismo que ERC20)
  startBlock: 26367738n,
  enabled: true,
};
