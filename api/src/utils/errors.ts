/**
 * Utilidades de manejo de errores
 * Formatea errores en formato compatible con Supabase
 */

import type { Request, Response, NextFunction } from 'express';

/**
 * Clase de error con código
 */
export class APIError extends Error {
  code: string;
  details?: string;
  statusCode: number;
  
  constructor(message: string, code: string, statusCode = 400, details?: string) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'APIError';
  }
}

/**
 * Códigos de error estilo Supabase PostgREST
 */
export const ErrorCodes = {
  // Auth errors
  INVALID_API_KEY: 'PGRST301',
  
  // Table errors
  TABLE_NOT_FOUND: 'PGRST200',
  COLUMN_NOT_FOUND: 'PGRST201',
  
  // Query errors
  INVALID_QUERY: 'PGRST100',
  INVALID_FILTER: 'PGRST101',
  
  // Data errors
  UNIQUE_VIOLATION: 'PGRST409',
  NOT_FOUND: 'PGRST404',
  
  // Server errors
  INTERNAL_ERROR: 'PGRST500',
  DATABASE_ERROR: 'PGRST501',
} as const;

/**
 * Crear error de tabla no encontrada
 */
export function tableNotFoundError(table: string): APIError {
  return new APIError(
    `Could not find the relation ${table}`,
    ErrorCodes.TABLE_NOT_FOUND,
    404,
    `The table "${table}" does not exist`
  );
}

/**
 * Crear error de query inválida
 */
export function invalidQueryError(message: string): APIError {
  return new APIError(
    message,
    ErrorCodes.INVALID_QUERY,
    400
  );
}

/**
 * Crear error de violación de unicidad
 */
export function uniqueViolationError(details: string): APIError {
  return new APIError(
    'Duplicate key value violates unique constraint',
    ErrorCodes.UNIQUE_VIOLATION,
    409,
    details
  );
}

/**
 * Middleware de manejo de errores
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('Error:', err);
  
  // Si es un APIError, usar sus propiedades
  if (err instanceof APIError) {
    res.status(err.statusCode).json({
      message: err.message,
      code: err.code,
      details: err.details,
    });
    return;
  }
  
  // Error de SQLite: UNIQUE constraint
  if (err.message.includes('UNIQUE constraint failed')) {
    res.status(409).json({
      message: 'Duplicate key value violates unique constraint',
      code: ErrorCodes.UNIQUE_VIOLATION,
      details: err.message,
    });
    return;
  }
  
  // Error de SQLite: no such table
  if (err.message.includes('no such table')) {
    const match = err.message.match(/no such table: (\w+)/);
    res.status(404).json({
      message: `Could not find the relation ${match?.[1] || 'unknown'}`,
      code: ErrorCodes.TABLE_NOT_FOUND,
      details: err.message,
    });
    return;
  }
  
  // Error de SQLite: no such column
  if (err.message.includes('no such column')) {
    const match = err.message.match(/no such column: (\w+)/);
    res.status(400).json({
      message: `Column ${match?.[1] || 'unknown'} not found`,
      code: ErrorCodes.COLUMN_NOT_FOUND,
      details: err.message,
    });
    return;
  }
  
  // Error genérico
  res.status(500).json({
    message: 'Internal server error',
    code: ErrorCodes.INTERNAL_ERROR,
    details: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
}

export default {
  APIError,
  ErrorCodes,
  tableNotFoundError,
  invalidQueryError,
  uniqueViolationError,
  errorHandler,
};
