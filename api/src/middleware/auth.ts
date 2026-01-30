/**
 * Middleware de autenticación
 * Verifica el API key en los headers
 */

import type { Request, Response, NextFunction } from 'express';

/**
 * Middleware que verifica el API key
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Obtener API key del header
  const apiKey = req.headers['apikey'] || req.headers['authorization']?.replace('Bearer ', '');
  
  // API key esperada
  const expectedApiKey = process.env.API_KEY;
  
  // Si no hay API key configurada, permitir todo (desarrollo)
  if (!expectedApiKey) {
    console.warn('⚠️  API_KEY no configurada - Permitiendo todas las requests');
    next();
    return;
  }
  
  // Verificar API key
  if (!apiKey || apiKey !== expectedApiKey) {
    res.status(401).json({
      message: 'Invalid API key',
      code: 'PGRST301',
      details: 'The API key provided is invalid or missing',
    });
    return;
  }
  
  next();
}

/**
 * Middleware opcional que solo verifica en producción
 */
export function authMiddlewareOptional(req: Request, res: Response, next: NextFunction): void {
  // En desarrollo, no verificar
  if (process.env.NODE_ENV !== 'production') {
    next();
    return;
  }
  
  authMiddleware(req, res, next);
}

export default {
  authMiddleware,
  authMiddlewareOptional,
};
