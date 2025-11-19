# 📚 Documentación API para Frontend

## 🎯 Resumen

Este documento describe cómo acceder a los datos indexados de los contratos desde el frontend usando Supabase.

El sistema indexa eventos de **6 contratos** en tiempo real:
- 🔷 **FloorEngine** (Marketplace)
- 🟡 **ADRIAN-ERC20** (Token)
- 🟣 **ADRIAN-ERC721** (NFTs - AdrianZERO)
- 🔵 **TraitsCore** (ERC1155 - Traits, Packs, Serums)
- 🟠 **TraitsExtensions** (Gestión de Traits e Inventario)
- 🛒 **AdrianShop** (Tienda de compras)

---

## 📊 Tablas Disponibles

### 1. **ERC1155 - AdrianTraitsCore**

#### `erc1155_transfers_single`
Transfers individuales de tokens ERC1155.

```sql
SELECT * FROM erc1155_transfers_single
WHERE contract_address = '0x90546848474fb3c9fda3fdad887969bb244e7e58'
  AND token_id = '123'
ORDER BY block_number DESC;
```

**Campos:**
- `contract_address`: Dirección del contrato
- `operator`: Quien ejecutó la transferencia
- `from_address`: De dónde
- `to_address`: Hacia dónde
- `token_id`: ID del token (string)
- `value`: Cantidad transferida (string)
- `tx_hash`: Hash de la transacción
- `block_number`: Número de bloque

#### `erc1155_transfers_batch`
Transfers en batch (múltiples tokens a la vez).

```sql
SELECT * FROM erc1155_transfers_batch
WHERE contract_address = '0x90546848474fb3c9fda3fdad887969bb244e7e58'
  AND '123' = ANY(token_ids)
ORDER BY block_number DESC;
```

**Campos:**
- `token_ids`: Array de IDs de tokens
- `values`: Array de cantidades

#### `erc1155_custom_events`
Eventos custom de TraitsCore (AssetRegistered, AssetMinted, etc.).

```sql
-- Ver todos los assets registrados
SELECT * FROM erc1155_custom_events
WHERE contract_address = '0x90546848474fb3c9fda3fdad887969bb244e7e58'
  AND event_name = 'AssetRegistered'
ORDER BY block_number DESC;

-- Ver mints de un asset específico
SELECT * FROM erc1155_custom_events
WHERE contract_address = '0x90546848474fb3c9fda3fdad887969bb244e7e58'
  AND event_name = 'AssetMinted'
  AND event_data->>'assetId' = '123'
ORDER BY block_number DESC;
```

**Eventos disponibles:**
- `AssetRegistered`: Nuevo asset creado
- `AssetMinted`: Asset minteado a un usuario
- `AssetBurned`: Asset quemado
- `CategoryAdded`: Nueva categoría añadida
- `CategoryRemoved`: Categoría removida
- `ExtensionAdded`: Extensión autorizada
- `ExtensionRemoved`: Extensión desautorizada
- `PaymentTokenUpdated`: Token de pago actualizado
- `AssetUpdated`: Asset actualizado
- `BaseURIUpdated`: Base URI actualizada

**Ejemplo de `event_data` para AssetMinted:**
```json
{
  "assetId": "123",
  "to": "0x...",
  "amount": "5"
}
```

---

### 2. **TraitsExtensions - Gestión de Traits**

#### `traits_extensions_events`
Eventos de aplicación de traits e inventario.

```sql
-- Ver traits aplicados a un token específico
SELECT * FROM traits_extensions_events
WHERE contract_address = '0x0995c0da1ca071b792e852b6ec531b7cd7d1f8d6'
  AND event_name = 'TraitApplied'
  AND event_data->>'tokenId' = '456'
ORDER BY block_number DESC;

-- Ver inventario añadido a un token
SELECT * FROM traits_extensions_events
WHERE contract_address = '0x0995c0da1ca071b792e852b6ec531b7cd7d1f8d6'
  AND event_name = 'AssetAddedToInventory'
  AND event_data->>'tokenId' = '456'
ORDER BY block_number DESC;
```

