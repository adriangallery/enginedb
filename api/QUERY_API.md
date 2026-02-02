# Query API - Consultas SQL Directas

Este endpoint permite ejecutar consultas SQL directas contra la base de datos SQLite desde el frontend.

## Seguridad

- Solo permite consultas de **lectura** (SELECT, PRAGMA, EXPLAIN)
- Bloquea comandos de escritura (INSERT, UPDATE, DELETE, DROP, etc.)
- Valida que no haya comandos peligrosos en la consulta

## Endpoints

### POST /query

Ejecuta una consulta SQL de solo lectura.

**Request:**
```json
{
  "sql": "SELECT * FROM trade_events WHERE token_id = ? ORDER BY block_number DESC LIMIT 10",
  "params": [1234]
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "contract_address": "0x...",
      "token_id": "1234",
      "price": "1000000000000000000",
      ...
    }
  ],
  "count": 10
}
```

**Ejemplos:**

```javascript
// Ejemplo 1: Query simple sin parámetros
const response = await fetch('https://enginedb-production.up.railway.app/query', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    sql: 'SELECT * FROM trade_events ORDER BY block_number DESC LIMIT 5'
  })
});
const result = await response.json();
console.log(result.data);

// Ejemplo 2: Query con parámetros
const response = await fetch('https://enginedb-production.up.railway.app/query', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    sql: 'SELECT * FROM trade_events WHERE token_id = ? AND price > ?',
    params: ['1234', '1000000000000000000']
  })
});

// Ejemplo 3: Query con JOINs
const response = await fetch('https://enginedb-production.up.railway.app/query', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    sql: `
      SELECT
        te.*,
        pl.price as listing_price
      FROM trade_events te
      LEFT JOIN punk_listings pl ON te.token_id = pl.punk_id
      WHERE te.contract_address = ?
      ORDER BY te.block_number DESC
      LIMIT 20
    `,
    params: ['0x...']
  })
});
```

### GET /query/tables

Lista todas las tablas disponibles en la base de datos.

**Response:**
```json
{
  "success": true,
  "tables": [
    "trade_events",
    "listing_events",
    "punk_listings",
    "erc721_transfers",
    "erc20_transfers",
    "sync_state"
  ]
}
```

**Ejemplo:**
```javascript
const response = await fetch('https://enginedb-production.up.railway.app/query/tables');
const result = await response.json();
console.log('Tablas disponibles:', result.tables);
```

### GET /query/schema/:table

Obtiene el schema (estructura de columnas) de una tabla específica.

**Response:**
```json
{
  "success": true,
  "table": "trade_events",
  "columns": [
    {
      "cid": 0,
      "name": "id",
      "type": "INTEGER",
      "notnull": 0,
      "dflt_value": null,
      "pk": 1
    },
    {
      "cid": 1,
      "name": "contract_address",
      "type": "TEXT",
      "notnull": 1,
      "dflt_value": null,
      "pk": 0
    },
    ...
  ]
}
```

**Ejemplo:**
```javascript
const response = await fetch('https://enginedb-production.up.railway.app/query/schema/trade_events');
const result = await response.json();
console.log('Columnas:', result.columns);
```

## Uso desde el Frontend

Puedes crear un módulo de utilidad para simplificar las consultas:

```javascript
// lib/database.js

const API_URL = 'https://enginedb-production.up.railway.app';

export async function query(sql, params = []) {
  try {
    const response = await fetch(`${API_URL}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql, params })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.success ? result.data : [];
  } catch (error) {
    console.error('Query error:', error);
    return [];
  }
}

export async function getTables() {
  try {
    const response = await fetch(`${API_URL}/query/tables`);
    const result = await response.json();
    return result.tables || [];
  } catch (error) {
    console.error('Error fetching tables:', error);
    return [];
  }
}

export async function getTableSchema(table) {
  try {
    const response = await fetch(`${API_URL}/query/schema/${table}`);
    const result = await response.json();
    return result.columns || [];
  } catch (error) {
    console.error('Error fetching schema:', error);
    return [];
  }
}
```

Luego en tus componentes:

```javascript
import { query } from '@/lib/database';

// En tu componente
const trades = await query(
  'SELECT * FROM trade_events WHERE contract_address = ? ORDER BY block_number DESC LIMIT 10',
  ['0x...']
);

console.log('Últimos trades:', trades);
```

## Queries Útiles

### Obtener últimos trades de un contrato
```sql
SELECT * FROM trade_events
WHERE contract_address = ?
ORDER BY block_number DESC
LIMIT 10
```

### Obtener listings activos
```sql
SELECT * FROM punk_listings
WHERE is_listed = 1
ORDER BY price ASC
```

### Obtener transfers de un token específico
```sql
SELECT * FROM erc721_transfers
WHERE contract_address = ? AND token_id = ?
ORDER BY block_number DESC
```

### Obtener volumen total de trades por contrato
```sql
SELECT
  contract_address,
  COUNT(*) as total_trades,
  SUM(CAST(price AS REAL)) as total_volume
FROM trade_events
GROUP BY contract_address
```

### Obtener estadísticas de un punk específico
```sql
SELECT
  te.*,
  (SELECT price FROM punk_listings WHERE punk_id = te.token_id AND is_listed = 1) as current_listing_price
FROM trade_events te
WHERE te.token_id = ?
ORDER BY te.block_number DESC
```

## Errores Comunes

### Query contiene keywords prohibidos
```json
{
  "success": false,
  "error": "Query contains forbidden keyword: insert"
}
```

**Solución:** Asegúrate de usar solo consultas SELECT.

### Nombre de tabla inválido
```json
{
  "success": false,
  "error": "Table 'invalid_table' not found"
}
```

**Solución:** Usa `GET /query/tables` para ver las tablas disponibles.

### Error de SQL
```json
{
  "success": false,
  "error": "SQL error: no such column: invalid_column"
}
```

**Solución:** Usa `GET /query/schema/:table` para ver las columnas disponibles.

## Límites y Consideraciones

- Las consultas tienen un timeout (verifica la configuración del servidor)
- Recomendado usar `LIMIT` en queries grandes para evitar timeouts
- Los parámetros son opcionales pero recomendados para prevenir SQL injection
- No se permiten múltiples statements separados por `;`
