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

-- Insertar fila inicial si no existe
INSERT INTO sync_state (last_synced_block)
SELECT 0
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

-- Trigger para sync_state
CREATE TRIGGER update_sync_state_updated_at
  BEFORE UPDATE ON sync_state
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para punk_listings
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

