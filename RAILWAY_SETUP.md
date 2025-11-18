# 🚂 Deployment en Railway - Guía Completa

Railway es **perfecto** para este proyecto porque:
- ✅ Proceso continuo (no serverless)
- ✅ Sincronización cada 5 minutos (gratis)
- ✅ $5 de crédito gratis cada mes
- ✅ Logs en tiempo real
- ✅ Setup más simple que Vercel

---

## 📋 RESUMEN RÁPIDO

| Variable | Dónde Configurar | Cuándo | Valor |
|----------|------------------|--------|-------|
| `RPC_URL_BASE` | Railway | Paso 3 | Alchemy o `https://mainnet.base.org` |
| `SUPABASE_URL` | Railway | Paso 3 | De Supabase dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Railway | Paso 3 | De Supabase dashboard |
| `START_BLOCK` | Railway (opcional) | Paso 3 | Bloque inicial |
| `SYNC_INTERVAL` | Railway (opcional) | Paso 3 | Milisegundos (default: 300000 = 5 min) |

**Tiempo total**: 10-15 minutos

---

## 🚀 PASO 1: Crear Proyecto en Supabase (Manual)

### 1.1 Desconectar Supabase de Vercel (si aplica)

1. Ve a Vercel → Settings → Integrations
2. Busca Supabase → Click en **"Manage"**
3. Click en **"Disconnect"** o **"Remove Integration"**
4. Confirma

### 1.2 Crear Proyecto Supabase

1. Ve a: https://supabase.com/dashboard

2. Click en **"New project"**

3. Configura:
   - **Organization**: Crea una o selecciona existente
   - **Name**: `floorengine-db` (o el que prefieras)
   - **Database Password**: Genera uno fuerte (guárdalo!)
   - **Region**: Selecciona el más cercano
   - **Pricing Plan**: Free

4. Click en **"Create new project"**

5. Espera 2-3 minutos a que se aprovisione

### 1.3 Obtener Credenciales

1. Una vez creado, ve a **Settings** → **API**

2. Copia y guarda:
   - **Project URL** (será tu `SUPABASE_URL`)
     ```
     https://xxxxxxxxxxxxx.supabase.co
     ```
   
   - **service_role key** (será tu `SUPABASE_SERVICE_ROLE_KEY`)
     ```
     eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     ```

**🔖 GUARDA ESTAS DOS CREDENCIALES** - Las necesitarás en el Paso 3

### 1.4 Ejecutar Schema SQL

1. Ve a **SQL Editor** en el menú lateral

2. Click en **"New query"**

3. Abre este archivo del repo:
   https://github.com/adriangallery/enginedb/blob/main/supabase/schema.sql

4. **Copia TODO el contenido** y pégalo en el SQL Editor

5. Click en **"Run"** (o Ctrl/Cmd + Enter)

6. Deberías ver: **"Success. No rows returned"**

7. Verifica las tablas creadas:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

   Deberías ver:
   - `sync_state`
   - `punk_listings`
   - `listing_events`
   - `trade_events`
   - `sweep_events`
   - `engine_config_events`

✅ **Supabase listo!**

---

## 🚀 PASO 2: Crear Proyecto en Railway

### 2.1 Crear Cuenta

1. Ve a: https://railway.app/

2. Click en **"Start a New Project"** o **"Login"**

3. Conecta con GitHub (recomendado)

### 2.2 Crear Proyecto desde GitHub

1. En el dashboard de Railway, click en **"New Project"**

2. Selecciona **"Deploy from GitHub repo"**

3. Si es primera vez:
   - Railway pedirá acceso a tus repos de GitHub
   - Click en **"Configure GitHub App"**
   - Selecciona el repositorio: **adriangallery/enginedb**
   - Click en **"Install & Authorize"**

4. Selecciona el repositorio: **adriangallery/enginedb**

5. Railway detectará automáticamente que es un proyecto Node.js

6. Click en **"Deploy Now"**

7. Railway empezará a buildear... pero **fallará** porque faltan las variables de entorno

⚠️ **Esto es normal** - Configuraremos las variables ahora

---

## 🚀 PASO 3: Configurar Variables de Entorno

### 3.1 Ir a Variables

1. En Railway → Tu proyecto → Click en el servicio (enginedb)

2. Ve a la pestaña **"Variables"**

### 3.2 Agregar Variables Requeridas

Click en **"New Variable"** para cada una:

#### Variable 1: RPC_URL_BASE (REQUERIDA)

**Key**: `RPC_URL_BASE`

**Value**: 
- Opción rápida: `https://mainnet.base.org`
- Opción recomendada: Tu URL de Alchemy
  - Ve a https://www.alchemy.com/
  - Create App → Base → Base Mainnet
  - Copia la URL HTTPS

**Click "Add"**

---

#### Variable 2: SUPABASE_URL (REQUERIDA)

