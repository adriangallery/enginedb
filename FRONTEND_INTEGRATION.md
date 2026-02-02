# Integración Frontend con enginedb API

Ya no necesitas WebAssembly ni librerías complejas. Tu API en Railway ya está lista para servir datos SQLite al frontend.

## ✅ Lo que ya tienes configurado

- ✅ API REST en Railway con Express + SQLite
- ✅ Endpoint `/query` para consultas SQL directas (solo lectura)
- ✅ Endpoints `/query/tables` y `/query/schema/:table` para exploración
- ✅ CORS configurado para permitir requests desde el frontend
- ✅ Seguridad: solo permite consultas SELECT

## 🚀 Pasos para usar desde el frontend

### 1. Obtener tu URL de Railway

Tu API debería estar desplegada en una URL similar a:
```
https://enginedb-production.up.railway.app
```

Para verificar que funciona:
```bash
curl https://enginedb-production.up.railway.app/health
```

Deberías ver una respuesta como:
```json
{
  "status": "healthy",
  "database": {
    "connected": true,
    "sizeBytes": 1234567,
    "sizeMB": "1.18"
  },
  "timestamp": "2024-01-30T..."
}
```

### 2. Copiar el módulo de base de datos a tu frontend

Copia el archivo `api/frontend-example.js` a tu proyecto frontend como `lib/database.js`:

```bash
# Desde tu proyecto frontend (por ejemplo, adriangallery)
cp /path/to/enginedb/api/frontend-example.js ./lib/database.js
```

**IMPORTANTE:** Abre `lib/database.js` y reemplaza la URL de la API con tu URL de Railway:

```javascript
// Cambiar esto:
const API_URL = 'https://enginedb-production.up.railway.app';

// Por tu URL real de Railway (si es diferente)
const API_URL = 'https://tu-url.railway.app';
```

### 3. Usar en tus componentes

#### Ejemplo básico:

```javascript
import { query } from '@/lib/database'

// En tu componente o función
const trades = await query(
  'SELECT * FROM trade_events WHERE token_id = ? ORDER BY block_number DESC LIMIT 10',
  ['1234']
)

console.log('Trades:', trades)
```

#### Ejemplo con helper functions:

```javascript
import { getLatestTrades, getFloorPrice, getPunkListing } from '@/lib/database'

// Obtener últimos trades
const trades = await getLatestTrades('0xContractAddress', 10)

// Obtener floor price
const floorPrice = await getFloorPrice()

// Obtener listing de un punk
const listing = await getPunkListing('1234')
```

#### Ejemplo en Next.js (Server Component):

```javascript
// app/trades/page.tsx
import { getLatestTrades } from '@/lib/database'

export default async function TradesPage() {
  const trades = await getLatestTrades('0x...', 20)

  return (
    <div>
      <h1>Latest Trades</h1>
      <ul>
        {trades.map(trade => (
          <li key={trade.id}>
            Token #{trade.token_id} - Price: {trade.price} wei
          </li>
        ))}
      </ul>
    </div>
  )
}
```

#### Ejemplo en Next.js (Client Component):

```javascript
'use client'

import { useEffect, useState } from 'react'
import { getLatestTrades } from '@/lib/database'

export default function TradesClient() {
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTrades() {
      try {
        const data = await getLatestTrades('0x...', 20)
        setTrades(data)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTrades()
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <h1>Latest Trades</h1>
      <ul>
        {trades.map(trade => (
          <li key={trade.id}>
            Token #{trade.token_id} - Price: {trade.price} wei
          </li>
        ))}
      </ul>
    </div>
  )
}
```

### 4. Queries personalizadas

Puedes ejecutar cualquier consulta SQL:

```javascript
import { query } from '@/lib/database'

// Query con JOIN
const data = await query(`
  SELECT
    te.*,
    pl.price as listing_price
  FROM trade_events te
  LEFT JOIN punk_listings pl ON te.token_id = pl.punk_id
  WHERE te.contract_address = ?
  ORDER BY te.block_number DESC
  LIMIT 20
