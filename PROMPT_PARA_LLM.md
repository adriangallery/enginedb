# 📚 Documentación Completa para LLM - FloorEngine Marketplace

## 🎯 CONTEXTO DEL PROYECTO

Tienes acceso a una base de datos Supabase que indexa eventos del contrato **FloorEngine**, un marketplace de NFTs (AdrianPunks) en Base mainnet con sistema de tax y floor sweeps automáticos.

### Información del Contrato

- **Nombre**: FloorEngine
- **Dirección**: `0x0351F7cBA83277E891D4a85Da498A7eACD764D58`
- **Red**: Base Mainnet (Chain ID: 8453)
- **Explorer**: https://basescan.org/address/0x0351F7cBA83277E891D4a85Da498A7eACD764D58
- **Colección**: AdrianPunks (NFTs)

### Características del Marketplace

1. **Listings**: Usuarios pueden listar sus NFTs para venta
2. **Compras**: Usuarios pueden comprar NFTs listados
3. **Tax System**: El marketplace cobra un premium (tax) en cada venta
4. **Floor Sweeps**: El contrato puede comprar automáticamente NFTs al floor price y relistarlos con premium
5. **Caller Rewards**: Quien ejecuta un floor sweep recibe una recompensa (porcentaje o fijo)

---

## 🗄️ ESTRUCTURA DE LA BASE DE DATOS

### Tabla 1: `sync_state`
**Propósito**: Estado de sincronización del bot listener

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | BIGINT | Primary key (siempre 1) |
| `last_synced_block` | BIGINT | Último bloque de blockchain procesado |
| `updated_at` | TIMESTAMPTZ | Última actualización |

**Uso**: Verificar qué tan actualizados están los datos.

---

### Tabla 2: `punk_listings`
**Propósito**: Estado actual del marketplace (vista en tiempo real)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | BIGINT | Primary key |
| `token_id` | BIGINT | ID del NFT (UNIQUE) |
| `seller` | TEXT | Dirección del vendedor (lowercase) |
| `price_wei` | NUMERIC | Precio en wei (1 ETH = 10^18 wei) |
| `is_contract_owned` | BOOLEAN | Si el contrato es el dueño (floor sweep) |
| `is_listed` | BOOLEAN | Si está actualmente listado |
| `last_event` | TEXT | Último evento: 'Listed', 'Cancelled', 'Bought', 'FloorSweep' |
| `last_tx_hash` | TEXT | Hash de la última transacción |
| `last_block_number` | BIGINT | Bloque de la última actualización |
| `updated_at` | TIMESTAMPTZ | Última actualización |

**Índices**:
- `token_id` (único)
- `is_listed`
- `seller`

**Uso principal**: Consultar listings activos, floor price, estado actual de cualquier NFT.

---

### Tabla 3: `listing_events`
**Propósito**: Histórico de eventos Listed y Cancelled

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | BIGINT | Primary key |
| `event_type` | TEXT | 'Listed' o 'Cancelled' |
| `token_id` | BIGINT | ID del NFT |
| `seller` | TEXT | Dirección del vendedor |
| `price_wei` | NUMERIC | Precio (solo en Listed, NULL en Cancelled) |
| `is_contract_owned` | BOOLEAN | Si el contrato es dueño (solo en Listed) |
| `tx_hash` | TEXT | Hash de transacción |
| `log_index` | INTEGER | Índice del log en el bloque |
| `block_number` | BIGINT | Número de bloque |
| `created_at` | TIMESTAMPTZ | Timestamp del evento |

**Índices**:
- `token_id`
- `seller`
- `block_number`
- `event_type`

**Uso principal**: Histórico de listings, análisis de precios, actividad de vendedores.

---

### Tabla 4: `trade_events`
**Propósito**: Histórico de compras (evento Bought)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | BIGINT | Primary key |
| `token_id` | BIGINT | ID del NFT vendido |
| `buyer` | TEXT | Dirección del comprador |
| `seller` | TEXT | Dirección del vendedor |
| `price_wei` | NUMERIC | Precio de venta en wei |
| `is_contract_owned` | BOOLEAN | Si el vendedor era el contrato (floor sweep) |
| `tx_hash` | TEXT | Hash de transacción |
| `log_index` | INTEGER | Índice del log |
| `block_number` | BIGINT | Número de bloque |
| `created_at` | TIMESTAMPTZ | Timestamp del trade |

