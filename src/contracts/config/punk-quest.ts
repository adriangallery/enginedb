/**
 * Configuración del contrato PunkQuest
 * Address: [ACTUALIZAR CON LA DIRECCIÓN REAL]
 * Red: Base Mainnet (Chain ID: 8453)
 */

import type { ContractConfig } from './adrian-token.js';

/**
 * Configuración del contrato PunkQuest
 */
export const PUNK_QUEST_CONFIG: ContractConfig = {
  address: '0x0000000000000000000000000000000000000000', // ⚠️ ACTUALIZAR CON LA DIRECCIÓN REAL
  name: 'PunkQuest',
  type: 'custom',
  // Start block: Bloque de deployment del contrato
  // ⚠️ ACTUALIZAR CON EL BLOQUE DE DEPLOYMENT REAL
  startBlock: 0n, // ⚠️ ACTUALIZAR
  enabled: true,
};

