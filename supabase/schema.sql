-- FloorEngine Listener Database Schema
-- Ejecutar este script en Supabase SQL Editor después de crear el proyecto

-- ============================================================================
-- Tabla: sync_state
-- Propósito: Mantener el último bloque sincronizado para continuar desde allí
-- ============================================================================
CREATE TABLE IF NOT EXISTS sync_state (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  last_synced_block BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agregar columna contract_address si no existe (para soporte multi-contrato)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sync_state' AND column_name = 'contract_address'
  ) THEN
    ALTER TABLE sync_state ADD COLUMN contract_address TEXT;
  END IF;
END $$;

-- Crear índice único parcial si no existe
CREATE UNIQUE INDEX IF NOT EXISTS idx_sync_state_contract_address 
ON sync_state(contract_address) 
WHERE contract_address IS NOT NULL;

-- Migrar registro existente de FloorEngine si contract_address es NULL
UPDATE sync_state 
SET contract_address = '0x0351F7cBA83277E891D4a85Da498A7eACD764D58'
WHERE contract_address IS NULL 
  AND id = (SELECT MIN(id) FROM sync_state WHERE contract_address IS NULL);

-- Insertar fila inicial si no existe
INSERT INTO sync_state (last_synced_block, contract_address)
SELECT 0, '0x0351F7cBA83277E891D4a85Da498A7eACD764D58'
WHERE NOT EXISTS (SELECT 1 FROM sync_state);

-- ============================================================================
-- Tabla: punk_listings
-- Propósito: Estado actual de listings por tokenId (vista en tiempo real)
-- ============================================================================
CREATE TABLE IF NOT EXISTS punk_listings (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  token_id BIGINT UNIQUE NOT NULL,
  seller TEXT NOT NULL,
  price_wei NUMERIC NOT NULL,
  is_contract_owned BOOLEAN NOT NULL,
  is_listed BOOLEAN NOT NULL,
  last_event TEXT NOT NULL,
  last_tx_hash TEXT NOT NULL,
  last_block_number BIGINT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_punk_listings_token_id ON punk_listings(token_id);
CREATE INDEX IF NOT EXISTS idx_punk_listings_is_listed ON punk_listings(is_listed);
CREATE INDEX IF NOT EXISTS idx_punk_listings_seller ON punk_listings(seller);

-- ============================================================================
-- Tabla: listing_events
-- Propósito: Histórico de eventos Listed y Cancelled
-- ============================================================================
CREATE TABLE IF NOT EXISTS listing_events (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  event_type TEXT NOT NULL CHECK (event_type IN ('Listed', 'Cancelled')),
  token_id BIGINT NOT NULL,
  seller TEXT NOT NULL,
  price_wei NUMERIC,
  is_contract_owned BOOLEAN,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tx_hash, log_index)
);

-- Índices para búsquedas
CREATE INDEX IF NOT EXISTS idx_listing_events_token_id ON listing_events(token_id);
CREATE INDEX IF NOT EXISTS idx_listing_events_seller ON listing_events(seller);
CREATE INDEX IF NOT EXISTS idx_listing_events_block_number ON listing_events(block_number);
CREATE INDEX IF NOT EXISTS idx_listing_events_event_type ON listing_events(event_type);

-- ============================================================================
-- Tabla: trade_events
-- Propósito: Histórico de eventos Bought (compras de usuarios)
-- ============================================================================
CREATE TABLE IF NOT EXISTS trade_events (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  token_id BIGINT NOT NULL,
  buyer TEXT NOT NULL,
  seller TEXT NOT NULL,
  price_wei NUMERIC NOT NULL,
  is_contract_owned BOOLEAN NOT NULL,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tx_hash, log_index)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_trade_events_token_id ON trade_events(token_id);
CREATE INDEX IF NOT EXISTS idx_trade_events_buyer ON trade_events(buyer);
CREATE INDEX IF NOT EXISTS idx_trade_events_seller ON trade_events(seller);
CREATE INDEX IF NOT EXISTS idx_trade_events_block_number ON trade_events(block_number);

-- ============================================================================
-- Tabla: sweep_events
-- Propósito: Histórico de eventos FloorSweep (barridos automáticos del engine)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sweep_events (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  token_id BIGINT NOT NULL,
  buy_price_wei NUMERIC NOT NULL,
  relist_price_wei NUMERIC NOT NULL,
  caller TEXT NOT NULL,
  caller_reward_wei NUMERIC NOT NULL,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tx_hash, log_index)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_sweep_events_token_id ON sweep_events(token_id);
