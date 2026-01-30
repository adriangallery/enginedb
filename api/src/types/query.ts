/**
 * Tipos para el sistema de queries compatible con Supabase PostgREST
 */

/**
 * Operadores de filtro soportados
 */
export type FilterOperator = 
  | 'eq'    // Igual a
  | 'neq'   // No igual a
  | 'gt'    // Mayor que
  | 'gte'   // Mayor o igual que
  | 'lt'    // Menor que
  | 'lte'   // Menor o igual que
  | 'like'  // LIKE (con %)
  | 'ilike' // ILIKE (case insensitive)
  | 'is'    // IS (para NULL/NOT NULL)
  | 'in'    // IN (lista de valores)
  | 'cs'    // Contains (para JSON)
  | 'cd'    // Contained by (para JSON)
  | 'not';  // Negación

/**
 * Filtro individual
 */
export interface QueryFilter {
  column: string;
  operator: FilterOperator;
  value: any;
}

/**
 * Orden de resultados
 */
export interface QueryOrder {
  column: string;
  ascending: boolean;
  nullsFirst?: boolean;
}

/**
 * Parámetros de query parseados
 */
export interface QueryParams {
  /** Columnas a seleccionar (comma-separated) */
  select?: string;
  
  /** Filtros a aplicar */
  filters: QueryFilter[];
  
  /** Orden de resultados */
  order?: QueryOrder[];
  
  /** Límite de resultados */
  limit?: number;
  
  /** Offset para paginación */
  offset?: number;
  
  /** Rango (para header Range) */
  range?: { from: number; to: number };
  
  /** Operador lógico (and/or) */
  logicalOperator?: 'and' | 'or';
}

/**
 * Resultado de una query
 */
export interface QueryResult<T = any> {
  data: T[];
  count?: number;
  error?: string;
}

/**
 * Cuerpo de un INSERT
 */
export interface InsertBody {
  [key: string]: any;
}

/**
 * Cuerpo de un UPDATE
 */
export interface UpdateBody {
  [key: string]: any;
}

/**
 * Lista de tablas válidas
 */
export const VALID_TABLES = [
  'sync_state',
  'punk_listings',
  'listing_events',
  'trade_events',
  'sweep_events',
  'engine_config_events',
  'erc20_transfers',
  'erc20_approvals',
  'erc20_custom_events',
  'erc721_transfers',
  'erc721_approvals',
  'erc721_approvals_for_all',
  'erc721_custom_events',
  'erc1155_transfers_single',
  'erc1155_transfers_batch',
  'erc1155_approvals_for_all',
  'erc1155_uri_updates',
  'erc1155_custom_events',
  'traits_extensions_events',
  'shop_events',
  'name_registry_events',
  'name_registry_config_events',
  'serum_module_events',
  'punk_quest_staking_events',
  'punk_quest_item_events',
  'punk_quest_event_events',
] as const;

export type ValidTable = typeof VALID_TABLES[number];

/**
 * Verificar si una tabla es válida
 */
export function isValidTable(table: string): table is ValidTable {
  return VALID_TABLES.includes(table as ValidTable);
}
