# 🚀 Guía de Deployment

Esta guía te llevará paso a paso para deployar el FloorEngine Listener Bot en Vercel con Supabase.

## Prerequisitos

- Cuenta en [GitHub](https://github.com)
- Cuenta en [Vercel](https://vercel.com)
- RPC URL de Base mainnet (puedes usar el público o uno de [Alchemy](https://www.alchemy.com/))

## Paso 1: Preparar el repositorio

### 1.1 Crear repositorio en GitHub

```bash
# Inicializar git (si no está inicializado)
git init

# Agregar archivos
git add .
git commit -m "Initial commit: FloorEngine Listener Bot"

# Crear repo en GitHub y pushear
git remote add origin https://github.com/tu-usuario/floor-engine-listener.git
git branch -M main
git push -u origin main
```

## Paso 2: Deploy en Vercel

### 2.1 Importar proyecto

1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. Click en **"New Project"**
3. Importa tu repositorio de GitHub
4. Vercel detectará automáticamente que es un proyecto TypeScript/Node

### 2.2 Configurar el proyecto

Vercel debería detectar automáticamente:
- **Framework Preset**: Other
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

Click en **"Deploy"** (aún sin variables de entorno, lo haremos después)

## Paso 3: Configurar Supabase

### Opción A: Crear desde Vercel (Recomendado)

1. En tu proyecto de Vercel → **Storage** → **Create Database**
2. Selecciona **"Postgres (Supabase)"**
3. Elige un nombre para tu base de datos
4. Click en **"Create"**

Vercel automáticamente:
- Crea el proyecto en Supabase
- Configura las variables `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`
- Las vincula a tu proyecto

### Opción B: Usar Supabase existente

1. Ve a [supabase.com](https://supabase.com) y crea un proyecto
2. Ve a **Settings** → **API**
3. Copia:
   - `URL` (SUPABASE_URL)
   - `service_role key` (SUPABASE_SERVICE_ROLE_KEY)

## Paso 4: Ejecutar Schema SQL

1. Ve a tu proyecto en Supabase
2. Abre **SQL Editor**
3. Crea una nueva query
4. Copia y pega el contenido completo de `supabase/schema.sql`
5. Click en **"Run"**

Verifica que se crearon las tablas:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

Deberías ver:
- sync_state
- punk_listings
- listing_events
- trade_events
- sweep_events
- engine_config_events

## Paso 5: Configurar Variables de Entorno

En Vercel → Tu proyecto → **Settings** → **Environment Variables**

Agrega las siguientes variables:

### Variables Requeridas

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `RPC_URL_BASE` | `https://mainnet.base.org` | RPC de Base mainnet (o Alchemy) |
| `SUPABASE_URL` | Auto-configurado | URL de tu proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-configurado | Service role key de Supabase |

### Variables Opcionales

| Variable | Ejemplo | Descripción |
|----------|---------|-------------|
| `START_BLOCK` | `10000000` | Bloque inicial para sync histórico |
| `CRON_SECRET` | `abc123...` | Secreto para proteger endpoint |
| `CONTRACT_ADDRESS` | Ya configurado | Dirección del FloorEngine |

**Importante**: Marca todas las variables para **Production**, **Preview** y **Development**

## Paso 6: Re-deploy con variables

1. En Vercel → **Deployments** → Click en los tres puntos del último deployment
2. Click en **"Redeploy"**
3. Marca **"Use existing Build Cache"**
4. Click en **"Redeploy"**

Esto aplicará las nuevas variables de entorno.

## Paso 7: Verificar el Cron Job

El cron job se ejecuta cada 5 minutos según `vercel.json`.

### 7.1 Ver ejecuciones

1. Ve a **Cron Jobs** en el sidebar de tu proyecto
2. Deberías ver: `*/5 * * * *` → `/api/sync`
3. Espera 5 minutos y verifica las ejecuciones

### 7.2 Trigger manual

Puedes ejecutar manualmente:

```bash
curl https://tu-proyecto.vercel.app/api/sync
```

Deberías recibir una respuesta JSON como:

```json
{
  "success": true,
  "timestamp": "2025-11-18T10:30:00.000Z",
  "duration": "2500ms",
  "processed": 5,
  "fromBlock": "10000000",
  "toBlock": "10002000",
  "message": "Procesados 5 eventos desde bloque 10000000 hasta 10002000"
}
```

## Paso 8: Verificar datos en Supabase

Ve a Supabase → **Table Editor** y verifica:

### 8.1 Sync State

```sql
SELECT * FROM sync_state;
```

Deberías ver el último bloque sincronizado > 0

### 8.2 Eventos procesados

```sql
-- Ver eventos recientes
SELECT event_type, COUNT(*) as count 
FROM listing_events 
GROUP BY event_type;

-- Ver trades
SELECT * FROM trade_events 
ORDER BY created_at DESC 
LIMIT 5;

-- Ver sweeps
SELECT * FROM sweep_events 
ORDER BY created_at DESC 
LIMIT 5;
```

## Paso 9: Monitoreo continuo

### Ver logs en tiempo real

1. Vercel → Tu proyecto → **Logs**
2. Filtra por función: `/api/sync`
3. Observa las ejecuciones cada 5 minutos

### Configurar alertas (Opcional)

1. Vercel → **Integrations** → **Monitoring**
2. Configura alertas para:
   - Errores en funciones
   - Timeouts
   - Rate limits

## 🔧 Troubleshooting

### El cron no se ejecuta

**Problema**: No ves ejecuciones en Vercel Cron Jobs

**Solución**:
- Los cron jobs SOLO funcionan en production (no en preview)
- Verifica que estés en `main` branch
- Puede tardar hasta 5 minutos en la primera ejecución

### Error: "Missing environment variables"

**Problema**: Logs muestran variables faltantes

**Solución**:
1. Verifica que las variables estén en Settings → Environment Variables
2. Marca que se apliquen a Production
3. Re-deploy el proyecto

### Error: "Failed to connect to database"

**Problema**: No puede conectar a Supabase

**Solución**:
- Verifica `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`
- Asegúrate de usar el **service_role** key (no el anon key)
- Verifica que el proyecto de Supabase esté activo

### Error: "RPC request failed"

**Problema**: No puede conectar al RPC de Base

**Solución**:
- Verifica que `RPC_URL_BASE` sea válida
- El RPC público puede tener rate limits
- Considera usar Alchemy o Infura:
  ```
  https://base-mainnet.g.alchemy.com/v2/TU-API-KEY
  ```

### Slow performance

**Problema**: La función tarda mucho o timeout

**Solución**:
- Reduce `BLOCKS_PER_BATCH` en `src/listener.ts` (de 2000 a 500)
- Usa un RPC más rápido (Alchemy, Infura)
- Verifica el plan de Vercel (hobby tiene límites)

## 🔐 Seguridad adicional

### Proteger el endpoint con secreto

1. Genera un secreto:
   ```bash
   openssl rand -base64 32
   ```

2. Agrégalo como `CRON_SECRET` en Vercel

3. El código ya valida automáticamente este header

### Rate limiting (Opcional)

Considera agregar rate limiting si expones el endpoint públicamente:

```typescript
// En api/sync.ts
import rateLimit from '@/lib/rate-limit'

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minuto
  uniqueTokenPerInterval: 500,
})

// Antes de syncEvents()
await limiter.check(res, 10, 'SYNC_ENDPOINT')
```

## 📊 Próximos pasos

Una vez que el bot esté corriendo:

1. **Dashboard**: Crea un dashboard en Supabase o con herramientas como Metabase
2. **API Pública**: Expón endpoints para consultar listings activos
3. **Notificaciones**: Agrega webhooks para notificar de sweeps o trades grandes
4. **Analytics**: Calcula métricas como volumen de trading, floor price promedio, etc.

## 🆘 Soporte

Si tienes problemas:

1. Revisa los logs en Vercel
2. Revisa los logs en Supabase → Logs
3. Verifica que el schema SQL se ejecutó correctamente
4. Abre un issue en GitHub con los logs relevantes

---

¡Felicidades! 🎉 Tu listener bot ahora está indexando eventos automáticamente cada 5 minutos.