**Índices**:
- `token_id`
- `buyer`
- `seller`
- `block_number`

**Uso principal**: Histórico de trades, volumen de trading, análisis de compradores/vendedores.

---

### Tabla 5: `sweep_events`
**Propósito**: Histórico de floor sweeps automáticos

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | BIGINT | Primary key |
| `token_id` | BIGINT | ID del NFT barrido |
| `buy_price_wei` | NUMERIC | Precio al que el engine compró |
| `relist_price_wei` | NUMERIC | Precio al que se relisteó (con premium) |
| `caller` | TEXT | Dirección que ejecutó el sweep |
| `caller_reward_wei` | NUMERIC | Recompensa recibida por el caller |
| `tx_hash` | TEXT | Hash de transacción |
| `log_index` | INTEGER | Índice del log |
| `block_number` | BIGINT | Número de bloque |
| `created_at` | TIMESTAMPTZ | Timestamp del sweep |

**Índices**:
- `token_id`
- `caller`
- `block_number`

**Uso principal**: Análisis de sweeps, rentabilidad de ejecutar sweeps, actividad del engine.

---

### Tabla 6: `engine_config_events`
**Propósito**: Histórico de cambios en configuración del contrato

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | BIGINT | Primary key |
| `event_type` | TEXT | Tipo de cambio (ver abajo) |
| `old_value` | TEXT | Valor anterior (string) |
| `new_value` | TEXT | Valor nuevo (string) |
| `tx_hash` | TEXT | Hash de transacción |
| `log_index` | INTEGER | Índice del log |
| `block_number` | BIGINT | Número de bloque |
| `created_at` | TIMESTAMPTZ | Timestamp del cambio |

**Tipos de eventos**:
- `PremiumUpdated`: Cambio en el premium/tax (en basis points, 1 bps = 0.01%)
- `MaxBuyPriceUpdated`: Cambio en precio máximo que el engine puede pagar
- `CallerRewardModeUpdated`: Cambio entre modo porcentaje vs fijo
- `CallerRewardBpsUpdated`: Cambio en porcentaje de recompensa (basis points)
- `CallerRewardFixedUpdated`: Cambio en recompensa fija (wei)
- `OwnershipTransferred`: Cambio de owner del contrato

**Uso principal**: Histórico de cambios de configuración, auditoría.

---

## 🔗 RELACIONES ENTRE TABLAS

### Relación Principal: `token_id`

Todas las tablas están relacionadas por `token_id`:

```
punk_listings (estado actual)
    ↓ token_id
listing_events (histórico de listings)
trade_events (histórico de compras)
sweep_events (histórico de sweeps)
```

### Flujo de un NFT típico:

1. **Listed** → `listing_events` + `punk_listings.is_listed = true`
2. **Bought** → `trade_events` + `punk_listings.is_listed = false`
3. O **Cancelled** → `listing_events` + `punk_listings.is_listed = false`
4. O **FloorSweep** → `sweep_events` + `punk_listings.is_listed = true` (relist automático)

---

## 📊 PARÁMETROS DEL CONTRATO (Configuración Actual)

Estos parámetros se pueden leer del contrato o ver en `engine_config_events`:

### Parámetros de Tax/Premium

- **`premiumBps`**: Premium en basis points (1 bps = 0.01%)
  - Ejemplo: 500 bps = 5% de tax
  - Se actualiza con evento `PremiumUpdated`

### Parámetros de Floor Sweep

- **`maxBuyPrice`**: Precio máximo que el engine puede pagar en un sweep
  - En wei
  - Se actualiza con evento `MaxBuyPriceUpdated`

- **`callerRewardIsPercentage`**: Modo de recompensa
  - `true` = Porcentaje del precio de compra
  - `false` = Cantidad fija en wei
  - Se actualiza con evento `CallerRewardModeUpdated`

