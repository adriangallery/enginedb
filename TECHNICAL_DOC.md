# EngineDB - Documentación Técnica

> **Última actualización**: 27 de enero de 2026
> **Propósito**: Documento de referencia técnica para contexto rápido sin exploración exhaustiva del código

---

## 1. Visión General del Proyecto

**EngineDB** es un sistema de indexación y monitoreo de eventos blockchain en **Base Mainnet** (Chain ID: 8453). Actúa como agregador de datos para el ecosistema **AdrianPunks**, sincronizando eventos de múltiples contratos inteligentes a tiempo real hacia bases de datos (Supabase PostgreSQL y/o SQLite local) y exponiendo los datos mediante una API REST compatible con PostgREST.

### Contratos Indexados (11 activos)

| Contrato | Tipo | Dirección | Desde Bloque |
|----------|------|-----------|--------------|
| FloorEngine | Custom Marketplace | 0x0351F7cBA83277E891D4a85Da498A7eACD764D58 | 21508000 |
| ADRIAN Token | ERC20 | 0x7E99075Ce287F1cF8cBCAaa6A1C7894e404fD7Ea | 26367738 |
| ADRIAN Lab Core | ERC721 | (ver config) | Variable |
| ADRIAN Traits Core | ERC1155 | (ver config) | Variable |
| ADRIAN Traits Extensions | Custom | (ver config) | Variable |
| ADRIAN Shop | Custom | (ver config) | Variable |
| ADRIAN Name Registry | Custom | (ver config) | Variable |
| ADRIAN Serum Module | Custom | (ver config) | Variable |
| Punk Quest | Custom | (ver config) | Variable |
| + 2 contratos adicionales | Mixed | (ver config) | Variable |

---

## 2. Arquitectura del Sistema

### Diagrama de Alto Nivel

```
┌──────────────────────────────────────────────────┐
│         BASE MAINNET (RPC)                       │
│  11 Smart Contracts con 100+ tipos de eventos   │
└──────────────────────────────────────────────────┘
                    ▲
                    │ Viem Client
                    ▼
┌──────────────────────────────────────────────────┐
│     UNIFIED LISTENER (Optimizado)                │
│  • Lee cada bloque UNA SOLA VEZ                  │
│  • Decodifica para 11 contratos en paralelo     │
│  • Batch processing: 10-20 bloques              │
│  • 20 requests paralelos / 10 en fallback       │
│                                                   │
│  ┌─────────┬─────────┬─────────┬─────────────┐  │
│  │ ERC20   │ ERC721  │ ERC1155 │ Custom (5)  │  │
│  │ Decoder │ Decoder │ Decoder │ Decoders    │  │
│  └─────────┴─────────┴─────────┴─────────────┘  │
│                    ▼                              │
│  ┌─────────┬─────────┬─────────┬─────────────┐  │
│  │ ERC20   │ ERC721  │ ERC1155 │ Custom (5)  │  │
│  │Processor│Processor│Processor│ Processors  │  │
│  └─────────┴─────────┴─────────┴─────────────┘  │
└──────────────────────────────────────────────────┘
        │                           │
        ▼                           ▼
┌──────────────────┐      ┌──────────────────┐
│ SUPABASE         │      │ SQLite Local     │
│ PostgreSQL       │◄────►│ (API Backend)    │
│ (Production)     │ Sync │ Port 3000        │
│ 30+ tablas       │      │ 30+ tablas       │
└──────────────────┘      └──────────────────┘
        ▲                           ▲
        │                           │
┌───────┴─────────────┐  ┌──────────┴────────────┐
│ CONTINUOUS LISTENER │  │ EXPRESS API SERVER    │
│ Railway (5 min)     │  │ REST + PostgREST      │
│ GitHub Auto-Sync    │  │ CORS + Auth           │
└─────────────────────┘  └───────────────────────┘
```

### Componentes Principales

