# 🪙 Setup del Contrato ERC20 - $ADRIAN Token

## 📋 Resumen

Este documento explica cómo está configurado el sistema de indexación para el contrato ERC20 $ADRIAN Token y cómo agregar más contratos ERC20 en el futuro.

## 🏗️ Estructura

El sistema está completamente separado de FloorEngine:

- **Tablas**: Prefijo `erc20_` (erc20_transfers, erc20_approvals, erc20_custom_events)
- **Código**: `src/listeners/erc20/` y `src/processors/erc20-processor.ts`
- **Configuración**: `src/contracts/config/adrian-token.ts`
- **ABIs**: `src/contracts/abis/adrian-token-abi.ts`

## 📊 Tablas de Base de Datos

### erc20_transfers
Almacena todos los eventos `Transfer` del contrato.

**Columnas**:
- `contract_address` - Dirección del contrato (para soportar múltiples tokens)
- `from_address` - Dirección origen
- `to_address` - Dirección destino
- `value_wei` - Cantidad transferida (en wei)
- `tx_hash`, `log_index`, `block_number` - Metadata del evento
- `created_at` - Timestamp

**Uso**:
```sql
-- Ver todas las transferencias del token $ADRIAN
SELECT * FROM erc20_transfers 
WHERE contract_address = '0x7e99075ce287f1cf8cbcaaa6a1c7894e404fd7ea'
ORDER BY block_number DESC;
```

### erc20_approvals
Almacena todos los eventos `Approval` del contrato.

**Columnas**:
- `contract_address` - Dirección del contrato
- `owner` - Dueño de los tokens
- `spender` - Dirección autorizada
- `value_wei` - Cantidad aprobada (en wei)
- `tx_hash`, `log_index`, `block_number` - Metadata
- `created_at` - Timestamp

### erc20_custom_events
Almacena eventos custom del contrato (TaxFeeUpdated, Staked, etc.).

**Columnas**:
- `contract_address` - Dirección del contrato
- `event_name` - Nombre del evento (TaxFeeUpdated, Staked, etc.)
- `event_data` - Datos del evento en formato JSONB
- `tx_hash`, `log_index`, `block_number` - Metadata
- `created_at` - Timestamp

**Ejemplo de event_data**:
```json
{
  "staker": "0x...",
  "amount": "1000000000000000000"
}
```

## ⚙️ Configuración

### Variables de Entorno

No se requieren variables adicionales. El sistema usa las mismas que FloorEngine:
- `RPC_URL_BASE` - URL del RPC de Base
- `SUPABASE_URL` - URL de Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key de Supabase

### Configuración del Contrato

El contrato está configurado en `src/contracts/config/adrian-token.ts`:

```typescript
export const ADRIAN_TOKEN_CONFIG: ContractConfig = {
  address: '0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea',
  name: 'ADRIAN Token',
  type: 'ERC20',
  startBlock: 38200000n, // Opcional: bloque de deployment
  enabled: true,
};
```

**Para configurar el startBlock**:
1. Obtener el bloque de deployment desde Basescan
2. Editar `src/contracts/config/adrian-token.ts`
3. O usar variable de entorno (futuro)

## 🔄 Sincronización

### Sincronización Normal

El bot sincroniza automáticamente cada minuto (configurable con `SYNC_INTERVAL_MINUTES`).

Los logs muestran:
```
[ADRIAN-ERC20] 🔄 Iniciando sincronización de eventos...
[ADRIAN-ERC20] 📊 Procesando X bloques...
[ADRIAN-ERC20] ✅ Procesado evento Transfer en bloque X
[ADRIAN-ERC20] 🎉 Sincronización completada: X eventos procesados
```

### Sincronización Histórica

Para sincronizar desde el bloque de deployment:

1. **Configurar startBlock** en `adrian-token.ts`
2. **Ejecutar sync histórico** (una vez):
   ```typescript
   import { syncHistoricalERC20 } from './listeners/erc20/historical-sync.js';
   await syncHistoricalERC20();
   ```

O crear un script temporal:
```typescript
// scripts/sync-historical-erc20.ts
import { syncHistoricalERC20 } from '../src/listeners/erc20/historical-sync.js';
import 'dotenv/config';

syncHistoricalERC20()
  .then(() => {
    console.log('✅ Sincronización histórica completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
```

