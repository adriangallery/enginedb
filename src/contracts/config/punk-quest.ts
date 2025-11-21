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
  address: '0xaF22843e195B792A3f874562ab7CEE751066665E',
  name: 'PunkQuest',
  type: 'custom',
  // Start block: Bloque de deployment del contrato
  // ⚠️ ACTUALIZAR CON EL BLOQUE DE DEPLOYMENT REAL (obtener de Basescan)
  startBlock: 0n, // ⚠️ ACTUALIZAR con el bloque de deployment
  enabled: true,
};

