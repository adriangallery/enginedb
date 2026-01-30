# 🚂 Deployment en Railway - Guía Completa

Railway es perfecto para este proyecto porque permite **procesos continuos** que se ejecutan 24/7.

---

## 🌟 Ventajas de Railway vs Vercel

| Característica | Railway | Vercel Free |
|---------------|---------|-------------|
| **Tipo de proceso** | ✅ Continuo 24/7 | ❌ Solo cron jobs |
| **Frecuencia sync** | ✅ Cada 5 min (o menos) | ⚠️ Cada 6 horas |
| **Free tier** | ✅ $5/mes crédito | ⚠️ Límites estrictos |
| **Configuración** | ✅ Más simple | ⚠️ Más compleja |
| **Logs** | ✅ En tiempo real | ✅ En tiempo real |
| **Base de datos** | ✅ Incluye Postgres | ❌ Requiere Supabase externo |

**Conclusión**: Railway es **mejor para este proyecto** 🎯

---

## 📋 RESUMEN RÁPIDO

| Variable | Dónde Configurar | Valor |
|----------|------------------|-------|
| `RPC_URL_BASE` | Railway | Obtener de Alchemy o usar público |
| `SUPABASE_URL` | Railway | Desde tu proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Railway | Desde tu proyecto Supabase |
| `START_BLOCK` | Railway (opcional) | Bloque inicial |
| `SYNC_INTERVAL_MINUTES` | Railway (opcional) | Minutos entre syncs (default: 5) |

**Tiempo total**: 10-15 minutos

---

## 🚀 PASO A PASO COMPLETO

### PASO 1: Preparar Supabase

Antes de empezar con Railway, necesitas un proyecto Supabase independiente.

#### Si Supabase está conectado a Vercel:

1. **Desconectar de Vercel**:
   - Ver guía: [DESCONECTAR_SUPABASE.md](./DESCONECTAR_SUPABASE.md)
   - O crear cuenta nueva en Supabase

2. **Crear proyecto en Supabase**:
   - Ve a: https://supabase.com/dashboard
   - Click en **"New Project"**
   - Configura:
     - **Name**: `floorengine-db` (o el que prefieras)
     - **Database Password**: Genera uno seguro (guárdalo!)
     - **Region**: Elige el más cercano
   - Click en **"Create new project"**
   - Espera 1-2 minutos

3. **Ejecutar Schema SQL**:
   - En tu proyecto → **SQL Editor**
   - Click en **"New query"**
   - Copia todo el contenido de: https://github.com/adriangallery/enginedb/blob/main/supabase/schema.sql
   - Pega y click en **"Run"**
   - ✅ Deberías ver: "Success. No rows returned"

4. **Obtener credenciales**:
   - En Supabase → **Settings** → **API**
   - Copia y guarda:
     - **Project URL** (SUPABASE_URL)
     - **service_role key** (SUPABASE_SERVICE_ROLE_KEY)
     - ⚠️ NO uses el `anon` key, usa el `service_role`

✅ **Supabase listo!**

---

### PASO 2: Crear cuenta en Railway

1. Ve a: https://railway.app/

2. Click en **"Start a New Project"** o **"Login"**

3. Inicia sesión con GitHub (recomendado)

4. ✅ Recibes **$5/mes gratis** en el plan Hobby

---

### PASO 3: Crear proyecto en Railway desde GitHub

1. En Railway Dashboard, click en **"New Project"**

2. Selecciona **"Deploy from GitHub repo"**

3. Autoriza a Railway a acceder a tus repos (si es la primera vez)

4. Busca y selecciona: **adriangallery/enginedb**

5. Click en **"Deploy Now"**

6. Railway detectará automáticamente que es un proyecto Node.js/TypeScript

7. El deployment inicial **fallará** (es normal, faltan las variables)

✅ **Proyecto creado en Railway!**

---

### PASO 4: Configurar Variables de Entorno

1. En tu proyecto de Railway, click en tu servicio (enginedb)

2. Ve a la pestaña **"Variables"**

3. Click en **"New Variable"** para cada una:

#### Variables REQUERIDAS:

