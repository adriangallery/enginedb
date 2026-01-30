/**
 * Configuración del contrato AdrianPunks (ERC721)
 * Address: 0x79BE8AcdD339C7b92918fcC3fd3875b5Aaad7566
 * Red: Base Mainnet (Chain ID: 8453)
 */

import type { ContractConfig } from './adrian-token.js';

/**
 * Configuración del contrato AdrianPunks
 */
export const ADRIAN_PUNKS_CONFIG: ContractConfig = {
  address: '0x79BE8AcdD339C7b92918fcC3fd3875b5Aaad7566',
  name: 'AdrianPunks',
  type: 'ERC721',
  // Start block: Bloque de deployment del contrato
  // TODO: Actualizar con el bloque correcto desde Basescan
  // Por ahora usando el mismo que ERC20 como placeholder
  startBlock: 26367738n,
  enabled: true,
};

