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

## 📋 Direcciones de Contratos

| Contrato | Dirección | Tipo | Start Block |
|----------|-----------|------|-------------|
| 🔷 FloorEngine | `0x0351F7cBA83277E891D4a85Da498A7eACD764D58` | Marketplace | 0 |
| 🟡 ADRIAN Token | `0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea` | ERC20 | 26367738 |
| 🟣 AdrianLABCore | `0x6e369bf0e4e0c106192d606fb6d85836d684da75` | ERC721 | 31180024 |
| 🔵 TraitsCore | `0x90546848474fb3c9fda3fdad887969bb244e7e58` | ERC1155 | 32334620 |
| 🟠 TraitsExtensions | `0x0995c0da1ca071b792e852b6ec531b7cd7d1f8d6` | Custom | 32414246 |
| 🛒 AdrianShop | `0x4b265927b1521995ce416bba3bed98231d2e946b` | Custom | 33273455 |

---

## 📊 Tablas Disponibles

### 1. **ERC20 - ADRIAN Token**

#### `erc20_transfers`
Transfers del token ERC20 $ADRIAN.

```sql
-- Ver todos los transfers de un usuario
SELECT * FROM erc20_transfers
WHERE contract_address = '0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea'
  AND (from_address = '0x...' OR to_address = '0x...')
ORDER BY block_number DESC
LIMIT 100;

-- Ver balance actual de un usuario (suma recibidos - enviados)
WITH received AS (
  SELECT SUM(value_wei::numeric) as total
  FROM erc20_transfers
  WHERE contract_address = '0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea'
    AND to_address = '0x...'
),
sent AS (
  SELECT SUM(value_wei::numeric) as total
  FROM erc20_transfers
  WHERE contract_address = '0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea'
    AND from_address = '0x...'
)
SELECT 
  COALESCE((SELECT total FROM received), 0) - COALESCE((SELECT total FROM sent), 0) as balance;
```

**Campos:**
- `contract_address`: Dirección del contrato
- `from_address`: De dónde se transfirió
- `to_address`: Hacia dónde se transfirió
- `value_wei`: Cantidad transferida en wei (string)
- `tx_hash`: Hash de la transacción
- `block_number`: Número de bloque
- `created_at`: Fecha de la transacción (timestamp del bloque)

#### `erc20_approvals`
Aprobaciones de gasto del token.

```sql
SELECT * FROM erc20_approvals
WHERE contract_address = '0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea'
  AND owner = '0x...'
ORDER BY block_number DESC;
```

#### `erc20_custom_events`
Eventos custom del token (TaxFeeUpdated, Staked, etc.).

```sql
-- Ver todos los stakes de un usuario
SELECT * FROM erc20_custom_events
WHERE contract_address = '0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea'
  AND event_name = 'Staked'
  AND event_data->>'staker' = '0x...'
ORDER BY block_number DESC;

-- Ver actualizaciones de fees
SELECT * FROM erc20_custom_events
WHERE contract_address = '0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea'
  AND event_name IN ('TaxFeeUpdated', 'CreatorFeeUpdated', 'BurnFeeUpdated')
ORDER BY block_number DESC;
```

**Eventos disponibles:**
- `TaxFeeUpdated`: Tax fee actualizado
- `CreatorFeeUpdated`: Creator fee actualizado
- `BurnFeeUpdated`: Burn fee actualizado
- `TaxAddressUpdated`: Dirección de tax actualizada
- `CreatorAddressUpdated`: Dirección de creator actualizada
- `FeeExemptionUpdated`: Exención de fees actualizada
- `Staked`: Tokens staked
- `WithdrawnStake`: Stake retirado
- `RewardRateUpdated`: Tasa de recompensa actualizada
- `GalleryAction`: Acción en la galería

---

### 2. **ERC721 - AdrianLABCore (AdrianZERO)**

#### `erc721_transfers`
Transfers de NFTs (AdrianZERO).