**Variable 1**: RPC_URL_BASE
```
RPC_URL_BASE=https://mainnet.base.org
```
O si usas Alchemy:
```
RPC_URL_BASE=https://base-mainnet.g.alchemy.com/v2/TU_API_KEY
```

**Variable 2**: SUPABASE_URL
```
SUPABASE_URL=https://tu-proyecto.supabase.co
```
(Lo copiaste en el Paso 1)

**Variable 3**: SUPABASE_SERVICE_ROLE_KEY
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
(Lo copiaste en el Paso 1)

#### Variables OPCIONALES:

**Variable 4**: START_BLOCK (opcional)
```
START_BLOCK=10000000
```
Bloque desde donde empezar la sincronización histórica.

**Variable 5**: SYNC_INTERVAL_MINUTES (opcional)
```
SYNC_INTERVAL_MINUTES=5
```
Minutos entre cada sincronización (default: 5 minutos).

Si quieres más frecuente:
- `1` = Cada minuto (muy rápido, usa más recursos)
- `3` = Cada 3 minutos (balance bueno)
- `5` = Cada 5 minutos (recomendado)
- `10` = Cada 10 minutos (más conservador)

**Variable 6**: BLOCKS_PER_BATCH (opcional)
```
BLOCKS_PER_BATCH=10
```
Bloques a consultar por request (default: 10).

Ajusta según tu plan de RPC:
- `10` = Alchemy Free tier (default)
- `100` = Alchemy Growth
- `2000` = Alchemy Pro o RPC privado

4. Click en **"Add"** después de cada variable

✅ **Variables configuradas!**

---

### PASO 5: Configurar Start Command (Verificar)

Railway debería detectar automáticamente el start command, pero verifica:

1. En tu servicio → Pestaña **"Settings"**

2. Busca **"Start Command"**

3. Debería decir:
   ```
   npm start
   ```

4. Si está vacío, agrégalo manualmente y guarda

✅ **Start command configurado!**

---

### PASO 6: Redeploy

1. Ve a la pestaña **"Deployments"**

2. Click en **"Redeploy"** en el deployment más reciente

3. Observa los logs en tiempo real

4. Deberías ver algo como:
   ```
   🚀 FloorEngine Continuous Listener Bot
   ======================================
   ⏰ Inicio: 2025-11-18T20:00:00.000Z
   🔄 Intervalo de sincronización: 5 minutos
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📊 Iteración #1
   ⏰ 2025-11-18T20:00:05.000Z
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   🔄 Iniciando sincronización de eventos...
   📊 Procesando bloques 0 a 2000
   📝 Encontrados 0 eventos
   🎉 Sincronización completada: 0 eventos procesados
   
   ✅ Sincronización completada
   📊 0 eventos procesados
   📍 Bloques: 0 → 2000
   ⏱️  Duración: 2500ms (2.50s)
   
   ⏳ Esperando 5 minutos hasta la próxima sincronización...
   🕐 Próxima ejecución: 2025-11-18T20:05:05.000Z
   ```

5. El servicio quedará corriendo continuamente ✅

✅ **Bot desplegado y funcionando!**

---

### PASO 7: Verificar en Supabase

1. Ve a Supabase → Tu proyecto → **Table Editor**

2. Click en tabla **`sync_state`**

3. Después de la primera sincronización, deberías ver:
   ```
   last_synced_block: 2000 (o mayor)
   updated_at: timestamp reciente
   ```

4. Verifica otras tablas para eventos procesados (si los hay)

✅ **Datos sincronizándose correctamente!**

---

## 📊 Monitoreo en Railway

### Ver Logs en Tiempo Real

1. En Railway → Tu servicio → Pestaña **"Logs"**

2. Verás cada sincronización en tiempo real:
   ```
   📊 Iteración #1
   ✅ Sincronización completada
   📊 5 eventos procesados
   ⏳ Esperando 5 minutos...
   
   📊 Iteración #2
   ✅ Sincronización completada
   📊 3 eventos procesados
   ⏳ Esperando 5 minutos...
   ```

### Ver Métricas

1. Pestaña **"Metrics"**

2. Métricas disponibles:
   - CPU Usage
   - Memory Usage
   - Network Traffic
   - Restart Count

### Restart Manual

Si necesitas reiniciar el servicio:

