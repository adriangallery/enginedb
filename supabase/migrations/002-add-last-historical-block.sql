-- ============================================================================
-- Migración: Agregar columna last_historical_block a sync_state
-- ============================================================================
-- Esta migración agrega la columna last_historical_block para rastrear
-- el progreso de sincronización histórica hacia atrás
-- ============================================================================

-- Agregar columna last_historical_block si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sync_state' AND column_name = 'last_historical_block'
  ) THEN
    ALTER TABLE sync_state ADD COLUMN last_historical_block BIGINT;
  END IF;
END $$;

-- Comentario para documentación
COMMENT ON COLUMN sync_state.last_historical_block IS 'Último bloque procesado en sincronización histórica hacia atrás';