`, ['0x...'])

// Query con agregaciones
const stats = await query(`
  SELECT
    COUNT(*) as total_trades,
    SUM(CAST(price AS REAL)) as total_volume,
    AVG(CAST(price AS REAL)) as avg_price
  FROM trade_events
  WHERE contract_address = ?
`, ['0x...'])

// Query de búsqueda
const results = await query(`
  SELECT * FROM trade_events
  WHERE token_id IN (?, ?, ?)
  ORDER BY block_number DESC
`, ['1', '2', '3'])
```

## 📊 Helper Functions Disponibles

El módulo `lib/database.js` incluye funciones pre-construidas:

| Función | Descripción |
|---------|-------------|
| `query(sql, params)` | Ejecuta una consulta SQL personalizada |
| `getTables()` | Lista todas las tablas disponibles |
| `getTableSchema(table)` | Obtiene el schema de una tabla |
| `getLatestTrades(address, limit)` | Últimos trades de un contrato |
| `getTokenTrades(address, tokenId, limit)` | Trades de un token específico |
| `getActiveListings(limit)` | Listings activos ordenados por precio |
| `getPunkListing(punkId)` | Listing actual de un punk |
| `getTokenTransfers(address, tokenId, limit)` | Transfers de un token |
| `getWalletTransfers(wallet, limit)` | Transfers de un wallet |
| `getContractStats(address)` | Estadísticas de volumen de un contrato |
| `getFloorPrice()` | Precio floor actual |
| `getEventsByTxHash(txHash)` | Todos los eventos de una transacción |
| `getRecentActivity(limit)` | Actividad reciente (todos los eventos) |

## 🔧 Desplegar cambios a Railway

Después de hacer modificaciones a la API:

```bash
cd /path/to/enginedb

# Commit y push a GitHub
git add .
git commit -m "Add query API endpoint"
git push origin main
```

Railway detectará el push y desplegará automáticamente.

Para verificar el despliegue:
1. Ve a tu dashboard de Railway
2. Revisa los logs del deployment
3. Prueba el endpoint: `curl https://tu-url.railway.app/query/tables`

## 🛠️ Troubleshooting

### El frontend no puede conectar a la API

**Verifica CORS:**
```bash
# En tu archivo api/.env
CORS_ORIGIN=https://tu-frontend.vercel.app,http://localhost:3000
```

Luego redeploy a Railway.

### Error "Query contains forbidden keyword"

Solo se permiten consultas SELECT. Intenta:
```javascript
// ❌ No permitido
await query('INSERT INTO ...')
await query('UPDATE ...')
await query('DELETE FROM ...')

// ✅ Permitido
await query('SELECT * FROM ...')
```

### Error "Table not found"

Lista las tablas disponibles:
```javascript
const tables = await getTables()
console.log('Tablas:', tables)
```

### Query muy lenta

Agrega `LIMIT` a tus queries:
```javascript
// ❌ Puede ser lento
await query('SELECT * FROM trade_events')

// ✅ Mejor
await query('SELECT * FROM trade_events LIMIT 100')
```

## 📚 Documentación adicional

- **API completa:** Ver `api/QUERY_API.md`
- **Ejemplos de código:** Ver `api/frontend-example.js`
- **Schema de la DB:** Ver `DATABASE_SCHEMA.md`

## 🎯 Siguiente paso

Una vez que copies `lib/database.js` a tu frontend y actualices la URL, ya puedes empezar a usarlo inmediatamente. No necesitas instalar ninguna dependencia adicional, solo usa `fetch` nativo del navegador.

```javascript
// ¡Eso es todo! Ya puedes empezar a usar tu base de datos
import { getLatestTrades } from '@/lib/database'

const trades = await getLatestTrades('0x...', 10)
```