- **`callerRewardBps`**: Porcentaje de recompensa (si `isPercentage = true`)
  - En basis points
  - Se actualiza con evento `CallerRewardBpsUpdated`

- **`callerRewardFixed`**: Recompensa fija (si `isPercentage = false`)
  - En wei
  - Se actualiza con evento `CallerRewardFixedUpdated`

### Ownership

- **`owner`**: Dirección del owner del contrato
  - Puede cambiar con evento `OwnershipTransferred`

---

## 💡 QUÉ PUEDES HACER CON ESTOS DATOS

### 1. Consultas de Marketplace en Tiempo Real

**Listings activos**:
```sql
SELECT 
  token_id,
  seller,
  price_wei / 1e18 as price_eth,
  is_contract_owned,
  last_event,
  updated_at
FROM punk_listings
WHERE is_listed = true
ORDER BY price_wei ASC;
```

**Floor price actual**:
```sql
SELECT MIN(price_wei) / 1e18 as floor_price_eth
FROM punk_listings
WHERE is_listed = true;
```

**Listings de un usuario**:
```sql
SELECT * FROM punk_listings
WHERE seller = '0x...' AND is_listed = true;
```

---

### 2. Análisis Histórico de Trading

**Volumen de trading por día**:
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as trades,
  SUM(price_wei) / 1e18 as volume_eth,
  AVG(price_wei) / 1e18 as avg_price_eth
FROM trade_events
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

**Top compradores**:
```sql
SELECT 
  buyer,
  COUNT(*) as purchases,
  SUM(price_wei) / 1e18 as total_spent_eth
FROM trade_events
GROUP BY buyer
ORDER BY total_spent_eth DESC
LIMIT 10;
```

**Top vendedores**:
```sql
SELECT 
  seller,
  COUNT(*) as sales,
  SUM(price_wei) / 1e18 as total_earned_eth
FROM trade_events
GROUP BY seller
ORDER BY total_earned_eth DESC
LIMIT 10;
```

---

### 3. Análisis de Floor Sweeps

**Sweeps recientes**:
```sql
SELECT 
  token_id,
  buy_price_wei / 1e18 as buy_price_eth,
  relist_price_wei / 1e18 as relist_price_eth,
  caller_reward_wei / 1e18 as reward_eth,
  caller,
  created_at
FROM sweep_events
ORDER BY created_at DESC
LIMIT 20;
```

**Rentabilidad de sweeps**:
```sql
SELECT 
  caller,
  COUNT(*) as sweeps_executed,
  SUM(caller_reward_wei) / 1e18 as total_rewards_eth,
  AVG(caller_reward_wei) / 1e18 as avg_reward_eth
FROM sweep_events
GROUP BY caller
ORDER BY total_rewards_eth DESC;
```

**Margen del engine en sweeps**:
```sql
SELECT 
  AVG(relist_price_wei - buy_price_wei) / 1e18 as avg_margin_eth,
  SUM(relist_price_wei - buy_price_wei) / 1e18 as total_margin_eth
FROM sweep_events;
```

---

### 4. Análisis de Precios

**Histórico de precios de un NFT**:
```sql
-- Todas las ventas de un token específico
SELECT 
  token_id,
  price_wei / 1e18 as price_eth,
  buyer,
  seller,
  created_at
FROM trade_events
WHERE token_id = 123
ORDER BY created_at DESC;
```

**Evolución del floor price**:
```sql
-- Floor price a lo largo del tiempo (aproximado por primera venta del día)
SELECT 
  DATE(created_at) as date,
  MIN(price_wei) / 1e18 as floor_price_eth
FROM trade_events
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

### 5. Métricas del Marketplace

**Estadísticas generales**:
```sql
SELECT 
  'Listings activos' as metric,
  COUNT(*)::text as value
FROM punk_listings
WHERE is_listed = true

UNION ALL

SELECT 
  'Total trades',
  COUNT(*)::text
FROM trade_events

UNION ALL

SELECT 
  'Total sweeps',
  COUNT(*)::text
FROM sweep_events

UNION ALL

