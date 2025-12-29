# 🔧 Configurar Variables de Entorno en Railway

## 📍 Dónde Encontrar las Variables en Railway

### Paso 1: Acceder a tu Proyecto
1. Ve a: https://railway.app/
2. Inicia sesión
3. Selecciona tu proyecto `enginedb` (o el nombre que le hayas dado)

### Paso 2: Abrir Variables de Entorno
1. En el dashboard de tu proyecto, busca la pestaña **"Variables"** en el menú lateral izquierdo
2. O haz clic en tu servicio (el que está corriendo) → **"Variables"** tab
3. También puedes hacer clic en el servicio → **"Settings"** → Scroll hasta **"Environment Variables"**

### Paso 3: Agregar Variables
Haz clic en **"+ New Variable"** y agrega cada una:

---

## 🔑 Variables Requeridas

### 1. `SUPABASE_URL`
**Dónde obtenerla:**
1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Copia el **"Project URL"** (algo como `https://xxxxx.supabase.co`)

**En Railway:**
- **Key**: `SUPABASE_URL`
- **Value**: `https://xxxxx.supabase.co` (tu URL completa)

---

### 2. `SUPABASE_SERVICE_ROLE_KEY`
**Dónde obtenerla:**
1. En el mismo lugar (Settings → API)
2. Busca la sección **"Project API keys"**
3. Copia el valor de **"service_role"** (es un token largo que empieza con `eyJ...`)

⚠️ **IMPORTANTE**: Usa la key de **"service_role"**, NO la de "anon" o "public"

**En Railway:**
- **Key**: `SUPABASE_SERVICE_ROLE_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (tu key completa)

---

### 3. `RPC_URL_BASE` (o usar modo fallback)
**Opción A: RPC Público (Gratis)**
- **Key**: `RPC_URL_BASE`
- **Value**: `https://mainnet.base.org`

**Opción B: Modo Fallback (Recomendado si Alchemy se agotó)**
- **Key**: `USE_FALLBACK_RPC`
- **Value**: `true`
- **Key**: `FALLBACK_START_BLOCK`
- **Value**: `38293582`

---

## ⚙️ Variables Opcionales (pero recomendadas)

### `USE_FALLBACK_RPC`
- **Value**: `true` (para usar RPC público cuando Alchemy se agota)

### `FALLBACK_START_BLOCK`
- **Value**: `38293582` (bloque de inicio para modo fallback)

### `PARALLEL_REQUESTS`
- **Value**: `2` (para modo fallback, más conservador)

### `PAUSE_BACKWARDS`
- **Value**: `pause` (por defecto, pausa la sincronización histórica hacia atrás)
- **Valores posibles**:
  - `pause` o `true`: Pausa la sincronización histórica (backwards)
  - `resume` o `false`: Activa la sincronización histórica
- **Nota**: Por defecto está en `pause` para reducir consumo de Alchemy. Cambia a `resume` cuando quieras procesar el histórico.

---

## ✅ Verificar que Funcionan

Después de agregar las variables:

1. **Reinicia el servicio en Railway:**
   - Ve a tu servicio → **"Settings"** → **"Redeploy"**
   - O simplemente espera a que Railway detecte los cambios y redeploye automáticamente

2. **Revisa los logs:**
   - Ve a **"Deployments"** → Selecciona el último deployment → **"View Logs"**
   - Busca mensajes como:
     - ✅ `🌐 Sincronización Unificada Multi-Contrato`
     - ✅ `💾 Progreso guardado`
     - ❌ Si ves `Faltan variables de entorno requeridas`, falta alguna variable

3. **Verifica en Supabase:**
   - Ve a Supabase → **Table Editor** → Tabla `sync_state`
   - Deberías ver registros con `last_synced_block` actualizándose

---

## 🐛 Solución de Problemas

### Error: "Faltan variables de entorno requeridas"
- **Causa**: Falta `SUPABASE_URL` o `SUPABASE_SERVICE_ROLE_KEY`
- **Solución**: Agrega las variables en Railway → Variables

### Error: "Error al guardar progreso"
- **Causa**: Credenciales incorrectas o proyecto Supabase incorrecto
- **Solución**: Verifica que `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` sean correctas

### No se guarda nada en la base de datos
- **Causa 1**: Variables no configuradas correctamente
- **Solución**: Verifica las variables en Railway
- **Causa 2**: Schema SQL no ejecutado
- **Solución**: Ejecuta `supabase/schema.sql` en Supabase SQL Editor

---

## 📸 Capturas de Pantalla (Referencia)

### Dónde encontrar Variables en Railway:
1. Dashboard → Tu Proyecto → **Variables** tab
2. O: Servicio → **Settings** → **Environment Variables**

### Dónde encontrar credenciales en Supabase:
1. Dashboard → Tu Proyecto → **Settings** → **API**
2. Copia **Project URL** y **service_role key**

---

## 🆘 ¿Necesitas Ayuda?

Si después de seguir estos pasos aún no funciona:
1. Revisa los logs en Railway para ver el error exacto
2. Verifica que el schema SQL esté ejecutado en Supabase
3. Asegúrate de usar la key de **service_role**, no la de anon

