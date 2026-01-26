/**
 * Constructor de queries SQL desde parámetros parseados
 * Genera SQL seguro usando prepared statements
 */

import type { QueryParams, QueryFilter, QueryOrder } from '../types/query.js';

/**
 * Resultado del builder
 */
export interface SQLQuery {
  sql: string;
  params: any[];
}

/**
 * Construir query SELECT
 */
export function buildSelectQuery(table: string, queryParams: QueryParams): SQLQuery {
  const params: any[] = [];
  const parts: string[] = [];
  
  // SELECT
  const columns = queryParams.select || '*';
  parts.push(`SELECT ${sanitizeColumns(columns)}`);
  
  // FROM
  parts.push(`FROM ${sanitizeTableName(table)}`);
  
  // WHERE
  if (queryParams.filters.length > 0) {
    const whereClause = buildWhereClause(queryParams.filters, params);
    if (whereClause) {
      parts.push(`WHERE ${whereClause}`);
    }
  }
  
  // ORDER BY
  if (queryParams.order && queryParams.order.length > 0) {
    const orderClause = buildOrderClause(queryParams.order);
    parts.push(`ORDER BY ${orderClause}`);
  }
  
  // LIMIT
  if (queryParams.limit !== undefined) {
    parts.push(`LIMIT ?`);
    params.push(queryParams.limit);
  }
  
  // OFFSET
  if (queryParams.offset !== undefined) {
    parts.push(`OFFSET ?`);
    params.push(queryParams.offset);
  }
  
  // Range (alternativo a limit/offset)
  if (queryParams.range && queryParams.limit === undefined) {
    const { from, to } = queryParams.range;
    parts.push(`LIMIT ? OFFSET ?`);
    params.push(to - from + 1, from);
  }
  
  return {
    sql: parts.join(' '),
    params,
  };
}

/**
 * Construir query COUNT
 */
export function buildCountQuery(table: string, queryParams: QueryParams): SQLQuery {
  const params: any[] = [];
  const parts: string[] = [];
  
  // SELECT COUNT
  parts.push(`SELECT COUNT(*) as count`);
  
  // FROM
  parts.push(`FROM ${sanitizeTableName(table)}`);
  
  // WHERE
  if (queryParams.filters.length > 0) {
    const whereClause = buildWhereClause(queryParams.filters, params);
    if (whereClause) {
      parts.push(`WHERE ${whereClause}`);
    }
  }
  
  return {
    sql: parts.join(' '),
    params,
  };
}

/**
 * Normalizar valor para SQLite (convierte tipos no soportados)
 */
function normalizeValueForSQLite(v: any): any {
  // undefined -> null (SQLite no acepta undefined)
  if (v === undefined) {
    return null;
  }
  // bigint -> string (SQLite no acepta bigint directamente)
  if (typeof v === 'bigint') {
    return v.toString();
  }
  // objetos/arrays -> JSON string
  if (typeof v === 'object' && v !== null) {
    return JSON.stringify(v);
  }
  // boolean -> 0/1 (SQLite usa integers para booleans)
  if (typeof v === 'boolean') {
    return v ? 1 : 0;
  }
  return v;
}

/**
 * Construir query INSERT
 */
export function buildInsertQuery(table: string, data: Record<string, any>): SQLQuery {
  // Filtrar campos con undefined y normalizar valores
  const entries = Object.entries(data).filter(([_, v]) => v !== undefined);
  const columns = entries.map(([k]) => k);
  const values = entries.map(([_, v]) => normalizeValueForSQLite(v));
  
  const placeholders = columns.map(() => '?').join(', ');
  
  const sql = `INSERT INTO ${sanitizeTableName(table)} (${columns.map(c => sanitizeColumnName(c)).join(', ')}) VALUES (${placeholders})`;
  
  return {
    sql,
    params: values,
  };
}

/**
 * Construir query UPDATE
 */
export function buildUpdateQuery(table: string, data: Record<string, any>, queryParams: QueryParams): SQLQuery {
  const params: any[] = [];
  
  // SET clause - filtrar undefined y normalizar valores
  const entries = Object.entries(data).filter(([_, v]) => v !== undefined);
  const setClause = entries
    .map(([key, value]) => {
      params.push(normalizeValueForSQLite(value));
      return `${sanitizeColumnName(key)} = ?`;
    })
    .join(', ');
  
  const parts = [
    `UPDATE ${sanitizeTableName(table)}`,
    `SET ${setClause}`,
  ];
  
  // WHERE
  if (queryParams.filters.length > 0) {
    const whereClause = buildWhereClause(queryParams.filters, params);
    if (whereClause) {
      parts.push(`WHERE ${whereClause}`);
    }
  }
  
  return {
    sql: parts.join(' '),
    params,
  };
}