1. **Unified Listener** (`src/unified-listener.ts`)
   - Sistema optimizado que lee cada bloque una sola vez
   - Decodifica para todos los contratos en paralelo
   - Reduce llamadas RPC en ~90% vs. listeners individuales

2. **Continuous Listener** (`src/continuous-listener.ts`)
   - Loop infinito para entornos 24/7 (Railway)
   - Sincronización cada 5 minutos (configurable)
   - Graceful shutdown con señales SIGTERM

3. **Processors** (8 especializados)
   - Transforman eventos decodificados a objetos tipados
   - Validan y enriquecen datos
   - Persisten en BD con idempotencia

4. **API REST** (`api/src/server.ts`)
   - Express + better-sqlite3
   - Compatible con sintaxis PostgREST de Supabase
   - Autenticación por API key

---

## 3. Estructura de Directorios

```
enginedb/
├── src/                                  # Código fuente del bot (TypeScript)
│   ├── index.ts                          # Entry point una sola ejecución
│   ├── continuous-listener.ts            # Loop infinito (Railway)
│   ├── unified-listener.ts               # Sistema optimizado multi-contrato
│   ├── start-unified.ts                  # Orquestador API + Bot
│   ├── github-sync.ts                    # Sincronización BD a GitHub
│   │
│   ├── contracts/                        # Configuración de contratos
│   │   ├── abis/                         # ABI definitions (11 archivos)
│   │   ├── config/                       # Configs por contrato (11 archivos)
│   │   └── types/                        # TypeScript types de eventos
│   │
│   ├── listeners/                        # Decoders especializados
│   │   ├── erc20/
│   │   │   ├── adrian-token-listener.ts
│   │   │   └── historical-sync.ts        # Sync hacia atrás
│   │   ├── erc721/
│   │   │   └── adrian-lab-core-listener.ts
│   │   ├── erc1155/
│   │   │   └── traits-core-listener.ts
│   │   └── custom/                       # 5 listeners custom
│   │
│   ├── processors/                       # Procesadores de eventos (8 archivos)
│   │   ├── erc20-processor.ts
│   │   ├── erc721-processor.ts
│   │   ├── erc1155-processor.ts
│   │   ├── shop-processor.ts
│   │   ├── traits-extensions-processor.ts
│   │   ├── name-registry-processor.ts
│   │   ├── serum-module-processor.ts
│   │   └── punk-quest-processor.ts
│   │
│   ├── supabase/
│   │   └── client.ts                     # Cliente unificado (Supabase o SQLite)
│   │
│   ├── db-api/                           # Cliente HTTP para API SQLite
│   │   ├── client.ts
│   │   └── sqlite.ts
│   │
│   └── scripts/
│       └── fix-event-timestamps.ts       # Mantenimiento
│
├── api/                                  # Backend API (Express + SQLite)
│   ├── src/
│   │   ├── server.ts                     # Servidor Express principal
│   │   ├── routes/
│   │   │   └── tables.ts                 # REST endpoints
│   │   ├── db/
│   │   │   ├── sqlite.ts                 # Cliente better-sqlite3
│   │   │   ├── init.ts                   # Inicialización BD
│   │   │   └── schema.sql                # Schema SQLite (30+ tablas)
│   │   ├── middleware/
│   │   │   └── auth.ts                   # Autenticación por API key
│   │   └── utils/
│   │       ├── sql-builder.ts            # Constructor dinámico SQL
│   │       ├── query-parser.ts           # Parser Supabase-like
│   │       ├── errors.ts                 # Manejo de errores HTTP
│   │       └── backup.ts                 # Sistema de backups
│   ├── scripts/                          # Scripts migración/mantenimiento
│   └── data/
│       └── enginedb.sqlite               # Base de datos SQLite
│
├── supabase/                             # Schemas y migrations Supabase
│   ├── schema.sql                        # Schema principal (586 líneas)
│   └── migrations/                       # Migrations SQL
│
├── dist/                                 # Código compilado (TypeScript)
│
├── package.json                          # Root dependencies
├── tsconfig.json                         # Config TypeScript
├── railway.json                          # Config Railway
├── vercel.json                           # Config Vercel (cron)
└── env.example.txt                       # Variables de entorno ejemplo
```

