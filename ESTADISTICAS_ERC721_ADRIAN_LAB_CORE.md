# 📊 Documentación de Estadísticas y Métricas - AdrianLABCore ERC721

## 🎯 CONTEXTO

Este documento describe toda la información nueva disponible en la base de datos para generar estadísticas y métricas del contrato **AdrianLABCore** (ERC721 - AdrianZERO) en el frontend.

### Información del Contrato

- **Nombre**: AdrianLABCore (AdrianZERO)
- **Dirección**: `0x6e369bf0e4e0c106192d606fb6d85836d684da75` (lowercase: `0x6e369bf0e4e0c106192d606fb6d85836d684da75`)
- **Red**: Base Mainnet (Chain ID: 8453)
- **Explorer**: https://basescan.org/address/0x6e369bf0e4e0c106192d606fb6d85836d684da75
- **Bloque de Deployment**: (A obtener de Basescan - primera transacción del contrato)
- **Tipo**: ERC721Enumerable con sistema de skins, mutaciones y serums

### Características del Contrato

1. **Minting**: Creación de nuevos tokens NFT (Gen0 y generaciones superiores)
2. **Sistema de Skins**: Skins con diferentes rarezas (Zero, Dark, Alien, etc.)
3. **Sistema de Mutaciones**: Tokens pueden ser mutados con serums
4. **Skins Especiales**: Skins automáticos asociados a mutaciones específicas
5. **Burning**: Tokens pueden ser quemados (sacrificados)
6. **Modificaciones**: Tracking de primera modificación de tokens

---

## 🗄️ ESTRUCTURA DE TABLAS

### Tabla 1: `erc721_transfers`

**Propósito**: Histórico completo de todas las transferencias de tokens NFT

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | BIGINT | Primary key (auto-increment) |
| `contract_address` | TEXT | Dirección del contrato (siempre `0x6e369bf0e4e0c106192d606fb6d85836d684da75`) |
| `from_address` | TEXT | Dirección origen (lowercase) |
| `to_address` | TEXT | Dirección destino (lowercase) |
| `token_id` | NUMERIC | ID del token NFT transferido |
| `tx_hash` | TEXT | Hash de la transacción |
| `log_index` | INTEGER | Índice del log en la transacción |
| `block_number` | BIGINT | Número de bloque |
| `created_at` | TIMESTAMPTZ | Timestamp de creación |

**Constraints**:
- `UNIQUE(tx_hash, log_index)` - Garantiza idempotencia

**Índices**:
- `idx_erc721_transfers_contract_address` - Búsqueda por contrato
- `idx_erc721_transfers_from_address` - Búsqueda por remitente
- `idx_erc721_transfers_to_address` - Búsqueda por destinatario
- `idx_erc721_transfers_token_id` - Búsqueda por token ID (compuesto con contract_address)
- `idx_erc721_transfers_block_number` - Ordenamiento por bloque

**Notas Importantes**:
- `from_address = '0x0000000000000000000000000000000000000000'` indica minting (creación de token)
- `to_address = '0x0000000000000000000000000000000000000000'` indica burning (quema de token)
- Cada transferencia representa un cambio de ownership del token

---

### Tabla 2: `erc721_approvals`

**Propósito**: Histórico de aprobaciones individuales de tokens (permisos para transferir un token específico)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | BIGINT | Primary key |
| `contract_address` | TEXT | Dirección del contrato |
| `owner` | TEXT | Dueño del token (lowercase) |
| `approved` | TEXT | Dirección autorizada para transferir el token (lowercase) |
| `token_id` | NUMERIC | ID del token aprobado |
| `tx_hash` | TEXT | Hash de la transacción |
| `log_index` | INTEGER | Índice del log |
| `block_number` | BIGINT | Número de bloque |
| `created_at` | TIMESTAMPTZ | Timestamp |

**Constraints**:
- `UNIQUE(tx_hash, log_index)`