SELECT 
  'Volumen total (ETH)',
  ROUND(SUM(price_wei) / 1e18, 2)::text
FROM trade_events;
```

**Tasa de conversión**:
```sql
-- Ratio de listings que se convierten en ventas
SELECT 
  (SELECT COUNT(*) FROM trade_events)::float / 
  (SELECT COUNT(*) FROM listing_events WHERE event_type = 'Listed')::float 
  as conversion_rate;
```

---

### 6. Análisis de Configuración

**Histórico de cambios de premium**:
```sql
SELECT 
  old_value,
  new_value,
  created_at,
  block_number
FROM engine_config_events
WHERE event_type = 'PremiumUpdated'
ORDER BY created_at DESC;
```

**Configuración actual (último valor de cada parámetro)**:
```sql
SELECT DISTINCT ON (event_type)
  event_type,
  new_value as current_value,
  created_at
FROM engine_config_events
ORDER BY event_type, created_at DESC;
```

---

## 🎯 CASOS DE USO ESPECÍFICOS PARA EL MARKETPLACE

### 1. Dashboard de Marketplace

**Datos necesarios**:
- Listings activos con precios
- Floor price
- Volumen de trading (24h, 7d, 30d)
- Últimos trades
- Estadísticas de sweeps

### 2. Alertas y Notificaciones

**Eventos a monitorear**:
- Nuevo listing (especialmente si es floor)
- Nueva compra
- Floor sweep ejecutado
- Cambio en configuración del contrato

### 3. Análisis de Rentabilidad

**Para usuarios**:
- Precio promedio de venta
- Tiempo promedio en marketplace
- Mejor momento para listar

**Para callers de sweeps**:
- Recompensas promedio
- Frecuencia de sweeps
- ROI de ejecutar sweeps

### 4. Detección de Patrones

- Actividad inusual
- Wash trading (mismo comprador/vendedor)
- Manipulación de precios
- Comportamiento de whales

---

## 🔢 CONVERSIONES ÚTILES

### Wei a ETH
```sql
price_wei / 1e18 as price_eth
```

### Basis Points a Porcentaje
```sql
premium_bps / 100.0 as premium_percent
-- Ejemplo: 500 bps = 5%
```

### Timestamps
- `created_at` y `updated_at` están en UTC
- Usar `DATE(created_at)` para agrupar por día
- Usar `EXTRACT(EPOCH FROM created_at)` para timestamps Unix

---

## 📈 MÉTRICAS CLAVE A CALCULAR

### Para el Marketplace

1. **Floor Price**: `MIN(price_wei) WHERE is_listed = true`
2. **Total Listings**: `COUNT(*) WHERE is_listed = true`
3. **24h Volume**: `SUM(price_wei) WHERE created_at > NOW() - INTERVAL '24 hours'`
4. **7d Volume**: `SUM(price_wei) WHERE created_at > NOW() - INTERVAL '7 days'`
5. **Total Volume**: `SUM(price_wei) FROM trade_events`
6. **Total Trades**: `COUNT(*) FROM trade_events`
7. **Average Sale Price**: `AVG(price_wei) FROM trade_events`
8. **Sweeps Count**: `COUNT(*) FROM sweep_events`
9. **Sweeps Volume**: `SUM(buy_price_wei) FROM sweep_events`

### Para Análisis de Usuarios

1. **User Trading Volume**: Agrupar por `buyer` o `seller`
2. **User Activity**: Contar trades por usuario
3. **Top Traders**: Ordenar por volumen
4. **New vs Returning**: Comparar primera vs última transacción

---

## ⚠️ CONSIDERACIONES IMPORTANTES

### 1. Precisión de Números

- Todos los precios están en **wei** (1 ETH = 10^18 wei)
- Usar `NUMERIC` en PostgreSQL para evitar pérdida de precisión
- Siempre dividir por `1e18` para mostrar en ETH

### 2. Direcciones

- Todas las direcciones están en **lowercase**
- Comparar siempre con `.toLowerCase()` o usar `LOWER()` en SQL

### 3. Estado Actual vs Histórico

- `punk_listings` = Estado actual (puede cambiar)
- `*_events` = Histórico inmutable (no cambia)

### 4. Idempotencia

- Todos los eventos tienen `UNIQUE(tx_hash, log_index)`
- No hay duplicados en eventos
- Un evento puede aparecer en múltiples tablas (ej: Listed → listing_events + punk_listings)

### 5. Sincronización

- Los datos se actualizan cada ~1 minuto
- Verificar `sync_state.last_synced_block` para saber qué tan actualizados están
- Comparar con bloque actual de Base para calcular delay

---

## 🚀 EJEMPLOS DE QUERIES COMPLEJAS

### Floor Price History (últimos 30 días)
```sql
WITH daily_floors AS (
  SELECT 
    DATE(created_at) as date,
    MIN(price_wei) / 1e18 as floor_price_eth
  FROM trade_events
  WHERE created_at > NOW() - INTERVAL '30 days'
  GROUP BY DATE(created_at)
)
SELECT * FROM daily_floors
ORDER BY date DESC;
```

### Top 10 NFTs más vendidos
```sql
SELECT 
  token_id,
  COUNT(*) as times_sold,
  SUM(price_wei) / 1e18 as total_volume_eth,
  AVG(price_wei) / 1e18 as avg_price_eth,
  MIN(price_wei) / 1e18 as min_price_eth,
  MAX(price_wei) / 1e18 as max_price_eth