---

## 4. Stack Tecnológico

| Categoría | Tecnología | Versión | Propósito |
|-----------|-----------|---------|-----------|
| **Runtime** | Node.js + tsx | ^4.7.0 | Ejecución TypeScript |
| **Lenguaje** | TypeScript | ^5.3.3 | Type safety |
| **Web Framework** | Express | ^4.18.2 | API REST |
| **Blockchain Client** | viem | ^2.7.1 | Interacción con Base Mainnet |
| **Base de Datos (Prod)** | Supabase | ^2.39.3 | PostgreSQL hosted |
| **Base de Datos (Local)** | better-sqlite3 | ^9.4.3 | SQLite sincronizado |
| **CORS** | cors | ^2.8.5 | Control de orígenes |
| **Validación** | zod | ^3.22.4 | Validación de esquemas |
| **Config** | dotenv | ^16.4.1 | Variables de entorno |

**Red Blockchain**: Base Mainnet (Chain ID: 8453)

---

## 5. Configuración (Variables de Entorno)

### Variables Críticas

```env
# === RPC Configuration ===
RPC_URL_BASE=https://mainnet.base.org
# O usar Alchemy/Infura para mayor throughput:
# RPC_URL_BASE=https://base-mainnet.g.alchemy.com/v2/TU_API_KEY

# === Supabase (Opcional) ===
USE_SUPABASE=false                        # true para usar Supabase, false para SQLite
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxx

# === SQLite API ===
DB_PATH=./api/data/enginedb.sqlite
API_KEY=tu-api-key-segura                 # Para autenticación API
PORT=3000

# === Optimización de Sincronización ===
BLOCKS_PER_BATCH=10                       # Bloques por request RPC
PARALLEL_REQUESTS=3                       # Requests simultáneos (cuidado con rate limit)
SYNC_INTERVAL_MINUTES=5                   # Intervalo en Railway
BATCHES_PER_CONTRACT=50                   # Batches máximos por sync

# === Fallback RPC (RPC gratuito más lento) ===
USE_FALLBACK_RPC=false
FALLBACK_RPC_URL=https://mainnet.base.org
FALLBACK_START_BLOCK=38293582

# === GitHub Auto-Sync ===
GITHUB_TOKEN=ghp_xxxxx                    # Token con permisos repo
GITHUB_SYNC_INTERVAL_MINUTES=10           # Intervalo de backup

# === API Server ===
CORS_ORIGIN=*                             # O dominios específicos
NODE_ENV=production
```

### Configuración por Plataforma

**Railway**:
- Build command: automático (NIXPACKS)
- Start command: `node dist/src/start-unified.js`
- Health check: `/health` endpoint
- Restart policy: ON_FAILURE (max 10 reintentos)

**Vercel**:
- Cron: `/api/sync` cada 6 horas (plan gratuito)
- Build: `npm run build`
- Max duration: 60 segundos

**Local Development**:
- Build: `npm run build`
- Dev: `npm run dev:unified` (con tsx)

---

## 6. APIs y Endpoints

### Health Check

```http
GET /health

Response:
{
  "status": "healthy",
  "database": {
    "connected": true,
    "sizeBytes": 12345678,
    "sizeMB": 11.77
  },
  "timestamp": "2026-01-27T10:00:00.000Z"
}
```

### REST Endpoints (PostgREST Compatible)

**Base URL**: `http://localhost:3000` o URL de Railway

#### 1. Query (GET)