CREATE INDEX IF NOT EXISTS idx_sweep_events_caller ON sweep_events(caller);
CREATE INDEX IF NOT EXISTS idx_sweep_events_block_number ON sweep_events(block_number);

-- ============================================================================
-- Tabla: engine_config_events
-- Propósito: Histórico de cambios en la configuración del FloorEngine
-- ============================================================================
CREATE TABLE IF NOT EXISTS engine_config_events (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'PremiumUpdated',
      'MaxBuyPriceUpdated',
      'CallerRewardModeUpdated',
      'CallerRewardBpsUpdated',
      'CallerRewardFixedUpdated',
      'OwnershipTransferred'
    )
  ),
  old_value TEXT,
  new_value TEXT,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tx_hash, log_index)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_engine_config_events_event_type ON engine_config_events(event_type);
CREATE INDEX IF NOT EXISTS idx_engine_config_events_block_number ON engine_config_events(block_number);

-- ============================================================================
-- Función helper para actualizar updated_at automáticamente
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para sync_state (DROP IF EXISTS para evitar errores si ya existe)
DROP TRIGGER IF EXISTS update_sync_state_updated_at ON sync_state;
CREATE TRIGGER update_sync_state_updated_at
  BEFORE UPDATE ON sync_state
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para punk_listings (DROP IF EXISTS para evitar errores si ya existe)
DROP TRIGGER IF EXISTS update_punk_listings_updated_at ON punk_listings;
CREATE TRIGGER update_punk_listings_updated_at
  BEFORE UPDATE ON punk_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Comentarios para documentación
-- ============================================================================
COMMENT ON TABLE sync_state IS 'Mantiene el último bloque sincronizado para continuar el polling';
COMMENT ON TABLE punk_listings IS 'Estado actual del marketplace por tokenId';
COMMENT ON TABLE listing_events IS 'Histórico de eventos Listed y Cancelled';
COMMENT ON TABLE trade_events IS 'Histórico de compras (evento Bought)';
COMMENT ON TABLE sweep_events IS 'Histórico de floor sweeps automáticos';
COMMENT ON TABLE engine_config_events IS 'Histórico de cambios de configuración del contrato';

-- ============================================================================
-- TABLAS ERC20 - Para contratos ERC20 como $ADRIAN Token
-- Separadas con prefijo erc20_ para no interferir con FloorEngine
-- ============================================================================

-- ============================================================================
-- Tabla: erc20_transfers
-- Propósito: Histórico de eventos Transfer de contratos ERC20
-- ============================================================================
CREATE TABLE IF NOT EXISTS erc20_transfers (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  contract_address TEXT NOT NULL,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  value_wei NUMERIC NOT NULL,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tx_hash, log_index)
);

-- Índices para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_erc20_transfers_contract_address ON erc20_transfers(contract_address);
CREATE INDEX IF NOT EXISTS idx_erc20_transfers_from_address ON erc20_transfers(from_address);
CREATE INDEX IF NOT EXISTS idx_erc20_transfers_to_address ON erc20_transfers(to_address);
CREATE INDEX IF NOT EXISTS idx_erc20_transfers_block_number ON erc20_transfers(block_number);

-- ============================================================================
-- Tabla: erc20_approvals
-- Propósito: Histórico de eventos Approval de contratos ERC20
-- ============================================================================
CREATE TABLE IF NOT EXISTS erc20_approvals (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  contract_address TEXT NOT NULL,
  owner TEXT NOT NULL,
  spender TEXT NOT NULL,
  value_wei NUMERIC NOT NULL,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tx_hash, log_index)
);

-- Índices para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_erc20_approvals_contract_address ON erc20_approvals(contract_address);
CREATE INDEX IF NOT EXISTS idx_erc20_approvals_owner ON erc20_approvals(owner);
CREATE INDEX IF NOT EXISTS idx_erc20_approvals_spender ON erc20_approvals(spender);
CREATE INDEX IF NOT EXISTS idx_erc20_approvals_block_number ON erc20_approvals(block_number);

-- ============================================================================
-- Tabla: erc20_custom_events
-- Propósito: Eventos custom de contratos ERC20 (TaxFeeUpdated, Staked, etc.)
-- Usa JSONB para flexibilidad en estructuras de eventos diferentes
-- ============================================================================
CREATE TABLE IF NOT EXISTS erc20_custom_events (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  contract_address TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_data JSONB NOT NULL,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tx_hash, log_index)
);

