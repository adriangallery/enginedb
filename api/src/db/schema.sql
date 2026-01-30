-- ============================================================================
-- SQLite Schema para enginedb-api
-- Convertido desde PostgreSQL (Supabase)
-- ============================================================================

-- ============================================================================
-- Tabla de migraciones (tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS _migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================================
-- Tabla: sync_state
-- Propósito: Mantener el último bloque sincronizado para continuar desde allí
-- ============================================================================
CREATE TABLE IF NOT EXISTS sync_state (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  last_synced_block INTEGER NOT NULL DEFAULT 0,
  last_historical_block INTEGER,
  contract_address TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sync_state_contract_address 
ON sync_state(contract_address) WHERE contract_address IS NOT NULL;

-- ============================================================================
-- Tabla: punk_listings
-- Propósito: Estado actual de listings por tokenId (vista en tiempo real)
-- ============================================================================
CREATE TABLE IF NOT EXISTS punk_listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_id INTEGER UNIQUE NOT NULL,
  seller TEXT NOT NULL,
  price_wei TEXT NOT NULL,
  is_contract_owned INTEGER NOT NULL,
  is_listed INTEGER NOT NULL,
  last_event TEXT NOT NULL,
  last_tx_hash TEXT NOT NULL,
  last_block_number INTEGER NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_punk_listings_token_id ON punk_listings(token_id);
CREATE INDEX IF NOT EXISTS idx_punk_listings_is_listed ON punk_listings(is_listed);
CREATE INDEX IF NOT EXISTS idx_punk_listings_seller ON punk_listings(seller);

-- ============================================================================
-- Tabla: listing_events
-- Propósito: Histórico de eventos Listed y Cancelled
-- ============================================================================
CREATE TABLE IF NOT EXISTS listing_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  token_id INTEGER NOT NULL,
  seller TEXT NOT NULL,
  price_wei TEXT,
  is_contract_owned INTEGER,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tx_hash, log_index)
);

CREATE INDEX IF NOT EXISTS idx_listing_events_token_id ON listing_events(token_id);
CREATE INDEX IF NOT EXISTS idx_listing_events_seller ON listing_events(seller);
CREATE INDEX IF NOT EXISTS idx_listing_events_block_number ON listing_events(block_number);
CREATE INDEX IF NOT EXISTS idx_listing_events_event_type ON listing_events(event_type);

-- ============================================================================
-- Tabla: trade_events
-- Propósito: Histórico de eventos Bought (compras de usuarios)
-- ============================================================================
CREATE TABLE IF NOT EXISTS trade_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_id INTEGER NOT NULL,
  buyer TEXT NOT NULL,
  seller TEXT NOT NULL,
  price_wei TEXT NOT NULL,
  is_contract_owned INTEGER NOT NULL,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tx_hash, log_index)
);

CREATE INDEX IF NOT EXISTS idx_trade_events_token_id ON trade_events(token_id);
CREATE INDEX IF NOT EXISTS idx_trade_events_buyer ON trade_events(buyer);
CREATE INDEX IF NOT EXISTS idx_trade_events_seller ON trade_events(seller);
CREATE INDEX IF NOT EXISTS idx_trade_events_block_number ON trade_events(block_number);

-- ============================================================================
-- Tabla: sweep_events
-- Propósito: Histórico de eventos FloorSweep
-- ============================================================================
CREATE TABLE IF NOT EXISTS sweep_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_id INTEGER NOT NULL,
  buy_price_wei TEXT NOT NULL,
  relist_price_wei TEXT NOT NULL,
  caller TEXT NOT NULL,
  caller_reward_wei TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tx_hash, log_index)
);

CREATE INDEX IF NOT EXISTS idx_sweep_events_token_id ON sweep_events(token_id);
CREATE INDEX IF NOT EXISTS idx_sweep_events_caller ON sweep_events(caller);
CREATE INDEX IF NOT EXISTS idx_sweep_events_block_number ON sweep_events(block_number);

-- ============================================================================
-- Tabla: engine_config_events
-- Propósito: Histórico de cambios en la configuración del FloorEngine
-- ============================================================================
CREATE TABLE IF NOT EXISTS engine_config_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tx_hash, log_index)
);

