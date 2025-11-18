/**
 * Exportar todas las configuraciones de contratos
 */

import { ADRIAN_TOKEN_CONFIG, type ContractConfig } from './adrian-token.js';

/**
 * Obtener todos los contratos activos
 */
export function getActiveContracts(): ContractConfig[] {
  return [ADRIAN_TOKEN_CONFIG].filter((config) => config.enabled);
}

/**
 * Obtener configuración de contrato por address
 */
export function getContractByAddress(
  address: string
): ContractConfig | undefined {
  const allContracts = [ADRIAN_TOKEN_CONFIG];
  return allContracts.find(
    (config) => config.address.toLowerCase() === address.toLowerCase()
  );
}

/**
 * Exportar configuraciones individuales
 */
export { ADRIAN_TOKEN_CONFIG, type ContractConfig };

