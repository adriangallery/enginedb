# 🗄️ Esquema de Base de Datos - Documentación Completa

## 📋 Estructura General

La base de datos está organizada por tipo de contrato con prefijos claros:

- **FloorEngine**: Tablas sin prefijo (legacy, no tocar)
- **ERC20**: Tablas con prefijo `erc20_`
- **ERC1155**: (Futuro) Tablas con prefijo `erc1155_`

## 🔄 Tabla: sync_state

**Propósito**: Mantener el último bloque sincronizado por contrato

**Columnas**:
- `id` - Primary key
- `last_synced_block` - Último bloque procesado
- `contract_address` - Dirección del contrato (nullable para compatibilidad)
- `updated_at` - Última actualización

**Uso**:
- Un registro por contrato
- FloorEngine: `contract_address = '0x0351F7cBA83277E891D4a85Da498A7eACD764D58'`
- ERC20: `contract_address = '0x7e99075ce287f1cf8cbcaaa6a1c7894e404fd7ea'`

**Índices**:
- `idx_sync_state_contract_address` (único, parcial para valores no-null)

## 🏪 Tablas de FloorEngine (Legacy - No Modificar)

### punk_listings
Estado actual del marketplace por tokenId.

### listing_events
Histórico de eventos Listed y Cancelled.

### trade_events
Histórico de compras (evento Bought).

### sweep_events
Histórico de floor sweeps automáticos.

### engine_config_events
Histórico de cambios de configuración del contrato.

**Nota**: Estas tablas son específicas de FloorEngine y no se modifican.

## 🪙 Tablas ERC20

### erc20_transfers

**Propósito**: Histórico de eventos Transfer de contratos ERC20

**Columnas**:
- `id` - Primary key
- `contract_address` - Dirección del contrato (TEXT, NOT NULL)
- `from_address` - Dirección origen (TEXT, NOT NULL)
- `to_address` - Dirección destino (TEXT, NOT NULL)
- `value_wei` - Cantidad transferida en wei (NUMERIC, NOT NULL)
- `tx_hash` - Hash de transacción (TEXT, NOT NULL)
- `log_index` - Índice del log (INTEGER, NOT NULL)
- `block_number` - Número de bloque (BIGINT, NOT NULL)
- `created_at` - Timestamp (TIMESTAMPTZ, NOT NULL)

**Constraints**:
- `UNIQUE(tx_hash, log_index)` - Idempotencia

**Índices**:
- `idx_erc20_transfers_contract_address`
- `idx_erc20_transfers_from_address`
- `idx_erc20_transfers_to_address`
- `idx_erc20_transfers_block_number`

**Ejemplo de Query**:
```sql
-- Transferencias de un usuario
SELECT * FROM erc20_transfers
WHERE contract_address = '0x7e99075ce287f1cf8cbcaaa6a1c7894e404fd7ea'
  AND (from_address = '0x...' OR to_address = '0x...')
ORDER BY block_number DESC;
```

### erc20_approvals

**Propósito**: Histórico de eventos Approval de contratos ERC20

**Columnas**:
- `id` - Primary key
- `contract_address` - Dirección del contrato
- `owner` - Dueño de los tokens
- `spender` - Dirección autorizada
- `value_wei` - Cantidad aprobada en wei
- `tx_hash`, `log_index`, `block_number`, `created_at`

**Constraints**:
- `UNIQUE(tx_hash, log_index)`

**Índices**:
- `idx_erc20_approvals_contract_address`
- `idx_erc20_approvals_owner`
- `idx_erc20_approvals_spender`
- `idx_erc20_approvals_block_number`

### erc20_custom_events

**Propósito**: Eventos custom de contratos ERC20 (TaxFeeUpdated, Staked, etc.)

**Columnas**:
- `id` - Primary key
- `contract_address` - Dirección del contrato
- `event_name` - Nombre del evento (TEXT)
- `event_data` - Datos del evento (JSONB)
- `tx_hash`, `log_index`, `block_number`, `created_at`

**Constraints**:
- `UNIQUE(tx_hash, log_index)`

**Índices**:
- `idx_erc20_custom_events_contract_address`
- `idx_erc20_custom_events_event_name`
- `idx_erc20_custom_events_block_number`
- `idx_erc20_custom_events_event_data` (GIN para búsquedas en JSONB)

**Estructura de event_data** (ejemplos):

**TaxFeeUpdated**:
```json
{
  "newTaxFee": "500"
}
```

**Staked**:
```json
{
  "staker": "0x...",
  "amount": "1000000000000000000"
}
```

**WithdrawnStake**:
```json
{
  "staker": "0x...",
  "amount": "1000000000000000000",
  "reward": "50000000000000000"
}
```