CREATE INDEX IF NOT EXISTS idx_engine_config_events_event_type ON engine_config_events(event_type);
CREATE INDEX IF NOT EXISTS idx_engine_config_events_block_number ON engine_config_events(block_number);

-- ============================================================================
-- TABLAS ERC20
-- ============================================================================

CREATE TABLE IF NOT EXISTS erc20_transfers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_address TEXT NOT NULL,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  value_wei TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tx_hash, log_index)
);

CREATE INDEX IF NOT EXISTS idx_erc20_transfers_contract_address ON erc20_transfers(contract_address);
CREATE INDEX IF NOT EXISTS idx_erc20_transfers_from_address ON erc20_transfers(from_address);
CREATE INDEX IF NOT EXISTS idx_erc20_transfers_to_address ON erc20_transfers(to_address);
CREATE INDEX IF NOT EXISTS idx_erc20_transfers_block_number ON erc20_transfers(block_number);

CREATE TABLE IF NOT EXISTS erc20_approvals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_address TEXT NOT NULL,
  owner TEXT NOT NULL,
  spender TEXT NOT NULL,
  value_wei TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tx_hash, log_index)
);

CREATE INDEX IF NOT EXISTS idx_erc20_approvals_contract_address ON erc20_approvals(contract_address);
CREATE INDEX IF NOT EXISTS idx_erc20_approvals_owner ON erc20_approvals(owner);
CREATE INDEX IF NOT EXISTS idx_erc20_approvals_spender ON erc20_approvals(spender);
CREATE INDEX IF NOT EXISTS idx_erc20_approvals_block_number ON erc20_approvals(block_number);

CREATE TABLE IF NOT EXISTS erc20_custom_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_address TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_data TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tx_hash, log_index)
);

CREATE INDEX IF NOT EXISTS idx_erc20_custom_events_contract_address ON erc20_custom_events(contract_address);
CREATE INDEX IF NOT EXISTS idx_erc20_custom_events_event_name ON erc20_custom_events(event_name);
CREATE INDEX IF NOT EXISTS idx_erc20_custom_events_block_number ON erc20_custom_events(block_number);

-- ============================================================================
-- TABLAS ERC721
-- ============================================================================

CREATE TABLE IF NOT EXISTS erc721_transfers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_address TEXT NOT NULL,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  token_id TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tx_hash, log_index)
);

CREATE INDEX IF NOT EXISTS idx_erc721_transfers_contract_address ON erc721_transfers(contract_address);
CREATE INDEX IF NOT EXISTS idx_erc721_transfers_from_address ON erc721_transfers(from_address);
CREATE INDEX IF NOT EXISTS idx_erc721_transfers_to_address ON erc721_transfers(to_address);
CREATE INDEX IF NOT EXISTS idx_erc721_transfers_token_id ON erc721_transfers(contract_address, token_id);
CREATE INDEX IF NOT EXISTS idx_erc721_transfers_block_number ON erc721_transfers(block_number);

CREATE TABLE IF NOT EXISTS erc721_approvals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_address TEXT NOT NULL,
  owner TEXT NOT NULL,
  approved TEXT NOT NULL,
  token_id TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tx_hash, log_index)
);

CREATE INDEX IF NOT EXISTS idx_erc721_approvals_contract_address ON erc721_approvals(contract_address);
CREATE INDEX IF NOT EXISTS idx_erc721_approvals_owner ON erc721_approvals(owner);
CREATE INDEX IF NOT EXISTS idx_erc721_approvals_token_id ON erc721_approvals(contract_address, token_id);
CREATE INDEX IF NOT EXISTS idx_erc721_approvals_block_number ON erc721_approvals(block_number);

CREATE TABLE IF NOT EXISTS erc721_approvals_for_all (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_address TEXT NOT NULL,
  owner TEXT NOT NULL,
  operator TEXT NOT NULL,
  approved INTEGER NOT NULL,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tx_hash, log_index)
);

