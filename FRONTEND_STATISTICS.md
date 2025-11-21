# 📊 Documentación de Estadísticas para Frontend

Este documento contiene todas las consultas y ejemplos de código para obtener estadísticas de todos los contratos indexados.

---

## 📋 Índice

1. [🔷 FloorEngine - Marketplace](#-floorengine---marketplace)
2. [🟡 ERC20 - $ADRIAN Token](#-erc20---adrian-token)
3. [🟣 ERC721 - AdrianZERO NFTs](#-erc721---adrianzero-nfts)
4. [🔵 ERC1155 - Traits, Packs, Serums](#-erc1155---traits-packs-serums)
5. [🟠 TraitsExtensions](#-traitsextensions)
6. [🛒 AdrianShop](#-adrianshop)
7. [🔗 Estadísticas Combinadas](#-estadísticas-combinadas)

---

## 🔷 FloorEngine - Marketplace

### Tablas Disponibles

| Tabla | Descripción | Campos Principales |
|-------|-------------|-------------------|
| `active_punk_listings` | Vista de punks a la venta | `token_id`, `price_adrian_wei`, `is_engine_owned` |
| `punk_listings` | Estado actual de todos los punks | `token_id`, `seller`, `price_wei`, `is_listed`, `is_contract_owned` |
| `listing_events` | Histórico Listed/Cancelled | `event_type`, `token_id`, `price_wei`, `seller`, `created_at` |
| `trade_events` | Histórico de compras | `token_id`, `buyer`, `seller`, `price_wei`, `created_at` |
| `sweep_events` | Histórico de floor sweeps | `token_id`, `buy_price_wei`, `relist_price_wei`, `caller`, `created_at` |

### Estadísticas Principales

#### 1. Estadísticas Generales del Marketplace

```sql
-- Total de punks a la venta
SELECT COUNT(*) as total_active_listings FROM active_punk_listings;

-- Floor price (precio más bajo)
SELECT MIN(price_adrian_wei) as floor_price FROM active_punk_listings;

-- Precio promedio
SELECT AVG(price_adrian_wei) as avg_price FROM active_punk_listings;

-- Precio más alto
SELECT MAX(price_adrian_wei) as max_price FROM active_punk_listings;

-- Distribución: Engine vs Usuarios
SELECT 
  is_engine_owned,
  COUNT(*) as count,
  MIN(price_adrian_wei) as min_price,
  AVG(price_adrian_wei) as avg_price,
  MAX(price_adrian_wei) as max_price
FROM active_punk_listings
GROUP BY is_engine_owned;
```

**Ejemplo TypeScript:**
```typescript
interface MarketplaceStats {
  totalActiveListings: number;
  floorPrice: string;
  avgPrice: string;
  maxPrice: string;
  engineListings: number;
  userListings: number;
}

async function getMarketplaceStats(): Promise<MarketplaceStats> {
  const { data: active } = await supabase
    .from('active_punk_listings')
    .select('price_adrian_wei, is_engine_owned');

  if (!active) return defaultStats();

  const prices = active.map(a => parseFloat(a.price_adrian_wei));
  const engineCount = active.filter(a => a.is_engine_owned).length;
  const userCount = active.length - engineCount;

  return {
    totalActiveListings: active.length,
    floorPrice: Math.min(...prices).toString(),
    avgPrice: (prices.reduce((a, b) => a + b, 0) / prices.length).toString(),
    maxPrice: Math.max(...prices).toString(),
    engineListings: engineCount,
    userListings: userCount,
  };
}
```

#### 2. Estadísticas de Trading

```sql
-- Total de trades
SELECT COUNT(*) as total_trades FROM trade_events;

-- Volumen total (suma de todos los precios)
SELECT SUM(price_wei::numeric) as total_volume_wei FROM trade_events;

-- Volumen en las últimas 24 horas
SELECT SUM(price_wei::numeric) as volume_24h_wei
FROM trade_events
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- Volumen por día (últimos 30 días)
SELECT 
  DATE(created_at) as date,
  COUNT(*) as trades_count,
  SUM(price_wei::numeric) as volume_wei,
  AVG(price_wei::numeric) as avg_price_wei
FROM trade_events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Top compradores
SELECT 
  buyer,
  COUNT(*) as purchases,
  SUM(price_wei::numeric) as total_spent_wei,
  AVG(price_wei::numeric) as avg_price_wei
FROM trade_events
GROUP BY buyer
ORDER BY total_spent_wei DESC
LIMIT 20;

-- Top vendedores
SELECT 
  seller,
  COUNT(*) as sales,
  SUM(price_wei::numeric) as total_earned_wei,
  AVG(price_wei::numeric) as avg_price_wei
FROM trade_events
WHERE is_contract_owned = false  -- Solo usuarios, no engine
GROUP BY seller
ORDER BY total_earned_wei DESC
LIMIT 20;
```

**Ejemplo TypeScript:**
```typescript
interface TradingStats {
  totalTrades: number;
  totalVolume: string;
  volume24h: string;
  avgPrice: string;
  topBuyers: Array<{ address: string; purchases: number; totalSpent: string }>;
  topSellers: Array<{ address: string; sales: number; totalEarned: string }>;
}

async function getTradingStats(): Promise<TradingStats> {
  // Total trades
  const { count: totalTrades } = await supabase
    .from('trade_events')
    .select('*', { count: 'exact', head: true });

  // Volumen total
  const { data: allTrades } = await supabase
    .from('trade_events')
    .select('price_wei');

  const totalVolume = allTrades?.reduce((sum, t) => 
    sum + BigInt(t.price_wei), 0n) || 0n;

  // Volumen 24h
  const yesterday = new Date();
  yesterday.setHours(yesterday.getHours() - 24);
  const { data: trades24h } = await supabase
    .from('trade_events')
    .select('price_wei')
    .gte('created_at', yesterday.toISOString());

  const volume24h = trades24h?.reduce((sum, t) => 
    sum + BigInt(t.price_wei), 0n) || 0n;

  // Top buyers (usando RPC call o función SQL)
  // Nota: Para agregaciones complejas, usa funciones SQL o RPC

  return {
    totalTrades: totalTrades || 0,
    totalVolume: totalVolume.toString(),
    volume24h: volume24h.toString(),
    avgPrice: (totalVolume / BigInt(totalTrades || 1)).toString(),
    topBuyers: [], // Implementar con RPC
    topSellers: [], // Implementar con RPC
  };
}
```

#### 3. Estadísticas de Floor Sweeps

```sql
-- Total de sweeps
SELECT COUNT(*) as total_sweeps FROM sweep_events;

-- Sweeps en las últimas 24 horas
SELECT COUNT(*) as sweeps_24h
FROM sweep_events
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- Top callers (usuarios que más han hecho sweeps)
SELECT 
  caller,
  COUNT(*) as sweep_count,
  SUM(buy_price_wei::numeric) as total_bought_wei,
  SUM(caller_reward_wei::numeric) as total_rewards_wei
FROM sweep_events
GROUP BY caller
ORDER BY sweep_count DESC
LIMIT 20;

-- Estadísticas de sweeps por día
SELECT 
  DATE(created_at) as date,
  COUNT(*) as sweeps_count,
  SUM(buy_price_wei::numeric) as total_bought_wei,
  AVG(buy_price_wei::numeric) as avg_buy_price_wei,
  AVG(relist_price_wei::numeric) as avg_relist_price_wei
FROM sweep_events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

#### 4. Estadísticas de Listings

```sql
-- Total de listings históricos
SELECT COUNT(*) as total_listings FROM listing_events WHERE event_type = 'Listed';

-- Listings cancelados
SELECT COUNT(*) as total_cancelled FROM listing_events WHERE event_type = 'Cancelled';

-- Tasa de cancelación
SELECT 
  (SELECT COUNT(*) FROM listing_events WHERE event_type = 'Cancelled')::numeric /
  NULLIF((SELECT COUNT(*) FROM listing_events WHERE event_type = 'Listed'), 0) * 100
  as cancellation_rate_percent;

-- Listings por día
SELECT 
  DATE(created_at) as date,
  COUNT(*) FILTER (WHERE event_type = 'Listed') as listed_count,
  COUNT(*) FILTER (WHERE event_type = 'Cancelled') as cancelled_count
FROM listing_events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## 🟡 ERC20 - $ADRIAN Token

### Tablas Disponibles

| Tabla | Descripción | Campos Principales |
|-------|-------------|-------------------|
| `erc20_transfers` | Transfers del token | `from_address`, `to_address`, `value_wei`, `created_at` |
| `erc20_approvals` | Aprobaciones | `owner`, `spender`, `value_wei`, `created_at` |
| `erc20_custom_events` | Eventos custom | `event_name`, `event_data` (JSONB), `created_at` |

### Estadísticas Principales

#### 1. Estadísticas Generales del Token

```sql
-- Total supply (minted - burned)
WITH minted AS (
  SELECT SUM(value_wei::numeric) as total
  FROM erc20_transfers
  WHERE contract_address = '0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea'
    AND from_address = '0x0000000000000000000000000000000000000000'
),
burned AS (
  SELECT SUM(value_wei::numeric) as total
  FROM erc20_transfers
  WHERE contract_address = '0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea'
    AND to_address = '0x0000000000000000000000000000000000000000'
)
SELECT 
  COALESCE((SELECT total FROM minted), 0) - COALESCE((SELECT total FROM burned), 0) as total_supply_wei;

-- Total de holders (direcciones con balance > 0)
WITH balances AS (
  SELECT 
    address,
    COALESCE(received.total, 0) - COALESCE(sent.total, 0) as balance
  FROM (
    SELECT DISTINCT to_address as address FROM erc20_transfers
    WHERE contract_address = '0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea'
    UNION
    SELECT DISTINCT from_address as address FROM erc20_transfers
    WHERE contract_address = '0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea'
  ) addresses
  LEFT JOIN (
    SELECT to_address as address, SUM(value_wei::numeric) as total
    FROM erc20_transfers
    WHERE contract_address = '0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea'
    GROUP BY to_address
  ) received ON addresses.address = received.address
  LEFT JOIN (
    SELECT from_address as address, SUM(value_wei::numeric) as total
    FROM erc20_transfers
    WHERE contract_address = '0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea'
    GROUP BY from_address
  ) sent ON addresses.address = sent.address
)
SELECT COUNT(*) as total_holders
FROM balances
WHERE balance > 0;

-- Volumen 24h
SELECT SUM(value_wei::numeric) as volume_24h_wei
FROM erc20_transfers
WHERE contract_address = '0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea'
  AND created_at >= NOW() - INTERVAL '24 hours'
  AND from_address != '0x0000000000000000000000000000000000000000'
  AND to_address != '0x0000000000000000000000000000000000000000';

-- Transacciones 24h
SELECT COUNT(*) as transactions_24h
FROM erc20_transfers
WHERE contract_address = '0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea'
  AND created_at >= NOW() - INTERVAL '24 hours';
```

**Ejemplo TypeScript:**
```typescript
interface TokenStats {
  totalSupply: string;
  totalHolders: number;
  volume24h: string;
  transactions24h: number;
  topHolders: Array<{ address: string; balance: string }>;
}

async function getTokenStats(): Promise<TokenStats> {
  const contractAddress = '0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea';
  const burnAddress = '0x0000000000000000000000000000000000000000';

  // Obtener todos los transfers
  const { data: transfers } = await supabase
    .from('erc20_transfers')
    .select('from_address, to_address, value_wei, created_at')
    .eq('contract_address', contractAddress);

  if (!transfers) return defaultTokenStats();

  // Calcular total supply
  const minted = transfers
    .filter(t => t.from_address === burnAddress)
    .reduce((sum, t) => sum + BigInt(t.value_wei), 0n);
  
  const burned = transfers
    .filter(t => t.to_address === burnAddress)
    .reduce((sum, t) => sum + BigInt(t.value_wei), 0n);

  const totalSupply = minted - burned;

  // Calcular balances por dirección
  const balances = new Map<string, bigint>();
  transfers.forEach(t => {
    if (t.from_address !== burnAddress) {
      balances.set(t.from_address, (balances.get(t.from_address) || 0n) - BigInt(t.value_wei));
    }
    if (t.to_address !== burnAddress) {
      balances.set(t.to_address, (balances.get(t.to_address) || 0n) + BigInt(t.value_wei));
    }
  });

  const totalHolders = Array.from(balances.values()).filter(b => b > 0n).length;

  // Volumen 24h
  const yesterday = new Date();
  yesterday.setHours(yesterday.getHours() - 24);
  const volume24h = transfers
    .filter(t => 
      new Date(t.created_at) >= yesterday &&
      t.from_address !== burnAddress &&
      t.to_address !== burnAddress
    )
    .reduce((sum, t) => sum + BigInt(t.value_wei), 0n);

  // Top holders
  const topHolders = Array.from(balances.entries())
    .filter(([_, balance]) => balance > 0n)
    .sort(([_, a], [__, b]) => (b > a ? 1 : -1))
    .slice(0, 20)
    .map(([address, balance]) => ({ address, balance: balance.toString() }));

  return {
    totalSupply: totalSupply.toString(),
    totalHolders,
    volume24h: volume24h.toString(),
    transactions24h: transfers.filter(t => new Date(t.created_at) >= yesterday).length,
    topHolders,
  };
}
```

#### 2. Estadísticas de un Usuario Específico

```sql
-- Balance de un usuario
WITH received AS (
  SELECT SUM(value_wei::numeric) as total
  FROM erc20_transfers
  WHERE contract_address = '0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea'
    AND to_address = '0x...'  -- Dirección del usuario
),
sent AS (
  SELECT SUM(value_wei::numeric) as total
  FROM erc20_transfers
  WHERE contract_address = '0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea'
    AND from_address = '0x...'  -- Dirección del usuario
)
SELECT 
  COALESCE((SELECT total FROM received), 0) - COALESCE((SELECT total FROM sent), 0) as balance_wei;

-- Total recibido
SELECT SUM(value_wei::numeric) as total_received_wei
FROM erc20_transfers
WHERE contract_address = '0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea'
  AND to_address = '0x...';

-- Total enviado
SELECT SUM(value_wei::numeric) as total_sent_wei
FROM erc20_transfers
WHERE contract_address = '0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea'
  AND from_address = '0x...';

-- Historial de transfers
SELECT * FROM erc20_transfers
WHERE contract_address = '0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea'
  AND (from_address = '0x...' OR to_address = '0x...')
ORDER BY created_at DESC
LIMIT 100;
```

#### 3. Estadísticas de Staking (si aplica)

```sql
-- Total staked (suma de todos los stakes activos)
SELECT SUM((event_data->>'amount')::numeric) as total_staked_wei
FROM erc20_custom_events
WHERE contract_address = '0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea'
  AND event_name = 'Staked';

-- Total rewards distribuidos
SELECT SUM((event_data->>'reward')::numeric) as total_rewards_wei
FROM erc20_custom_events
WHERE contract_address = '0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea'
  AND event_name = 'RewardDistributed';

-- Top stakers
SELECT 
  event_data->>'staker' as staker,
  SUM((event_data->>'amount')::numeric) as total_staked_wei
FROM erc20_custom_events
WHERE contract_address = '0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea'
  AND event_name = 'Staked'
GROUP BY event_data->>'staker'
ORDER BY total_staked_wei DESC
LIMIT 20;
```

---

## 🟣 ERC721 - AdrianZERO NFTs

### Tablas Disponibles

| Tabla | Descripción | Campos Principales |
|-------|-------------|-------------------|
| `erc721_transfers` | Transfers de NFTs | `from_address`, `to_address`, `token_id`, `created_at` |
| `erc721_custom_events` | Eventos custom | `event_name`, `event_data` (JSONB), `created_at` |

### Estadísticas Principales

#### 1. Estadísticas Generales

```sql
-- Total supply (minted - burned)
WITH minted AS (
  SELECT COUNT(*) as count
  FROM erc721_custom_events
  WHERE contract_address = '0x6e369bf0e4e0c106192d606fb6d85836d684da75'
    AND event_name = 'TokenMinted'
),
burned AS (
  SELECT COUNT(*) as count
  FROM erc721_custom_events
  WHERE contract_address = '0x6e369bf0e4e0c106192d606fb6d85836d684da75'
    AND event_name = 'TokenBurnt'
)
SELECT 
  (SELECT count FROM minted) - COALESCE((SELECT count FROM burned), 0) as total_supply;

-- Total de holders
WITH latest_owners AS (
  SELECT DISTINCT ON (token_id)
    token_id,
    to_address as owner
  FROM erc721_transfers
  WHERE contract_address = '0x6e369bf0e4e0c106192d606fb6d85836d684da75'
    AND to_address != '0x0000000000000000000000000000000000000000'
  ORDER BY token_id, block_number DESC
)
SELECT COUNT(DISTINCT owner) as total_holders FROM latest_owners;

-- Mints por día
SELECT 
  DATE(created_at) as date,
  COUNT(*) as mints_count
FROM erc721_custom_events
WHERE contract_address = '0x6e369bf0e4e0c106192d606fb6d85836d684da75'
  AND event_name = 'TokenMinted'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

#### 2. Estadísticas de Skins

```sql
-- Distribución de skins
SELECT 
  event_data->>'skinId' as skin_id,
  event_data->>'name' as skin_name,
  COUNT(*) as count
FROM erc721_custom_events
WHERE contract_address = '0x6e369bf0e4e0c106192d606fb6d85836d684da75'
  AND event_name = 'SkinAssigned'
GROUP BY event_data->>'skinId', event_data->>'name'
ORDER BY count DESC;

-- Skins más raros (menos asignados)
SELECT 
  event_data->>'skinId' as skin_id,
  event_data->>'name' as skin_name,
  COUNT(*) as count
FROM erc721_custom_events
WHERE contract_address = '0x6e369bf0e4e0c106192d606fb6d85836d684da75'
  AND event_name = 'SkinAssigned'
GROUP BY event_data->>'skinId', event_data->>'name'
ORDER BY count ASC
LIMIT 10;
```

#### 3. Estadísticas de Mutaciones

```sql
-- Total de mutaciones
SELECT COUNT(*) as total_mutations
FROM erc721_custom_events
WHERE contract_address = '0x6e369bf0e4e0c106192d606fb6d85836d684da75'
  AND event_name = 'MutationAssigned';

-- Mutaciones por tipo
SELECT 
  event_data->>'mutationType' as mutation_type,
  COUNT(*) as count
FROM erc721_custom_events
WHERE contract_address = '0x6e369bf0e4e0c106192d606fb6d85836d684da75'
  AND event_name = 'MutationAssigned'
GROUP BY event_data->>'mutationType'
ORDER BY count DESC;

-- Serums aplicados
SELECT COUNT(*) as serums_applied
FROM erc721_custom_events
WHERE contract_address = '0x6e369bf0e4e0c106192d606fb6d85836d684da75'
  AND event_name = 'SerumApplied';
```

#### 4. Top Holders

```sql
-- Top holders por cantidad de NFTs
WITH latest_owners AS (
  SELECT DISTINCT ON (token_id)
    token_id,
    to_address as owner
  FROM erc721_transfers
  WHERE contract_address = '0x6e369bf0e4e0c106192d606fb6d85836d684da75'
    AND to_address != '0x0000000000000000000000000000000000000000'
  ORDER BY token_id, block_number DESC
)
SELECT 
  owner,
  COUNT(*) as token_count
FROM latest_owners
GROUP BY owner
ORDER BY token_count DESC
LIMIT 20;
```

---

## 🔵 ERC1155 - Traits, Packs, Serums

### Tablas Disponibles

| Tabla | Descripción | Campos Principales |
|-------|-------------|-------------------|
| `erc1155_transfers_single` | Transfers individuales | `from_address`, `to_address`, `token_id`, `value`, `created_at` |
| `erc1155_transfers_batch` | Transfers en batch | `from_address`, `to_address`, `token_ids[]`, `values[]`, `created_at` |
| `erc1155_custom_events` | Eventos custom | `event_name`, `event_data` (JSONB), `created_at` |

### Estadísticas Principales

#### 1. Estadísticas Generales

```sql
-- Total de assets minteados por tipo
SELECT 
  event_data->>'assetId' as asset_id,
  event_data->>'assetType' as asset_type,
  COUNT(*) as minted_count,
  SUM((event_data->>'amount')::numeric) as total_amount
FROM erc1155_custom_events
WHERE contract_address = '0x90546848474fb3c9fda3fdad887969bb244e7e58'
  AND event_name = 'AssetMinted'
GROUP BY event_data->>'assetId', event_data->>'assetType'
ORDER BY total_amount DESC;

-- Assets más populares (más transfers)
SELECT 
  token_id,
  COUNT(*) as transfer_count,
  SUM(value::numeric) as total_transferred
FROM erc1155_transfers_single
WHERE contract_address = '0x90546848474fb3c9fda3fdad887969bb244e7e58'
GROUP BY token_id
ORDER BY transfer_count DESC
LIMIT 20;
```

#### 2. Estadísticas de Inventario

```sql
-- Balance total de un usuario por asset
SELECT 
  token_id,
  SUM(CASE WHEN to_address = '0x...' THEN value::numeric ELSE 0 END) -
  SUM(CASE WHEN from_address = '0x...' THEN value::numeric ELSE 0 END) as balance
FROM erc1155_transfers_single
WHERE contract_address = '0x90546848474fb3c9fda3fdad887969bb244e7e58'
GROUP BY token_id
HAVING balance > 0;
```

---

## 🟠 TraitsExtensions

### Tablas Disponibles

| Tabla | Descripción | Campos Principales |
|-------|-------------|-------------------|
| `traits_extensions_events` | Eventos de TraitsExtensions | `event_name`, `event_data` (JSONB), `created_at` |

### Estadísticas Principales

```sql
-- Traits aplicados por tipo
SELECT 
  event_data->>'traitType' as trait_type,
  COUNT(*) as applications
FROM traits_extensions_events
WHERE contract_address = '0x0995c0da1ca071b792e852b6ec531b7cd7d1f8d6'
  AND event_name = 'TraitApplied'
GROUP BY event_data->>'traitType'
ORDER BY applications DESC;

-- Assets agregados al inventario
SELECT 
  event_data->>'assetId' as asset_id,
  COUNT(*) as times_added,
  SUM((event_data->>'amount')::numeric) as total_amount
FROM traits_extensions_events
WHERE contract_address = '0x0995c0da1ca071b792e852b6ec531b7cd7d1f8d6'
  AND event_name = 'AssetAddedToInventory'
GROUP BY event_data->>'assetId'
ORDER BY total_amount DESC;
```

---

## 🛒 AdrianShop

### Tablas Disponibles

| Tabla | Descripción | Campos Principales |
|-------|-------------|-------------------|
| `shop_events` | Eventos de la tienda | `event_name`, `event_data` (JSONB), `created_at` |

### Estadísticas Principales

```sql
-- Total de compras
SELECT COUNT(*) as total_purchases
FROM shop_events
WHERE contract_address = '0x4b265927b1521995ce416bba3bed98231d2e946b'
  AND event_name IN ('ItemPurchased', 'BatchPurchase');

-- Revenue total
SELECT SUM((event_data->>'totalCost')::numeric) as total_revenue_wei
FROM shop_events
WHERE contract_address = '0x4b265927b1521995ce416bba3bed98231d2e946b'
  AND event_name IN ('ItemPurchased', 'BatchPurchase');

-- Items más vendidos
SELECT 
  event_data->>'assetId' as asset_id,
  COUNT(*) as purchase_count,
  SUM((event_data->>'quantity')::numeric) as total_quantity_sold,
  SUM((event_data->>'totalCost')::numeric) as total_revenue_wei
FROM shop_events
WHERE contract_address = '0x4b265927b1521995ce416bba3bed98231d2e946b'
  AND event_name = 'ItemPurchased'
GROUP BY event_data->>'assetId'
ORDER BY total_quantity_sold DESC
LIMIT 20;

-- Top compradores
SELECT 
  event_data->>'buyer' as buyer,
  COUNT(*) as purchases,
  SUM((event_data->>'totalCost')::numeric) as total_spent_wei
FROM shop_events
WHERE contract_address = '0x4b265927b1521995ce416bba3bed98231d2e946b'
  AND event_name IN ('ItemPurchased', 'BatchPurchase')
GROUP BY event_data->>'buyer'
ORDER BY total_spent_wei DESC
LIMIT 20;
```

---

## 🔗 Estadísticas Combinadas

### Usuarios que participan en múltiples contratos

```sql
-- Usuarios que han comprado en FloorEngine Y en AdrianShop
SELECT DISTINCT
  t.buyer as address,
  COUNT(DISTINCT t.tx_hash) as floor_engine_trades,
  COUNT(DISTINCT s.id) as shop_purchases
FROM trade_events t
INNER JOIN shop_events s ON t.buyer = s.event_data->>'buyer'
WHERE s.contract_address = '0x4b265927b1521995ce416bba3bed98231d2e946b'
  AND s.event_name IN ('ItemPurchased', 'BatchPurchase')
GROUP BY t.buyer
ORDER BY floor_engine_trades + COUNT(DISTINCT s.id) DESC
LIMIT 20;

-- Usuarios con balance de $ADRIAN que también tienen NFTs
WITH adrian_holders AS (
  SELECT DISTINCT to_address as address
  FROM erc20_transfers
  WHERE contract_address = '0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea'
),
nft_holders AS (
  SELECT DISTINCT to_address as address
  FROM erc721_transfers
  WHERE contract_address = '0x6e369bf0e4e0c106192d606fb6d85836d684da75'
)
SELECT COUNT(*) as users_with_both
FROM adrian_holders a
INNER JOIN nft_holders n ON a.address = n.address;
```

---

## 💻 Helpers TypeScript/JavaScript

### Función para convertir wei a formato legible

```typescript
function formatWei(wei: string | bigint, decimals: number = 18): string {
  const weiBigInt = typeof wei === 'string' ? BigInt(wei) : wei;
  const divisor = BigInt(10 ** decimals);
  const whole = weiBigInt / divisor;
  const remainder = weiBigInt % divisor;
  
  if (remainder === 0n) {
    return whole.toString();
  }
  
  const remainderStr = remainder.toString().padStart(decimals, '0');
  const trimmed = remainderStr.replace(/0+$/, '');
  
  return `${whole}.${trimmed}`;
}

// Uso
const price = formatWei('1000000000000000000'); // "1"
const price2 = formatWei('1500000000000000000'); // "1.5"
```

### Hook React para estadísticas

```typescript
import { useEffect, useState } from 'react';
import { supabase } from './supabase-client';

export function useMarketplaceStats() {
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        
        // Obtener listings activos
        const { data: listings, error: listingsError } = await supabase
          .from('active_punk_listings')
          .select('price_adrian_wei, is_engine_owned');

        if (listingsError) throw listingsError;

        // Obtener trades recientes
        const yesterday = new Date();
        yesterday.setHours(yesterday.getHours() - 24);
        
        const { data: trades, error: tradesError } = await supabase
          .from('trade_events')
          .select('price_wei')
          .gte('created_at', yesterday.toISOString());

        if (tradesError) throw tradesError;

        // Calcular estadísticas
        const prices = listings?.map(l => parseFloat(l.price_adrian_wei)) || [];
        const volume24h = trades?.reduce((sum, t) => 
          sum + BigInt(t.price_wei), 0n) || 0n;

        setStats({
          totalActiveListings: listings?.length || 0,
          floorPrice: prices.length > 0 ? Math.min(...prices).toString() : '0',
          avgPrice: prices.length > 0 
            ? (prices.reduce((a, b) => a + b, 0) / prices.length).toString() 
            : '0',
          maxPrice: prices.length > 0 ? Math.max(...prices).toString() : '0',
          engineListings: listings?.filter(l => l.is_engine_owned).length || 0,
          userListings: listings?.filter(l => !l.is_engine_owned).length || 0,
          volume24h: volume24h.toString(),
        });

        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return { stats, loading, error };
}
```

---

## 📝 Notas Importantes

1. **Direcciones en lowercase**: Todas las direcciones están almacenadas en lowercase
2. **Valores en wei**: Los precios y cantidades están en wei (18 decimales)
3. **Timestamps**: Usa `created_at` para ordenamiento temporal preciso
4. **JSONB queries**: Para eventos custom, usa operadores JSONB de PostgreSQL
5. **Rendimiento**: Para consultas complejas, considera usar funciones SQL o RPC calls

---

## 🔗 Recursos Adicionales

- [Documentación completa de API](./FRONTEND_API_DOCUMENTATION.md)
- [Setup de Active Listings](./supabase/ACTIVE_LISTINGS_SETUP.md)
- [Schema de la base de datos](./supabase/schema.sql)