**Eventos disponibles:**
- `TraitEquipped`: Trait equipado (temporal)
- `TraitUnequipped`: Trait desequipado
- `TraitApplied`: Trait aplicado permanentemente (se quema)
- `TraitsAppliedBatch`: Múltiples traits aplicados en batch
- `AssetAddedToInventory`: Asset añadido al inventario de un token
- `AssetRemovedFromInventory`: Asset removido del inventario
- `CoreContractCallReceived`: Llamada al core contract recibida

**Ejemplo de `event_data` para TraitApplied:**
```json
{
  "tokenId": "456",
  "category": "EYES",
  "traitId": "789"
}
```

**Ejemplo de `event_data` para TraitsAppliedBatch:**
```json
{
  "tokenId": "456",
  "traitIds": ["789", "790", "791"],
  "categories": ["EYES", "MOUTH", "HEAD"]
}
```

---

### 3. **AdrianShop - Compras y Configuración**

#### `shop_events`
Eventos de compras y configuración de la tienda.

```sql
-- Ver todas las compras
SELECT * FROM shop_events
WHERE contract_address = '0x4b265927b1521995ce416bba3bed98231d2e946b'
  AND event_name = 'ItemPurchased'
ORDER BY block_number DESC
LIMIT 100;

-- Ver compras de un usuario específico
SELECT * FROM shop_events
WHERE contract_address = '0x4b265927b1521995ce416bba3bed98231d2e946b'
  AND event_name = 'ItemPurchased'
  AND event_data->>'buyer' = '0x...'
ORDER BY block_number DESC;

-- Ver compras de un asset específico
SELECT * FROM shop_events
WHERE contract_address = '0x4b265927b1521995ce416bba3bed98231d2e946b'
  AND event_name = 'ItemPurchased'
  AND event_data->>'assetId' = '123'
ORDER BY block_number DESC;
```

**Eventos disponibles:**

**Compras:**
- `ItemPurchased`: Compra individual
- `BatchPurchase`: Compra en batch
- `FreeItemClaimed`: Item gratuito reclamado

**Configuración:**
- `ShopItemConfigured`: Item configurado en la tienda
- `ShopItemTimingSet`: Timing (start/end) configurado
- `ShopItemStatusChanged`: Estado activo/inactivo cambiado
- `ShopItemPriceChanged`: Precio actualizado
- `ShopItemQuantityUpdated`: Cantidad disponible actualizada
- `AllowlistConfigured`: Allowlist configurada
- `WalletsAddedToAllowlist`: Wallets añadidas a allowlist
- `WalletsRemovedFromAllowlist`: Wallets removidas de allowlist
- `ShopGlobalStatusChanged`: Estado global de la tienda cambiado
- `TreasuryOverrideSet`: Treasury override configurado

**Ejemplo de `event_data` para ItemPurchased:**
```json
{
  "buyer": "0x...",
  "assetId": "123",
  "quantity": "5",
  "unitPrice": "1000000000000000000",
  "totalCost": "5000000000000000000",
  "freeAmount": "1"
}
```

**Ejemplo de `event_data` para BatchPurchase:**
```json
{
  "buyer": "0x...",
  "assetIds": ["123", "124", "125"],
  "quantities": ["2", "3", "1"],
  "totalCost": "6000000000000000000",
  "totalFreeAmount": "0"
}
```

---

## 🔍 Queries Útiles para el Frontend

### 1. **Obtener balance de un usuario en TraitsCore**

```sql
-- Sumar todos los transfers recibidos menos los enviados
WITH received AS (
  SELECT token_id, SUM(value::numeric) as total
  FROM erc1155_transfers_single
  WHERE contract_address = '0x90546848474fb3c9fda3fdad887969bb244e7e58'
    AND to_address = '0x...'
  GROUP BY token_id
),
sent AS (
  SELECT token_id, SUM(value::numeric) as total
  FROM erc1155_transfers_single
  WHERE contract_address = '0x90546848474fb3c9fda3fdad887969bb244e7e58'
    AND from_address = '0x...'
  GROUP BY token_id
)
SELECT 
  COALESCE(r.token_id, s.token_id) as token_id,
  COALESCE(r.total, 0) - COALESCE(s.total, 0) as balance
FROM received r
FULL OUTER JOIN sent s ON r.token_id = s.token_id
WHERE COALESCE(r.total, 0) - COALESCE(s.total, 0) > 0;
```