1. Pestaña **"Settings"**
2. Scroll down → **"Restart Service"**

---

## 💰 Costos de Railway

### Plan Hobby (Free Tier)

- **Crédito mensual**: $5 gratis
- **Costo por servicio**: ~$0.01/hora si está activo 24/7
- **Costo estimado**: ~$7/mes si está corriendo todo el tiempo

**¿Suficiente con $5/mes?**
- ⚠️ Puede quedarse corto si el bot corre 24/7
- ✅ Suficiente si ajustas `SYNC_INTERVAL_MINUTES` a 10-15 minutos
- ✅ Railway pausa automáticamente cuando no hay uso (¡ahorro!)

### Optimizar Costos

**Opción 1**: Aumentar intervalo de sync
```
SYNC_INTERVAL_MINUTES=10  # En lugar de 5
```
Reduce uso de CPU y memoria.

**Opción 2**: Usar schedule más inteligente
Si solo necesitas datos durante horas laborales, modifica el código para:
```typescript
// Solo ejecutar entre 8AM y 8PM
const hour = new Date().getHours();
if (hour >= 8 && hour <= 20) {
  await syncEvents();
}
```

**Opción 3**: Upgrade a plan Pro
- $20/mes con créditos incluidos
- Sin límites de uso

---

## 🔧 Troubleshooting

### Error: "Missing environment variables"

**Solución**:
1. Ve a Variables en Railway
2. Verifica que todas las variables estén configuradas
3. Redeploy el servicio

---

### Error: "Failed to connect to database"

**Solución**:
1. Verifica que ejecutaste el schema SQL en Supabase
2. Verifica que `SUPABASE_SERVICE_ROLE_KEY` sea correcta (no el anon key)
3. Ve a Supabase → SQL Editor:
   ```sql
   SELECT * FROM sync_state;
   ```
   Si da error, ejecuta de nuevo el schema completo

---

### El servicio se crashea constantemente

**Solución**:
1. Ve a Logs en Railway
2. Identifica el error específico
3. Problemas comunes:
   - RPC rate limit → Usa Alchemy en lugar del RPC público
   - Out of memory → Reduce `BLOCKS_PER_BATCH` en `src/listener.ts`
   - Timeout → Aumenta `SYNC_INTERVAL_MINUTES`

---

### Servicio pausado automáticamente

Railway pausa servicios inactivos para ahorrar recursos.

**Solución**:
1. Settings → Desactiva "Auto Sleep" (si existe la opción)
2. O el servicio se reactivará automáticamente en el próximo intervalo

---

## 🎯 Comparación Final

### Railway (Ahora)
```
✅ Sincronización cada 5 minutos
✅ Proceso continuo 24/7
✅ Logs en tiempo real
✅ Fácil de monitorear
✅ ~$5-7/mes
⚡ Datos casi en tiempo real
```

### Vercel Free (Antes)
```
⚠️ Sincronización cada 6 horas
⚠️ Solo cron jobs
✅ Logs en tiempo real
✅ Gratis
⏱️ Datos con 6 horas de delay
```

**Railway es claramente superior para este proyecto** 🎯

---

## ✅ Checklist Final

- [ ] Supabase desconectado de Vercel (o cuenta nueva)
- [ ] Proyecto creado en Supabase
- [ ] Schema SQL ejecutado
- [ ] Credenciales de Supabase copiadas
- [ ] Cuenta creada en Railway
- [ ] Proyecto desplegado desde GitHub
- [ ] Variables de entorno configuradas
- [ ] Servicio redeployeado con variables
- [ ] Logs muestran sincronizaciones exitosas
- [ ] Datos aparecen en Supabase
- [ ] ✅ Todo funcionando!

---

## 🎉 ¡Listo!

Tu bot ahora está:
- ✅ Corriendo 24/7 en Railway
- ✅ Sincronizando cada 5 minutos (o lo que configuraste)
- ✅ Guardando datos en Supabase
- ✅ Monitoreado con logs en tiempo real

**Próximos pasos opcionales**:
- Crear dashboard con los datos
- Exponer API para consultar listings
- Agregar alertas por eventos importantes
- Optimizar costos ajustando intervalos

---

**¿Preguntas?** Revisa los logs en Railway y Supabase para debugging.