/**
 * Construir query DELETE
 */
export function buildDeleteQuery(table: string, queryParams: QueryParams): SQLQuery {
  const params: any[] = [];
  
  const parts = [
    `DELETE FROM ${sanitizeTableName(table)}`,
  ];
  
  // WHERE
  if (queryParams.filters.length > 0) {
    const whereClause = buildWhereClause(queryParams.filters, params);
    if (whereClause) {
      parts.push(`WHERE ${whereClause}`);
    }
  }
  
  return {
    sql: parts.join(' '),
    params,
  };
}

/**
 * Construir cláusula WHERE
 */
function buildWhereClause(filters: QueryFilter[], params: any[]): string {
  const conditions: string[] = [];
  
  for (const filter of filters) {
    const condition = buildCondition(filter, params);
    if (condition) {
      conditions.push(condition);
    }
  }
  
  return conditions.join(' AND ');
}

/**
 * Construir una condición individual
 */
function buildCondition(filter: QueryFilter, params: any[]): string | null {
  const column = sanitizeColumnName(filter.column);
  const value = normalizeValueForSQLite(filter.value);
  
  switch (filter.operator) {
    case 'eq':
      params.push(value);
      return `${column} = ?`;
      
    case 'neq':
      params.push(value);
      return `${column} != ?`;
      
    case 'gt':
      params.push(value);
      return `${column} > ?`;
      
    case 'gte':
      params.push(value);
      return `${column} >= ?`;
      
    case 'lt':
      params.push(value);
      return `${column} < ?`;
      
    case 'lte':
      params.push(value);
      return `${column} <= ?`;
      
    case 'like':
      params.push(value);
      return `${column} LIKE ?`;
      
    case 'ilike':
      params.push(value);
      return `${column} LIKE ? COLLATE NOCASE`;
      
    case 'is':
      if (filter.value === null || filter.value === undefined) {
        return `${column} IS NULL`;
      }
      params.push(value);
      return `${column} IS ?`;
      
    case 'in':
      if (Array.isArray(filter.value) && filter.value.length > 0) {
        const placeholders = filter.value.map(() => '?').join(', ');
        params.push(...filter.value.map(v => normalizeValueForSQLite(v)));
        return `${column} IN (${placeholders})`;
      }
      return null;
      
    case 'not':
      params.push(value);
      return `${column} != ?`;
      
    default:
      params.push(value);
      return `${column} = ?`;
  }
}

/**
 * Construir cláusula ORDER BY
 */
function buildOrderClause(orders: QueryOrder[]): string {
  return orders
    .map(order => {
      const column = sanitizeColumnName(order.column);
      const direction = order.ascending ? 'ASC' : 'DESC';
      const nulls = order.nullsFirst ? 'NULLS FIRST' : '';
      return `${column} ${direction} ${nulls}`.trim();
    })
    .join(', ');
}

/**
 * Sanitizar nombre de tabla (prevenir SQL injection)
 */
function sanitizeTableName(table: string): string {
  // Solo permitir caracteres alfanuméricos y guiones bajos
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
    throw new Error(`Invalid table name: ${table}`);
  }
  return table;
}

/**
 * Sanitizar nombre de columna
 */
function sanitizeColumnName(column: string): string {
  // Manejar JSON path (ej: event_data->>'tokenId')
  if (column.includes('->')) {
    // SQLite usa json_extract en lugar de ->
    const match = column.match(/^(\w+)->>?'?(\w+)'?$/);
    if (match) {
      return `json_extract(${match[1]}, '$.${match[2]}')`;
    }
  }
  
  // Solo permitir caracteres alfanuméricos y guiones bajos
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(column)) {
    throw new Error(`Invalid column name: ${column}`);
  }
  return column;
}

/**
 * Sanitizar lista de columnas para SELECT
 */
function sanitizeColumns(columns: string): string {
  if (columns === '*') return '*';
  
  return columns
    .split(',')
    .map(col => sanitizeColumnName(col.trim()))
    .join(', ');
}

export default {
  buildSelectQuery,
  buildCountQuery,
  buildInsertQuery,
  buildUpdateQuery,
  buildDeleteQuery,
};
