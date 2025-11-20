-- Script para identificar eventos con fechas que necesitan corrección
-- Este script identifica eventos donde created_at es más reciente que el bloque debería indicar
-- (eventos guardados antes de implementar el uso de timestamps de bloques)

-- ============================================================================
-- IDENTIFICAR EVENTOS PROBLEMÁTICOS
-- ============================================================================

-- Eventos de trade_events que necesitan corrección
-- (fechas del 20 de noviembre cuando deberían ser del 18 de noviembre)
SELECT 
  'trade_events' as tabla,
  id,
  token_id,
  block_number,
  created_at,
  tx_hash,
  CASE 
    WHEN created_at > NOW() - INTERVAL '1 day' THEN 'Sospechoso: fecha muy reciente'
    ELSE 'OK'
  END as estado
FROM trade_events
WHERE created_at > NOW() - INTERVAL '2 days'  -- Eventos de los últimos 2 días
ORDER BY block_number DESC
LIMIT 100;

-- Eventos de listing_events que necesitan corrección
SELECT 
  'listing_events' as tabla,
  id,
  token_id,
  block_number,
  created_at,
  tx_hash,
  CASE 
    WHEN created_at > NOW() - INTERVAL '1 day' THEN 'Sospechoso: fecha muy reciente'
    ELSE 'OK'
  END as estado
FROM listing_events
WHERE created_at > NOW() - INTERVAL '2 days'
ORDER BY block_number DESC
LIMIT 100;

-- Resumen de eventos por fecha
SELECT 
  DATE(created_at) as fecha,
  COUNT(*) as total_eventos,
  MIN(block_number) as bloque_min,
  MAX(block_number) as bloque_max
FROM trade_events
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY fecha DESC;

-- ============================================================================
-- INSTRUCCIONES PARA CORREGIR TIMESTAMPS:
-- 
-- 1. Este script SQL solo identifica eventos problemáticos (solo lectura)
-- 2. Para CORREGIR las fechas, ejecuta en la TERMINAL (no en SQL):
--    npm run fix-timestamps
-- 
-- El script Node.js obtendrá los timestamps reales de los bloques
-- desde la blockchain y actualizará las fechas en la base de datos.
-- ============================================================================

