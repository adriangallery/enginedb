-- ============================================================================
-- Inicialización de AdrianPunks en sync_state
-- ============================================================================
-- Este script es OPCIONAL - El sistema creará automáticamente el registro
-- cuando procese el primer evento. Solo ejecutar si quieres inicializar
-- manualmente el estado de sincronización.

-- Insertar registro inicial para AdrianPunks si no existe
INSERT INTO sync_state (contract_address, last_synced_block, last_historical_block)
VALUES ('0x79be8acdd339c7b92918fcc3fd3875b5aaad7566', 0, NULL)
ON CONFLICT (contract_address) DO NOTHING;

-- Verificar que se creó correctamente
SELECT 
  contract_address,
  last_synced_block,
  last_historical_block,
  updated_at
FROM sync_state
WHERE contract_address = '0x79be8acdd339c7b92918fcc3fd3875b5aaad7566';

-- ============================================================================
-- NOTA: Las tablas ERC721 ya existen y son compartidas:
-- - erc721_transfers (para eventos Transfer)
-- - erc721_approvals (para eventos Approval)
-- - erc721_approvals_for_all (para eventos ApprovalForAll)
-- - erc721_custom_events (para eventos custom si los hay)
--
-- El sistema diferenciará los eventos de AdrianPunks usando el campo
-- contract_address = '0x79be8acdd339c7b92918fcc3fd3875b5aaad7566'
-- ============================================================================

