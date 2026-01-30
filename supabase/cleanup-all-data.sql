-- ============================================================================
-- Script de Limpieza Completa de Datos
-- ============================================================================
-- Este script elimina TODOS los datos de todas las tablas de eventos
-- y limpia completamente sync_state para empezar desde cero
--
-- ⚠️  ADVERTENCIA: Este script es DESTRUCTIVO
-- Ejecutar solo cuando se quiera resetear completamente la base de datos
-- ============================================================================

-- Limpiar todas las tablas de eventos
TRUNCATE TABLE listing_events CASCADE;
TRUNCATE TABLE trade_events CASCADE;
TRUNCATE TABLE sweep_events CASCADE;
TRUNCATE TABLE engine_config_events CASCADE;
TRUNCATE TABLE punk_listings CASCADE;

-- Limpiar tablas ERC20
TRUNCATE TABLE erc20_transfers CASCADE;
TRUNCATE TABLE erc20_approvals CASCADE;
TRUNCATE TABLE erc20_custom_events CASCADE;

-- Limpiar tablas ERC721
TRUNCATE TABLE erc721_transfers CASCADE;
TRUNCATE TABLE erc721_approvals CASCADE;
TRUNCATE TABLE erc721_approvals_for_all CASCADE;
TRUNCATE TABLE erc721_custom_events CASCADE;

-- Limpiar tablas ERC1155
TRUNCATE TABLE erc1155_transfers_single CASCADE;
TRUNCATE TABLE erc1155_transfers_batch CASCADE;
TRUNCATE TABLE erc1155_approvals_for_all CASCADE;
TRUNCATE TABLE erc1155_uri_updates CASCADE;
TRUNCATE TABLE erc1155_custom_events CASCADE;

-- Limpiar tablas de contratos custom
TRUNCATE TABLE traits_extensions_events CASCADE;
TRUNCATE TABLE shop_events CASCADE;

-- Limpiar sync_state completamente
TRUNCATE TABLE sync_state CASCADE;

-- ============================================================================
-- Verificación: Contar registros (debería ser 0 en todas las tablas)
-- ============================================================================
SELECT 
  'listing_events' as tabla, COUNT(*) as registros FROM listing_events
UNION ALL
SELECT 'trade_events', COUNT(*) FROM trade_events
UNION ALL
SELECT 'sweep_events', COUNT(*) FROM sweep_events
UNION ALL
SELECT 'engine_config_events', COUNT(*) FROM engine_config_events
UNION ALL
SELECT 'punk_listings', COUNT(*) FROM punk_listings
UNION ALL
SELECT 'erc20_transfers', COUNT(*) FROM erc20_transfers
UNION ALL
SELECT 'erc20_approvals', COUNT(*) FROM erc20_approvals
UNION ALL
SELECT 'erc20_custom_events', COUNT(*) FROM erc20_custom_events
UNION ALL
SELECT 'erc721_transfers', COUNT(*) FROM erc721_transfers
UNION ALL
SELECT 'erc721_approvals', COUNT(*) FROM erc721_approvals
UNION ALL
SELECT 'erc721_approvals_for_all', COUNT(*) FROM erc721_approvals_for_all
UNION ALL
SELECT 'erc721_custom_events', COUNT(*) FROM erc721_custom_events
UNION ALL
SELECT 'erc1155_transfers_single', COUNT(*) FROM erc1155_transfers_single
UNION ALL
SELECT 'erc1155_transfers_batch', COUNT(*) FROM erc1155_transfers_batch
UNION ALL
SELECT 'erc1155_approvals_for_all', COUNT(*) FROM erc1155_approvals_for_all
UNION ALL
SELECT 'erc1155_uri_updates', COUNT(*) FROM erc1155_uri_updates
UNION ALL
SELECT 'erc1155_custom_events', COUNT(*) FROM erc1155_custom_events
UNION ALL
SELECT 'traits_extensions_events', COUNT(*) FROM traits_extensions_events
UNION ALL
SELECT 'shop_events', COUNT(*) FROM shop_events
UNION ALL
SELECT 'sync_state', COUNT(*) FROM sync_state;

-- ============================================================================
-- INSTRUCCIONES:
-- ============================================================================
-- 1. Ejecutar este script en Supabase SQL Editor
-- 2. Verificar que todos los registros sean 0
-- 3. Reiniciar el listener para que inicialice sync_state con el bloque actual
-- ============================================================================