FROM trade_events
GROUP BY token_id
ORDER BY times_sold DESC
LIMIT 10;
```

### Análisis de Sweeps por Día
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as sweeps_count,
  SUM(buy_price_wei) / 1e18 as total_bought_eth,
  SUM(relist_price_wei) / 1e18 as total_relisted_eth,
  SUM(caller_reward_wei) / 1e18 as total_rewards_eth,
  AVG(relist_price_wei - buy_price_wei) / 1e18 as avg_margin_eth
FROM sweep_events
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Actividad de un Usuario Completa
```sql
-- Compras
SELECT 'buy' as type, token_id, price_wei / 1e18 as amount_eth, created_at
FROM trade_events
WHERE buyer = '0x...'

UNION ALL

-- Ventas
SELECT 'sell' as type, token_id, price_wei / 1e18 as amount_eth, created_at
FROM trade_events
WHERE seller = '0x...'

UNION ALL

-- Listings
SELECT 'list' as type, token_id, price_wei / 1e18 as amount_eth, created_at
FROM listing_events
WHERE seller = '0x...' AND event_type = 'Listed'

ORDER BY created_at DESC;
```

---

## 📋 CHECKLIST PARA EL LLM

Cuando trabajes con esta base de datos, asegúrate de:

- [ ] Convertir wei a ETH dividiendo por `1e18`
- [ ] Usar direcciones en lowercase
- [ ] Verificar `is_listed = true` para listings activos
- [ ] Usar `punk_listings` para estado actual
- [ ] Usar `*_events` para histórico
- [ ] Agrupar por `DATE(created_at)` para análisis diarios
- [ ] Considerar que `is_contract_owned = true` significa floor sweep
- [ ] Verificar `sync_state` para saber qué tan actualizados están los datos

---

## 🔗 RECURSOS ADICIONALES

- **Base Explorer**: https://basescan.org/
- **Contrato**: https://basescan.org/address/0x0351F7cBA83277E891D4a85Da498A7eACD764D58
- **Documentación viem**: https://viem.sh/
- **Supabase Docs**: https://supabase.com/docs

---

## 💬 NOTAS FINALES

Esta base de datos se actualiza automáticamente cada ~1 minuto mediante un bot listener que indexa eventos on-chain del contrato FloorEngine.

Todos los datos son **inmutables** (excepto `punk_listings` que refleja estado actual) y representan la actividad real del marketplace.

Puedes usar esta información para:
- Construir dashboards
- Crear APIs
- Análisis de datos
- Alertas y notificaciones
- Machine learning
- Cualquier otra funcionalidad relacionada con el marketplace

---

**Última actualización**: 2025-11-18  
**Versión del schema**: 1.0  
**Estado**: Producción activa