**Índices**:
- `idx_erc721_approvals_contract_address`
- `idx_erc721_approvals_owner`
- `idx_erc721_approvals_token_id` (compuesto con contract_address)
- `idx_erc721_approvals_block_number`

**Notas**:
- `approved = '0x0000000000000000000000000000000000000000'` indica revocación de aprobación
- Útil para tracking de permisos a marketplaces o contratos específicos

---

### Tabla 3: `erc721_approvals_for_all`

**Propósito**: Histórico de aprobaciones globales (permisos para transferir todos los tokens del owner)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | BIGINT | Primary key |
| `contract_address` | TEXT | Dirección del contrato |
| `owner` | TEXT | Dueño de los tokens (lowercase) |
| `operator` | TEXT | Dirección autorizada para transferir todos los tokens (lowercase) |
| `approved` | BOOLEAN | `true` = aprobado, `false` = revocado |
| `tx_hash` | TEXT | Hash de la transacción |
| `log_index` | INTEGER | Índice del log |
| `block_number` | BIGINT | Número de bloque |
| `created_at` | TIMESTAMPTZ | Timestamp |

**Constraints**:
- `UNIQUE(tx_hash, log_index)`

**Índices**:
- `idx_erc721_approvals_for_all_contract_address`
- `idx_erc721_approvals_for_all_owner`
- `idx_erc721_approvals_for_all_operator`
- `idx_erc721_approvals_for_all_block_number`

**Notas**:
- `approved = false` indica revocación de aprobación global
- Útil para tracking de permisos a marketplaces o wallets de confianza

---

### Tabla 4: `erc721_custom_events`

**Propósito**: Eventos custom del contrato (minting, skins, mutaciones, configuración, etc.)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | BIGINT | Primary key |
| `contract_address` | TEXT | Dirección del contrato |
| `event_name` | TEXT | Nombre del evento (ver lista abajo) |
| `event_data` | JSONB | Datos del evento (estructura varía por tipo) |
| `tx_hash` | TEXT | Hash de la transacción |
| `log_index` | INTEGER | Índice del log |
| `block_number` | BIGINT | Número de bloque |
| `created_at` | TIMESTAMPTZ | Timestamp |

**Constraints**:
- `UNIQUE(tx_hash, log_index)`

**Índices**:
- `idx_erc721_custom_events_contract_address`
- `idx_erc721_custom_events_event_name`
- `idx_erc721_custom_events_block_number`
- `idx_erc721_custom_events_event_data` (GIN index para búsquedas JSONB)

**Tipos de Eventos**:

#### 1. TokenMinted
Token nuevo creado (minting)
```json
{
  "to": "0x...",        // Dirección que recibió el token
  "tokenId": "123"      // ID del token creado
}
```

#### 2. TokenBurnt
Token quemado (sacrificado)
```json
{
  "tokenId": "123",     // ID del token quemado
  "burner": "0x..."     // Dirección que quemó el token
}
```

#### 3. SkinCreated
Nuevo skin creado en el sistema
```json
{
  "skinId": "1",        // ID del skin
  "name": "Zero",       // Nombre del skin
  "rarity": "750"       // Peso de rareza (1-1000)
}
```

#### 4. SkinAssigned
Skin asignado a un token
```json
{
  "tokenId": "123",     // ID del token
  "skinId": "1",        // ID del skin asignado
  "name": "Zero"        // Nombre del skin
}
```

#### 5. SkinUpdated
Skin modificado (nombre, rareza o estado activo)
```json
{
  "skinId": "1",        // ID del skin
  "name": "Zero",       // Nuevo nombre
  "rarity": "750",      // Nueva rareza
  "active": true        // Si está activo para asignación aleatoria
}
```

#### 6. SkinRemoved
Skin eliminado del sistema
```json
{
  "skinId": "1"         // ID del skin eliminado
}
```

#### 7. RandomSkinToggled
Activación/desactivación de asignación aleatoria de skins
```json
{
  "enabled": true       // `true` = activado, `false` = desactivado
}
```

#### 8. MutationAssigned
Mutación asignada a un token
```json
{
  "tokenId": "123"      // ID del token mutado
}
```

