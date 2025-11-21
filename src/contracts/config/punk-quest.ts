/**
 * Configuración del contrato PunkQuest
 * Address: 0xaF22843e195B792A3f874562ab7CEE751066665E
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
  // Deployment block: 26367738 (mismo que ERC20)
  startBlock: 26367738n,
  enabled: true,
};