```sql
-- Ver todos los transfers de un token específico
SELECT * FROM erc721_transfers
WHERE contract_address = '0x6e369bf0e4e0c106192d606fb6d85836d684da75'
  AND token_id = '123'
ORDER BY block_number DESC;

-- Ver todos los NFTs de un usuario (último owner conocido)
SELECT DISTINCT ON (token_id) 
  token_id, to_address as owner, block_number, tx_hash
FROM erc721_transfers
WHERE contract_address = '0x6e369bf0e4e0c106192d606fb6d85836d684da75'
  AND to_address = '0x...'
ORDER BY token_id, block_number DESC;
```

**Campos:**
- `contract_address`: Dirección del contrato
- `from_address`: De dónde (0x0000... para mints)
- `to_address`: Hacia dónde (0x0000... para burns)
- `token_id`: ID del NFT (string)
- `tx_hash`: Hash de la transacción
- `block_number`: Número de bloque
- `created_at`: Fecha de la transacción (timestamp del bloque)

#### `erc721_approvals`
Aprobaciones de tokens individuales.

```sql
SELECT * FROM erc721_approvals
WHERE contract_address = '0x6e369bf0e4e0c106192d606fb6d85836d684da75'
  AND owner = '0x...'
ORDER BY block_number DESC;
```

#### `erc721_approvals_for_all`
Aprobaciones para todos los tokens de un owner.

```sql
SELECT * FROM erc721_approvals_for_all
WHERE contract_address = '0x6e369bf0e4e0c106192d606fb6d85836d684da75'
  AND owner = '0x...'
ORDER BY block_number DESC;
```

#### `erc721_custom_events`
Eventos custom de AdrianLABCore (TokenMinted, SkinCreated, etc.).

```sql
-- Ver todos los mints
SELECT * FROM erc721_custom_events
WHERE contract_address = '0x6e369bf0e4e0c106192d606fb6d85836d684da75'
  AND event_name = 'TokenMinted'
ORDER BY block_number DESC;

-- Ver skins creados
SELECT * FROM erc721_custom_events
WHERE contract_address = '0x6e369bf0e4e0c106192d606fb6d85836d684da75'
  AND event_name = 'SkinCreated'
ORDER BY block_number DESC;

-- Ver mutaciones asignadas
SELECT * FROM erc721_custom_events
WHERE contract_address = '0x6e369bf0e4e0c106192d606fb6d85836d684da75'
  AND event_name = 'MutationAssigned'
  AND event_data->>'tokenId' = '123'
ORDER BY block_number DESC;
```

**Eventos disponibles:**
- `TokenMinted`: NFT minteado
- `TokenBurnt`: NFT quemado
- `SkinCreated`: Skin creado
- `SkinAssigned`: Skin asignado a un token
- `SkinUpdated`: Skin actualizado
- `SkinRemoved`: Skin removido
- `RandomSkinToggled`: Random skin activado/desactivado
- `MutationAssigned`: Mutación asignada
- `MutationNameAssigned`: Nombre de mutación asignado
- `SerumApplied`: Serum aplicado
- `MutationSkinSet`: Skin de mutación configurado
- `SpecialSkinApplied`: Skin especial aplicado
- `BaseURIUpdated`: Base URI actualizada
- `ExtensionsContractUpdated`: Contrato de extensiones actualizado
- `TraitsContractUpdated`: Contrato de traits actualizado
- `PaymentTokenUpdated`: Token de pago actualizado
- `TreasuryWalletUpdated`: Wallet de treasury actualizada
- `AdminContractUpdated`: Contrato admin actualizado
- `FunctionImplementationUpdated`: Implementación de función actualizada
- `ProceedsWithdrawn`: Proceeds retirados
- `FirstModification`: Primera modificación de un token

**Ejemplo de `event_data` para TokenMinted:**
```json
{
  "to": "0x...",
  "tokenId": "123"
}
```

**Ejemplo de `event_data` para SkinAssigned:**
```json
{
  "tokenId": "123",
  "skinId": "456",
  "name": "Cool Skin"
}
```

---

### 3. **FloorEngine - Marketplace**

#### `punk_listings`
Estado actual de listings por tokenId (vista en tiempo real).