-- Índices para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_erc20_custom_events_contract_address ON erc20_custom_events(contract_address);
CREATE INDEX IF NOT EXISTS idx_erc20_custom_events_event_name ON erc20_custom_events(event_name);
CREATE INDEX IF NOT EXISTS idx_erc20_custom_events_block_number ON erc20_custom_events(block_number);
-- Índice GIN para búsquedas en JSONB
CREATE INDEX IF NOT EXISTS idx_erc20_custom_events_event_data ON erc20_custom_events USING GIN (event_data);

-- Comentarios para documentación
COMMENT ON TABLE erc20_transfers IS 'Histórico de eventos Transfer de contratos ERC20';
COMMENT ON TABLE erc20_approvals IS 'Histórico de eventos Approval de contratos ERC20';
COMMENT ON TABLE erc20_custom_events IS 'Eventos custom de contratos ERC20 (TaxFeeUpdated, Staked, etc.)';

-- ============================================================================
-- TABLAS ERC721 - Para contratos ERC721 como AdrianLABCore (AdrianZERO)
-- Separadas con prefijo erc721_ para no interferir con FloorEngine o ERC20
-- ============================================================================

-- ============================================================================
-- Tabla: erc721_transfers
-- Propósito: Histórico de eventos Transfer de contratos ERC721
-- ============================================================================
CREATE TABLE IF NOT EXISTS erc721_transfers (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  contract_address TEXT NOT NULL,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  token_id NUMERIC NOT NULL,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tx_hash, log_index)
);

-- Índices para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_erc721_transfers_contract_address ON erc721_transfers(contract_address);
CREATE INDEX IF NOT EXISTS idx_erc721_transfers_from_address ON erc721_transfers(from_address);
CREATE INDEX IF NOT EXISTS idx_erc721_transfers_to_address ON erc721_transfers(to_address);
CREATE INDEX IF NOT EXISTS idx_erc721_transfers_token_id ON erc721_transfers(contract_address, token_id);
CREATE INDEX IF NOT EXISTS idx_erc721_transfers_block_number ON erc721_transfers(block_number);

-- ============================================================================
-- Tabla: erc721_approvals
-- Propósito: Histórico de eventos Approval de contratos ERC721
-- ============================================================================
CREATE TABLE IF NOT EXISTS erc721_approvals (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  contract_address TEXT NOT NULL,
  owner TEXT NOT NULL,
  approved TEXT NOT NULL,
  token_id NUMERIC NOT NULL,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tx_hash, log_index)
);

-- Índices para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_erc721_approvals_contract_address ON erc721_approvals(contract_address);
CREATE INDEX IF NOT EXISTS idx_erc721_approvals_owner ON erc721_approvals(owner);
CREATE INDEX IF NOT EXISTS idx_erc721_approvals_token_id ON erc721_approvals(contract_address, token_id);
CREATE INDEX IF NOT EXISTS idx_erc721_approvals_block_number ON erc721_approvals(block_number);

-- ============================================================================
-- Tabla: erc721_approvals_for_all
-- Propósito: Histórico de eventos ApprovalForAll de contratos ERC721
-- ============================================================================
CREATE TABLE IF NOT EXISTS erc721_approvals_for_all (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  contract_address TEXT NOT NULL,
  owner TEXT NOT NULL,
  operator TEXT NOT NULL,
  approved BOOLEAN NOT NULL,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tx_hash, log_index)
);

-- Índices para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_erc721_approvals_for_all_contract_address ON erc721_approvals_for_all(contract_address);
CREATE INDEX IF NOT EXISTS idx_erc721_approvals_for_all_owner ON erc721_approvals_for_all(owner);
CREATE INDEX IF NOT EXISTS idx_erc721_approvals_for_all_operator ON erc721_approvals_for_all(operator);
CREATE INDEX IF NOT EXISTS idx_erc721_approvals_for_all_block_number ON erc721_approvals_for_all(block_number);

-- ============================================================================
-- Tabla: erc721_custom_events
-- Propósito: Eventos custom de contratos ERC721 (TokenMinted, SkinCreated, etc.)
-- Usa JSONB para flexibilidad en estructuras de eventos diferentes
-- ============================================================================
CREATE TABLE IF NOT EXISTS erc721_custom_events (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  contract_address TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_data JSONB NOT NULL,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tx_hash, log_index)
);

