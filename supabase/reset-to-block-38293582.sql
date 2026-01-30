-- Resetear sync_state para comenzar desde el bloque 38293582
-- Este script resetea todos los contratos al bloque de inicio especificado
-- Mantiene los datos de eventos existentes, solo resetea el progreso de sincronización

-- Deshabilitar triggers temporalmente
ALTER TABLE sync_state DISABLE TRIGGER USER;

-- Resetear todos los contratos al bloque 38293582
-- last_synced_block se pone en 38293581 (un bloque antes) para que el siguiente sea 38293582
-- last_historical_block se pone en 38293582 para que el backward empiece desde ahí hacia atrás
UPDATE sync_state
SET 
  last_synced_block = 38293581,
  last_historical_block = 38293582,
  updated_at = NOW()
WHERE contract_address IN (
  '0x0351f7cba83277e891d4a85da498a7eacd764d58', -- FloorEngine
  '0x7e99075ce287f1cf8cbcaaa6a1c7894e404fd7ea', -- ADRIAN-ERC20
  '0x6e369bf0e4e0c106192d606fb6d85836d684da75', -- ADRIAN-ERC721
  '0x90546848474fb3c9fda3fdad887969bb244e7e58', -- TraitsCore
  '0x0995c0da1ca071b792e852b6ec531b7cd7d1f8d6', -- TraitsExtensions
  '0x4b265927b1521995ce416bba3bed98231d2e946b'  -- AdrianShop
);

-- Si algún contrato no existe en sync_state, crearlo
INSERT INTO sync_state (contract_address, last_synced_block, last_historical_block)
SELECT '0x0351f7cba83277e891d4a85da498a7eacd764d58', 38293581, 38293582
WHERE NOT EXISTS (
  SELECT 1 FROM sync_state WHERE contract_address = '0x0351f7cba83277e891d4a85da498a7eacd764d58'
);

INSERT INTO sync_state (contract_address, last_synced_block, last_historical_block)
SELECT '0x7e99075ce287f1cf8cbcaaa6a1c7894e404fd7ea', 38293581, 38293582
WHERE NOT EXISTS (
  SELECT 1 FROM sync_state WHERE contract_address = '0x7e99075ce287f1cf8cbcaaa6a1c7894e404fd7ea'
);

INSERT INTO sync_state (contract_address, last_synced_block, last_historical_block)
SELECT '0x6e369bf0e4e0c106192d606fb6d85836d684da75', 38293581, 38293582
WHERE NOT EXISTS (
  SELECT 1 FROM sync_state WHERE contract_address = '0x6e369bf0e4e0c106192d606fb6d85836d684da75'
);

INSERT INTO sync_state (contract_address, last_synced_block, last_historical_block)
SELECT '0x90546848474fb3c9fda3fdad887969bb244e7e58', 38293581, 38293582
WHERE NOT EXISTS (
  SELECT 1 FROM sync_state WHERE contract_address = '0x90546848474fb3c9fda3fdad887969bb244e7e58'
);

INSERT INTO sync_state (contract_address, last_synced_block, last_historical_block)
SELECT '0x0995c0da1ca071b792e852b6ec531b7cd7d1f8d6', 38293581, 38293582
WHERE NOT EXISTS (
  SELECT 1 FROM sync_state WHERE contract_address = '0x0995c0da1ca071b792e852b6ec531b7cd7d1f8d6'
);

INSERT INTO sync_state (contract_address, last_synced_block, last_historical_block)
SELECT '0x4b265927b1521995ce416bba3bed98231d2e946b', 38293581, 38293582
WHERE NOT EXISTS (
  SELECT 1 FROM sync_state WHERE contract_address = '0x4b265927b1521995ce416bba3bed98231d2e946b'
);

-- Re-habilitar triggers
ALTER TABLE sync_state ENABLE TRIGGER USER;

-- Mostrar el estado final
SELECT 
  contract_address,
  last_synced_block,
  last_historical_block,
  updated_at
FROM sync_state
ORDER BY contract_address;

