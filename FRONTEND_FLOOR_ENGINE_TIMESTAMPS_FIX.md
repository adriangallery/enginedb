# Corrección de Timestamps - FloorEngine

## Problema

El frontend estaba usando `punk_listings.updated_at` que es la fecha de actualización en la base de datos, no el timestamp real del bloque de la transacción.

## Solución

### Opción 1: Usar la Vista Unificada (Recomendado)

Se ha creado una vista `floor_engine_events_unified` que combina todos los eventos con sus timestamps correctos:

```sql
-- Obtener todos los eventos con timestamps correctos
SELECT 
  event_type,
  token_id,
  user_address,
  price_wei,
  event_timestamp,
  tx_hash,
  block_number
FROM floor_engine_events_unified
ORDER BY event_timestamp DESC
LIMIT 50;
```

### Opción 2: Usar las Tablas de Eventos Directamente

Para cada tipo de evento, usar la tabla correspondiente con `created_at`:

#### Para eventos Listed/Cancelled:
```sql
SELECT 
  event_type,
  token_id,
  seller,
  price_wei,
  created_at as event_timestamp,  -- ✅ Usar created_at, NO updated_at
  tx_hash,
  block_number
FROM listing_events
WHERE event_type = 'Listed'  -- o 'Cancelled'
ORDER BY created_at DESC;
```

#### Para eventos Bought:
```sql
SELECT 
  token_id,
  buyer,
  seller,
  price_wei,
  created_at as event_timestamp,  -- ✅ Usar created_at
  tx_hash,
  block_number
FROM trade_events
ORDER BY created_at DESC;
```

#### Para eventos FloorSweep:
```sql
SELECT 
  token_id,
  caller,
  buy_price_wei,
  relist_price_wei,
  created_at as event_timestamp,  -- ✅ Usar created_at
  tx_hash,
  block_number
FROM sweep_events
ORDER BY created_at DESC;
```

## Código TypeScript/JavaScript

### Ejemplo con la Vista Unificada:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function getFloorEngineEvents(limit = 50) {
  const { data, error } = await supabase
    .from('floor_engine_events_unified')
    .select('*')
    .order('event_timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error:', error);
    return [];
  }

  // Formatear fechas
  return data?.map(event => ({
    ...event,
    event_timestamp: new Date(event.event_timestamp),
    formatted_date: new Date(event.event_timestamp).toLocaleString('es-ES')
  })) || [];
}
```

### Ejemplo con Tablas Individuales:

```typescript
async function getRecentListings() {
  // ✅ CORRECTO: Usar listing_events.created_at
  const { data, error } = await supabase
    .from('listing_events')
    .select('*')
    .eq('event_type', 'Listed')
    .order('created_at', { ascending: false })  // ✅ created_at, NO updated_at
    .limit(50);

  return data?.map(listing => ({
    ...listing,
    created_at: new Date(listing.created_at),
    formatted_date: new Date(listing.created_at).toLocaleString('es-ES')
  })) || [];
}

async function getRecentSweeps() {
  // ✅ CORRECTO: Usar sweep_events.created_at
  const { data, error } = await supabase
    .from('sweep_events')
    .select('*')
    .order('created_at', { ascending: false })  // ✅ created_at
    .limit(50);

  return data || [];
}
```

## Comparación: ❌ Incorrecto vs ✅ Correcto

### ❌ INCORRECTO (lo que estaba pasando):
```typescript
// NO usar punk_listings.updated_at para fechas de eventos
const { data } = await supabase
  .from('punk_listings')
  .select('*')
  .order('updated_at', { ascending: false });  // ❌ updated_at es fecha de BD, no de transacción
```

### ✅ CORRECTO:
```typescript
// Usar listing_events.created_at para eventos Listed/Cancelled
const { data } = await supabase
  .from('listing_events')
  .select('*')
  .eq('event_type', 'Listed')
  .order('created_at', { ascending: false });  // ✅ created_at es timestamp del bloque

// O usar la vista unificada
const { data } = await supabase
  .from('floor_engine_events_unified')
  .select('*')
  .order('event_timestamp', { ascending: false });  // ✅ event_timestamp es timestamp del bloque
```

## Estructura de la Vista Unificada

La vista `floor_engine_events_unified` incluye:

| Campo | Descripción | Fuente |
|-------|-------------|--------|
| `event_type` | Tipo de evento: 'Listed', 'Cancelled', 'Bought', 'FloorSweep' | Varias tablas |
| `token_id` | ID del token | Todas |
| `user_address` | Dirección del usuario (seller/buyer/caller) | Varias tablas |
| `price_wei` | Precio en wei | Varias tablas |
| `event_timestamp` | ✅ **Timestamp real del bloque** | `created_at` de cada tabla |
| `tx_hash` | Hash de la transacción | Todas |
| `block_number` | Número de bloque | Todas |

## Aplicar la Vista en Supabase

Ejecutar el script SQL:

```sql
-- Ejecutar en Supabase SQL Editor
\i supabase/create-floor-engine-events-view.sql
```

O copiar y pegar el contenido de `supabase/create-floor-engine-events-view.sql` en el SQL Editor de Supabase.

## Verificación

Después de aplicar los cambios, verificar que las fechas son correctas:

```sql
-- Comparar timestamps
SELECT 
  'Vista unificada' as source,
  event_type,
  token_id,
  event_timestamp
FROM floor_engine_events_unified
WHERE token_id = 542
ORDER BY event_timestamp DESC
LIMIT 1;

-- Comparar con listing_events
SELECT 
  'listing_events' as source,
  event_type,
  token_id,
  created_at as event_timestamp
FROM listing_events
WHERE token_id = 542
ORDER BY created_at DESC
LIMIT 1;
```

Ambas queries deberían mostrar el mismo timestamp.