#### 9. MutationNameAssigned
Nombre de mutación asignado a un token
```json
{
  "tokenId": "123",           // ID del token
  "newMutation": "Radioactive" // Nombre de la mutación
}
```

#### 10. SerumApplied
Serum aplicado a un token
```json
{
  "tokenId": "123",     // ID del token
  "serumId": "5"        // ID del serum aplicado
}
```

#### 11. MutationSkinSet
Configuración de skin especial para una mutación específica
```json
{
  "mutation": "Radioactive",  // Nombre de la mutación
  "skinId": "10"               // ID del skin que se aplicará automáticamente
}
```

#### 12. SpecialSkinApplied
Skin especial aplicado automáticamente por mutación
```json
{
  "tokenId": "123",           // ID del token
  "skinId": "10",             // ID del skin especial
  "mutation": "Radioactive"   // Mutación que trigger el skin
}
```

#### 13. BaseURIUpdated
Actualización del Base URI para metadata
```json
{
  "newURI": "https://adrianlab.vercel.app/api/metadata/"
}
```

#### 14. ExtensionsContractUpdated
Actualización del contrato de extensiones
```json
{
  "newContract": "0x..."
}
```

#### 15. TraitsContractUpdated
Actualización del contrato de traits
```json
{
  "newContract": "0x..."
}
```

#### 16. PaymentTokenUpdated
Actualización del token de pago
```json
{
  "newToken": "0x..."
}
```

#### 17. TreasuryWalletUpdated
Actualización de la wallet del treasury
```json
{
  "newWallet": "0x..."
}
```

#### 18. AdminContractUpdated
Actualización del contrato admin
```json
{
  "newAdmin": "0x..."
}
```

#### 19. FunctionImplementationUpdated
Actualización de implementación de función (proxy pattern)
```json
{
  "selector": "0x...",        // Selector de función (bytes4)
  "implementation": "0x..."   // Nueva implementación
}
```

#### 20. ProceedsWithdrawn
Retiro de fondos del contrato
```json
{
  "wallet": "0x...",    // Wallet que recibió los fondos
  "amount": "1000000"   // Cantidad retirada (en wei del token de pago)
}
```

#### 21. FirstModification
Primera modificación de un token (tracking de estado)
```json
{
  "tokenId": "123"      // ID del token modificado por primera vez
}
```

---

## 📊 EJEMPLOS DE QUERIES SQL

### 1. Estadísticas Generales

#### Total de tokens minteados
```sql
SELECT COUNT(DISTINCT token_id) as total_tokens
FROM erc721_transfers
WHERE contract_address = '0x6e369bf0e4e0c106192d606fb6d85836d684da75'
  AND from_address = '0x0000000000000000000000000000000000000000';
```

#### Total de tokens quemados
```sql
SELECT COUNT(DISTINCT token_id) as total_burnt
FROM erc721_transfers
WHERE contract_address = '0x6e369bf0e4e0c106192d606fb6d85836d684da75'
  AND to_address = '0x0000000000000000000000000000000000000000';
```

#### Tokens minteados por día
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT (event_data->>'tokenId')) as tokens_minted
FROM erc721_custom_events
WHERE contract_address = '0x6e369bf0e4e0c106192d606fb6d85836d684da75'
  AND event_name = 'TokenMinted'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### 2. Sistema de Skins

#### Distribución de skins asignados
```sql
SELECT 
  event_data->>'name' as skin_name,
  COUNT(*) as count
FROM erc721_custom_events
WHERE contract_address = '0x6e369bf0e4e0c106192d606fb6d85836d684da75'
  AND event_name = 'SkinAssigned'
GROUP BY event_data->>'name'
ORDER BY count DESC;
```

#### Tokens con skin específico
```sql
SELECT 
  event_data->>'tokenId' as token_id,
  event_data->>'name' as skin_name,
  created_at
FROM erc721_custom_events
WHERE contract_address = '0x6e369bf0e4e0c106192d606fb6d85836d684da75'
  AND event_name = 'SkinAssigned'
  AND event_data->>'name' = 'Alien'
ORDER BY created_at DESC;
```

