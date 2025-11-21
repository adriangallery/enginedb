/**
 * Configuración del contrato AdrianSerumModule
 * Address: [ACTUALIZAR CON LA DIRECCIÓN REAL]
 * Red: Base Mainnet (Chain ID: 8453)
 */

import type { ContractConfig } from './adrian-token.js';

/**
 * Configuración del contrato AdrianSerumModule
 */
export const ADRIAN_SERUM_MODULE_CONFIG: ContractConfig = {
  address: '0x0000000000000000000000000000000000000000', // ⚠️ ACTUALIZAR CON LA DIRECCIÓN REAL
  name: 'AdrianSerumModule',
  type: 'custom',
  // Start block: Bloque de deployment del contrato
  // ⚠️ ACTUALIZAR CON EL BLOQUE DE DEPLOYMENT REAL
  startBlock: 0n, // ⚠️ ACTUALIZAR
  enabled: true,
};