```http
GET /rest/v1/:table?param=value

# Ejemplos:
GET /rest/v1/trade_events?order=block_number.desc&limit=10
GET /rest/v1/erc20_transfers?from=eq.0x123...&select=tx_hash,value,timestamp
GET /rest/v1/listing_events?price=gt.1000000000000000000
GET /rest/v1/punk_listings?token_id=eq.42&active=eq.true

# Query params soportados:
- select=col1,col2,col3              # Columnas específicas
- column=eq.value                     # Igualdad
- column=gt.value                     # Mayor que
- column=lt.value                     # Menor que
- column=gte.value                    # Mayor o igual
- column=lte.value                    # Menor o igual
- column=neq.value                    # No igual
- column=like.%pattern%               # LIKE pattern
- column=in.(val1,val2,val3)         # IN (valores)
- order=column.asc|desc               # Ordenamiento
- limit=10                            # Límite de resultados
- offset=20                           # Offset para paginación

# Headers:
apikey: tu-api-key                    # Si autenticación activada
Prefer: count=exact                   # Para incluir total count
Range: items=0-9                      # Para paginación

# Response headers:
Content-Range: items 0-9/100          # Si se pidió count
```

#### 2. Insert (POST)

```http
POST /rest/v1/:table
Content-Type: application/json

Body (objeto único):
{
  "tx_hash": "0x123...",
  "token_id": "42",
  "price": "1000000000000000000"
}

Body (array para bulk insert):
[
  { "tx_hash": "0x123...", "token_id": "42" },
  { "tx_hash": "0x456...", "token_id": "43" }
]

Response: 201 Created + body con registros insertados
```

#### 3. Update (PATCH)

```http
PATCH /rest/v1/:table?column=eq.value
Content-Type: application/json

Body:
{
  "active": false,
  "updated_at": "2026-01-27T10:00:00.000Z"
}

Response: 200 OK + body con registros actualizados
```

#### 4. Delete (DELETE)

```http
DELETE /rest/v1/:table?column=eq.value

Response: 204 No Content
```

### Tablas Disponibles

**Eventos FloorEngine**:
- `trade_events` - Eventos de compra/venta
- `listing_events` - Listados creados/cancelados
- `offer_events` - Ofertas creadas/aceptadas
- `sweep_events` - Compras múltiples (sweeps)
- `punk_listings` - Estado actual de listados

**Eventos ERC20 (ADRIAN Token)**:
- `erc20_transfers` - Transferencias
- `erc20_approvals` - Aprobaciones
- `erc20_tax_fee_updates` - Actualizaciones de fees
- `erc20_stakes` - Eventos de staking

**Eventos ERC721 (ADRIAN Lab Core)**:
- `erc721_transfers` - Transferencias NFT
- `erc721_approvals` - Aprobaciones individuales
- `erc721_approval_for_all` - Aprobaciones de operador
- `erc721_metadata_updates` - Actualizaciones de metadata

**Eventos ERC1155 (Traits)**:
- `erc1155_tokens` - Metadata de tokens
- `erc1155_transfers` - Transferencias single/batch
- `erc1155_approval_for_all` - Aprobaciones de operador

**Eventos Custom**:
- `shop_purchases` - Compras en tienda
- `trait_updates` - Actualizaciones de traits
- `name_registry_events` - Registro de nombres
- `serum_events` - Aplicación/remoción de serums
- `quest_events` - Inicio/completado de quests

**Control**:
- `sync_state` - Estado de sincronización por contrato

---

## 7. Flujo de Datos

### Sincronización Forward (Bloques Nuevos)

```
1. Viem Client consulta RPC
   ↓
2. getLogs(fromBlock, toBlock, contractAddress)
   → Log[] (eventos sin decodificar)
   ↓
3. Unified Listener decodifica con 11 ABIs en paralelo
   → TransferEvent, ApprovalEvent, ItemPurchasedEvent, etc.
   ↓
4. Processor específico procesa evento
   → Validación, enriquecimiento, transformación
   ↓
5. Persistencia dual (si configurado)
   ├─ Supabase: INSERT INTO table (si USE_SUPABASE=true)
   └─ SQLite: INSERT INTO table (vía DB-API)
   ↓
6. Update sync state
   → UPDATE sync_state SET last_synced_block = X WHERE contract = Y
```