#### Skins creados y sus rarezas
```sql
SELECT 
  event_data->>'skinId' as skin_id,
  event_data->>'name' as skin_name,
  event_data->>'rarity' as rarity
FROM erc721_custom_events
WHERE contract_address = '0x6e369bf0e4e0c106192d606fb6d85836d684da75'
  AND event_name = 'SkinCreated'
ORDER BY (event_data->>'rarity')::numeric DESC;
```

### 3. Sistema de Mutaciones

#### Tokens mutados
```sql
SELECT 
  event_data->>'tokenId' as token_id,
  event_data->>'newMutation' as mutation_name,
  created_at
FROM erc721_custom_events
WHERE contract_address = '0x6e369bf0e4e0c106192d606fb6d85836d684da75'
  AND event_name = 'MutationNameAssigned'
ORDER BY created_at DESC;
```

#### Distribución de mutaciones
```sql
SELECT 
  event_data->>'newMutation' as mutation_name,
  COUNT(*) as count
FROM erc721_custom_events
WHERE contract_address = '0x6e369bf0e4e0c106192d606fb6d85836d684da75'
  AND event_name = 'MutationNameAssigned'
GROUP BY event_data->>'newMutation'
ORDER BY count DESC;
```

#### Serums aplicados
```sql
SELECT 
  event_data->>'tokenId' as token_id,
  event_data->>'serumId' as serum_id,
  created_at
FROM erc721_custom_events
WHERE contract_address = '0x6e369bf0e4e0c106192d606fb6d85836d684da75'
  AND event_name = 'SerumApplied'
ORDER BY created_at DESC;
```

#### Skins especiales aplicados por mutación
```sql
SELECT 
  event_data->>'mutation' as mutation,
  event_data->>'skinId' as skin_id,
  COUNT(*) as count
FROM erc721_custom_events
WHERE contract_address = '0x6e369bf0e4e0c106192d606fb6d85836d684da75'
  AND event_name = 'SpecialSkinApplied'
GROUP BY event_data->>'mutation', event_data->>'skinId'
ORDER BY count DESC;
```

### 4. Transferencias y Ownership

#### Historial de ownership de un token específico
```sql
SELECT 
  from_address,
  to_address,
  block_number,
  created_at
FROM erc721_transfers
WHERE contract_address = '0x6e369bf0e4e0c106192d606fb6d85836d684da75'
  AND token_id = 123
ORDER BY block_number ASC;
```

#### Tokens actualmente en posesión de una dirección
```sql
WITH latest_transfers AS (
  SELECT DISTINCT ON (token_id)
    token_id,
    to_address as owner
  FROM erc721_transfers
  WHERE contract_address = '0x6e369bf0e4e0c106192d606fb6d85836d684da75'
    AND to_address != '0x0000000000000000000000000000000000000000'
  ORDER BY token_id, block_number DESC
)
SELECT COUNT(*) as token_count
FROM latest_transfers
WHERE owner = '0x...'; -- Dirección del usuario
```

#### Top holders (direcciones con más tokens)
```sql
WITH latest_transfers AS (
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
FROM latest_transfers
GROUP BY owner
ORDER BY token_count DESC
LIMIT 20;
```

### 5. Actividad Temporal

#### Actividad por hora del día
```sql
SELECT 
  EXTRACT(HOUR FROM created_at) as hour,
  COUNT(*) as event_count
FROM erc721_custom_events
WHERE contract_address = '0x6e369bf0e4e0c106192d606fb6d85836d684da75'
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY EXTRACT(HOUR FROM created_at)
ORDER BY hour;
```

#### Eventos por tipo en los últimos 30 días
```sql
SELECT 
  event_name,
  COUNT(*) as count
FROM erc721_custom_events
WHERE contract_address = '0x6e369bf0e4e0c106192d606fb6d85836d684da75'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY event_name
ORDER BY count DESC;
```