### 2. **Obtener traits aplicados a un token**

```sql
SELECT 
  event_data->>'category' as category,
  event_data->>'traitId' as trait_id,
  block_number,
  created_at
FROM traits_extensions_events
WHERE contract_address = '0x0995c0da1ca071b792e852b6ec531b7cd7d1f8d6'
  AND event_name = 'TraitApplied'
  AND event_data->>'tokenId' = '456'
ORDER BY block_number DESC;
```

### 3. **Obtener historial de compras de un usuario**

```sql
SELECT 
  event_data->>'assetId' as asset_id,
  event_data->>'quantity' as quantity,
  event_data->>'totalCost' as total_cost,
  event_data->>'freeAmount' as free_amount,
  block_number,
  created_at
FROM shop_events
WHERE contract_address = '0x4b265927b1521995ce416bba3bed98231d2e946b'
  AND event_name IN ('ItemPurchased', 'BatchPurchase', 'FreeItemClaimed')
  AND (
    event_data->>'buyer' = '0x...' OR
    event_data->>'user' = '0x...'
  )
ORDER BY block_number DESC;
```

### 4. **Obtener estadísticas de ventas de un asset**

```sql
SELECT 
  COUNT(*) as total_purchases,
  SUM((event_data->>'quantity')::numeric) as total_quantity_sold,
  SUM((event_data->>'totalCost')::numeric) as total_revenue,
  AVG((event_data->>'unitPrice')::numeric) as avg_price
FROM shop_events
WHERE contract_address = '0x4b265927b1521995ce416bba3bed98231d2e946b'
  AND event_name = 'ItemPurchased'
  AND event_data->>'assetId' = '123';
```

### 5. **Obtener inventario de un token**

```sql
-- Assets añadidos menos removidos
WITH added AS (
  SELECT 
    event_data->>'assetId' as asset_id,
    SUM((event_data->>'amount')::numeric) as total
  FROM traits_extensions_events
  WHERE contract_address = '0x0995c0da1ca071b792e852b6ec531b7cd7d1f8d6'
    AND event_name = 'AssetAddedToInventory'
    AND event_data->>'tokenId' = '456'
  GROUP BY event_data->>'assetId'
),
removed AS (
  SELECT 
    event_data->>'assetId' as asset_id,
    SUM((event_data->>'amount')::numeric) as total
  FROM traits_extensions_events
  WHERE contract_address = '0x0995c0da1ca071b792e852b6ec531b7cd7d1f8d6'
    AND event_name = 'AssetRemovedFromInventory'
    AND event_data->>'tokenId' = '456'
  GROUP BY event_data->>'assetId'
)
SELECT 
  COALESCE(a.asset_id, r.asset_id) as asset_id,
  COALESCE(a.total, 0) - COALESCE(r.total, 0) as balance
FROM added a
FULL OUTER JOIN removed r ON a.asset_id = r.asset_id
WHERE COALESCE(a.total, 0) - COALESCE(r.total, 0) > 0;
```

---

## 📡 Ejemplo de Uso con Supabase Client (JavaScript/TypeScript)

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY'
);

