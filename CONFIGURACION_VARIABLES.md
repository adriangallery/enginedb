# 🔐 CONFIGURACIÓN DE VARIABLES DE ENTORNO

## ✅ REPOSITORIO CREADO
**URL**: https://github.com/adriangallery/enginedb

El código ya está en GitHub y listo para deployar. Solo faltan las variables de entorno.

---

## 📋 RESUMEN RÁPIDO

| Variable | Dónde Configurar | Cuándo | Valor |
|----------|------------------|--------|-------|
| `RPC_URL_BASE` | Vercel | Después de crear proyecto | Obtener de paso 1 |
| `SUPABASE_URL` | Auto-configurado | Automático | Vercel lo configura |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-configurado | Automático | Vercel lo configura |
| `START_BLOCK` | Vercel (opcional) | Después de crear proyecto | Ver paso 2 |
| `CRON_SECRET` | Vercel (opcional) | Después de crear proyecto | Ver paso 3 |

---

## 🚀 PROCESO COMPLETO PASO A PASO

### PASO 1: Obtener RPC URL de Base Mainnet

Tienes 2 opciones:

#### Opción A: RPC Público (Gratis, puede ser lento)
```
https://mainnet.base.org
```
✅ **Úsalo para empezar rápido**

#### Opción B: Alchemy (Recomendado, más rápido y confiable)

1. Ve a: https://www.alchemy.com/
2. Sign up / Log in (gratis)
3. Click en **"Create new app"**
4. Configura:
   - **Name**: FloorEngine Listener
   - **Chain**: Base
   - **Network**: Base Mainnet
5. Click en **"Create app"**
6. Click en tu app → **"API Key"** → **"HTTPS"**
7. Copia la URL completa, será algo como:
   ```
   https://base-mainnet.g.alchemy.com/v2/TU_API_KEY_AQUI
   ```

**🔖 GUARDA ESTA URL** - La necesitarás en el Paso 5

---

### PASO 2: Deploy en Vercel

1. Ve a: https://vercel.com/

2. Inicia sesión con GitHub (si no tienes cuenta, créala - es gratis)

3. Click en **"Add New..."** → **"Project"**

4. Busca el repositorio: **adriangallery/enginedb**

5. Click en **"Import"**

6. Deja todo por defecto (Vercel detecta automáticamente la configuración)

7. **NO AGREGUES VARIABLES AÚN** - Click en **"Deploy"**

8. Espera a que termine el deployment (1-2 minutos)

---

### PASO 3: Crear Base de Datos Supabase desde Vercel

1. En tu proyecto de Vercel → Click en **"Storage"** (en el menú superior)

2. Click en **"Create Database"**

3. Selecciona **"Postgres"**

4. Vercel te preguntará qué provider usar → Selecciona **"Supabase"**

5. Configura:
   - **Database Name**: `floorengine-db` (o el nombre que prefieras)
   - **Region**: Elige el más cercano (ej: `us-east-1`)

6. Click en **"Create"**

7. **✅ HECHO**: Vercel automáticamente:
   - Crea el proyecto en Supabase
   - Configura `SUPABASE_URL` en tu proyecto
   - Configura `SUPABASE_SERVICE_ROLE_KEY` en tu proyecto

---

### PASO 4: Ejecutar Schema SQL en Supabase

1. Vercel te dará un link al proyecto de Supabase, O ve directamente a: https://supabase.com/dashboard/projects

2. Click en tu proyecto (floorengine-db)

3. En el menú lateral → Click en **"SQL Editor"**

4. Click en **"New query"**

5. Abre el archivo del repo: **`supabase/schema.sql`**
   - URL directa: https://github.com/adriangallery/enginedb/blob/main/supabase/schema.sql

6. **Copia TODO el contenido** del archivo schema.sql

7. **Pégalo** en el SQL Editor de Supabase

8. Click en **"Run"** (o presiona Ctrl/Cmd + Enter)

9. Deberías ver: **"Success. No rows returned"**

10. Para verificar, ejecuta esta query:
    ```sql
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
    ```

11. Deberías ver estas 6 tablas:
    - `sync_state`
    - `punk_listings`
    - `listing_events`
    - `trade_events`
    - `sweep_events`
    - `engine_config_events`

