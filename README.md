# 🤖 FloorEngine Listener Bot

Bot listener en TypeScript que indexa eventos del contrato **FloorEngine** (marketplace de AdrianPunks con tax) en Base mainnet hacia Supabase.

---

## ⚡ EMPEZAR AHORA

**El repositorio ya está creado y el código está listo.**

### 👉 [CONFIGURACIÓN DE VARIABLES - SIGUE ESTOS PASOS](./CONFIGURACION_VARIABLES.md) 👈

Toda la configuración necesaria está en ese archivo. Te tomará 10-15 minutos.

---

## 📋 Características

- ✅ Sincronización automática de eventos on-chain cada 5 minutos
- ✅ Indexación de todos los eventos del marketplace (Listed, Cancelled, Bought, FloorSweep)
- ✅ Rastreo de cambios de configuración del contrato
- ✅ Estado en tiempo real de listings activos
- ✅ Histórico completo de trades y sweeps
- ✅ Deployment automático en Vercel con cron jobs
- ✅ Integración con Supabase para almacenamiento

## 🏗️ Arquitectura

```
┌─────────────┐      ┌──────────────┐      ┌──────────────┐
│   Vercel    │──────▶│  Listener    │──────▶│  Supabase   │
│  Cron Job   │      │   (viem)     │      │  PostgreSQL  │
│  (5 min)    │      │              │      │              │
└─────────────┘      └──────────────┘      └──────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │ Base Mainnet │
                    │ FloorEngine  │
                    │   Contract   │
                    └──────────────┘
```

## 📊 Eventos Monitoreados

### Marketplace
- **Listed**: Cuando un punk es listado para venta
- **Cancelled**: Cuando una listing es cancelada
- **Bought**: Cuando un usuario compra un punk
- **FloorSweep**: Cuando el engine ejecuta un floor sweep automático

### Configuración
- **PremiumUpdated**: Cambios en el premium/tax del marketplace
- **MaxBuyPriceUpdated**: Cambios en el precio máximo de compra del engine
- **CallerRewardModeUpdated**: Cambios en modo de recompensa (% vs fijo)
- **CallerRewardBpsUpdated**: Cambios en porcentaje de recompensa
- **CallerRewardFixedUpdated**: Cambios en recompensa fija
- **OwnershipTransferred**: Cambios de ownership del contrato

## 🗄️ Schema de Base de Datos

### Tablas principales

1. **sync_state**: Rastrea el último bloque sincronizado
2. **punk_listings**: Estado actual de cada listing (vista en tiempo real)
3. **listing_events**: Histórico de Listed/Cancelled
4. **trade_events**: Histórico de compras (Bought)
5. **sweep_events**: Histórico de floor sweeps
6. **engine_config_events**: Histórico de cambios de configuración

Ver schema completo en [`supabase/schema.sql`](./supabase/schema.sql)

## 🚀 Setup y Deployment

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/floor-engine-listener.git
cd floor-engine-listener
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo de ejemplo y configura tus valores:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:

```env
RPC_URL_BASE=https://mainnet.base.org
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
START_BLOCK=  # Opcional: bloque inicial
CRON_SECRET=  # Opcional: secreto para proteger el endpoint
```

### 4. Crear las tablas en Supabase

Ve a tu proyecto en Supabase → SQL Editor y ejecuta el contenido de:

```
supabase/schema.sql
```

Esto creará todas las tablas necesarias con índices y triggers.

### 5. Probar localmente (opcional)

```bash
npm run dev
```

Esto ejecutará una sincronización única para verificar que todo funciona.

### 6. Deploy a Vercel

#### Opción A: Deploy desde GitHub

