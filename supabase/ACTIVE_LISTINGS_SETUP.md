# 🎯 Setup de Vista Active Punk Listings

Esta guía explica cómo crear la vista `active_punk_listings` que muestra automáticamente los punks actualmente a la venta.

---

## 📋 ¿Qué hace esta vista?

La vista `active_punk_listings` filtra automáticamente los punks que están a la venta, excluyendo:
- ❌ Punks que ya se vendieron (evento `Bought`)
- ❌ Punks que se cancelaron (evento `Cancelled`)
- ❌ Punks que estaban listados por usuarios pero fueron barridos por el engine (evento `FloorSweep`)

**La vista se actualiza automáticamente** cuando cambian los datos en `punk_listings`. No requiere mantenimiento manual.

---

## 🚀 Paso 1: Aplicar el Schema en Supabase

### Opción A: Desde el SQL Editor (Recomendado)

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **SQL Editor** en el menú lateral
4. Click en **"New query"**
5. Abre el archivo `supabase/create-active-listings-view.sql`
6. Copia todo el contenido y pégalo en el editor
7. Click en **"Run"** o presiona `Ctrl+Enter` (Windows/Linux) o `Cmd+Enter` (Mac)
8. ✅ Deberías ver: "Success. No rows returned"

### Opción B: Desde la línea de comandos

Si tienes `psql` instalado y configurado:

```bash
psql -h [TU_HOST] -U postgres -d postgres -f supabase/create-active-listings-view.sql
```

---

## ✅ Paso 2: Verificar que Funciona

Ejecuta esta consulta en el SQL Editor de Supabase:

```sql
-- Ver cuántos punks están a la venta
SELECT COUNT(*) as total_active_listings FROM active_punk_listings;

-- Ver los primeros 10 punks a la venta
SELECT * FROM active_punk_listings LIMIT 10;

-- Ver solo punks del engine
SELECT COUNT(*) as engine_listings 
FROM active_punk_listings 
WHERE is_engine_owned = true;

-- Ver solo punks de usuarios
SELECT COUNT(*) as user_listings 
FROM active_punk_listings 
WHERE is_engine_owned = false;
```

Si todo funciona correctamente, deberías ver resultados sin errores.

---

## 📊 Paso 3: Estructura de la Vista

La vista `active_punk_listings` tiene estos campos:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `token_id` | BIGINT | ID del punk |
| `price_adrian_wei` | NUMERIC | Precio en $ADRIAN (en wei) |
| `is_engine_owned` | BOOLEAN | `true` = del engine, `false` = de usuario |
| `seller` | TEXT | Dirección del vendedor (opcional) |
| `last_event` | TEXT | Último evento (opcional) |
| `last_block_number` | BIGINT | Número del último bloque (opcional) |
| `updated_at` | TIMESTAMPTZ | Última actualización (opcional) |

---

## 💻 Paso 4: Usar desde el Frontend

### Con Supabase Client (JavaScript/TypeScript)

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Obtener todos los punks a la venta
async function getActiveListings() {
  const { data, error } = await supabase
    .from('active_punk_listings')
    .select('token_id, price_adrian_wei, is_engine_owned')
    .order('price_adrian_wei', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return [];
  }

  return data;
}

// Obtener solo punks del engine
async function getEngineListings() {
  const { data, error } = await supabase
    .from('active_punk_listings')
    .select('token_id, price_adrian_wei')
    .eq('is_engine_owned', true)
    .order('price_adrian_wei', { ascending: true });

  return data || [];
}

// Obtener solo punks de usuarios
async function getUserListings() {
  const { data, error } = await supabase
    .from('active_punk_listings')
    .select('token_id, price_adrian_wei, seller')
    .eq('is_engine_owned', false)
    .order('price_adrian_wei', { ascending: true });

  return data || [];
}

// Buscar un punk específico
async function getPunkListing(tokenId: number) {
  const { data, error } = await supabase
    .from('active_punk_listings')
    .select('*')
    .eq('token_id', tokenId)
    .single();

  return data;
}

// Obtener el floor price (precio más bajo)
async function getFloorPrice() {
  const { data, error } = await supabase
    .from('active_punk_listings')
    .select('price_adrian_wei')
    .order('price_adrian_wei', { ascending: true })
    .limit(1)
    .single();

  return data?.price_adrian_wei || null;
}
```

### Con Fetch API (JavaScript)

```javascript
const SUPABASE_URL = 'https://tu-proyecto.supabase.co';
const SUPABASE_ANON_KEY = 'tu-anon-key';

// Obtener todos los punks a la venta
async function getActiveListings() {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/active_punk_listings?select=token_id,price_adrian_wei,is_engine_owned&order=price_adrian_wei.asc`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  );

  if (!response.ok) {
    throw new Error('Error al obtener listings');
  }

  return await response.json();
}

// Obtener solo punks del engine
async function getEngineListings() {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/active_punk_listings?select=token_id,price_adrian_wei&is_engine_owned=eq.true&order=price_adrian_wei.asc`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    }
  );

  return await response.json();
}
```

### Con React Hook (Ejemplo)

```typescript
import { useEffect, useState } from 'react';
import { supabase } from './supabase-client';

interface ActiveListing {
  token_id: number;
  price_adrian_wei: string;
  is_engine_owned: boolean;
}

export function useActiveListings() {
  const [listings, setListings] = useState<ActiveListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchListings() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('active_punk_listings')
          .select('token_id, price_adrian_wei, is_engine_owned')
          .order('price_adrian_wei', { ascending: true });

        if (error) throw error;

        setListings(data || []);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchListings();

    // Opcional: Actualizar cada 30 segundos
    const interval = setInterval(fetchListings, 30000);
    return () => clearInterval(interval);
  }, []);

  return { listings, loading, error };
}

// Uso en un componente
function ListingsPage() {
  const { listings, loading, error } = useActiveListings();

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Punks a la Venta ({listings.length})</h1>
      {listings.map((listing) => (
        <div key={listing.token_id}>
          Punk #{listing.token_id} - {listing.price_adrian_wei} $ADRIAN
          {listing.is_engine_owned ? ' (Engine)' : ' (Usuario)'}
        </div>
      ))}
    </div>
  );
}
```

---

## 🔄 Actualización Automática

La vista se actualiza automáticamente cuando:
- ✅ Un punk se lista (evento `Listed`)
- ✅ Un punk se cancela (evento `Cancelled`)
- ✅ Un punk se vende (evento `Bought`)
- ✅ Un punk es barrido por el engine (evento `FloorSweep`)

**No necesitas hacer nada manualmente.** La vista siempre refleja el estado actual de los listings.

---

## 🐛 Solución de Problemas

### Error: "relation active_punk_listings does not exist"

**Solución:** Ejecuta el script SQL `create-active-listings-view.sql` en el SQL Editor de Supabase.

### La vista no muestra punks que deberían estar listados

**Solución:** Verifica que `punk_listings` tenga datos correctos:
```sql
SELECT * FROM punk_listings WHERE token_id = [ID_DEL_PUNK];
```

Si `is_listed = false`, el punk no aparecerá en la vista (es correcto).

### La vista está vacía pero hay punks listados

**Solución:** Verifica que los punks tengan `is_listed = true`:
```sql
SELECT COUNT(*) FROM punk_listings WHERE is_listed = true;
```

Si este número es 0, significa que no hay punks listados actualmente.

---

## 📚 Más Información

- Ver documentación completa: [FRONTEND_API_DOCUMENTATION.md](../FRONTEND_API_DOCUMENTATION.md)
- Ver schema completo: [schema.sql](./schema.sql)