**Key**: `SUPABASE_URL`

**Value**: La URL que copiaste en el Paso 1.3
```
https://xxxxxxxxxxxxx.supabase.co
```

**Click "Add"**

---

#### Variable 3: SUPABASE_SERVICE_ROLE_KEY (REQUERIDA)

**Key**: `SUPABASE_SERVICE_ROLE_KEY`

**Value**: El service_role key que copiaste en el Paso 1.3
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Click "Add"**

---

### 3.3 Variables Opcionales

#### Variable 4: START_BLOCK (Opcional)

**Key**: `START_BLOCK`

**Value**: Bloque inicial desde donde sincronizar (ej: `10000000`)

**Si no lo configuras**: Empezará desde el bloque 0

---

#### Variable 5: SYNC_INTERVAL (Opcional)

**Key**: `SYNC_INTERVAL`

**Value**: Intervalo en milisegundos entre sincronizaciones

**Ejemplos**:
- `300000` = 5 minutos (default)
- `600000` = 10 minutos
- `60000` = 1 minuto (para testing)

**Si no lo configuras**: Usará 5 minutos por defecto

---

## 🚀 PASO 4: Redeploy

1. Una vez agregadas todas las variables, Railway **NO redeploya automáticamente**

2. Ve a **"Deployments"** (en el menú lateral)

3. Click en el último deployment (el que falló)

4. Click en los **3 puntos** (⋯) → **"Redeploy"**

5. Railway empezará a buildear de nuevo

6. Espera 2-3 minutos

---

## 🚀 PASO 5: Verificar que Funciona

### 5.1 Ver Logs en Tiempo Real

1. En Railway → Tu proyecto → Tu servicio

2. Ve a la pestaña **"Logs"**

3. Deberías ver algo como:

```
🚀 FloorEngine Listener Bot - Railway Mode
════════════════════════════════════════════════════════════════
⏰ Intervalo de sincronización: 5 minutos
🌐 Network: Base Mainnet
📦 Contrato: 0x0351F7cBA83277E891D4a85Da498A7eACD764D58
════════════════════════════════════════════════════════════════

🔄 Iniciando sincronización - 2025-11-18T15:30:00.000Z
📊 Procesando bloques 0 a 2000
📝 Encontrados 0 eventos
✅ Sincronización completada exitosamente
📊 Eventos procesados: 0
📍 Bloques: 0 → 22500000
⏰ Próxima sincronización en 5 minutos

✅ Bot activo - Sincronizando automáticamente
```

✅ **Si ves esto, está funcionando perfectamente!**

---

### 5.2 Verificar en Supabase

1. Ve a Supabase → Tu proyecto → **Table Editor**

2. Click en la tabla **`sync_state`**

3. Deberías ver:
   ```
   id | last_synced_block | updated_at
   1  | 22500000          | 2025-11-18 15:30:00+00
   ```

✅ **Si `last_synced_block` > 0, perfecto!**

---

### 5.3 Ver Eventos Procesados (si los hay)

En Supabase → SQL Editor:

```sql
-- Ver estadísticas de eventos
SELECT 
  'listing_events' as table_name, 
  COUNT(*) as count 
FROM listing_events
UNION ALL
SELECT 'trade_events', COUNT(*) FROM trade_events
UNION ALL
SELECT 'sweep_events', COUNT(*) FROM sweep_events;
```

---

## 🎯 ¿Qué Está Pasando Ahora?

Tu bot está:

1. ✅ **Corriendo 24/7** en Railway
2. ✅ **Sincronizando cada 5 minutos** automáticamente
3. ✅ **Procesando nuevos bloques** en cada iteración
4. ✅ **Guardando eventos** en Supabase
5. ✅ **Reiniciándose automáticamente** si hay un error

**No necesitas hacer nada más** - El bot se encarga de todo.

---

## 📊 Monitoreo

### Ver Logs en Tiempo Real

Railway → Tu proyecto → Logs

Verás una nueva sincronización cada 5 minutos con estadísticas completas.

### Ver Métricas

Railway → Tu proyecto → Metrics

- CPU usage
- Memory usage
- Network traffic

### Ver Datos en Supabase

Supabase → Table Editor → Explora las tablas

---

## ⚙️ Configuración Avanzada

### Cambiar Intervalo de Sincronización

1. Railway → Variables
2. Editar `SYNC_INTERVAL`
3. Ejemplos:
   - `60000` = 1 minuto
   - `180000` = 3 minutos
   - `300000` = 5 minutos (default)
   - `600000` = 10 minutos

4. Railway redesplegará automáticamente

### Cambiar Bloque Inicial

Si quieres resincronizar desde un bloque diferente:

1. **Opción A** - Cambiar START_BLOCK:
   - Railway → Variables → `START_BLOCK`
   - Cambiar valor
   - Redeploy