-- Índices para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_erc721_custom_events_contract_address ON erc721_custom_events(contract_address);
CREATE INDEX IF NOT EXISTS idx_erc721_custom_events_event_name ON erc721_custom_events(event_name);
CREATE INDEX IF NOT EXISTS idx_erc721_custom_events_block_number ON erc721_custom_events(block_number);
-- Índice GIN para búsquedas en JSONB
CREATE INDEX IF NOT EXISTS idx_erc721_custom_events_event_data ON erc721_custom_events USING GIN (event_data);

-- Comentarios para documentación
COMMENT ON TABLE erc721_transfers IS 'Histórico de eventos Transfer de contratos ERC721';
COMMENT ON TABLE erc721_approvals IS 'Histórico de eventos Approval de contratos ERC721';
COMMENT ON TABLE erc721_approvals_for_all IS 'Histórico de eventos ApprovalForAll de contratos ERC721';
COMMENT ON TABLE erc721_custom_events IS 'Eventos custom de contratos ERC721 (TokenMinted, SkinCreated, MutationAssigned, etc.)';

-- ============================================================================
-- TABLAS ERC1155 - Para contratos ERC1155 como AdrianTraitsCore
-- Separadas con prefijo erc1155_ para no interferir con otros contratos
-- ============================================================================

-- ============================================================================
-- Tabla: erc1155_transfers_single
-- Propósito: Histórico de eventos TransferSingle de contratos ERC1155
-- ============================================================================
CREATE TABLE IF NOT EXISTS erc1155_transfers_single (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  contract_address TEXT NOT NULL,
  operator TEXT NOT NULL,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  token_id TEXT NOT NULL,
  value TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tx_hash, log_index)
);

-- Índices para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_erc1155_transfers_single_contract_address ON erc1155_transfers_single(contract_address);
CREATE INDEX IF NOT EXISTS idx_erc1155_transfers_single_from_address ON erc1155_transfers_single(from_address);
CREATE INDEX IF NOT EXISTS idx_erc1155_transfers_single_to_address ON erc1155_transfers_single(to_address);
CREATE INDEX IF NOT EXISTS idx_erc1155_transfers_single_token_id ON erc1155_transfers_single(contract_address, token_id);
CREATE INDEX IF NOT EXISTS idx_erc1155_transfers_single_block_number ON erc1155_transfers_single(block_number);

-- ============================================================================
-- Tabla: erc1155_transfers_batch
-- Propósito: Histórico de eventos TransferBatch de contratos ERC1155
-- ============================================================================
CREATE TABLE IF NOT EXISTS erc1155_transfers_batch (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  contract_address TEXT NOT NULL,
  operator TEXT NOT NULL,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  token_ids TEXT[] NOT NULL,
  values TEXT[] NOT NULL,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tx_hash, log_index)
);

-- Índices para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_erc1155_transfers_batch_contract_address ON erc1155_transfers_batch(contract_address);
CREATE INDEX IF NOT EXISTS idx_erc1155_transfers_batch_from_address ON erc1155_transfers_batch(from_address);
CREATE INDEX IF NOT EXISTS idx_erc1155_transfers_batch_to_address ON erc1155_transfers_batch(to_address);
CREATE INDEX IF NOT EXISTS idx_erc1155_transfers_batch_block_number ON erc1155_transfers_batch(block_number);

-- ============================================================================
-- Tabla: erc1155_approvals_for_all
-- Propósito: Histórico de eventos ApprovalForAll de contratos ERC1155
-- ============================================================================
CREATE TABLE IF NOT EXISTS erc1155_approvals_for_all (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  contract_address TEXT NOT NULL,
  account TEXT NOT NULL,
  operator TEXT NOT NULL,
  approved BOOLEAN NOT NULL,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tx_hash, log_index)
);

-- Índices para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_erc1155_approvals_for_all_contract_address ON erc1155_approvals_for_all(contract_address);
CREATE INDEX IF NOT EXISTS idx_erc1155_approvals_for_all_account ON erc1155_approvals_for_all(account);
CREATE INDEX IF NOT EXISTS idx_erc1155_approvals_for_all_operator ON erc1155_approvals_for_all(operator);
CREATE INDEX IF NOT EXISTS idx_erc1155_approvals_for_all_block_number ON erc1155_approvals_for_all(block_number);

-- ============================================================================
-- Tabla: erc1155_uri_updates
-- Propósito: Histórico de eventos URI de contratos ERC1155
-- ============================================================================
CREATE TABLE IF NOT EXISTS erc1155_uri_updates (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  contract_address TEXT NOT NULL,
  token_id TEXT NOT NULL,
  uri TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tx_hash, log_index)
);