---

## 🎯 MÉTRICAS SUGERIDAS PARA EL FRONTEND

### Métricas Generales
1. **Total Supply**: Total de tokens minteados menos tokens quemados
2. **Total Burned**: Total de tokens quemados
3. **Unique Holders**: Número de direcciones únicas que han poseído tokens
4. **Minting Rate**: Tokens minteados por día/semana/mes
5. **Burn Rate**: Tokens quemados por día/semana/mes

### Métricas de Skins
1. **Skin Distribution**: Distribución de skins asignados (gráfico de barras)
2. **Rarest Skins**: Top 5 skins más raros (menor frecuencia de asignación)
3. **Most Common Skins**: Top 5 skins más comunes
4. **Skin Assignment Rate**: Skins asignados por día

### Métricas de Mutaciones
1. **Mutation Distribution**: Distribución de tipos de mutaciones
2. **Mutation Rate**: Tokens mutados por día/semana/mes
3. **Serum Usage**: Serums aplicados por tipo
4. **Special Skin Applications**: Skins especiales aplicados por mutación

### Métricas de Trading
1. **Transfer Volume**: Número de transferencias por día
2. **Active Wallets**: Direcciones únicas que han transferido tokens en un período
3. **Average Holdings**: Promedio de tokens por holder
4. **Top Traders**: Direcciones con más transferencias

### Métricas de Configuración
1. **Contract Updates**: Historial de cambios en configuración (BaseURI, contratos, etc.)
2. **Proceeds Withdrawn**: Total de fondos retirados del contrato
3. **Admin Actions**: Acciones realizadas por el admin contract

---

## 🔌 ENDPOINTS DE API SUGERIDOS

### 1. Estadísticas Generales
```
GET /api/erc721/adrian-lab-core/stats
```
Retorna: totalSupply, totalBurned, uniqueHolders, mintingRate, burnRate

### 2. Información de Token
```
GET /api/erc721/adrian-lab-core/token/:tokenId
```
Retorna: ownership history, skin, mutations, serums aplicados, etc.

### 3. Distribución de Skins
```
GET /api/erc721/adrian-lab-core/skins/distribution
```
Retorna: distribución de skins con conteos y porcentajes

### 4. Historial de Mutaciones
```
GET /api/erc721/adrian-lab-core/mutations
```
Retorna: lista de mutaciones con distribución y estadísticas

### 5. Top Holders
```
GET /api/erc721/adrian-lab-core/holders/top?limit=20
```
Retorna: top N holders con cantidad de tokens

### 6. Actividad Reciente
```
GET /api/erc721/adrian-lab-core/activity?days=7
```
Retorna: eventos recientes agrupados por tipo y fecha

### 7. Búsqueda de Tokens
```
GET /api/erc721/adrian-lab-core/tokens/search?skin=Alien&mutation=Radioactive
```
Retorna: tokens que cumplen con los criterios de búsqueda

---

## 📝 NOTAS IMPORTANTES

1. **Lowercase Addresses**: Todas las direcciones están almacenadas en lowercase para consistencia
2. **Token IDs**: Los token IDs se almacenan como NUMERIC (pueden ser muy grandes)
3. **JSONB Queries**: Usar operadores JSONB de PostgreSQL para búsquedas eficientes en `event_data`
4. **Idempotencia**: Todos los eventos tienen `UNIQUE(tx_hash, log_index)` para evitar duplicados
5. **Block Numbers**: Útiles para ordenamiento temporal y sincronización
6. **Timestamps**: `created_at` es más preciso para ordenamiento que `block_number` en algunos casos

---

## 🔗 RECURSOS ADICIONALES

- **Contrato en Basescan**: https://basescan.org/address/0x6e369bf0e4e0c106192d606fb6d85836d684da75
- **Documentación del Contrato**: Ver `contratos/adrianlabcore.txt`
- **Schema de Base de Datos**: Ver `supabase/schema.sql`

---

**Última actualización**: 2025-01-19