```sql
-- Ver todos los listings activos
SELECT * FROM punk_listings
WHERE is_listed = true
ORDER BY price_wei ASC;

-- Ver listing de un token específico
SELECT * FROM punk_listings
WHERE token_id = 123;
```

**Campos:**
- `token_id`: ID del NFT listado
- `seller`: Dirección del vendedor
- `price_wei`: Precio en wei (string)
- `is_contract_owned`: Si el contrato es el owner
- `is_listed`: Si está actualmente listado
- `last_event`: Último evento ('Listed' o 'Cancelled')
- `last_tx_hash`: Hash de la última transacción
- `last_block_number`: Número del último bloque
- `updated_at`: Última actualización

#### `listing_events`
Histórico de eventos Listed y Cancelled.

```sql
-- Ver historial de listings de un token
SELECT * FROM listing_events
WHERE token_id = 123
ORDER BY block_number DESC;

-- Ver todos los listings activos (último evento fue 'Listed')
SELECT DISTINCT ON (token_id) *
FROM listing_events
WHERE event_type = 'Listed'
ORDER BY token_id, block_number DESC;
```

#### `trade_events`
Histórico de compras (evento Bought).

```sql
-- Ver todas las compras
SELECT * FROM trade_events
ORDER BY block_number DESC
LIMIT 100;

-- Ver compras de un usuario
SELECT * FROM trade_events
WHERE buyer = '0x...'
ORDER BY block_number DESC;

-- Ver ventas de un usuario
SELECT * FROM trade_events
WHERE seller = '0x...'
ORDER BY block_number DESC;
```

#### `sweep_events`
Histórico de floor sweeps automáticos.

```sql
SELECT * FROM sweep_events
ORDER BY block_number DESC
LIMIT 100;
```

#### `engine_config_events`
Histórico de cambios en la configuración del FloorEngine.

```sql
SELECT * FROM engine_config_events
ORDER BY block_number DESC;
```

**Eventos disponibles:**
- `PremiumUpdated`: Premium actualizado
- `MaxBuyPriceUpdated`: Precio máximo de compra actualizado
- `CallerRewardModeUpdated`: Modo de recompensa actualizado
- `CallerRewardBpsUpdated`: Recompensa en BPS actualizada
- `CallerRewardFixedUpdated`: Recompensa fija actualizada
- `OwnershipTransferred`: Ownership transferido

---

### 4. **ERC1155 - AdrianTraitsCore**

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

### 5. **TraitsExtensions - Gestión de Traits**

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

### 6. **AdrianShop - Compras y Configuración**

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

### 1. **Obtener balance de $ADRIAN Token de un usuario**

```sql
WITH received AS (
  SELECT SUM(value_wei::numeric) as total
  FROM erc20_transfers
  WHERE contract_address = '0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea'
    AND to_address = '0x...'
),
sent AS (
  SELECT SUM(value_wei::numeric) as total
  FROM erc20_transfers
  WHERE contract_address = '0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea'
    AND from_address = '0x...'
)
SELECT 
  COALESCE((SELECT total FROM received), 0) - COALESCE((SELECT total FROM sent), 0) as balance_wei;
```

### 2. **Obtener todos los NFTs de un usuario (AdrianZERO)**

```sql
-- Obtener el último owner conocido de cada token
WITH latest_transfers AS (
  SELECT DISTINCT ON (token_id)
    token_id,
    to_address as owner,
    block_number,
    created_at
  FROM erc721_transfers
  WHERE contract_address = '0x6e369bf0e4e0c106192d606fb6d85836d684da75'
  ORDER BY token_id, block_number DESC
)
SELECT token_id, owner, created_at
FROM latest_transfers
WHERE owner = '0x...'
ORDER BY token_id;
```

### 3. **Obtener historial completo de un NFT**

```sql
SELECT 
  from_address,
  to_address,
  block_number,
  created_at,
  tx_hash
FROM erc721_transfers
WHERE contract_address = '0x6e369bf0e4e0c106192d606fb6d85836d684da75'
  AND token_id = '123'
ORDER BY block_number ASC;
```

### 4. **Obtener listings activos del marketplace**

