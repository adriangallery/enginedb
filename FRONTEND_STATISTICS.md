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
7. [📝 AdrianNameRegistry](#-adriannameregistry)
8. [🧪 AdrianSerumModule](#-adrianserummodule)
9. [⚔️ PunkQuest](#-punkquest)
10. [🔗 Estadísticas Combinadas](#-estadísticas-combinadas)

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

## 📝 AdrianNameRegistry

### Tablas Disponibles

| Tabla | Descripción | Campos Principales |
|-------|-------------|-------------------|
| `name_registry_events` | Histórico de cambios de nombres | `token_id`, `new_name`, `setter`, `paid`, `price_wei`, `created_at` |
| `name_registry_config_events` | Eventos de configuración | `event_type`, `old_price_wei`, `new_price_wei`, `old_treasury`, `new_treasury`, `created_at` |

### Estadísticas Principales

#### 1. Estadísticas de Nombres

```sql
-- Total de nombres asignados
SELECT COUNT(*) as total_names FROM name_registry_events;

-- Nombres únicos por token
SELECT COUNT(DISTINCT token_id) as tokens_with_names FROM name_registry_events;

-- Nombres pagados vs gratuitos
SELECT 
  paid,
  COUNT(*) as count,
  COUNT(DISTINCT token_id) as unique_tokens
FROM name_registry_events
GROUP BY paid;

-- Top usuarios que más nombres han asignado
SELECT 
  setter,
  COUNT(*) as names_set,
  COUNT(DISTINCT token_id) as unique_tokens
FROM name_registry_events
GROUP BY setter
ORDER BY names_set DESC
LIMIT 10;

-- Ingresos totales por nombres (suma de precios pagados)
SELECT SUM(price_wei::numeric) as total_revenue_wei 
FROM name_registry_events 
WHERE paid = true AND price_wei IS NOT NULL;
```

**Ejemplo TypeScript:**
```typescript
interface NameRegistryStats {
  totalNames: number;
  tokensWithNames: number;
  paidNames: number;
  freeNames: number;
  totalRevenue: string;
  topSetters: Array<{ address: string; count: number }>;
}

async function getNameRegistryStats(contractAddress: string): Promise<NameRegistryStats> {
  const { data: events } = await supabase
    .from('name_registry_events')
    .select('token_id, setter, paid, price_wei')
    .eq('contract_address', contractAddress.toLowerCase());

  if (!events) return defaultStats();

  const paidNames = events.filter(e => e.paid).length;
  const freeNames = events.length - paidNames;
  const totalRevenue = events
    .filter(e => e.paid && e.price_wei)
    .reduce((sum, e) => sum + BigInt(e.price_wei), 0n);

  const setterCounts = events.reduce((acc, e) => {
    acc[e.setter] = (acc[e.setter] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topSetters = Object.entries(setterCounts)
    .map(([address, count]) => ({ address, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalNames: events.length,
    tokensWithNames: new Set(events.map(e => e.token_id)).size,
    paidNames,
    freeNames,
    totalRevenue: totalRevenue.toString(),
    topSetters,
  };
}
```

#### 2. Historial de Nombres por Token

```sql
-- Obtener historial completo de nombres para un token
SELECT 
  new_name,
  setter,
  paid,
  price_wei,
  created_at
FROM name_registry_events
WHERE token_id = 123
ORDER BY created_at DESC;
```

#### 3. Estadísticas de Configuración

```sql
-- Historial de cambios de precio
SELECT 
  old_price_wei,
  new_price_wei,
  created_at
FROM name_registry_config_events
WHERE event_type = 'PriceUpdated'
ORDER BY created_at DESC;

-- Historial de cambios de treasury
SELECT 
  old_treasury,
  new_treasury,
  created_at
FROM name_registry_config_events
WHERE event_type = 'TreasuryUpdated'
ORDER BY created_at DESC;
```

---

## 🧪 AdrianSerumModule

### Tablas Disponibles

| Tabla | Descripción | Campos Principales |
|-------|-------------|-------------------|
| `serum_module_events` | Histórico de aplicaciones de serums | `user_address`, `token_id`, `serum_id`, `success`, `mutation`, `created_at` |

### Estadísticas Principales

#### 1. Estadísticas de Aplicaciones de Serums

```sql
-- Total de aplicaciones
SELECT COUNT(*) as total_applications FROM serum_module_events;

-- Tasa de éxito
SELECT 
  success,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM serum_module_events), 2) as percentage
FROM serum_module_events
GROUP BY success;

-- Aplicaciones por serum
SELECT 
  serum_id,
  COUNT(*) as total_applications,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful,
  ROUND(SUM(CASE WHEN success THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as success_rate
FROM serum_module_events
GROUP BY serum_id
ORDER BY total_applications DESC;

-- Top usuarios que más serums han usado
SELECT 
  user_address,
  COUNT(*) as total_applications,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful
FROM serum_module_events
GROUP BY user_address
ORDER BY total_applications DESC
LIMIT 10;

-- Tokens con más aplicaciones
SELECT 
  token_id,
  COUNT(*) as total_applications,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful
FROM serum_module_events
GROUP BY token_id
ORDER BY total_applications DESC
LIMIT 10;
```

**Ejemplo TypeScript:**
```typescript
interface SerumModuleStats {
  totalApplications: number;
  successRate: number;
  totalSuccessful: number;
  totalFailed: number;
  topSerums: Array<{ serumId: number; applications: number; successRate: number }>;
  topUsers: Array<{ address: string; applications: number; successful: number }>;
}

async function getSerumModuleStats(contractAddress: string): Promise<SerumModuleStats> {
  const { data: events } = await supabase
    .from('serum_module_events')
    .select('serum_id, user_address, success')
    .eq('contract_address', contractAddress.toLowerCase());

  if (!events) return defaultStats();

  const totalSuccessful = events.filter(e => e.success).length;
  const totalFailed = events.length - totalSuccessful;
  const successRate = events.length > 0 
    ? (totalSuccessful / events.length) * 100 
    : 0;

  const serumStats = events.reduce((acc, e) => {
    if (!acc[e.serum_id]) {
      acc[e.serum_id] = { total: 0, successful: 0 };
    }
    acc[e.serum_id].total++;
    if (e.success) acc[e.serum_id].successful++;
    return acc;
  }, {} as Record<number, { total: number; successful: number }>);

  const topSerums = Object.entries(serumStats)
    .map(([serumId, stats]) => ({
      serumId: parseInt(serumId),
      applications: stats.total,
      successRate: (stats.successful / stats.total) * 100,
    }))
    .sort((a, b) => b.applications - a.applications)
    .slice(0, 10);

  const userStats = events.reduce((acc, e) => {
    if (!acc[e.user_address]) {
      acc[e.user_address] = { total: 0, successful: 0 };
    }
    acc[e.user_address].total++;
    if (e.success) acc[e.user_address].successful++;
    return acc;
  }, {} as Record<string, { total: number; successful: number }>);

  const topUsers = Object.entries(userStats)
    .map(([address, stats]) => ({
      address,
      applications: stats.total,
      successful: stats.successful,
    }))
    .sort((a, b) => b.applications - a.applications)
    .slice(0, 10);

  return {
    totalApplications: events.length,
    successRate,
    totalSuccessful,
    totalFailed,
    topSerums,
    topUsers,
  };
}
```

#### 2. Historial de Aplicaciones por Token

```sql
-- Obtener todas las aplicaciones de serums para un token
SELECT 
  serum_id,
  success,
  mutation,
  created_at
FROM serum_module_events
WHERE token_id = 123
ORDER BY created_at DESC;
```

---

## ⚔️ PunkQuest

### Tablas Disponibles

| Tabla | Descripción | Campos Principales |
|-------|-------------|-------------------|
| `punk_quest_staking_events` | Eventos de staking | `event_type`, `user_address`, `token_id`, `reward_wei`, `bonus_added`, `timestamp`, `created_at` |
| `punk_quest_item_events` | Eventos de items | `event_type`, `user_address`, `token_id`, `item_id`, `item_type`, `quantity`, `price_wei`, `bonus`, `durability`, `created_at` |
| `punk_quest_event_events` | Eventos de quests | `event_type`, `operator_address`, `token_id`, `event_id`, `event_name`, `adjustment`, `description`, `degrade_amount`, `created_at` |

### Estadísticas Principales

#### 1. Estadísticas de Staking

```sql
-- Total de stakes
SELECT COUNT(*) as total_stakes 
FROM punk_quest_staking_events 
WHERE event_type = 'Staked';

-- Total de unstakes
SELECT COUNT(*) as total_unstakes 
FROM punk_quest_staking_events 
WHERE event_type = 'Unstaked';

-- Tokens actualmente staked (staked pero no unstaked)
SELECT 
  token_id,
  MAX(CASE WHEN event_type = 'Staked' THEN created_at END) as staked_at,
  MAX(CASE WHEN event_type = 'Unstaked' THEN created_at END) as unstaked_at
FROM punk_quest_staking_events
GROUP BY token_id
HAVING MAX(CASE WHEN event_type = 'Staked' THEN created_at END) > 
       COALESCE(MAX(CASE WHEN event_type = 'Unstaked' THEN created_at END), '1970-01-01'::timestamp);

-- Total de recompensas reclamadas
SELECT 
  SUM(reward_wei::numeric) as total_rewards_wei,
  COUNT(*) as total_claims
FROM punk_quest_staking_events
WHERE event_type = 'RewardClaimed' AND reward_wei IS NOT NULL;

-- Top usuarios por recompensas reclamadas
SELECT 
  user_address,
  COUNT(*) as claims,
  SUM(reward_wei::numeric) as total_rewards_wei
FROM punk_quest_staking_events
WHERE event_type = 'RewardClaimed' AND reward_wei IS NOT NULL
GROUP BY user_address
ORDER BY total_rewards_wei DESC
LIMIT 10;
```

**Ejemplo TypeScript:**
```typescript
interface PunkQuestStakingStats {
  totalStakes: number;
  totalUnstakes: number;
  currentlyStaked: number;
  totalRewardsClaimed: string;
  totalClaims: number;
  topRewardEarners: Array<{ address: string; rewards: string; claims: number }>;
}

async function getPunkQuestStakingStats(contractAddress: string): Promise<PunkQuestStakingStats> {
  const { data: events } = await supabase
    .from('punk_quest_staking_events')
    .select('event_type, user_address, token_id, reward_wei')
    .eq('contract_address', contractAddress.toLowerCase());

  if (!events) return defaultStats();

  const stakes = events.filter(e => e.event_type === 'Staked');
  const unstakes = events.filter(e => e.event_type === 'Unstaked');
  const claims = events.filter(e => e.event_type === 'RewardClaimed' && e.reward_wei);

  // Calcular tokens actualmente staked
  const stakedTokens = new Set(stakes.map(e => e.token_id));
  const unstakedTokens = new Set(unstakes.map(e => e.token_id));
  const currentlyStaked = Array.from(stakedTokens).filter(
    tokenId => !unstakedTokens.has(tokenId)
  ).length;

  const totalRewards = claims.reduce(
    (sum, e) => sum + BigInt(e.reward_wei || '0'),
    0n
  );

  const userRewards = claims.reduce((acc, e) => {
    if (!acc[e.user_address]) {
      acc[e.user_address] = { rewards: 0n, claims: 0 };
    }
    acc[e.user_address].rewards += BigInt(e.reward_wei || '0');
    acc[e.user_address].claims++;
    return acc;
  }, {} as Record<string, { rewards: bigint; claims: number }>);

  const topRewardEarners = Object.entries(userRewards)
    .map(([address, stats]) => ({
      address,
      rewards: stats.rewards.toString(),
      claims: stats.claims,
    }))
    .sort((a, b) => {
      const aRewards = BigInt(a.rewards);
      const bRewards = BigInt(b.rewards);
      return aRewards > bRewards ? -1 : aRewards < bRewards ? 1 : 0;
    })
    .slice(0, 10);

  return {
    totalStakes: stakes.length,
    totalUnstakes: unstakes.length,
    currentlyStaked,
    totalRewardsClaimed: totalRewards.toString(),
    totalClaims: claims.length,
    topRewardEarners,
  };
}
```

#### 2. Estadísticas de Items

```sql
-- Total de items comprados
SELECT 
  COUNT(*) as total_purchases,
  SUM(quantity::bigint) as total_items_purchased
FROM punk_quest_item_events
WHERE event_type = 'ItemPurchasedInStore';

-- Items más comprados
SELECT 
  item_id,
  SUM(quantity::bigint) as total_purchased,
  COUNT(*) as purchase_count
FROM punk_quest_item_events
WHERE event_type = 'ItemPurchasedInStore'
GROUP BY item_id
ORDER BY total_purchased DESC
LIMIT 10;

-- Items más equipados
SELECT 
  item_id,
  COUNT(*) as equip_count,
  COUNT(DISTINCT token_id) as unique_tokens
FROM punk_quest_item_events
WHERE event_type = 'ItemEquipped'
GROUP BY item_id
ORDER BY equip_count DESC
LIMIT 10;

-- Ingresos totales por venta de items
SELECT 
  SUM(price_wei::numeric * quantity::bigint) as total_revenue_wei
FROM punk_quest_item_events
WHERE event_type = 'ItemPurchasedInStore' 
  AND price_wei IS NOT NULL 
  AND quantity IS NOT NULL;
```

#### 3. Estadísticas de Quests

```sql
-- Total de eventos triggerados
SELECT 
  event_type,
  COUNT(*) as count
FROM punk_quest_event_events
WHERE event_type IN ('EventTriggered', 'AdvancedEventTriggered')
GROUP BY event_type;

-- Eventos más comunes
SELECT 
  event_name,
  COUNT(*) as trigger_count,
  COUNT(DISTINCT token_id) as affected_tokens
FROM punk_quest_event_events
WHERE event_type IN ('EventTriggered', 'AdvancedEventTriggered')
GROUP BY event_name
ORDER BY trigger_count DESC
LIMIT 10;

-- Tokens con más eventos
SELECT 
  token_id,
  COUNT(*) as event_count
FROM punk_quest_event_events
WHERE event_type IN ('EventTriggered', 'AdvancedEventTriggered')
GROUP BY token_id
ORDER BY event_count DESC
LIMIT 10;
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

