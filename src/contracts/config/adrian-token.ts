/**
 * Configuración del contrato $ADRIAN Token (ERC20)
 * Address: 0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea
 * Red: Base Mainnet (Chain ID: 8453)
 */

export interface ContractConfig {
  address: string;
  name: string;
  type: 'ERC20' | 'ERC721' | 'ERC1155' | 'custom';
  startBlock?: bigint; // Bloque de deployment (opcional, se puede obtener de Basescan)
  enabled: boolean;
}

/**
 * Configuración del contrato $ADRIAN Token
 */
export const ADRIAN_TOKEN_CONFIG: ContractConfig = {
  address: '0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea',
  name: 'ADRIAN Token',
  type: 'ERC20',
  // Start block: Se puede obtener de Basescan o configurar manualmente
  // Ejemplo: startBlock: 38200000n (ajustar según deployment real)
  enabled: true,
};

