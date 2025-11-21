-- Script para verificar que las fechas guardadas corresponden a los timestamps de los bloques
-- Este script compara created_at con el timestamp del bloque en la blockchain

-- Verificar eventos de FloorEngine (listing_events)
SELECT 
  'listing_events' as tabla,
  COUNT(*) as total_eventos,
  MIN(created_at) as fecha_mas_antigua,
  MAX(created_at) as fecha_mas_reciente,
  MIN(block_number) as bloque_mas_antiguo,
  MAX(block_number) as bloque_mas_reciente
FROM listing_events
WHERE created_at IS NOT NULL;

-- Verificar eventos de Trade
SELECT 
  'trade_events' as tabla,
  COUNT(*) as total_eventos,
  MIN(created_at) as fecha_mas_antigua,
  MAX(created_at) as fecha_mas_reciente,
  MIN(block_number) as bloque_mas_antiguo,
  MAX(block_number) as bloque_mas_reciente
FROM trade_events
WHERE created_at IS NOT NULL;

-- Verificar eventos ERC20
SELECT 
  'erc20_transfers' as tabla,
  COUNT(*) as total_eventos,
  MIN(created_at) as fecha_mas_antigua,
  MAX(created_at) as fecha_mas_reciente,
  MIN(block_number) as bloque_mas_antiguo,
  MAX(block_number) as bloque_mas_reciente
FROM erc20_transfers
WHERE created_at IS NOT NULL;

-- Verificar eventos ERC721
SELECT 
  'erc721_transfers' as tabla,
  COUNT(*) as total_eventos,
  MIN(created_at) as fecha_mas_antigua,
  MAX(created_at) as fecha_mas_reciente,
  MIN(block_number) as bloque_mas_antiguo,
  MAX(block_number) as bloque_mas_reciente
FROM erc721_transfers
WHERE created_at IS NOT NULL;

-- Verificar eventos ERC1155
SELECT 
  'erc1155_transfers_single' as tabla,
  COUNT(*) as total_eventos,
  MIN(created_at) as fecha_mas_antigua,
  MAX(created_at) as fecha_mas_reciente,
  MIN(block_number) as bloque_mas_antiguo,
  MAX(block_number) as bloque_mas_reciente
FROM erc1155_transfers_single
WHERE created_at IS NOT NULL;

-- Verificar algunos eventos recientes con sus bloques
-- (Esto te ayudará a verificar manualmente si las fechas coinciden con los timestamps de los bloques)
SELECT 
  'listing_events' as tabla,
  event_type,
  token_id,
  block_number,
  created_at,
  tx_hash
FROM listing_events
ORDER BY block_number DESC
LIMIT 10;

SELECT 
  'trade_events' as tabla,
  token_id,
  buyer,
  seller,
  block_number,
  created_at,
  tx_hash
FROM trade_events
ORDER BY block_number DESC
LIMIT 10;

