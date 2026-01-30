-- Migración: Extender sync_state para soportar múltiples contratos
-- Fecha: 2025-11-18
-- Propósito: Agregar contract_address para permitir tracking por contrato

-- Agregar columna contract_address (nullable para mantener compatibilidad)
ALTER TABLE sync_state 
ADD COLUMN IF NOT EXISTS contract_address TEXT;

-- Crear índice único parcial (solo para valores no-null)
-- Esto permite múltiples registros con NULL pero solo uno por contract_address
CREATE UNIQUE INDEX IF NOT EXISTS idx_sync_state_contract_address 
ON sync_state(contract_address) 
WHERE contract_address IS NOT NULL;

-- Migrar registro existente de FloorEngine
-- Si existe un registro sin contract_address, asignarle el address de FloorEngine
UPDATE sync_state 
SET contract_address = '0x0351F7cBA83277E891D4a85Da498A7eACD764D58'
WHERE contract_address IS NULL 
  AND id = (SELECT MIN(id) FROM sync_state WHERE contract_address IS NULL);

-- Comentario para documentación
COMMENT ON COLUMN sync_state.contract_address IS 'Dirección del contrato para tracking multi-contrato. NULL para compatibilidad con FloorEngine legacy.';