## 🔧 Ajustes por Contrato

### Cómo Hacer Ajustes Específicos

La estructura modular permite ajustes independientes por contrato:

1. **Ajustes en Tablas**:
   - Agregar columnas específicas solo afecta a ese tipo de contrato
   - Ejemplo: Agregar `fee_amount` a `erc20_transfers` solo afecta ERC20

2. **Ajustes en Código**:
   - Cada contrato tiene su propio listener en `src/listeners/`
   - Cambios en un listener no afectan otros

3. **Ajustes en Procesadores**:
   - Cada tipo tiene su procesador en `src/processors/`
   - Lógica específica por tipo de contrato

### Ejemplo: Agregar Columna a ERC20

```sql
-- Agregar columna solo a erc20_transfers
ALTER TABLE erc20_transfers 
ADD COLUMN fee_amount_wei NUMERIC;

-- Actualizar procesador para incluir fee_amount
-- En src/processors/erc20-processor.ts
```

Esto **NO afecta** a FloorEngine ni a futuros contratos ERC1155.

## 📊 Convenciones de Naming

### Tablas
- **FloorEngine**: Sin prefijo (legacy)
- **ERC20**: Prefijo `erc20_`
- **ERC1155**: Prefijo `erc1155_` (futuro)
- **Genéricas**: Prefijo por tipo de evento

### Columnas
- Direcciones: `*_address` (siempre lowercase)
- Valores: `*_wei` (siempre en wei)
- IDs: `*_id` o `id`
- Timestamps: `created_at`, `updated_at`

### Índices
- Formato: `idx_<tabla>_<columna>`
- Ejemplo: `idx_erc20_transfers_contract_address`

## 🔍 Queries Cross-Contract

### Comparar Actividad entre Contratos

```sql
-- Actividad de un usuario en múltiples contratos
SELECT 
  'FloorEngine' as contract_type,
  COUNT(*) as events
FROM trade_events
WHERE buyer = '0x...' OR seller = '0x...'

UNION ALL

SELECT 
  'ERC20' as contract_type,
  COUNT(*) as events
FROM erc20_transfers
WHERE contract_address = '0x7e99075ce287f1cf8cbcaaa6a1c7894e404fd7ea'
  AND (from_address = '0x...' OR to_address = '0x...');
```

### Volumen Total por Tipo

```sql
-- Volumen de trading en FloorEngine
SELECT 
  'FloorEngine' as source,
  SUM(price_wei::numeric / 1e18) as volume_eth
FROM trade_events

UNION ALL

-- Volumen de transfers en ERC20 (aproximado)
SELECT 
  'ERC20' as source,
  SUM(value_wei::numeric / 1e18) as volume_eth
FROM erc20_transfers
WHERE contract_address = '0x7e99075ce287f1cf8cbcaaa6a1c7894e404fd7ea';
```

## 🚀 Migraciones Futuras

### Agregar Nuevo Tipo de Contrato (ej: ERC1155)

1. Crear tablas con prefijo `erc1155_`
2. Crear listener en `src/listeners/erc1155/`
3. Crear procesador en `src/processors/erc1155-processor.ts`
4. Agregar a `continuous-listener.ts`

**No se requiere modificar**:
- Tablas existentes
- Listeners existentes
- Procesadores existentes

## ⚠️ Consideraciones Importantes

1. **Idempotencia**: Todas las tablas tienen `UNIQUE(tx_hash, log_index)`
2. **Lowercase**: Todas las direcciones se almacenan en lowercase
3. **Wei**: Todos los valores se almacenan en wei (dividir por 1e18 para ETH)
4. **Separación**: Cada tipo de contrato tiene sus propias tablas
5. **Escalabilidad**: Estructura preparada para agregar más contratos

## 📝 Mantenimiento

### Verificar Sincronización

```sql
-- Estado de sincronización por contrato
SELECT 
  contract_address,
  last_synced_block,
  updated_at,
  EXTRACT(EPOCH FROM (NOW() - updated_at)) / 60 as minutes_ago
FROM sync_state
ORDER BY updated_at DESC;
```

### Limpiar Datos (si es necesario)

```sql
-- Eliminar eventos de un contrato específico (cuidado!)
DELETE FROM erc20_transfers 
WHERE contract_address = '0x...';

DELETE FROM erc20_approvals 
WHERE contract_address = '0x...';

DELETE FROM erc20_custom_events 
WHERE contract_address = '0x...';
```

### Backup

Todas las tablas tienen `created_at` para tracking temporal. Los backups regulares de Supabase cubren toda la base de datos.

