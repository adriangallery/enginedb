-- ============================================================================
-- SQL para agregar tablas de los nuevos contratos
-- Contratos: AdrianNameRegistry, AdrianSerumModule, PunkQuest
-- Ejecutar este script en Supabase SQL Editor después del schema.sql principal
-- ============================================================================

-- ============================================================================
-- TABLAS ADRIAN NAME REGISTRY
-- ============================================================================

-- Tabla: name_registry_events
-- Propósito: Histórico de eventos NameSet del contrato AdrianNameRegistry
CREATE TABLE IF NOT EXISTS name_registry_events (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  contract_address TEXT NOT NULL,
  token_id BIGINT NOT NULL,
  new_name TEXT NOT NULL,
  setter TEXT NOT NULL,
  paid BOOLEAN NOT NULL,
  price_wei NUMERIC,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tx_hash, log_index)
);

CREATE INDEX IF NOT EXISTS idx_name_registry_events_token_id ON name_registry_events(token_id);
CREATE INDEX IF NOT EXISTS idx_name_registry_events_setter ON name_registry_events(setter);
CREATE INDEX IF NOT EXISTS idx_name_registry_events_block_number ON name_registry_events(block_number);
CREATE INDEX IF NOT EXISTS idx_name_registry_events_contract_address ON name_registry_events(contract_address);

-- Tabla: name_registry_config_events
-- Propósito: Eventos de configuración (PriceUpdated, TreasuryUpdated)
CREATE TABLE IF NOT EXISTS name_registry_config_events (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  contract_address TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('PriceUpdated', 'TreasuryUpdated')),
  old_value TEXT,
  new_value TEXT,
  old_price_wei NUMERIC,
  new_price_wei NUMERIC,
  old_treasury TEXT,
  new_treasury TEXT,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tx_hash, log_index)
);

CREATE INDEX IF NOT EXISTS idx_name_registry_config_events_contract_address ON name_registry_config_events(contract_address);
CREATE INDEX IF NOT EXISTS idx_name_registry_config_events_event_type ON name_registry_config_events(event_type);
CREATE INDEX IF NOT EXISTS idx_name_registry_config_events_block_number ON name_registry_config_events(block_number);

COMMENT ON TABLE name_registry_events IS 'Histórico de eventos NameSet del contrato AdrianNameRegistry';
COMMENT ON TABLE name_registry_config_events IS 'Eventos de configuración del contrato AdrianNameRegistry (PriceUpdated, TreasuryUpdated)';

-- ============================================================================
-- TABLAS ADRIAN SERUM MODULE
-- ============================================================================

-- Tabla: serum_module_events
-- Propósito: Histórico de eventos SerumResult del contrato AdrianSerumModule
CREATE TABLE IF NOT EXISTS serum_module_events (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  contract_address TEXT NOT NULL,
  user_address TEXT NOT NULL,
  token_id BIGINT NOT NULL,
  serum_id BIGINT NOT NULL,
  success BOOLEAN NOT NULL,
  mutation TEXT,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tx_hash, log_index)
);

CREATE INDEX IF NOT EXISTS idx_serum_module_events_user_address ON serum_module_events(user_address);
CREATE INDEX IF NOT EXISTS idx_serum_module_events_token_id ON serum_module_events(token_id);
CREATE INDEX IF NOT EXISTS idx_serum_module_events_serum_id ON serum_module_events(serum_id);
CREATE INDEX IF NOT EXISTS idx_serum_module_events_success ON serum_module_events(success);
CREATE INDEX IF NOT EXISTS idx_serum_module_events_block_number ON serum_module_events(block_number);
CREATE INDEX IF NOT EXISTS idx_serum_module_events_contract_address ON serum_module_events(contract_address);

COMMENT ON TABLE serum_module_events IS 'Histórico de eventos SerumResult del contrato AdrianSerumModule';

-- ============================================================================
-- TABLAS PUNK QUEST
-- ============================================================================

-- Tabla: punk_quest_staking_events
-- Propósito: Eventos de staking (Staked, Unstaked, RewardClaimed, FastLevelUpgradePurchased)
CREATE TABLE IF NOT EXISTS punk_quest_staking_events (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  contract_address TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('Staked', 'Unstaked', 'RewardClaimed', 'FastLevelUpgradePurchased')),
  user_address TEXT NOT NULL,
  token_id BIGINT NOT NULL,
  reward_wei NUMERIC,
  bonus_added NUMERIC,
  timestamp BIGINT,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tx_hash, log_index)
);