2. **Opción B** - Resetear sync_state:
   ```sql
   UPDATE sync_state SET last_synced_block = 10000000;
   ```

---

## 💰 Costos de Railway

### Plan Hobby (Gratis)

- **$5 de crédito gratis/mes**
- **$0.000231/GB-hour** de RAM
- **$0.000463/vCPU-hour** de CPU

**Estimado para este bot**:
- RAM: ~100MB
- CPU: Muy bajo (solo activo durante sync)
- **Costo mensual estimado**: ~$0.50 - $1.50

✅ **Entra perfectamente en los $5 gratis** 🎉

### Monitorear Uso

Railway → Settings → Usage

Verás el consumo en tiempo real y cuánto crédito te queda.

---

## 🆘 Troubleshooting

### El deployment falla con "Missing environment variables"

**Solución**:
1. Verifica que las 3 variables requeridas estén configuradas
2. Variables → Verificar que `RPC_URL_BASE`, `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` existan
3. Redeploy

---

### El bot se ejecuta pero no encuentra eventos

**Causa**: Normal si no hay actividad reciente en el contrato

**Verificar**:
```sql
SELECT * FROM sync_state;
```

Si `last_synced_block` aumenta en cada sync, está funcionando.

---

### Error: "Failed to connect to database"

**Solución**:
1. Verifica las credenciales de Supabase
2. Settings → API → Verifica que copiaste el **service_role** key (no el anon key)
3. Verifica que ejecutaste el schema.sql

---

### El bot se reinicia constantemente

**Solución**:
1. Ver logs completos en Railway
2. Probablemente error en RPC o Supabase
3. Verifica todas las variables

---

### Quiero ver más detalles en los logs

Railway ya muestra logs completos. Para más detalle puedes:

1. Railway → Logs → Ver en tiempo real
2. Cada 5 minutos verás una nueva sincronización con estadísticas

---

## ⚡ Ventajas de Railway vs Vercel

| Característica | Railway | Vercel Free |
|---------------|---------|-------------|
| **Tipo** | Proceso continuo | Serverless |
| **Frecuencia sync** | Cada 5 min | Cada 6 horas |
| **Sincronizaciones/día** | 288 | 4 |
| **Lag máximo** | 5 minutos | 6 horas |
| **Logs** | En tiempo real | Por ejecución |
| **Costo** | $0.50-1.50/mes | Gratis |
| **Crédito gratis** | $5/mes | N/A |
| **Reinicio auto** | Sí | N/A |

✅ **Railway es mejor para este proyecto**

---

## 🔄 Migrar de Vercel a Railway

Si ya tenías el bot en Vercel:

1. ✅ **Código ya adaptado** - El repo ya tiene todo para Railway
2. ✅ **Supabase funciona igual** - No cambies nada en la DB
3. ✅ **Datos se preservan** - `last_synced_block` continúa desde donde estaba
4. ✅ **Solo cambias el deployment** - De Vercel a Railway

**Pasos**:
1. Sigue esta guía completa
2. Railway empezará a sincronizar desde el último bloque
3. Puedes eliminar el proyecto de Vercel cuando confirmes que funciona

---

## 📝 Checklist Completo

- [ ] Paso 1: Crear proyecto Supabase manual
  - [ ] Desconectar de Vercel (si aplica)
  - [ ] Crear proyecto en supabase.com
  - [ ] Copiar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
  - [ ] Ejecutar schema.sql
  - [ ] Verificar tablas creadas

- [ ] Paso 2: Crear proyecto en Railway
  - [ ] Crear cuenta en railway.app
  - [ ] Deploy from GitHub: adriangallery/enginedb
  - [ ] (Ignorar el error inicial)

- [ ] Paso 3: Configurar variables
  - [ ] RPC_URL_BASE
  - [ ] SUPABASE_URL
  - [ ] SUPABASE_SERVICE_ROLE_KEY
  - [ ] START_BLOCK (opcional)
  - [ ] SYNC_INTERVAL (opcional)

- [ ] Paso 4: Redeploy en Railway
  - [ ] Deployments → Redeploy

- [ ] Paso 5: Verificar
  - [ ] Logs muestran sincronizaciones
  - [ ] sync_state.last_synced_block > 0
  - [ ] Bot corriendo 24/7

- [ ] ✅ Todo funcionando!

---

## 🎉 Completado

Una vez que veas logs de sincronización en Railway y datos en Supabase:

✅ Tu bot está indexando eventos **cada 5 minutos** automáticamente  
✅ Corriendo 24/7 en Railway  
✅ Guardando datos en Supabase  
✅ Listo para consultar y usar

---

**¿Problemas?** Revisa los logs en Railway y los datos en Supabase.  
**¿Todo funciona?** ¡Felicidades! 🎊 Tu bot está operativo.

