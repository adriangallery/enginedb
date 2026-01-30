# 🚀 Primera Sincronización

Después de deployar en Vercel, es importante ejecutar la **primera sincronización manual** para:
- ✅ Inicializar la base de datos con el bloque actual
- ✅ Verificar que todo funciona correctamente
- ✅ No esperar 6 horas al primer cron

---

## ⚡ Ejecutar Primera Sincronización

### Opción 1: Desde el Navegador (Más Fácil)

1. Una vez completado el deployment en Vercel
2. Ve a tu URL del proyecto (ej: `https://marketplace-adrianlab.vercel.app`)
3. Agrega `/api/sync` al final:
   ```
   https://marketplace-adrianlab.vercel.app/api/sync
   ```
4. Abre esa URL en tu navegador
5. Verás una respuesta JSON como:
   ```json
   {
     "success": true,
     "processed": 0,
     "fromBlock": "0",
     "toBlock": "22500000",
     "message": "Procesados 0 eventos..."
   }
   ```

✅ **Listo!** La base de datos ya está inicializada con el bloque actual.

---

### Opción 2: Desde la Terminal (Más Pro)

```bash
# Sin CRON_SECRET (si no lo configuraste)
curl https://TU-URL.vercel.app/api/sync

# Con CRON_SECRET (si lo configuraste)
curl -H "Authorization: Bearer TU_SECRETO" https://TU-URL.vercel.app/api/sync
```

Reemplaza:
- `TU-URL` con tu URL de Vercel
- `TU_SECRETO` con tu CRON_SECRET (si lo configuraste)

---

### Opción 3: Desde Vercel Dashboard (Más Visual)

1. Ve a Vercel → Tu proyecto → **Functions**
2. Busca `/api/sync`
3. Click en **"Invoke Function"**
4. Click en **"Execute"**
5. Ver la respuesta en la consola

---

## 📊 ¿Qué Esperar?

### Primera Ejecución Exitosa:

```json
{
  "success": true,
  "timestamp": "2025-11-18T15:30:00.000Z",
  "duration": "2500ms",
  "processed": 0,
  "fromBlock": "0",
  "toBlock": "22500000",
  "message": "Procesados 0 eventos desde bloque 0 hasta 22500000"
}
```

**`processed: 0`** es normal si:
- Es la primera vez que se ejecuta
- No hay eventos recientes en el contrato
- El START_BLOCK está muy adelantado

**`processed: X`** (donde X > 0):
- ✅ Perfecto! Encontró y procesó eventos
- Verifica en Supabase que estén guardados

---

## ⚠️ Errores Comunes

### Error: "Missing environment variables"

```json
{
  "error": "Missing environment variables",
  "message": "Faltan variables de entorno requeridas: RPC_URL_BASE"
}
```

**Solución**:
1. Ve a Vercel → Settings → Environment Variables
2. Verifica que `RPC_URL_BASE` esté configurada
3. Redeploy el proyecto

---

### Error: "Failed to connect to database"

```json
{
  "error": "Failed to connect to database"
}
```

**Solución**:
1. Verifica que ejecutaste el `schema.sql` en Supabase
2. Ve a Supabase → SQL Editor y ejecuta:
   ```sql
   SELECT * FROM sync_state;
   ```
3. Si da error, ejecuta de nuevo el schema completo

---

### Error: "RPC request failed"

```json
{
  "error": "RPC request failed"
}
```

**Solución**:
1. Verifica que `RPC_URL_BASE` sea correcta
2. Prueba con el RPC público: `https://mainnet.base.org`
3. O usa Alchemy para mejor confiabilidad

---

## 🔍 Verificar en Supabase

Después de la primera sincronización exitosa:

### 1. Verificar sync_state

```sql
SELECT * FROM sync_state;
```

Deberías ver:
```
id | last_synced_block | updated_at
1  | 22500000          | 2025-11-18 15:30:00+00
```

✅ Si `last_synced_block` > 0, ¡funciona!

---

### 2. Verificar eventos (si se procesaron)

```sql
-- Ver todos los eventos procesados
SELECT 
  'listing_events' as table_name, 
  COUNT(*) as count 
FROM listing_events
UNION ALL
SELECT 'trade_events', COUNT(*) FROM trade_events
UNION ALL
SELECT 'sweep_events', COUNT(*) FROM sweep_events
UNION ALL
SELECT 'engine_config_events', COUNT(*) FROM engine_config_events;
```

---

### 3. Ver eventos recientes

```sql
-- Últimos 10 eventos de cualquier tipo
SELECT 
  'Listed' as event,
  token_id,
  seller as address,
  price_wei,
  block_number,
  created_at
FROM listing_events
WHERE event_type = 'Listed'
ORDER BY created_at DESC
LIMIT 5;
```

---

## ⏰ Siguientes Sincronizaciones (Automáticas)

Después de esta primera ejecución manual, el cron se encargará automáticamente:

```
🕐 00:00 - Medianoche
🕐 06:00 - Mañana
🕐 12:00 - Mediodía
🕐 18:00 - Tarde
```

Cada ejecución procesará los bloques desde el último `last_synced_block` hasta el bloque actual.

---

## 🔄 Ejecutar Manualmente Cuando Quieras

Aunque el cron se ejecute cada 6 horas, **siempre puedes ejecutar manualmente**:

```bash
# Trigger manual
curl https://TU-URL.vercel.app/api/sync

# Ver el resultado
# ✅ success: true
# 📊 processed: número de eventos
# 📍 fromBlock → toBlock
```

Esto es útil para:
- Verificar que funciona después de cambios
- Sincronizar antes de consultar datos recientes
- Testing y debugging

---

## 📝 Checklist de Primera Sincronización

- [ ] Deployment completado en Vercel
- [ ] Variables de entorno configuradas (RPC_URL_BASE, SUPABASE_*)
- [ ] Schema SQL ejecutado en Supabase
- [ ] Ejecutar primera sincronización manual
- [ ] Verificar respuesta JSON exitosa
- [ ] Verificar `sync_state` en Supabase (last_synced_block > 0)
- [ ] Verificar eventos procesados (si corresponde)
- [ ] ✅ Todo funcionando!

---

## 🎉 Todo Configurado

Una vez que veas:
- ✅ Respuesta exitosa del endpoint
- ✅ `last_synced_block` actualizado en Supabase
- ✅ Cron job visible en Vercel

**Tu bot está operativo y sincronizando automáticamente cada 6 horas** 🚀

---

## 💡 Tips

### Tip 1: Bookmark el Endpoint
Guarda la URL del endpoint en favoritos para triggers rápidos:
```
https://TU-URL.vercel.app/api/sync
```

### Tip 2: Crear un Script
Guarda un script bash para ejecutar fácilmente:

```bash
#!/bin/bash
# sync.sh
curl https://TU-URL.vercel.app/api/sync | jq
```

Uso: `chmod +x sync.sh && ./sync.sh`

### Tip 3: Monitorear con Watch
Para ver sincronizaciones en tiempo real durante testing:

```bash
watch -n 30 "curl -s https://TU-URL.vercel.app/api/sync | jq"
```

Esto ejecutará el sync cada 30 segundos y mostrará los resultados.

---

**¿Problemas?** Revisa los logs en Vercel → Logs y busca errores específicos.