### Sincronización Backward (Histórico)

```
1. Historical Sync Listener
   ↓ Partiendo de last_historical_block
2. Procesa bloques hacia atrás (en reversa)
   ↓
3. Mismo flujo de decodificación y procesamiento
   ↓
4. UPDATE sync_state SET last_historical_block = X
```

### Optimización Clave: Lectura Única de Bloques

**Antes** (Listeners individuales):
```
FloorEngine: getLogs(block 100) → 1 request
ADRIAN Token: getLogs(block 100) → 1 request
ADRIAN Lab: getLogs(block 100) → 1 request
...
Total: 11 requests por bloque
```

**Ahora** (Unified Listener):
```
getLogs(block 100, ALL_ADDRESSES) → 1 request
  ↓
Decodifica con 11 ABIs en paralelo
  ↓
Total: 1 request por bloque (90% reducción)
```

---

## 8. Comandos Útiles

### Root (Bot + Listener)

```bash
# Desarrollo (una sola sync)
npm run dev

# Desarrollo continuo (Railway local)
npm run dev:continuous

# Desarrollo optimizado (recomendado)
npm run dev:unified

# Build completo (bot + API)
npm run build

# Producción (compilado)
npm start

# Producción optimizada (API + Bot)
npm start:unified

# Solo API sin bot
npm start:api-only

# Type checking sin compilar
npm run type-check

# Script de mantenimiento
npm run fix-timestamps
```

### API (Backend)

```bash
cd api

# Desarrollo con hot reload
npm run dev

# Build API
npm run build

# Producción
npm start

# Crear schema SQLite
npm run migrate

# Migración Supabase → SQLite
npm run export-supabase    # Exportar de Supabase
npm run import-sqlite      # Importar a SQLite
npm run validate           # Validar migración

# Backups
npm run backup             # Backup manual
npm run sync-github        # Sincronizar a GitHub

# Debugging
npm run check-records      # Verificar registros locales
npm run check-railway      # Verificar registros en Railway
```

---

## 9. Patrones Arquitectónicos

### 9.1 Singleton Pattern (Base de Datos)

```typescript
// api/src/db/sqlite.ts
let db: Database | null = null;

export function getDatabase(): Database {
  if (!db) {
    db = new Database(DB_PATH);
    // Configuración inicial...
  }
  return db;
}
```

**Beneficio**: Una sola instancia de BD, evita conexiones múltiples.

### 9.2 Registry Pattern (Contratos Dinámicos)

```typescript
// src/unified-listener.ts
const CONTRACT_REGISTRY: ContractDefinition[] = [
  {
    name: 'FloorEngine',
    address: FLOOR_ENGINE_ADDRESS,
    startBlock: 21508000n,
    decoder: decodeFloorEngineEvent,
    processor: processFloorEngineEvent,
  },
  {
    name: 'ADRIAN-ERC20',
    address: ADRIAN_TOKEN_CONFIG.address,
    startBlock: ADRIAN_TOKEN_CONFIG.startBlock,
    decoder: decodeERC20Event,
    processor: processERC20Event,
  },
  // ... 9 contratos más
];
```

**Beneficio**: Agregar nuevos contratos sin modificar lógica core del listener.

### 9.3 Strategy Pattern (Procesadores)

Cada tipo de evento tiene su procesador específico con interfaz común:

```typescript
export async function processTradeEvent(event: TradeEvent, timestamp?: Date)
export async function processERC20Transfer(event: TransferEvent, timestamp?: Date)
export async function processShopPurchase(event: ItemPurchasedEvent, timestamp?: Date)
```

**Beneficio**: Lógica de negocio encapsulada por tipo de evento.

### 9.4 Adapter Pattern (DB Abstraction)

```typescript
// src/supabase/client.ts
const USE_SUPABASE = process.env.USE_SUPABASE === 'true';

export const supabase = USE_SUPABASE
  ? createClient(SUPABASE_URL, SUPABASE_KEY)  // Cliente Supabase real
  : createDBAPIClient(DB_API_URL);             // Cliente HTTP a API SQLite

// Interfaz idéntica para ambos
await supabase.from('table').insert(data);
```

