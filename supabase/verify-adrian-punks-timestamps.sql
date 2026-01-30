-- ============================================================================
-- Verificar que los timestamps de AdrianPunks se están guardando correctamente
-- ============================================================================

-- Verificar que hay datos de AdrianPunks
SELECT 
  COUNT(*) as total_transfers,
  MIN(created_at) as earliest_transfer,
  MAX(created_at) as latest_transfer,
  COUNT(DISTINCT DATE(created_at)) as unique_dates
FROM erc721_transfers
WHERE contract_address = '0x79be8acdd339c7b92918fcc3fd3875b5aaad7566';

-- Verificar que los timestamps son consistentes con los block_numbers
-- (Los bloques más antiguos deberían tener timestamps más antiguos)
SELECT 
  block_number,
  created_at,
  DATE(created_at) as transfer_date,
  COUNT(*) as transfers_in_block
FROM erc721_transfers
WHERE contract_address = '0x79be8acdd339c7b92918fcc3fd3875b5aaad7566'
GROUP BY block_number, created_at
ORDER BY block_number ASC
LIMIT 20;

-- Verificar que no hay timestamps NULL o incorrectos
SELECT 
  COUNT(*) as null_timestamps
FROM erc721_transfers
WHERE contract_address = '0x79be8acdd339c7b92918fcc3fd3875b5aaad7566'
  AND created_at IS NULL;

-- Verificar que los timestamps están en el rango esperado
-- (Base mainnet empezó en 2023, así que timestamps antes de eso serían incorrectos)
SELECT 
  COUNT(*) as invalid_timestamps,
  MIN(created_at) as min_timestamp,
  MAX(created_at) as max_timestamp
FROM erc721_transfers
WHERE contract_address = '0x79be8acdd339c7b92918fcc3fd3875b5aaad7566'
  AND (created_at < '2023-01-01'::timestamp OR created_at > NOW());

-- Verificar distribución de transfers por día
SELECT 
  DATE(created_at) as date,
  COUNT(*) as transfers_count,
  MIN(block_number) as min_block,
  MAX(block_number) as max_block
FROM erc721_transfers
WHERE contract_address = '0x79be8acdd339c7b92918fcc3fd3875b5aaad7566'
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 30;

-- Verificar que los timestamps son únicos por tx_hash + log_index
-- (No debería haber duplicados con diferentes timestamps)
SELECT 
  tx_hash,
  log_index,
  COUNT(*) as duplicate_count,
  COUNT(DISTINCT created_at) as distinct_timestamps
FROM erc721_transfers
WHERE contract_address = '0x79be8acdd339c7b92918fcc3fd3875b5aaad7566'
GROUP BY tx_hash, log_index
HAVING COUNT(*) > 1 OR COUNT(DISTINCT created_at) > 1;

-- ============================================================================
-- Si todas las queries anteriores muestran datos correctos, los timestamps
-- se están guardando correctamente.
-- ============================================================================

