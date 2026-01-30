/**
 * Configuración del contrato AdrianShopv1
 * Address: 0x4b265927b1521995ce416bba3bed98231d2e946b
 * Red: Base Mainnet (Chain ID: 8453)
 */

import type { ContractConfig } from './adrian-token.js';

/**
 * Configuración del contrato AdrianShopv1
 */
export const ADRIAN_SHOP_CONFIG: ContractConfig = {
  address: '0x4b265927b1521995ce416bba3bed98231d2e946b',
  name: 'AdrianShopv1',
  type: 'custom',
  // Start block: Bloque de deployment del contrato
  // Deployment block: 33273455
  startBlock: 33273455n,
  enabled: true,
};

