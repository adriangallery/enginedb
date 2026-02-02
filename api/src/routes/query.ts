/**
 * Ruta para ejecutar consultas SQL directas
 * Solo permite consultas de lectura (SELECT)
 */

import { Router, Request, Response, NextFunction } from 'express';
import { query as executeQuery } from '../db/sqlite.js';
import { invalidQueryError } from '../utils/errors.js';

const router = Router();

/**
 * POST /query
 * Ejecuta una consulta SQL de solo lectura
 *
 * Body:
 * {
 *   "sql": "SELECT * FROM trade_events LIMIT 10",
 *   "params": [] // opcional
 * }
 */
router.post('/query', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sql, params = [] } = req.body;

    // Validar que se proporcionó un SQL
    if (!sql || typeof sql !== 'string') {
      throw invalidQueryError('SQL query is required');
    }

    // Normalizar SQL (trim y minúsculas para validación)
    const normalizedSql = sql.trim().toLowerCase();

    // Validar que es una consulta de solo lectura
    if (!normalizedSql.startsWith('select') &&
        !normalizedSql.startsWith('pragma') &&
        !normalizedSql.startsWith('explain')) {
      throw invalidQueryError('Only SELECT, PRAGMA, and EXPLAIN queries are allowed');
    }

    // Validar que no contiene comandos peligrosos
    const dangerousKeywords = ['insert', 'update', 'delete', 'drop', 'create', 'alter', 'truncate'];
    for (const keyword of dangerousKeywords) {
      if (normalizedSql.includes(keyword)) {
        throw invalidQueryError(`Query contains forbidden keyword: ${keyword}`);
      }
    }

    // Validar params
    if (params && !Array.isArray(params)) {
      throw invalidQueryError('Params must be an array');
    }

    // Ejecutar la consulta
    const results = executeQuery(sql, params);

    // Responder con los resultados
    res.json({
      success: true,
      data: results,
      count: results.length
    });

  } catch (error: any) {
    // Si es un error de SQLite, proporcionar más contexto
    if (error.code?.startsWith('SQLITE_')) {
      next(invalidQueryError(`SQL error: ${error.message}`));
    } else {
      next(error);
    }
  }
});

/**
 * GET /query/tables
 * Lista todas las tablas disponibles en la base de datos
 */
router.get('/query/tables', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const tables = executeQuery(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    );

    res.json({
      success: true,
      tables: tables.map((t: any) => t.name)
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /query/schema/:table
 * Obtiene el schema de una tabla específica
 */
router.get('/query/schema/:table', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { table } = req.params;

    // Validar nombre de tabla (solo alfanumérico y guiones bajos)
    if (!/^[a-zA-Z0-9_]+$/.test(table)) {
      throw invalidQueryError('Invalid table name');
    }

    const schema = executeQuery(`PRAGMA table_info(${table})`);

    if (schema.length === 0) {
      throw invalidQueryError(`Table '${table}' not found`);
    }

    res.json({
      success: true,
      table: table,
      columns: schema
    });
  } catch (error) {
    next(error);
  }
});

export default router;
