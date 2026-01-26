/**
 * Parser de queries compatible con Supabase PostgREST
 * Convierte query strings al formato interno
 */

import type { QueryParams, QueryFilter, QueryOrder, FilterOperator } from '../types/query.js';

/**
 * Operadores soportados y su mapeo
 */
const OPERATOR_MAP: Record<string, FilterOperator> = {
  'eq': 'eq',
  'neq': 'neq',
  'gt': 'gt',
  'gte': 'gte',
  'lt': 'lt',
  'lte': 'lte',
  'like': 'like',
  'ilike': 'ilike',
  'is': 'is',
  'in': 'in',
  'cs': 'cs',
  'cd': 'cd',
  'not': 'not',
};

/**
 * Parsear el query string de una URL
 */
export function parseQueryString(queryString: string | URLSearchParams | Record<string, any>): QueryParams {
  let params: URLSearchParams;
  
  if (typeof queryString === 'string') {
    params = new URLSearchParams(queryString);
  } else if (queryString instanceof URLSearchParams) {
    params = queryString;
  } else {
    // Es un objeto (como req.query de Express)
    params = new URLSearchParams();
    for (const [key, value] of Object.entries(queryString)) {
      if (typeof value === 'string') {
        params.set(key, value);
      } else if (Array.isArray(value)) {
        // Si es array, usar el primer valor
        params.set(key, String(value[0]));
      }
    }
  }
  
  const result: QueryParams = {
    filters: [],
  };
  
  // Parsear cada parámetro
  for (const [key, value] of params.entries()) {
    // Select
    if (key === 'select') {
      result.select = value;
      continue;
    }
    
    // Order
    if (key === 'order') {
      result.order = parseOrder(value);
      continue;
    }
    
    // Limit
    if (key === 'limit') {
      result.limit = parseInt(value, 10);
      continue;
    }
    
    // Offset
    if (key === 'offset') {
      result.offset = parseInt(value, 10);
      continue;
    }
    
    // Filtros con formato columna=operador.valor
    // Ejemplo: token_id=eq.123 o price_wei=gt.1000
    const filter = parseFilter(key, value);
    if (filter) {
      result.filters.push(filter);
    }
  }
  
  return result;
}

/**
 * Parsear un filtro individual
 * Formato: columna=operador.valor
 */
function parseFilter(column: string, value: string): QueryFilter | null {
  // Buscar el operador al inicio del valor
  const dotIndex = value.indexOf('.');
  
  if (dotIndex === -1) {
    // Sin operador, asumir eq
    return {
      column,
      operator: 'eq',
      value: parseValue(value),
    };
  }
  
  const operatorStr = value.substring(0, dotIndex);
  const rawValue = value.substring(dotIndex + 1);
  
  // Verificar si es un operador válido
  if (operatorStr in OPERATOR_MAP) {
    return {
      column,
      operator: OPERATOR_MAP[operatorStr],
      value: parseValue(rawValue, operatorStr as FilterOperator),
    };
  }
  
  // Si no es un operador reconocido, tratarlo como eq con el valor completo
  return {
    column,
    operator: 'eq',
    value: parseValue(value),
  };
}

/**
 * Parsear el valor según el operador
 */
function parseValue(value: string, operator?: FilterOperator): any {
  // Para operador 'in', parsear como array
  if (operator === 'in') {
    // Formato: (val1,val2,val3)
    if (value.startsWith('(') && value.endsWith(')')) {
      const inner = value.slice(1, -1);
      return inner.split(',').map(v => parseSimpleValue(v.trim()));
    }
    return [parseSimpleValue(value)];
  }
  
  // Para operador 'is', manejar null/true/false
  if (operator === 'is') {
    if (value.toLowerCase() === 'null') return null;
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    return value;
  }
  
  return parseSimpleValue(value);
}

/**
 * Parsear un valor simple (número, boolean, string)
 */
function parseSimpleValue(value: string): any {
  // Intentar parsear como número
  const num = Number(value);
  if (!isNaN(num) && value.trim() !== '') {
    return num;
  }
  
  // Boolean
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  
  // Null
  if (value.toLowerCase() === 'null') return null;
  
  // String (remover comillas si las tiene)
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  
  return value;
}

/**
 * Parsear el orden
 * Formato: columna.asc o columna.desc
 */
function parseOrder(value: string): QueryOrder[] {
  const orders: QueryOrder[] = [];
  
  const parts = value.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    
    // Formato: columna.asc o columna.desc
    const dotIndex = trimmed.lastIndexOf('.');
    
    if (dotIndex === -1) {
      // Sin dirección, asumir asc
      orders.push({
        column: trimmed,
        ascending: true,
      });
    } else {
      const column = trimmed.substring(0, dotIndex);
      const direction = trimmed.substring(dotIndex + 1).toLowerCase();
      
      orders.push({
        column,
        ascending: direction !== 'desc',
        nullsFirst: direction.includes('nullsfirst'),
      });
    }
  }
  
  return orders;
}

/**
 * Parsear el header Range para paginación
 * Formato: 0-9 (significa filas 0 a 9, total 10)
 */
export function parseRangeHeader(range: string | null): { from: number; to: number } | undefined {
  if (!range) return undefined;
  
  const match = range.match(/^(\d+)-(\d+)$/);
  if (!match) return undefined;
  
  return {
    from: parseInt(match[1], 10),
    to: parseInt(match[2], 10),
  };
}

export default {
  parseQueryString,
  parseRangeHeader,
};