**Beneficio**: Cambiar de Supabase a SQLite sin tocar código del listener.

### 9.5 Batch Processing Pattern

```typescript
const BLOCKS_PER_BATCH = parseInt(process.env.BLOCKS_PER_BATCH || '10');
const PARALLEL_REQUESTS = 20; // Normal mode
const FALLBACK_PARALLEL_REQUESTS = 10; // Fallback mode

// Procesa en chunks
for (let i = 0; i < blocksToProcess.length; i += BLOCKS_PER_BATCH) {
  const batch = blocksToProcess.slice(i, i + BLOCKS_PER_BATCH);
  const promises = batch.map(block => processBlock(block));
  await Promise.allSettled(promises);
}
```

**Beneficio**: Evita rate limiting del RPC, procesa eficientemente.

### 9.6 Idempotency Pattern

Todas las tablas tienen constraints únicos:

```sql
CREATE TABLE trade_events (
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  -- otros campos...
  UNIQUE(tx_hash, log_index)  -- Evita duplicados
);
```

**Beneficio**: Permite reintentos sin corromper datos.

### 9.7 Graceful Shutdown Pattern

```typescript
// src/continuous-listener.ts
let isShuttingDown = false;

process.on('SIGTERM', async () => {
  console.log('SIGTERM recibido, deteniendo...');
  isShuttingDown = true;
  closeDatabase();
  process.exit(0);
});

while (!isShuttingDown) {
  await syncAllContracts();
  await sleep(SYNC_INTERVAL_MS);
}
```

**Beneficio**: Evita corrupción de datos en Railway restarts.

### 9.8 Circuit Breaker Pattern (Fallback RPC)

```typescript
const USE_FALLBACK_RPC = process.env.USE_FALLBACK_RPC === 'true';

const client = USE_FALLBACK_RPC
  ? createPublicClient({
      chain: base,
      transport: http(FALLBACK_RPC_URL), // RPC gratuito
    })
  : createPublicClient({
      chain: base,
      transport: http(RPC_URL_BASE),     // RPC premium (Alchemy)
    });
```

**Beneficio**: Resilencia ante fallos del RPC principal.

### 9.9 Polling Pattern (Continuous Listener)

```typescript
const SYNC_INTERVAL_MS = parseInt(process.env.SYNC_INTERVAL_MINUTES || '5') * 60 * 1000;

while (true) {
  try {
    await syncAllContracts();
  } catch (error) {
    console.error('Error en sync:', error);
  }

  await sleep(SYNC_INTERVAL_MS); // Espera N minutos
}
```

**Beneficio**: Sincronización continua 24/7 sin webhooks.

### 9.10 Factory Pattern (Contratos Config)

```typescript
// src/contracts/config/index.ts
export function getActiveContracts(): ContractConfig[] {
  return [
    FLOOR_ENGINE_CONFIG,
    ADRIAN_TOKEN_CONFIG,
    ADRIAN_LAB_CORE_CONFIG,
    // ...
  ].filter(config => config.enabled);
}
```

**Beneficio**: Habilitar/deshabilitar contratos mediante flag.

---

## 10. Métricas y Estadísticas Clave

| Métrica | Valor |
|---------|-------|
| Contratos indexados | 11 activos |
| Tablas de BD | 30+ |
| Tipos de eventos | 100+ |
| Bloques por batch | 10-20 (configurable) |
| Requests paralelos | 20 normal / 10 fallback |
| Intervalo Railway | 5 minutos |
| Intervalo Vercel | 6 horas (cron) |
| Reducción de requests RPC | ~90% (vs. listeners individuales) |
| GitHub backup | Cada 10 minutos |
| Health check | `/health` endpoint |

---

## 11. Guías Rápidas

### Agregar un Nuevo Contrato