**✅ Base de datos lista**

---

### PASO 5: Configurar Variables en Vercel

1. En Vercel → Tu proyecto → **"Settings"** → **"Environment Variables"**

2. Verás que ya están configuradas (auto-generadas por Vercel):
   - ✅ `SUPABASE_URL`
   - ✅ `SUPABASE_SERVICE_ROLE_KEY`

3. **Agrega la variable faltante**:

   **Variable 1 (REQUERIDA)**:
   - **Key**: `RPC_URL_BASE`
   - **Value**: La URL que guardaste en el Paso 1
     - Si usas público: `https://mainnet.base.org`
     - Si usas Alchemy: `https://base-mainnet.g.alchemy.com/v2/TU_API_KEY`
   - **Environment**: Marca las 3 opciones (Production, Preview, Development)
   - Click **"Save"**

4. **Variables opcionales** (puedes agregarlas ahora o después):

   **Variable 2 (OPCIONAL)** - Para empezar desde un bloque específico:
   - **Key**: `START_BLOCK`
   - **Value**: Número de bloque (ej: `10000000`)
   - **¿Qué hace?**: El bot empezará a sincronizar desde este bloque en adelante
   - **Si no lo configuras**: Empezará desde el bloque 0 (puede tardar)
   - **Recomendación**: Usa el bloque de deployment del contrato o un bloque reciente
   - **Environment**: Marca las 3 opciones
   - Click **"Save"**

   **Variable 3 (OPCIONAL)** - Para proteger el endpoint:
   - **Key**: `CRON_SECRET`
   - **Value**: Un string aleatorio (genera uno con el comando de abajo)
   - **¿Qué hace?**: Protege el endpoint /api/sync de accesos no autorizados
   - **Si no lo configuras**: El endpoint será público (solo Vercel cron lo llamará de todas formas)
   - **Environment**: Marca las 3 opciones
   - Click **"Save"**

   Para generar un secreto aleatorio (en tu terminal):
   ```bash
   openssl rand -base64 32
   ```

---

### PASO 6: Redeploy con las Nuevas Variables

1. En Vercel → Tu proyecto → **"Deployments"**

2. Click en el último deployment (el de arriba)

3. Click en los **3 puntos** (⋯) → **"Redeploy"**

4. **NO MARQUES** "Use existing Build Cache"

5. Click en **"Redeploy"**

6. Espera 1-2 minutos

**✅ Bot desplegado con todas las variables configuradas**

---

### PASO 7: Verificar que Funciona

#### 7.1 Verificar Cron Job

1. En Vercel → Tu proyecto → **"Cron Jobs"** (en el menú lateral)

2. Deberías ver:
   ```
   */5 * * * *  →  /api/sync
   ```

3. Espera 5 minutos y verás la primera ejecución

#### 7.2 Trigger Manual (Opcional)

Puedes ejecutar manualmente desde tu terminal:

```bash
curl https://TU-PROYECTO.vercel.app/api/sync
```

Reemplaza `TU-PROYECTO` con tu URL de Vercel (ej: `enginedb-asdf1234.vercel.app`)

Deberías recibir algo como:
```json
{
  "success": true,
  "processed": 5,
  "fromBlock": "10000000",
  "toBlock": "10002000",
  "message": "Procesados 5 eventos desde bloque 10000000 hasta 10002000"
}
```

#### 7.3 Ver Logs en Tiempo Real

1. En Vercel → Tu proyecto → **"Logs"** (menú lateral)

2. Deberías ver logs cada 5 minutos como:
   ```
   🔄 Iniciando sincronización de eventos...
   📊 Procesando bloques 10000000 a 10002000
   📝 Encontrados 5 eventos
   ✅ Procesado evento Listed en bloque 10000123
   🎉 Sincronización completada: 5 eventos procesados
   ```

#### 7.4 Verificar Datos en Supabase

1. Ve a Supabase → Tu proyecto → **"Table Editor"**

2. Click en la tabla **`sync_state`**
   - Deberías ver `last_synced_block` > 0

3. Click en la tabla **`listing_events`** o **`trade_events`**
   - Deberías ver eventos (si hay actividad en el contrato)