```sql
SELECT 
  token_id,
  seller,
  price_wei,
  is_contract_owned,
  last_tx_hash,
  updated_at
FROM punk_listings
WHERE is_listed = true
ORDER BY price_wei ASC;
```

### 5. **Obtener historial de trades de un token**

```sql
SELECT 
  buyer,
  seller,
  price_wei,
  block_number,
  created_at,
  tx_hash
FROM trade_events
WHERE token_id = 123
ORDER BY block_number DESC;
```

### 6. **Obtener balance de un usuario en TraitsCore**

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

### 7. **Obtener traits aplicados a un token**

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

### 8. **Obtener historial de compras de un usuario**

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

### 9. **Obtener estadísticas de ventas de un asset**

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

### 10. **Obtener inventario de un token**

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

// Obtener balance de $ADRIAN Token
async function getADRIANBalance(userAddress: string) {
  const { data: received } = await supabase
    .from('erc20_transfers')
    .select('value_wei')
    .eq('contract_address', '0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea')
    .eq('to_address', userAddress.toLowerCase());

  const { data: sent } = await supabase
    .from('erc20_transfers')
    .select('value_wei')
    .eq('contract_address', '0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea')
    .eq('from_address', userAddress.toLowerCase());

  const receivedTotal = received?.reduce((sum, r) => sum + BigInt(r.value_wei), 0n) || 0n;
  const sentTotal = sent?.reduce((sum, s) => sum + BigInt(s.value_wei), 0n) || 0n;

  return receivedTotal - sentTotal;
}

// Obtener NFTs de un usuario (AdrianZERO)
async function getUserNFTs(userAddress: string) {
  // Obtener todos los transfers donde el usuario recibió tokens
  const { data: transfers } = await supabase
    .from('erc721_transfers')
    .select('token_id, block_number, created_at')
    .eq('contract_address', '0x6e369bf0e4e0c106192d606fb6d85836d684da75')
    .eq('to_address', userAddress.toLowerCase())
    .order('block_number', { ascending: false });

  // Filtrar solo los tokens que el usuario aún posee
  // (no han sido transferidos después)
  const ownedTokens = new Set<string>();
  if (transfers) {
    for (const transfer of transfers) {
      if (!ownedTokens.has(transfer.token_id)) {
        // Verificar si el token fue transferido después
        const { data: laterTransfers } = await supabase
          .from('erc721_transfers')
          .select('from_address')
          .eq('contract_address', '0x6e369bf0e4e0c106192d606fb6d85836d684da75')
          .eq('token_id', transfer.token_id)
          .gt('block_number', transfer.block_number)
          .limit(1);

        if (!laterTransfers || laterTransfers.length === 0) {
          ownedTokens.add(transfer.token_id);
        }
      }
    }
  }

  return Array.from(ownedTokens);
}

// Obtener listings activos
async function getActiveListings() {
  const { data, error } = await supabase
    .from('punk_listings')
    .select('*')
    .eq('is_listed', true)
    .order('price_wei', { ascending: true });

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

El sistema usa una estrategia de sincronización intercalada que prioriza datos en tiempo real:

- **Forward (Tiempo Real)**: Sincroniza desde el último bloque procesado hacia el bloque actual
- **Backward (Histórico)**: Sincroniza desde el bloque actual hacia atrás hasta el startBlock

Esto garantiza que los datos más recientes estén disponibles lo antes posible, mientras se completa el histórico en segundo plano.

Para verificar el estado de sincronización:

```sql
SELECT 
  contract_address,
  last_synced_block as forward_progress,
  last_historical_block as backward_progress,
  updated_at
FROM sync_state
WHERE contract_address IN (
  '0x0351F7cBA83277E891D4a85Da498A7eACD764D58', -- FloorEngine
  '0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea', -- ADRIAN Token
  '0x6e369bf0e4e0c106192d606fb6d85836d684da75', -- AdrianLABCore
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
6. **Las fechas (`created_at`)** reflejan el timestamp real del bloque de la transacción, no cuando se indexó
7. **Sincronización intercalada**: Los datos más recientes tienen prioridad sobre el histórico

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

