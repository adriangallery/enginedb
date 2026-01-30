/**
 * Configuración del contrato FloorEngine
 * Address: 0x0351F7cBA83277E891D4a85Da498A7eACD764D58
 * Red: Base Mainnet (Chain ID: 8453)
 */

import type { ContractConfig } from './adrian-token.js';

/**
 * Configuración del contrato FloorEngine
 */
export const FLOOR_ENGINE_CONFIG: ContractConfig = {
  address: '0x0351F7cBA83277E891D4a85Da498A7eACD764D58',
  name: 'FloorEngine',
  type: 'custom',
  // Start block: Puedes ajustar esto al bloque de deployment real
  // Por ahora usando 0n para procesar desde el principio
  startBlock: 0n,
  enabled: true,
};