1. **Crear ABI file**: `src/contracts/abis/mi-contrato.json`
2. **Crear config**: `src/contracts/config/mi-contrato.ts`
   ```typescript
   export const MI_CONTRATO_CONFIG: ContractConfig = {
     address: '0x...',
     name: 'Mi Contrato',
     type: 'Custom',
     startBlock: 12345678n,
     enabled: true,
   };
   ```
3. **Crear types**: `src/contracts/types/mi-contrato-events.ts`
4. **Crear listener** (si necesario): `src/listeners/custom/mi-contrato-listener.ts`
5. **Crear processor**: `src/processors/mi-contrato-processor.ts`
6. **Registrar en Registry**: Agregar a `CONTRACT_REGISTRY` en `unified-listener.ts`
7. **Crear tabla en BD**: Agregar schema en `api/src/db/schema.sql` y `supabase/schema.sql`
8. **Rebuild**: `npm run build`

### Cambiar de Supabase a SQLite

```bash
# 1. Cambiar variable de entorno
USE_SUPABASE=false

# 2. Exportar datos de Supabase (si hay datos existentes)
cd api && npm run export-supabase

# 3. Importar a SQLite
npm run import-sqlite

# 4. Validar migración
npm run validate

# 5. Reiniciar bot
npm start:unified
```

### Debugging de Sincronización

```bash
# Ver estado de sync
sqlite3 api/data/enginedb.sqlite "SELECT * FROM sync_state;"

# Ver últimos eventos
sqlite3 api/data/enginedb.sqlite "SELECT * FROM trade_events ORDER BY block_number DESC LIMIT 10;"

# Ver tamaño de BD
ls -lh api/data/enginedb.sqlite

# Ver logs en Railway
railway logs --tail

# Health check
curl http://localhost:3000/health

# Verificar registros
cd api && npm run check-records
```

### Backup Manual

```bash
# Backup SQLite
cd api && npm run backup
# → Crea backup en ./backups/enginedb-TIMESTAMP.sqlite

# Backup a GitHub (automático)
cd api && npm run sync-github
# → Commit + push a repositorio configurado
```

---

## 12. Troubleshooting Común

### Problema: RPC Rate Limiting

**Síntoma**: Errores 429 Too Many Requests

**Solución**:
```env
# Reducir requests paralelos
PARALLEL_REQUESTS=5

# Reducir bloques por batch
BLOCKS_PER_BATCH=5

# O usar RPC premium (Alchemy/Infura)
RPC_URL_BASE=https://base-mainnet.g.alchemy.com/v2/TU_API_KEY
```

### Problema: Eventos Duplicados

**Síntoma**: Error UNIQUE constraint failed

**Solución**: Normal, el sistema maneja esto automáticamente por idempotencia. Si persiste:
```bash
# Verificar constraints únicos en schema
sqlite3 api/data/enginedb.sqlite ".schema trade_events"
```

### Problema: Sync Lento

**Diagnóstico**:
```bash
# Ver sync state
sqlite3 api/data/enginedb.sqlite "SELECT contract_address, last_synced_block FROM sync_state;"

# Ver último bloque en red
curl https://mainnet.base.org -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

**Solución**: Aumentar `BLOCKS_PER_BATCH` y `PARALLEL_REQUESTS` (con cuidado de rate limit).

### Problema: API no Responde

**Diagnóstico**:
```bash
# Verificar proceso
ps aux | grep node

# Verificar puerto
lsof -i :3000

# Health check
curl http://localhost:3000/health
```

**Solución**:
```bash
# Reiniciar API
pkill node
npm start:unified
```

---

## 13. Seguridad

### API Keys

```env
# Generar API key seguro
API_KEY=$(openssl rand -hex 32)
```

### CORS

```env
# Producción: Limitar orígenes
CORS_ORIGIN=https://mi-frontend.com,https://mi-admin.com

# Desarrollo: Permitir todo
CORS_ORIGIN=*
```

### GitHub Token

```bash
# Crear token con permisos:
# - repo (full control)
# Scope: repo:all

GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
```

### Supabase Keys

```env
# NUNCA usar SUPABASE_ANON_KEY en servidor
# Siempre usar SUPABASE_SERVICE_ROLE_KEY
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

---

## 14. Performance Tips

1. **Optimizar RPC**:
   - Usar Alchemy/Infura para mayor throughput
   - Ajustar `BLOCKS_PER_BATCH` según rate limit
   - Usar `PARALLEL_REQUESTS` entre 10-20

2. **Optimizar BD**:
   - Índices en columnas de filtrado frecuente
   - `PRAGMA journal_mode=WAL` en SQLite (ya configurado)
   - Backup periódico para prevenir corrupción

3. **Optimizar Memoria**:
   - Procesar bloques en batches (no todos a la vez)
   - Usar streaming para queries grandes
   - Limpiar listeners antiguos (garbage collection)

4. **Monitoreo**:
   - Health check cada minuto
   - Alertas si `last_synced_block` no avanza
   - Logs estructurados (considerar Sentry/LogDNA)

---

## 15. Próximos Pasos / Roadmap

- [ ] Implementar WebSocket para eventos en tiempo real
- [ ] Agregar sistema de notificaciones (Discord/Telegram)
- [ ] Métricas con Prometheus + Grafana
- [ ] Separar API en servicio independiente (microservicio)
- [ ] Implementar caché con Redis para queries frecuentes
- [ ] Agregar rate limiting por API key
- [ ] Documentación OpenAPI/Swagger
- [ ] Tests unitarios y de integración
- [ ] CI/CD con GitHub Actions
- [ ] Dashboard de monitoreo interno

---

## 16. Contacto y Recursos

### Repositorios

- **Main Repo**: `/Users/adrian/Documents/GitHub/enginedb`
- **GitHub Remote**: (configurar si aplica)

### Documentos Relacionados

- `env.example.txt` - Variables de entorno de ejemplo
- `supabase/schema.sql` - Schema completo Supabase
- `api/src/db/schema.sql` - Schema SQLite
- `railway.json` - Configuración Railway
- `vercel.json` - Configuración Vercel

### Comandos de Git

```bash
# Ver estado
git status

# Crear commit
git add .
git commit -m "descripción"

# Push
git push origin main

# Ver últimos commits
git log --oneline -10
```

---

**Última sincronización**: 2026-01-27T08:38:28.732Z (ver últimos commits)

**Versión del documento**: 1.0

---

## Apéndice: Esquema de Base de Datos

### Tabla: sync_state

Control de sincronización por contrato.

```sql
CREATE TABLE sync_state (
  contract_address TEXT PRIMARY KEY,
  contract_name TEXT NOT NULL,
  last_synced_block INTEGER NOT NULL,
  last_historical_block INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: trade_events

Eventos de compra/venta en FloorEngine.

```sql
CREATE TABLE trade_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number INTEGER NOT NULL,
  block_timestamp DATETIME,
  buyer TEXT NOT NULL,
  seller TEXT NOT NULL,
  token_id TEXT NOT NULL,
  price TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tx_hash, log_index)
);

CREATE INDEX idx_trade_events_block ON trade_events(block_number);
CREATE INDEX idx_trade_events_token ON trade_events(token_id);
CREATE INDEX idx_trade_events_buyer ON trade_events(buyer);
```

### Tabla: erc20_transfers

Transferencias de ADRIAN Token.

```sql
CREATE TABLE erc20_transfers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number INTEGER NOT NULL,
  block_timestamp DATETIME,
  contract_address TEXT NOT NULL,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tx_hash, log_index)
);

CREATE INDEX idx_erc20_transfers_block ON erc20_transfers(block_number);
CREATE INDEX idx_erc20_transfers_from ON erc20_transfers(from_address);
CREATE INDEX idx_erc20_transfers_to ON erc20_transfers(to_address);
```

*(30+ tablas más con estructura similar)*

---

**Fin del documento**
