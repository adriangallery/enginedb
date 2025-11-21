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
  address: '0xaeC5ED33c88c1943BB7452aC4B571ad0b4c4068C',
  name: 'AdrianNameRegistry',
  type: 'custom',
  // Start block: Bloque de deployment del contrato
  // ⚠️ ACTUALIZAR CON EL BLOQUE DE DEPLOYMENT REAL (obtener de Basescan)
  startBlock: 0n, // ⚠️ ACTUALIZAR con el bloque de deployment
  enabled: true,
};

