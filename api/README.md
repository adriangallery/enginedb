# enginedb-api

Backend API con SQLite compatible con Supabase PostgREST.

## Características

- Base de datos SQLite (sin límites de Supabase free)
- API REST compatible con Supabase PostgREST
- Autenticación por API key
- Backups automáticos a GitHub
- Migración fácil desde Supabase

## Instalación

```bash
cd api
npm install
```

## Configuración

Copiar `.env.example` a `.env` y configurar:

```bash
cp .env.example .env
```

Variables principales:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | `3000` |
| `DB_PATH` | Ruta al archivo SQLite | `./data/enginedb.sqlite` |
| `API_KEY` | Clave de API para autenticación | `tu-api-key-segura` |
| `CORS_ORIGIN` | Orígenes permitidos | `https://tu-frontend.com` |

## Uso

### Desarrollo

```bash
npm run dev
```

### Producción

```bash
npm run build
npm start
```

### Crear base de datos

```bash
npm run migrate
```

## Migración desde Supabase

### 1. Configurar credenciales Supabase

En `api/.env`:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

### 2. Exportar datos

```bash
npm run export-supabase
```

### 3. Importar a SQLite

```bash
npm run migrate
npm run import-sqlite
```

### 4. Validar migración

```bash
npm run validate
```

## API Endpoints

### Health Check

```
GET /health
```

### Query data

```
GET /rest/v1/:table
```

Query parameters:
- `select` - Columnas a seleccionar
- `column=eq.value` - Filtrar por igualdad
- `column=gt.value` - Mayor que
- `column=lt.value` - Menor que
- `order=column.asc` - Ordenar
- `limit=10` - Limitar resultados

### Insert data

```
POST /rest/v1/:table
Content-Type: application/json

{"column1": "value1", "column2": "value2"}
```

### Update data

```
PATCH /rest/v1/:table?column=eq.value
Content-Type: application/json

{"column1": "new_value"}
```

### Delete data

```
DELETE /rest/v1/:table?column=eq.value
```

## Ejemplos

### JavaScript/TypeScript

```typescript
// Usando fetch
const response = await fetch('http://localhost:3000/rest/v1/trade_events?limit=10&order=block_number.desc', {
  headers: {
    'apikey': 'tu-api-key',
  }
});
const data = await response.json();

// Usando el cliente incluido
import { createDBAPIClient } from '../src/db-api/client';

const db = createDBAPIClient();

const { data, error } = await db
  .from('trade_events')
  .select('*')
  .order('block_number', { ascending: false })
  .limit(10);
```

## Backups

### Manual

```bash
npm run backup
```

### Automático

Configura `BACKUP_INTERVAL_HOURS` y el servidor creará backups automáticamente.

## Estructura

```
api/
├── src/
│   ├── server.ts           # Servidor Express
│   ├── routes/
│   │   └── tables.ts       # Rutas REST
│   ├── db/
│   │   ├── sqlite.ts       # Cliente SQLite
│   │   ├── init.ts         # Inicialización
│   │   └── schema.sql      # Schema de tablas
│   ├── middleware/
│   │   └── auth.ts         # Autenticación
│   └── utils/
│       ├── query-parser.ts # Parser de queries
│       ├── sql-builder.ts  # Constructor SQL
│       ├── errors.ts       # Manejo de errores
│       └── backup.ts       # Sistema de backup
├── scripts/
│   ├── migrate.ts          # Migración inicial
│   ├── export-from-supabase.ts
│   ├── import-to-sqlite.ts
│   ├── validate-migration.ts
│   └── backup-to-github.ts
└── data/
    └── enginedb.sqlite     # Base de datos
```

## Licencia

MIT