1. Sube tu código a GitHub
2. Ve a [vercel.com](https://vercel.com) y crea una cuenta
3. Haz clic en "New Project"
4. Importa tu repositorio de GitHub
5. Vercel detectará automáticamente la configuración

#### Opción B: Deploy desde CLI

```bash
npm install -g vercel
vercel
```

### 7. Configurar variables de entorno en Vercel

En el dashboard de Vercel:

1. Ve a tu proyecto → Settings → Environment Variables
2. Agrega todas las variables de `.env`:
   - `RPC_URL_BASE`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CONTRACT_ADDRESS` (opcional, ya está hardcoded)
   - `START_BLOCK` (opcional)
   - `CRON_SECRET` (opcional)

### 8. Conectar Supabase con Vercel

Vercel puede crear y gestionar automáticamente tu base de datos Supabase:

1. En tu proyecto de Vercel → Storage → Create Database
2. Selecciona "Postgres (Supabase)"
3. Vercel creará el proyecto y configurará las variables de entorno automáticamente
4. Ejecuta el schema SQL en el proyecto creado

### 9. Verificar el Cron Job

El cron job se ejecutará automáticamente cada 5 minutos según la configuración en `vercel.json`.

Para verificar:

1. Ve a tu proyecto en Vercel → Deployments
2. Espera 5 minutos y verifica los logs
3. También puedes llamar manualmente a: `https://tu-proyecto.vercel.app/api/sync`

## 🔧 Desarrollo Local

### Scripts disponibles

```bash
# Ejecutar una sincronización única
npm run dev

# Compilar TypeScript
npm run build

# Ejecutar versión compilada
npm start

# Verificar tipos sin compilar
npm run type-check
```

### Testing manual del endpoint

```bash
# Ejecutar sincronización
curl http://localhost:3000/api/sync

# Con autenticación (si configuraste CRON_SECRET)
curl -H "Authorization: Bearer tu-secreto" http://localhost:3000/api/sync
```

## 📈 Monitoreo

### Ver logs en Vercel

1. Dashboard → Tu proyecto → Deployments
2. Click en la última ejecución
3. Ver logs en tiempo real

### Verificar datos en Supabase

```sql
-- Ver último bloque sincronizado
SELECT * FROM sync_state;

-- Ver listings activos
SELECT * FROM punk_listings WHERE is_listed = true;

-- Ver últimos trades
SELECT * FROM trade_events ORDER BY created_at DESC LIMIT 10;

-- Ver últimos sweeps
SELECT * FROM sweep_events ORDER BY created_at DESC LIMIT 10;
```

## 🔐 Seguridad

### Proteger el endpoint de sync

Por defecto, el endpoint `/api/sync` está público. Para protegerlo:

1. Genera un secreto aleatorio:
   ```bash
   openssl rand -base64 32
   ```

2. Agrégalo como variable de entorno `CRON_SECRET` en Vercel

3. Configura Vercel Cron para incluir el header:
   - En Vercel → Settings → Crons → Edit
   - Agrega header: `Authorization: Bearer tu-secreto`

El código en `api/sync.ts` ya valida este header automáticamente.

## 🛠️ Troubleshooting

### El cron no se ejecuta

- Verifica que `vercel.json` existe y tiene la configuración correcta
- Los cron jobs solo funcionan en producción (no en preview deployments)
- Puede tardar hasta 5 minutos en aparecer la primera ejecución

### Errores de conexión a RPC

- Verifica que `RPC_URL_BASE` sea válida
- Considera usar un RPC privado (Alchemy, Infura) para mejor rate limiting
- El RPC público puede ser lento o poco confiable

### Errores de Supabase

- Verifica que las tablas estén creadas correctamente
- Verifica que el `SUPABASE_SERVICE_ROLE_KEY` sea el correcto (no el anon key)
- Revisa los logs en Supabase Dashboard → Logs

### Duplicados en la base de datos

- El schema incluye constraints `UNIQUE(tx_hash, log_index)` para prevenir duplicados
- Si ves errores de "duplicate key", es normal y se ignoran automáticamente

## 📝 Información del Contrato

- **Contrato**: FloorEngine
- **Dirección**: `0x0351F7cBA83277E891D4a85Da498A7eACD764D58`
- **Red**: Base Mainnet (Chain ID: 8453)
- **Explorer**: [BaseScan](https://basescan.org/address/0x0351F7cBA83277E891D4a85Da498A7eACD764D58)

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para más detalles.

## 🔗 Links Útiles

- [Documentación de viem](https://viem.sh/)
- [Documentación de Supabase](https://supabase.com/docs)
- [Documentación de Vercel](https://vercel.com/docs)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Base Network](https://base.org/)

---

Hecho con ❤️ para AdrianPunks

