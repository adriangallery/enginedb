# Checklist de Correcciones - Errores en Logs

## Problemas Identificados

### 1. ❌ "Unexpected end of JSON input" (NETWORK_ERROR)
**Ubicación**: `src/db-api/client.ts` - cuando el API devuelve error 500
**Causa**: El cliente HTTP intenta parsear JSON de una respuesta vacía o no-JSON cuando hay un error del servidor
**Impacto**: Los eventos no se insertan y el bot reporta errores de red

### 2. ❌ "SQLite3 can only bind numbers, strings, bigints, buffers, and null"
**Ubicación**: `api/src/utils/sql-builder.ts` - función `buildInsertQuery`
**Causa**: Valores `undefined` no se están convirtiendo a `null` antes de pasarlos a SQLite
**Impacto**: Errores al insertar eventos que tienen campos opcionales con `undefined`

### 3. ❌ Error de sintaxis en `api/src/routes/tables.ts`
**Ubicación**: Línea 107 - falta `{` después de `try`
**Causa**: Error de sintaxis que impide que el código compile correctamente
**Impacto**: El servidor puede no estar ejecutando el código correcto

### 4. ❌ Manejo de errores HTTP incompleto
**Ubicación**: `src/db-api/client.ts` - función `executeQuery`
**Causa**: Cuando hay un error 500, la respuesta puede estar vacía y `response.json()` falla
**Impacto**: Errores de red en lugar de errores de servidor claros

---

## Checklist de Correcciones

### ✅ Fase 1: Correcciones Críticas

- [x] **Fix 1.1**: ~~Corregir sintaxis en `api/src/routes/tables.ts`~~ (ya estaba correcto)
- [x] **Fix 1.2**: Manejar `undefined` en `buildInsertQuery` - convertir a `null` antes de pasar a SQLite
- [x] **Fix 1.3**: Manejar `undefined` en `buildUpdateQuery` - convertir a `null`
- [x] **Fix 1.4**: Manejar `undefined` en filtros WHERE - convertir a `null` o omitir

### ✅ Fase 2: Manejo de Errores HTTP

- [x] **Fix 2.1**: En `src/db-api/client.ts`, verificar que la respuesta tenga contenido antes de parsear JSON
- [x] **Fix 2.2**: Capturar errores de parsing JSON y devolver error descriptivo
- [x] **Fix 2.3**: Manejar respuestas vacías (status 204, 500 sin body) correctamente

### ✅ Fase 3: Validación y Limpieza de Datos

- [x] **Fix 3.1**: Filtrar campos `undefined` del objeto antes de insertar (o convertirlos a `null`)
- [x] **Fix 3.2**: Validar que todos los valores sean tipos válidos para SQLite antes de binding
- [x] **Fix 3.3**: Agregar logging detallado para identificar qué campo causa el error de binding

### ✅ Fase 4: Testing y Verificación

- [x] **Fix 4.1**: Compilar y verificar que no hay errores de TypeScript
- [ ] **Fix 4.2**: Probar inserción con valores `undefined` (pendiente en Railway)
- [ ] **Fix 4.3**: Probar inserción con bigint (pendiente en Railway)
- [ ] **Fix 4.4**: Probar manejo de errores HTTP (500, respuestas vacías) (pendiente en Railway)
- [ ] **Fix 4.5**: Verificar que los logs ya no muestren estos errores después del deploy

---

## Detalles Técnicos - Cambios Implementados

### Fix 1.2, 1.3, 1.4, 3.1, 3.2 - Normalización de valores para SQLite

Se creó una función centralizada `normalizeValueForSQLite()` que maneja:
- `undefined` → `null`
- `bigint` → `string`
- `object/array` → `JSON.stringify()`
- `boolean` → `0/1`

```typescript
function normalizeValueForSQLite(v: any): any {
  if (v === undefined) return null;
  if (typeof v === 'bigint') return v.toString();
  if (typeof v === 'object' && v !== null) return JSON.stringify(v);
  if (typeof v === 'boolean') return v ? 1 : 0;
  return v;
}
```

### Fix 2.1, 2.2, 2.3 - Manejo de respuestas HTTP

```typescript
// Leer respuesta como texto primero
const responseText = await response.text();

// Parsear JSON solo si hay contenido
if (responseText) {
  try {
    data = JSON.parse(responseText) as T;
  } catch (parseError) {
    return { data: null, error: { message: 'Invalid JSON response', ... } };
  }
} else {
  data = (method === 'POST' || method === 'PATCH' ? [] : null) as T;
}
```

### Fix 3.3 - Error handler mejorado

Se agregó manejo específico para errores de SQLite binding:

```typescript
if (err.message.includes('can only bind') || err.message.includes('SQLite3')) {
  res.status(400).json({
    message: 'Invalid data type for SQLite binding',
    code: 'PGRST400',
    details: err.message,
  });
}
```

---

## Prioridad

1. **ALTA**: Fix 1.1 (sintaxis) - bloquea ejecución
2. **ALTA**: Fix 1.2, 1.3, 1.4 (undefined) - causa errores de binding
3. **MEDIA**: Fix 2.1, 2.2, 2.3 (HTTP errors) - mejora debugging
4. **BAJA**: Fix 3.1, 3.2, 3.3 (validación) - prevención adicional

---

## Notas

- Los errores ocurren principalmente en eventos de `FloorEngine`, `ADRIAN-ERC20`, y `ADRIAN-ERC721`
- El bot continúa funcionando pero pierde eventos debido a estos errores
- Después de aplicar los fixes, el bot debería poder insertar todos los eventos correctamente
