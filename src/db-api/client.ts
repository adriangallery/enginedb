/**
 * Cliente HTTP para la API SQLite
 * Compatible con la interfaz de Supabase
 */

// Configuración
// En Railway, la API corre en el mismo contenedor en el puerto 8080
const DB_API_URL = process.env.DB_API_URL || `http://localhost:${process.env.PORT || 8080}`;
const DB_API_KEY = process.env.DB_API_KEY || process.env.API_KEY || '';

/**
 * Interfaz compatible con Supabase
 */
interface QueryBuilder {
  select(columns?: string): QueryBuilder;
  insert(data: any): QueryBuilder;
  update(data: any): QueryBuilder;
  upsert(data: any, options?: { onConflict?: string }): QueryBuilder;
  delete(): QueryBuilder;
  eq(column: string, value: any): QueryBuilder;
  neq(column: string, value: any): QueryBuilder;
  gt(column: string, value: any): QueryBuilder;
  gte(column: string, value: any): QueryBuilder;
  lt(column: string, value: any): QueryBuilder;
  lte(column: string, value: any): QueryBuilder;
  in(column: string, values: any[]): QueryBuilder;
  order(column: string, options?: { ascending?: boolean }): QueryBuilder;
  limit(count: number): QueryBuilder;
  range(from: number, to: number): QueryBuilder;
  single(): QueryBuilder;
  then<T>(resolve: (result: { data: T | null; error: any }) => void): void;
}

/**
 * Crear cliente de API
 */
export function createDBAPIClient() {
  return {
    from: (table: string) => createQueryBuilder(table),
  };
}

/**
 * Crear query builder para una tabla
 */
function createQueryBuilder(table: string): QueryBuilder {
  let method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET';
  let selectColumns: string | undefined;
  let body: any = undefined;
  let filters: string[] = [];
  let orderBy: string | undefined;
  let limitCount: number | undefined;
  let rangeFrom: number | undefined;
  let rangeTo: number | undefined;
  let isSingle = false;

  const builder: QueryBuilder = {
    select(columns?: string) {
      method = 'GET';
      selectColumns = columns;
      return builder;
    },

    insert(data: any) {
      method = 'POST';
      body = data;
      return builder;
    },

    update(data: any) {
      method = 'PATCH';
      body = data;
      return builder;
    },

    upsert(data: any, options?: { onConflict?: string }) {
      method = 'POST';
      body = data;
      // Add upsert header/param for the API to handle
      if (options?.onConflict) {
        filters.push(`on_conflict=${options.onConflict}`);
      }
      return builder;
    },

    delete() {
      method = 'DELETE';
      return builder;
    },

    eq(column: string, value: any) {
      filters.push(`${column}=eq.${encodeURIComponent(value)}`);
      return builder;
    },

    neq(column: string, value: any) {
      filters.push(`${column}=neq.${encodeURIComponent(value)}`);
      return builder;
    },

    gt(column: string, value: any) {
      filters.push(`${column}=gt.${encodeURIComponent(value)}`);
      return builder;
    },

    gte(column: string, value: any) {
      filters.push(`${column}=gte.${encodeURIComponent(value)}`);
      return builder;
    },

    lt(column: string, value: any) {
      filters.push(`${column}=lt.${encodeURIComponent(value)}`);
      return builder;
    },

    lte(column: string, value: any) {
      filters.push(`${column}=lte.${encodeURIComponent(value)}`);
      return builder;
    },

    in(column: string, values: any[]) {
      filters.push(`${column}=in.(${values.map(v => encodeURIComponent(v)).join(',')})`);
      return builder;
    },

    order(column: string, options?: { ascending?: boolean }) {
      const direction = options?.ascending === false ? 'desc' : 'asc';
      orderBy = `${column}.${direction}`;
      return builder;
    },

    limit(count: number) {
      limitCount = count;
      return builder;
    },

    range(from: number, to: number) {
      rangeFrom = from;
      rangeTo = to;
      return builder;
    },

    single() {
      isSingle = true;
      limitCount = 1;
      return builder;
    },

    then<T>(resolve: (result: { data: T | null; error: any }) => void) {
      executeQuery<T>().then(resolve);
    },
  };

  async function executeQuery<T>(): Promise<{ data: T | null; error: any }> {
    try {
      // Construir URL
      const params = new URLSearchParams();
      
      if (selectColumns) {
        params.set('select', selectColumns);
      }
      
      for (const filter of filters) {
        const [key, value] = filter.split('=');
        params.set(key, value);
      }
      
      if (orderBy) {
        params.set('order', orderBy);
      }
      
      if (limitCount !== undefined) {
        params.set('limit', String(limitCount));
      }
      
      const queryString = params.toString();
      const url = `${DB_API_URL}/rest/v1/${table}${queryString ? `?${queryString}` : ''}`;
      
      // Headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (DB_API_KEY) {
        headers['apikey'] = DB_API_KEY;
        headers['Authorization'] = `Bearer ${DB_API_KEY}`;
      }
      
      if (rangeFrom !== undefined && rangeTo !== undefined) {
        headers['Range'] = `${rangeFrom}-${rangeTo}`;
      }
      
      // Request options
      const options: RequestInit = {
        method,
        headers,
      };
      
      if (body && (method === 'POST' || method === 'PATCH')) {
        options.body = JSON.stringify(body);
      }
      
      // Ejecutar request
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData: any = await response.json().catch(() => ({ message: response.statusText }));
        return {
          data: null,
          error: {
            message: errorData.message || response.statusText,
            code: errorData.code || response.status.toString(),
            details: errorData.details,
          },
        };
      }
      
      const data = await response.json() as T;
      
      // Si es single, retornar solo el primer elemento
      if (isSingle) {
        return {
          data: Array.isArray(data) ? (data as any)[0] || null : data,
          error: null,
        };
      }
      
      return { data, error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'Network error',
          code: 'NETWORK_ERROR',
          details: error.toString(),
        },
      };
    }
  }

  // Hacer el builder thenable
  (builder as any)[Symbol.toStringTag] = 'Promise';

  return builder;
}

// Exportar instancia singleton
let dbAPIClient: ReturnType<typeof createDBAPIClient> | null = null;

export function getDBAPIClient() {
  if (!dbAPIClient) {
    dbAPIClient = createDBAPIClient();
  }
  return dbAPIClient;
}

export default {
  createDBAPIClient,
  getDBAPIClient,
};