CREATE INDEX IF NOT EXISTS idx_erc721_approvals_for_all_contract_address ON erc721_approvals_for_all(contract_address);
CREATE INDEX IF NOT EXISTS idx_erc721_approvals_for_all_owner ON erc721_approvals_for_all(owner);
CREATE INDEX IF NOT EXISTS idx_erc721_approvals_for_all_operator ON erc721_approvals_for_all(operator);
CREATE INDEX IF NOT EXISTS idx_erc721_approvals_for_all_block_number ON erc721_approvals_for_all(block_number);

CREATE TABLE IF NOT EXISTS erc721_custom_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_address TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_data TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tx_hash, log_index)
);

CREATE INDEX IF NOT EXISTS idx_erc721_custom_events_contract_address ON erc721_custom_events(contract_address);
CREATE INDEX IF NOT EXISTS idx_erc721_custom_events_event_name ON erc721_custom_events(event_name);
CREATE INDEX IF NOT EXISTS idx_erc721_custom_events_block_number ON erc721_custom_events(block_number);

-- ============================================================================
-- TABLAS ERC1155
-- ============================================================================

CREATE TABLE IF NOT EXISTS erc1155_transfers_single (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_address TEXT NOT NULL,
  operator TEXT NOT NULL,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  token_id TEXT NOT NULL,
  value TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tx_hash, log_index)
);

CREATE INDEX IF NOT EXISTS idx_erc1155_transfers_single_contract_address ON erc1155_transfers_single(contract_address);
CREATE INDEX IF NOT EXISTS idx_erc1155_transfers_single_from_address ON erc1155_transfers_single(from_address);
CREATE INDEX IF NOT EXISTS idx_erc1155_transfers_single_to_address ON erc1155_transfers_single(to_address);
CREATE INDEX IF NOT EXISTS idx_erc1155_transfers_single_token_id ON erc1155_transfers_single(contract_address, token_id);
CREATE INDEX IF NOT EXISTS idx_erc1155_transfers_single_block_number ON erc1155_transfers_single(block_number);

CREATE TABLE IF NOT EXISTS erc1155_transfers_batch (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_address TEXT NOT NULL,
  operator TEXT NOT NULL,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  token_ids TEXT NOT NULL,
  amounts TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tx_hash, log_index)
);

CREATE INDEX IF NOT EXISTS idx_erc1155_transfers_batch_contract_address ON erc1155_transfers_batch(contract_address);
CREATE INDEX IF NOT EXISTS idx_erc1155_transfers_batch_from_address ON erc1155_transfers_batch(from_address);
CREATE INDEX IF NOT EXISTS idx_erc1155_transfers_batch_to_address ON erc1155_transfers_batch(to_address);
CREATE INDEX IF NOT EXISTS idx_erc1155_transfers_batch_block_number ON erc1155_transfers_batch(block_number);

CREATE TABLE IF NOT EXISTS erc1155_approvals_for_all (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_address TEXT NOT NULL,
  account TEXT NOT NULL,
  operator TEXT NOT NULL,
  approved INTEGER NOT NULL,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tx_hash, log_index)
);

CREATE INDEX IF NOT EXISTS idx_erc1155_approvals_for_all_contract_address ON erc1155_approvals_for_all(contract_address);
CREATE INDEX IF NOT EXISTS idx_erc1155_approvals_for_all_account ON erc1155_approvals_for_all(account);
CREATE INDEX IF NOT EXISTS idx_erc1155_approvals_for_all_operator ON erc1155_approvals_for_all(operator);
CREATE INDEX IF NOT EXISTS idx_erc1155_approvals_for_all_block_number ON erc1155_approvals_for_all(block_number);

CREATE TABLE IF NOT EXISTS erc1155_uri_updates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_address TEXT NOT NULL,
  token_id TEXT NOT NULL,
  uri TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tx_hash, log_index)
);

CREATE INDEX IF NOT EXISTS idx_erc1155_uri_updates_contract_address ON erc1155_uri_updates(contract_address);
CREATE INDEX IF NOT EXISTS idx_erc1155_uri_updates_token_id ON erc1155_uri_updates(contract_address, token_id);
CREATE INDEX IF NOT EXISTS idx_erc1155_uri_updates_block_number ON erc1155_uri_updates(block_number);

