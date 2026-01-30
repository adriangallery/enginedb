# ⚡ Quick Start

Guía rápida para poner en marcha el FloorEngine Listener Bot en menos de 10 minutos.

## 🚀 Setup Local (Desarrollo)

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno
cp env.example.txt .env

# 3. Editar .env con tus credenciales
nano .env  # o usa tu editor favorito

# 4. Ejecutar el schema SQL en Supabase
# (copiar contenido de supabase/schema.sql al SQL Editor de Supabase)

# 5. Probar sincronización local
npm run dev
```

## ☁️ Deploy en Vercel (Producción)

```bash
# 1. Push a GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/tu-usuario/floor-engine-listener.git
git push -u origin main

# 2. Ir a vercel.com
# - New Project
# - Import tu repo
# - Deploy

# 3. Configurar Supabase en Vercel
# - Storage → Create Database → Postgres (Supabase)

# 4. Ejecutar schema SQL en Supabase
# - Ir a supabase.com
# - Tu proyecto → SQL Editor
# - Pegar contenido de supabase/schema.sql
# - Run

# 5. Configurar variables en Vercel
# - Settings → Environment Variables
# - Agregar RPC_URL_BASE
# - Redeploy

# 6. Verificar cron
# - Cron Jobs → Ver ejecuciones cada 5 min
```

## 📋 Comandos útiles

```bash
# Desarrollo
npm run dev              # Ejecutar sincronización única
npm run build            # Compilar TypeScript
npm run type-check       # Verificar tipos sin compilar

# Testing
curl http://localhost:3000/api/sync                    # Local
curl https://tu-proyecto.vercel.app/api/sync           # Production

# Git
git status
git add .
git commit -m "Update"
git push
```

## 🔍 Verificar que funciona

### 1. Check Vercel Logs
```
Vercel Dashboard → Tu proyecto → Logs → Filtrar por /api/sync
```

### 2. Check Supabase Data
```sql
-- Ver último bloque sincronizado
SELECT * FROM sync_state;

-- Ver últimos eventos procesados
SELECT * FROM listing_events ORDER BY created_at DESC LIMIT 10;
```

### 3. Check Cron Jobs
```
Vercel Dashboard → Cron Jobs
```

Deberías ver ejecuciones cada 5 minutos.

## 🔧 Variables de Entorno Mínimas

```env
# Requeridas
RPC_URL_BASE=https://mainnet.base.org
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Opcionales
START_BLOCK=10000000
CRON_SECRET=tu-secreto-aqui
```

## 📊 Schema SQL - One Liner

Para ejecutar rápido en Supabase:

1. Ve a SQL Editor en Supabase
2. New query
3. Pega contenido de `supabase/schema.sql`
4. Click "Run"
5. ✅ Listo

## 🎯 Checklist de Deployment

- [ ] Código pusheado a GitHub
- [ ] Proyecto creado en Vercel
- [ ] Base de datos Supabase creada
- [ ] Schema SQL ejecutado en Supabase
- [ ] Variables de entorno configuradas en Vercel
- [ ] Proyecto re-deployeado con variables
- [ ] Cron job visible en dashboard
- [ ] Primera ejecución exitosa (check logs)
- [ ] Datos aparecen en Supabase (check tablas)

## 🆘 Problemas Comunes

| Error | Solución Rápida |
|-------|----------------|
| "Missing environment variables" | Configura variables en Vercel Settings |
| "Failed to connect to database" | Usa SUPABASE_SERVICE_ROLE_KEY (no anon) |
| "Cron not running" | Solo funciona en production (branch main) |
| "RPC request failed" | Verifica RPC_URL_BASE, considera Alchemy |
| Timeout en función | Reduce BLOCKS_PER_BATCH en listener.ts |

## 📚 Documentación Completa

- [README.md](./README.md) - Documentación completa del proyecto
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guía detallada de deployment
- [supabase/schema.sql](./supabase/schema.sql) - Schema de base de datos

---

¿Tienes problemas? Revisa los logs en Vercel y Supabase. 
¿Todo funciona? ¡Genial! 🎉 Ahora tu bot está indexando eventos automáticamente.

