/**
 * Configuración del contrato AdrianNameRegistry
 * Address: [ACTUALIZAR CON LA DIRECCIÓN REAL]
 * Red: Base Mainnet (Chain ID: 8453)
 */

import type { ContractConfig } from './adrian-token.js';

/**
 * Configuración del contrato AdrianNameRegistry
 */
export const ADRIAN_NAME_REGISTRY_CONFIG: ContractConfig = {
  address: '0x0000000000000000000000000000000000000000', // ⚠️ ACTUALIZAR CON LA DIRECCIÓN REAL
  name: 'AdrianNameRegistry',
  type: 'custom',
  // Start block: Bloque de deployment del contrato
  // ⚠️ ACTUALIZAR CON EL BLOQUE DE DEPLOYMENT REAL
  startBlock: 0n, // ⚠️ ACTUALIZAR
  enabled: true,
};