CREATE TABLE IF NOT EXISTS erc1155_custom_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_address TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_data TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tx_hash, log_index)
);

CREATE INDEX IF NOT EXISTS idx_erc1155_custom_events_contract_address ON erc1155_custom_events(contract_address);
CREATE INDEX IF NOT EXISTS idx_erc1155_custom_events_event_name ON erc1155_custom_events(event_name);
CREATE INDEX IF NOT EXISTS idx_erc1155_custom_events_block_number ON erc1155_custom_events(block_number);

-- ============================================================================
-- TABLA TRAITS EXTENSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS traits_extensions_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_address TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_data TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tx_hash, log_index)
);

CREATE INDEX IF NOT EXISTS idx_traits_extensions_events_contract_address ON traits_extensions_events(contract_address);
CREATE INDEX IF NOT EXISTS idx_traits_extensions_events_event_name ON traits_extensions_events(event_name);
CREATE INDEX IF NOT EXISTS idx_traits_extensions_events_block_number ON traits_extensions_events(block_number);

-- ============================================================================
-- TABLA SHOP
-- ============================================================================

CREATE TABLE IF NOT EXISTS shop_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_address TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_data TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tx_hash, log_index)
);

CREATE INDEX IF NOT EXISTS idx_shop_events_contract_address ON shop_events(contract_address);
CREATE INDEX IF NOT EXISTS idx_shop_events_event_name ON shop_events(event_name);
CREATE INDEX IF NOT EXISTS idx_shop_events_block_number ON shop_events(block_number);

-- ============================================================================
-- TABLAS ADRIAN NAME REGISTRY
-- ============================================================================

CREATE TABLE IF NOT EXISTS name_registry_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_address TEXT NOT NULL,
  token_id INTEGER NOT NULL,
  new_name TEXT NOT NULL,
  setter TEXT NOT NULL,
  paid INTEGER NOT NULL,
  price_wei TEXT,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tx_hash, log_index)
);

CREATE INDEX IF NOT EXISTS idx_name_registry_events_token_id ON name_registry_events(token_id);
CREATE INDEX IF NOT EXISTS idx_name_registry_events_setter ON name_registry_events(setter);
CREATE INDEX IF NOT EXISTS idx_name_registry_events_block_number ON name_registry_events(block_number);
CREATE INDEX IF NOT EXISTS idx_name_registry_events_contract_address ON name_registry_events(contract_address);

CREATE TABLE IF NOT EXISTS name_registry_config_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_address TEXT NOT NULL,
  event_type TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  old_price_wei TEXT,
  new_price_wei TEXT,
  old_treasury TEXT,
  new_treasury TEXT,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tx_hash, log_index)
);

CREATE INDEX IF NOT EXISTS idx_name_registry_config_events_contract_address ON name_registry_config_events(contract_address);
CREATE INDEX IF NOT EXISTS idx_name_registry_config_events_event_type ON name_registry_config_events(event_type);
CREATE INDEX IF NOT EXISTS idx_name_registry_config_events_block_number ON name_registry_config_events(block_number);

-- ============================================================================
-- TABLAS ADRIAN SERUM MODULE
-- ============================================================================

CREATE TABLE IF NOT EXISTS serum_module_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_address TEXT NOT NULL,
  user_address TEXT NOT NULL,
  token_id INTEGER NOT NULL,
  serum_id INTEGER NOT NULL,
  success INTEGER NOT NULL,
  mutation TEXT,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tx_hash, log_index)
);

CREATE INDEX IF NOT EXISTS idx_serum_module_events_user_address ON serum_module_events(user_address);
CREATE INDEX IF NOT EXISTS idx_serum_module_events_token_id ON serum_module_events(token_id);
CREATE INDEX IF NOT EXISTS idx_serum_module_events_serum_id ON serum_module_events(serum_id);
CREATE INDEX IF NOT EXISTS idx_serum_module_events_success ON serum_module_events(success);
CREATE INDEX IF NOT EXISTS idx_serum_module_events_block_number ON serum_module_events(block_number);
CREATE INDEX IF NOT EXISTS idx_serum_module_events_contract_address ON serum_module_events(contract_address);

