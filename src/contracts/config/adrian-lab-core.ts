/**
 * Configuración del contrato AdrianLABCore (ERC721)
 * Address: 0x6e369bf0e4e0c106192d606fb6d85836d684da75
 * Red: Base Mainnet (Chain ID: 8453)
 * Nombre: AdrianZERO
 */

import type { ContractConfig } from './adrian-token.js';

/**
 * Configuración del contrato AdrianLABCore (AdrianZERO)
 */
export const ADRIAN_LAB_CORE_CONFIG: ContractConfig = {
  address: '0x6e369bf0e4e0c106192d606fb6d85836d684da75',
  name: 'AdrianLABCore',
  type: 'ERC721',
  // Start block: Bloque de deployment del contrato
  // Deployment block: 31180024
  startBlock: 31180024n,
  enabled: true,
};