// Obtener compras recientes
async function getRecentPurchases(limit = 50) {
  const { data, error } = await supabase
    .from('shop_events')
    .select('*')
    .eq('contract_address', '0x4b265927b1521995ce416bba3bed98231d2e946b')
    .eq('event_name', 'ItemPurchased')
    .order('block_number', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// Obtener traits aplicados a un token
async function getTokenTraits(tokenId: string) {
  const { data, error } = await supabase
    .from('traits_extensions_events')
    .select('*')
    .eq('contract_address', '0x0995c0da1ca071b792e852b6ec531b7cd7d1f8d6')
    .eq('event_name', 'TraitApplied')
    .eq('event_data->tokenId', tokenId)
    .order('block_number', { ascending: false });

  if (error) throw error;
  return data;
}

// Obtener balance de un usuario en TraitsCore
async function getUserBalance(userAddress: string, tokenId: string) {
  // Recibidos
  const { data: received } = await supabase
    .from('erc1155_transfers_single')
    .select('value')
    .eq('contract_address', '0x90546848474fb3c9fda3fdad887969bb244e7e58')
    .eq('to_address', userAddress.toLowerCase())
    .eq('token_id', tokenId);

  // Enviados
  const { data: sent } = await supabase
    .from('erc1155_transfers_single')
    .select('value')
    .eq('contract_address', '0x90546848474fb3c9fda3fdad887969bb244e7e58')
    .eq('from_address', userAddress.toLowerCase())
    .eq('token_id', tokenId);

  const receivedTotal = received?.reduce((sum, r) => sum + BigInt(r.value), 0n) || 0n;
  const sentTotal = sent?.reduce((sum, s) => sum + BigInt(s.value), 0n) || 0n;

  return receivedTotal - sentTotal;
}
```

---

## 🎨 Estructura de Datos JSONB

Todos los eventos custom usan JSONB para flexibilidad. Aquí están las estructuras esperadas:

### TraitsCore Custom Events

**AssetRegistered:**
```json
{
  "assetId": "123",
  "category": "EYES",
  "assetType": 0
}
```

**AssetMinted:**
```json
{
  "assetId": "123",
  "to": "0x...",
  "amount": "5"
}
```

### TraitsExtensions Events

**TraitApplied:**
```json
{
  "tokenId": "456",
  "category": "EYES",
  "traitId": "789"
}
```

**TraitsAppliedBatch:**
```json
{
  "tokenId": "456",
  "traitIds": ["789", "790"],
  "categories": ["EYES", "MOUTH"]
}
```

### Shop Events

**ItemPurchased:**
```json
{
  "buyer": "0x...",
  "assetId": "123",
  "quantity": "5",
  "unitPrice": "1000000000000000000",
  "totalCost": "5000000000000000000",
  "freeAmount": "1"
}
```

---

## 🔄 Sincronización en Tiempo Real

El bot sincroniza eventos en tiempo real. Para verificar el estado de sincronización:

```sql
SELECT * FROM sync_state
WHERE contract_address IN (
  '0x90546848474fb3c9fda3fdad887969bb244e7e58', -- TraitsCore
  '0x0995c0da1ca071b792e852b6ec531b7cd7d1f8d6', -- TraitsExtensions
  '0x4b265927b1521995ce416bba3bed98231d2e946b'  -- Shop
)
ORDER BY last_synced_block DESC;
```

---

## 📝 Notas Importantes

1. **Todos los valores numéricos** (bigint) se almacenan como **strings** para evitar pérdida de precisión
2. **Todas las direcciones** se almacenan en **lowercase** para consistencia
3. **Todos los eventos** tienen `UNIQUE(tx_hash, log_index)` para prevenir duplicados
4. **Los índices GIN** en campos JSONB permiten búsquedas eficientes dentro del JSON
5. **El sistema procesa bloques en orden**, garantizando que los eventos estén en orden cronológico

---

## 🚀 Próximos Pasos

1. **Ejecutar el schema.sql** en Supabase para crear las nuevas tablas
2. **Esperar a que el bot sincronice** los bloques históricos
3. **Usar las queries de ejemplo** para construir tu frontend
4. **Configurar Supabase Realtime** si necesitas actualizaciones en tiempo real

---

## 📞 Soporte

Si tienes preguntas sobre la estructura de datos o necesitas queries adicionales, consulta:
- `DATABASE_SCHEMA.md` - Esquema completo de la base de datos
- `AGREGAR_CONTRATOS.md` - Cómo añadir nuevos contratos al sistema

