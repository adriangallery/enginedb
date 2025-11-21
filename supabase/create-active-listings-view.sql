-- ============================================================================
-- Vista: active_punk_listings
-- Propósito: Lista simplificada de punks actualmente a la venta
-- Solo muestra: token_id, precio en $ADRIAN, y si es del engine o usuario
-- 
-- Esta vista se actualiza AUTOMÁTICAMENTE cuando cambian los datos en
-- punk_listings. No requiere mantenimiento manual.
-- ============================================================================

-- Eliminar la vista si existe (para poder recrearla)
DROP VIEW IF EXISTS active_punk_listings;

-- Crear la vista
CREATE VIEW active_punk_listings AS
SELECT 
  token_id,
  price_wei AS price_adrian_wei,
  is_contract_owned AS is_engine_owned,
  seller,
  last_event,
  last_block_number,
  updated_at
FROM punk_listings
WHERE is_listed = true
ORDER BY token_id;

-- Comentario para documentación
COMMENT ON VIEW active_punk_listings IS 
'Lista de punks actualmente a la venta en el Floor Engine. 
Filtra automáticamente los vendidos, cancelados o que pasaron por sweep y ya no están listados.
Se actualiza automáticamente cuando cambian los datos en punk_listings.';

-- ============================================================================
-- Índices adicionales para optimizar consultas (ya existen en punk_listings)
-- ============================================================================
-- Nota: Los índices en punk_listings ya optimizan esta vista:
-- - idx_punk_listings_is_listed: Para filtrar is_listed = true
-- - idx_punk_listings_token_id: Para ordenar por token_id
-- 
-- Si necesitas más rendimiento, puedes crear índices específicos:
-- CREATE INDEX IF NOT EXISTS idx_punk_listings_active 
--   ON punk_listings(token_id, price_wei, is_contract_owned) 
--   WHERE is_listed = true;

-- ============================================================================
-- Verificación: Consulta de prueba
-- ============================================================================
-- Ejecuta esto para verificar que la vista funciona:
-- SELECT COUNT(*) FROM active_punk_listings;
-- SELECT * FROM active_punk_listings LIMIT 10;