**✅ TODO FUNCIONANDO** 🎉

---

## 🔍 RESUMEN VISUAL

```
┌─────────────────────────────────────────────────┐
│  1. Alchemy/RPC Público                         │
│     └─ Obtener RPC_URL_BASE                     │
└────────────┬────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────┐
│  2. Vercel                                      │
│     ├─ Import repo: adriangallery/enginedb     │
│     └─ Deploy inicial (sin variables)          │
└────────────┬────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────┐
│  3. Vercel → Storage                            │
│     ├─ Create Database (Supabase)              │
│     └─ Auto-configura SUPABASE_URL + KEY       │
└────────────┬────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────┐
│  4. Supabase → SQL Editor                       │
│     └─ Ejecutar supabase/schema.sql            │
└────────────┬────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────┐
│  5. Vercel → Settings → Env Variables          │
│     ├─ Agregar RPC_URL_BASE (requerido)        │
│     ├─ Agregar START_BLOCK (opcional)          │
│     └─ Agregar CRON_SECRET (opcional)          │
└────────────┬────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────┐
│  6. Vercel → Redeploy                           │
│     └─ Aplicar nuevas variables                │
└────────────┬────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────┐
│  7. Verificar                                   │
│     ├─ Cron Jobs: Ejecuciones cada 5 min       │
│     ├─ Logs: Ver procesamiento en tiempo real  │
│     └─ Supabase: Verificar datos en tablas     │
└─────────────────────────────────────────────────┘
```

---

## ⚠️ IMPORTANTE

### ¿Qué NO necesitas hacer?

❌ **NO** necesitas configurar nada en GitHub (solo el repo ya está creado)  
❌ **NO** necesitas configurar variables en Supabase manualmente  
❌ **NO** necesitas crear tablas manualmente (solo ejecutar el SQL)  
❌ **NO** necesitas instalar nada localmente (todo corre en Vercel)

### ¿Qué SÍ necesitas hacer?

✅ Obtener RPC URL (Paso 1)  
✅ Deploy en Vercel (Paso 2)  
✅ Crear DB Supabase desde Vercel (Paso 3)  
✅ Ejecutar schema SQL (Paso 4)  
✅ Agregar RPC_URL_BASE en Vercel (Paso 5)  
✅ Redeploy (Paso 6)  
✅ Verificar que funciona (Paso 7)

---

## 🆘 PROBLEMAS COMUNES

### "El cron no se ejecuta"
- Los cron jobs solo funcionan en **production** (branch main)
- Espera 5 minutos completos después del deployment
- Verifica en: Vercel → Cron Jobs

### "Error: Missing environment variables"
- Ve a: Vercel → Settings → Environment Variables
- Verifica que `RPC_URL_BASE` esté configurada
- Verifica que esté marcada para "Production"
- Haz Redeploy

### "Error: Failed to connect to database"
- Verifica que ejecutaste el schema SQL en Supabase
- Ve a: Supabase → SQL Editor y ejecuta:
  ```sql
  SELECT * FROM sync_state;
  ```
  Si da error "relation does not exist", ejecuta de nuevo el schema.sql

### "Error: RPC request failed"
- Verifica que `RPC_URL_BASE` sea correcta
- Si usas Alchemy, verifica que la API key sea válida
- Prueba con el RPC público: `https://mainnet.base.org`

### "Processed: 0 events"
- Es normal si no hay eventos nuevos en el contrato
- El bot solo procesa eventos desde `START_BLOCK` en adelante
- Verifica que el contrato tenga actividad reciente

---

## 📞 SIGUIENTE PASO

Una vez completados los 7 pasos, tu bot estará:
- ✅ Indexando eventos cada 5 minutos automáticamente
- ✅ Guardando datos en Supabase
- ✅ Listo para consultar vía SQL o API

Puedes entonces:
1. Crear un dashboard para visualizar los datos
2. Exponer una API pública para consultar listings
3. Agregar webhooks para notificaciones

---

**¿Dudas?** Revisa los logs en Vercel y Supabase.  
**¿Todo funciona?** ¡Felicidades! 🎉 Tu listener está operando.

