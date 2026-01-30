/**
 * Configuración del contrato AdrianTraitsCore (ERC1155)
 * Address: 0x90546848474fb3c9fda3fdad887969bb244e7e58
 * Red: Base Mainnet (Chain ID: 8453)
 */

import type { ContractConfig } from './adrian-token.js';

/**
 * Configuración del contrato AdrianTraitsCore
 */
export const ADRIAN_TRAITS_CORE_CONFIG: ContractConfig = {
  address: '0x90546848474fb3c9fda3fdad887969bb244e7e58',
  name: 'AdrianTraitsCore',
  type: 'ERC1155',
  // Start block: Bloque de deployment del contrato
  // Deployment block: 32334620
  startBlock: 32334620n,
  enabled: true,
};

