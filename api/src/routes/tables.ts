/**
 * Rutas REST para tablas
 * Compatible con Supabase PostgREST API
 */

import { Router, Request, Response, NextFunction } from 'express';
import { query, run, get } from '../db/sqlite.js';
import { parseQueryString, parseRangeHeader } from '../utils/query-parser.js';
import { buildSelectQuery, buildCountQuery, buildInsertQuery, buildUpdateQuery, buildDeleteQuery } from '../utils/sql-builder.js';
import { isValidTable } from '../types/query.js';
import { tableNotFoundError, invalidQueryError } from '../utils/errors.js';

const router = Router();

/**
 * GET /rest/v1/:table
 * Query data from a table
 */
router.get('/:table', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { table } = req.params;
    
    // Validar tabla
    if (!isValidTable(table)) {
      throw tableNotFoundError(table);
    }
    
    // Parsear query params
    const queryParams = parseQueryString(req.query as Record<string, string>);
    
    // Parsear Range header si existe
    const rangeHeader = req.headers['range'] as string | undefined;
    if (rangeHeader) {
      queryParams.range = parseRangeHeader(rangeHeader);
    }
    
    // Construir y ejecutar query
    const { sql, params } = buildSelectQuery(table, queryParams);
    const data = query(sql, params);
    
    // Parsear JSON strings si hay columnas con _data o event_data
    const parsedData = data.map(row => parseJsonFields(row));
    
    // Si se solicita count, obtener el total
    let count: number | undefined;
    const preferHeader = req.headers['prefer'] as string | undefined;
    if (preferHeader?.includes('count=exact')) {
      const countQuery = buildCountQuery(table, queryParams);
      const countResult = get<{ count: number }>(countQuery.sql, countQuery.params);
      count = countResult?.count;
    }
    
    // Headers de respuesta
    if (count !== undefined) {
      res.setHeader('Content-Range', `0-${data.length - 1}/${count}`);
    }
    res.setHeader('Content-Type', 'application/json');
    
    // Respuesta en formato Supabase (array directo)
    res.json(parsedData);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /rest/v1/:table
 * Insert data into a table
 */
router.post('/:table', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { table } = req.params;
    const body = req.body;
    
    // Validar tabla
    if (!isValidTable(table)) {
      throw tableNotFoundError(table);
    }
    
    // Validar body
    if (!body || typeof body !== 'object') {
      throw invalidQueryError('Request body must be a JSON object');
    }
    
    // Si es un array, insertar múltiples
    const rows = Array.isArray(body) ? body : [body];
    const results: any[] = [];
    
    for (const row of rows) {
      const { sql, params } = buildInsertQuery(table, row);
      const result = run(sql, params);
      
      // Obtener el registro insertado
      if (result.lastInsertRowid) {
        const inserted = get(`SELECT * FROM ${table} WHERE id = ?`, [result.lastInsertRowid]);
        if (inserted) {
          results.push(parseJsonFields(inserted));
        }
      }
    }
    
    // Respuesta
    res.status(201).json(Array.isArray(body) ? results : results[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /rest/v1/:table
 * Update data in a table
 */
router.patch('/:table', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { table } = req.params;
    const body = req.body;
    
    // Validar tabla
    if (!isValidTable(table)) {
      throw tableNotFoundError(table);
    }
    
    // Validar body
    if (!body || typeof body !== 'object') {
      throw invalidQueryError('Request body must be a JSON object');
    }
    
    // Parsear query params para filtros
    const queryParams = parseQueryString(req.query as Record<string, string>);
    
    // Construir y ejecutar query
    const { sql, params } = buildUpdateQuery(table, body, queryParams);
    run(sql, params);
    
    // Obtener registros actualizados
    const selectQuery = buildSelectQuery(table, queryParams);
    const updated = query(selectQuery.sql, selectQuery.params);
    
    res.json(updated.map(row => parseJsonFields(row)));
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /rest/v1/:table
 * Delete data from a table
 */
router.delete('/:table', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { table } = req.params;
    
    // Validar tabla
    if (!isValidTable(table)) {
      throw tableNotFoundError(table);
    }
    
    // Parsear query params para filtros
    const queryParams = parseQueryString(req.query as Record<string, string>);
    
    // Primero obtener los registros a eliminar (para retornarlos)
    const selectQuery = buildSelectQuery(table, queryParams);
    const toDelete = query(selectQuery.sql, selectQuery.params);
    
    // Construir y ejecutar query
    const { sql, params } = buildDeleteQuery(table, queryParams);
    run(sql, params);
    
    res.json(toDelete.map(row => parseJsonFields(row)));
  } catch (error) {
    next(error);
  }
});

/**
 * Parsear campos JSON en un registro
 */
function parseJsonFields(row: Record<string, any>): Record<string, any> {
  const result = { ...row };
  
  for (const [key, value] of Object.entries(result)) {
    // Campos que contienen JSON
    if ((key.includes('_data') || key === 'event_data') && typeof value === 'string') {
      try {
        result[key] = JSON.parse(value);
      } catch {
        // Si no es JSON válido, dejar como string
      }
    }
    
    // Convertir INTEGER a boolean para campos específicos
    if ((key === 'is_listed' || key === 'is_contract_owned' || key === 'approved' || key === 'success' || key === 'paid') 
        && typeof value === 'number') {
      result[key] = Boolean(value);
    }
  }
  
  return result;
}

export default router;