CREATE INDEX IF NOT EXISTS idx_punk_quest_staking_events_user_address ON punk_quest_staking_events(user_address);
CREATE INDEX IF NOT EXISTS idx_punk_quest_staking_events_token_id ON punk_quest_staking_events(token_id);
CREATE INDEX IF NOT EXISTS idx_punk_quest_staking_events_event_type ON punk_quest_staking_events(event_type);
CREATE INDEX IF NOT EXISTS idx_punk_quest_staking_events_block_number ON punk_quest_staking_events(block_number);
CREATE INDEX IF NOT EXISTS idx_punk_quest_staking_events_contract_address ON punk_quest_staking_events(contract_address);

-- Tabla: punk_quest_item_events
-- Propósito: Eventos de items (ItemAdded, ItemUpdated, ItemPurchasedInStore, ItemEquipped, ArmoryBonusUpdated)
CREATE TABLE IF NOT EXISTS punk_quest_item_events (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  contract_address TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('ItemAdded', 'ItemUpdated', 'ItemPurchasedInStore', 'ItemEquipped', 'ArmoryBonusUpdated')),
  user_address TEXT,
  token_id BIGINT,
  item_id BIGINT,
  item_type TEXT,
  quantity BIGINT,
  price_wei NUMERIC,
  bonus NUMERIC,
  durability BIGINT,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tx_hash, log_index)
);

CREATE INDEX IF NOT EXISTS idx_punk_quest_item_events_user_address ON punk_quest_item_events(user_address);
CREATE INDEX IF NOT EXISTS idx_punk_quest_item_events_token_id ON punk_quest_item_events(token_id);
CREATE INDEX IF NOT EXISTS idx_punk_quest_item_events_item_id ON punk_quest_item_events(item_id);
CREATE INDEX IF NOT EXISTS idx_punk_quest_item_events_event_type ON punk_quest_item_events(event_type);
CREATE INDEX IF NOT EXISTS idx_punk_quest_item_events_block_number ON punk_quest_item_events(block_number);
CREATE INDEX IF NOT EXISTS idx_punk_quest_item_events_contract_address ON punk_quest_item_events(contract_address);

-- Tabla: punk_quest_event_events
-- Propósito: Eventos de quests (EventDefinitionAdded, EventTriggered, AdvancedEventDefinitionAdded, AdvancedEventTriggered)
CREATE TABLE IF NOT EXISTS punk_quest_event_events (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  contract_address TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('EventDefinitionAdded', 'EventTriggered', 'AdvancedEventDefinitionAdded', 'AdvancedEventTriggered')),
  operator_address TEXT,
  token_id BIGINT,
  event_id BIGINT,
  event_name TEXT,
  adjustment NUMERIC,
  description TEXT,
  degrade_amount NUMERIC,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tx_hash, log_index)
);

CREATE INDEX IF NOT EXISTS idx_punk_quest_event_events_operator_address ON punk_quest_event_events(operator_address);
CREATE INDEX IF NOT EXISTS idx_punk_quest_event_events_token_id ON punk_quest_event_events(token_id);
CREATE INDEX IF NOT EXISTS idx_punk_quest_event_events_event_id ON punk_quest_event_events(event_id);
CREATE INDEX IF NOT EXISTS idx_punk_quest_event_events_event_type ON punk_quest_event_events(event_type);
CREATE INDEX IF NOT EXISTS idx_punk_quest_event_events_block_number ON punk_quest_event_events(block_number);
CREATE INDEX IF NOT EXISTS idx_punk_quest_event_events_contract_address ON punk_quest_event_events(contract_address);

COMMENT ON TABLE punk_quest_staking_events IS 'Eventos de staking del contrato PunkQuest (Staked, Unstaked, RewardClaimed, FastLevelUpgradePurchased)';
COMMENT ON TABLE punk_quest_item_events IS 'Eventos de items del contrato PunkQuest (ItemAdded, ItemUpdated, ItemPurchasedInStore, ItemEquipped, ArmoryBonusUpdated)';
COMMENT ON TABLE punk_quest_event_events IS 'Eventos de quests del contrato PunkQuest (EventDefinitionAdded, EventTriggered, AdvancedEventDefinitionAdded, AdvancedEventTriggered)';