-- ============================================================================
-- TABLAS PUNK QUEST
-- ============================================================================

CREATE TABLE IF NOT EXISTS punk_quest_staking_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_address TEXT NOT NULL,
  event_type TEXT NOT NULL,
  user_address TEXT NOT NULL,
  token_id INTEGER NOT NULL,
  reward_wei TEXT,
  bonus_added TEXT,
  timestamp INTEGER,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tx_hash, log_index)
);

CREATE INDEX IF NOT EXISTS idx_punk_quest_staking_events_user_address ON punk_quest_staking_events(user_address);
CREATE INDEX IF NOT EXISTS idx_punk_quest_staking_events_token_id ON punk_quest_staking_events(token_id);
CREATE INDEX IF NOT EXISTS idx_punk_quest_staking_events_event_type ON punk_quest_staking_events(event_type);
CREATE INDEX IF NOT EXISTS idx_punk_quest_staking_events_block_number ON punk_quest_staking_events(block_number);
CREATE INDEX IF NOT EXISTS idx_punk_quest_staking_events_contract_address ON punk_quest_staking_events(contract_address);

CREATE TABLE IF NOT EXISTS punk_quest_item_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_address TEXT NOT NULL,
  event_type TEXT NOT NULL,
  user_address TEXT,
  token_id INTEGER,
  item_id INTEGER,
  item_type TEXT,
  quantity INTEGER,
  price_wei TEXT,
  bonus TEXT,
  durability INTEGER,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tx_hash, log_index)
);

CREATE INDEX IF NOT EXISTS idx_punk_quest_item_events_user_address ON punk_quest_item_events(user_address);
CREATE INDEX IF NOT EXISTS idx_punk_quest_item_events_token_id ON punk_quest_item_events(token_id);
CREATE INDEX IF NOT EXISTS idx_punk_quest_item_events_item_id ON punk_quest_item_events(item_id);
CREATE INDEX IF NOT EXISTS idx_punk_quest_item_events_event_type ON punk_quest_item_events(event_type);
CREATE INDEX IF NOT EXISTS idx_punk_quest_item_events_block_number ON punk_quest_item_events(block_number);
CREATE INDEX IF NOT EXISTS idx_punk_quest_item_events_contract_address ON punk_quest_item_events(contract_address);

CREATE TABLE IF NOT EXISTS punk_quest_event_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contract_address TEXT NOT NULL,
  event_type TEXT NOT NULL,
  operator_address TEXT,
  token_id INTEGER,
  event_id INTEGER,
  event_name TEXT,
  adjustment TEXT,
  description TEXT,
  degrade_amount TEXT,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tx_hash, log_index)
);

CREATE INDEX IF NOT EXISTS idx_punk_quest_event_events_operator_address ON punk_quest_event_events(operator_address);
CREATE INDEX IF NOT EXISTS idx_punk_quest_event_events_token_id ON punk_quest_event_events(token_id);
CREATE INDEX IF NOT EXISTS idx_punk_quest_event_events_event_id ON punk_quest_event_events(event_id);
CREATE INDEX IF NOT EXISTS idx_punk_quest_event_events_event_type ON punk_quest_event_events(event_type);
CREATE INDEX IF NOT EXISTS idx_punk_quest_event_events_block_number ON punk_quest_event_events(block_number);
CREATE INDEX IF NOT EXISTS idx_punk_quest_event_events_contract_address ON punk_quest_event_events(contract_address);

-- ============================================================================
-- Triggers para auto-actualizar updated_at (solo en tablas que lo tienen)
-- ============================================================================

CREATE TRIGGER IF NOT EXISTS update_sync_state_updated_at
AFTER UPDATE ON sync_state
BEGIN
  UPDATE sync_state SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_punk_listings_updated_at
AFTER UPDATE ON punk_listings
BEGIN
  UPDATE punk_listings SET updated_at = datetime('now') WHERE id = NEW.id;
END;