## ➕ Agregar Nuevos Contratos ERC20

Para agregar otro contrato ERC20:

1. **Crear configuración** en `src/contracts/config/`:
   ```typescript
   export const NEW_TOKEN_CONFIG: ContractConfig = {
     address: '0x...',
     name: 'New Token',
     type: 'ERC20',
     startBlock: 40000000n, // Opcional
     enabled: true,
   };
   ```

2. **Agregar a index.ts**:
   ```typescript
   import { NEW_TOKEN_CONFIG } from './new-token.js';
   
   export function getActiveContracts(): ContractConfig[] {
     return [ADRIAN_TOKEN_CONFIG, NEW_TOKEN_CONFIG].filter(c => c.enabled);
   }
   ```

3. **Las tablas son compartidas**: `erc20_transfers`, `erc20_approvals`, `erc20_custom_events` ya soportan múltiples contratos vía `contract_address`.

4. **Agregar listener** en `continuous-listener.ts`:
   ```typescript
   import { syncNewTokenEvents } from './listeners/erc20/new-token-listener.js';
   
   // En el loop:
   await syncNewTokenEvents();
   ```

## 🔍 Eventos Indexados

### Eventos Estándar ERC20

- **Transfer**: Todas las transferencias de tokens
- **Approval**: Todas las aprobaciones de gasto

### Eventos Custom de $ADRIAN Token

- **TaxFeeUpdated**: Cambio en la tasa de tax
- **CreatorFeeUpdated**: Cambio en la tasa de creator fee
- **BurnFeeUpdated**: Cambio en la tasa de burn
- **TaxAddressUpdated**: Cambio en dirección de tax
- **CreatorAddressUpdated**: Cambio en dirección de creator
- **FeeExemptionUpdated**: Cambio en exención de fees
- **Staked**: Tokens staked
- **WithdrawnStake**: Retiro de stake con recompensa
- **RewardRateUpdated**: Cambio en tasa de recompensa
- **GalleryAction**: Acciones de integración con gallery

## 📈 Queries Útiles

### Volumen de Trading (24h)
```sql
SELECT 
  SUM(value_wei::numeric / 1e18) as volume_eth_24h,
  COUNT(*) as transfers_24h
FROM erc20_transfers
WHERE contract_address = '0x7e99075ce287f1cf8cbcaaa6a1c7894e404fd7ea'
  AND created_at > NOW() - INTERVAL '24 hours';
```

### Top Holders (actual)
```sql
WITH balances AS (
  SELECT 
    to_address as address,
    SUM(value_wei::numeric) as balance_wei
  FROM erc20_transfers
  WHERE contract_address = '0x7e99075ce287f1cf8cbcaaa6a1c7894e404fd7ea'
  GROUP BY to_address
)
SELECT 
  address,
  balance_wei::numeric / 1e18 as balance_eth
FROM balances
ORDER BY balance_wei DESC
LIMIT 10;
```

### Eventos de Staking
```sql
SELECT 
  event_data->>'staker' as staker,
  event_data->>'amount' as amount,
  created_at
FROM erc20_custom_events
WHERE contract_address = '0x7e99075ce287f1cf8cbcaaa6a1c7894e404fd7ea'
  AND event_name = 'Staked'
ORDER BY created_at DESC;
```

## 🐛 Troubleshooting

### No se están indexando eventos

1. Verificar que el contrato esté `enabled: true` en la configuración
2. Verificar logs en Railway para errores
3. Verificar que `contract_address` esté correcto (lowercase)
4. Verificar que el RPC esté funcionando

### Errores de duplicados

Los errores de "duplicate key" son normales y se ignoran automáticamente (idempotencia).

### Sincronización lenta

- Verificar `BLOCKS_PER_BATCH` (default: 10 para Alchemy Free)
- Verificar `PARALLEL_REQUESTS` (default: 3)
- Considerar upgrade a Alchemy Growth para más bloques por request

## 📝 Notas

- Todas las direcciones se almacenan en **lowercase** para consistencia
- Los valores se almacenan en **wei** (dividir por 1e18 para ETH)
- El sistema es **idempotente**: procesar el mismo evento múltiples veces no crea duplicados
- Los errores en un contrato **no afectan** a otros contratos

