-- ============================================================================
-- Vista: floor_engine_events_unified
-- Propósito: Unificar todos los eventos de FloorEngine con sus timestamps
--            reales del bloque (no updated_at de punk_listings)
-- ============================================================================

CREATE OR REPLACE VIEW floor_engine_events_unified AS
SELECT 
  'Listed' as event_type,
  token_id,
  seller as user_address,
  price_wei,
  is_contract_owned,
  tx_hash,
  log_index,
  block_number,
  created_at as event_timestamp,
  NULL::TEXT as buyer,
  NULL::NUMERIC as buy_price_wei,
  NULL::NUMERIC as relist_price_wei,
  NULL::TEXT as caller,
  NULL::NUMERIC as caller_reward_wei
FROM listing_events
WHERE event_type = 'Listed'

UNION ALL

SELECT 
  'Cancelled' as event_type,
  token_id,
  seller as user_address,
  NULL::NUMERIC as price_wei,
  NULL::BOOLEAN as is_contract_owned,
  tx_hash,
  log_index,
  block_number,
  created_at as event_timestamp,
  NULL::TEXT as buyer,
  NULL::NUMERIC as buy_price_wei,
  NULL::NUMERIC as relist_price_wei,
  NULL::TEXT as caller,
  NULL::NUMERIC as caller_reward_wei
FROM listing_events
WHERE event_type = 'Cancelled'

UNION ALL

SELECT 
  'Bought' as event_type,
  token_id,
  seller as user_address,
  price_wei,
  is_contract_owned,
  tx_hash,
  log_index,
  block_number,
  created_at as event_timestamp,
  buyer,
  price_wei as buy_price_wei,
  NULL::NUMERIC as relist_price_wei,
  NULL::TEXT as caller,
  NULL::NUMERIC as caller_reward_wei
FROM trade_events

UNION ALL

SELECT 
  'FloorSweep' as event_type,
  token_id,
  NULL::TEXT as user_address,
  relist_price_wei as price_wei,
  true as is_contract_owned,
  tx_hash,
  log_index,
  block_number,
  created_at as event_timestamp,
  NULL::TEXT as buyer,
  buy_price_wei,
  relist_price_wei,
  caller,
  caller_reward_wei
FROM sweep_events

ORDER BY event_timestamp DESC;

-- Índices para mejorar performance (si es necesario)
-- Nota: Las vistas no pueden tener índices, pero las tablas base ya los tienen

-- Comentario para documentación
COMMENT ON VIEW floor_engine_events_unified IS 
'Vista unificada de todos los eventos de FloorEngine con timestamps reales del bloque. '
'Usar esta vista en lugar de punk_listings.updated_at para obtener las fechas correctas de las transacciones.';