-- Índices para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_erc1155_uri_updates_contract_address ON erc1155_uri_updates(contract_address);
CREATE INDEX IF NOT EXISTS idx_erc1155_uri_updates_token_id ON erc1155_uri_updates(contract_address, token_id);
CREATE INDEX IF NOT EXISTS idx_erc1155_uri_updates_block_number ON erc1155_uri_updates(block_number);

-- ============================================================================
-- Tabla: erc1155_custom_events
-- Propósito: Eventos custom de contratos ERC1155 (AssetRegistered, AssetMinted, etc.)
-- Usa JSONB para flexibilidad en estructuras de eventos diferentes
-- ============================================================================
CREATE TABLE IF NOT EXISTS erc1155_custom_events (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  contract_address TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_data JSONB NOT NULL,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tx_hash, log_index)
);

-- Índices para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_erc1155_custom_events_contract_address ON erc1155_custom_events(contract_address);
CREATE INDEX IF NOT EXISTS idx_erc1155_custom_events_event_name ON erc1155_custom_events(event_name);
CREATE INDEX IF NOT EXISTS idx_erc1155_custom_events_block_number ON erc1155_custom_events(block_number);
-- Índice GIN para búsquedas en JSONB
CREATE INDEX IF NOT EXISTS idx_erc1155_custom_events_event_data ON erc1155_custom_events USING GIN (event_data);

-- Comentarios para documentación
COMMENT ON TABLE erc1155_transfers_single IS 'Histórico de eventos TransferSingle de contratos ERC1155';
COMMENT ON TABLE erc1155_transfers_batch IS 'Histórico de eventos TransferBatch de contratos ERC1155';
COMMENT ON TABLE erc1155_approvals_for_all IS 'Histórico de eventos ApprovalForAll de contratos ERC1155';
COMMENT ON TABLE erc1155_uri_updates IS 'Histórico de eventos URI de contratos ERC1155';
COMMENT ON TABLE erc1155_custom_events IS 'Eventos custom de contratos ERC1155 (AssetRegistered, AssetMinted, AssetBurned, etc.)';

-- ============================================================================
-- TABLA TRAITS EXTENSIONS - Para eventos de AdrianTraitsExtensions
-- ============================================================================

-- ============================================================================
-- Tabla: traits_extensions_events
-- Propósito: Eventos de AdrianTraitsExtensions (TraitApplied, AssetAddedToInventory, etc.)
-- Usa JSONB para flexibilidad en estructuras de eventos diferentes
-- ============================================================================
CREATE TABLE IF NOT EXISTS traits_extensions_events (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  contract_address TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_data JSONB NOT NULL,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tx_hash, log_index)
);

-- Índices para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_traits_extensions_events_contract_address ON traits_extensions_events(contract_address);
CREATE INDEX IF NOT EXISTS idx_traits_extensions_events_event_name ON traits_extensions_events(event_name);
CREATE INDEX IF NOT EXISTS idx_traits_extensions_events_block_number ON traits_extensions_events(block_number);
-- Índice GIN para búsquedas en JSONB
CREATE INDEX IF NOT EXISTS idx_traits_extensions_events_event_data ON traits_extensions_events USING GIN (event_data);

-- Comentarios para documentación
COMMENT ON TABLE traits_extensions_events IS 'Eventos de AdrianTraitsExtensions (TraitApplied, AssetAddedToInventory, etc.)';

-- ============================================================================
-- TABLA SHOP - Para eventos de AdrianShopv1
-- ============================================================================

-- ============================================================================
-- Tabla: shop_events
-- Propósito: Eventos de AdrianShopv1 (ItemPurchased, ShopItemConfigured, etc.)
-- Usa JSONB para flexibilidad en estructuras de eventos diferentes
-- ============================================================================
CREATE TABLE IF NOT EXISTS shop_events (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  contract_address TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_data JSONB NOT NULL,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tx_hash, log_index)
);

-- Índices para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_shop_events_contract_address ON shop_events(contract_address);
CREATE INDEX IF NOT EXISTS idx_shop_events_event_name ON shop_events(event_name);
CREATE INDEX IF NOT EXISTS idx_shop_events_block_number ON shop_events(block_number);
-- Índice GIN para búsquedas en JSONB
CREATE INDEX IF NOT EXISTS idx_shop_events_event_data ON shop_events USING GIN (event_data);

-- Comentarios para documentación
COMMENT ON TABLE shop_events IS 'Eventos de AdrianShopv1 (ItemPurchased, ShopItemConfigured, etc.)';

