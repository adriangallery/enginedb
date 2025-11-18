# ✅ Checklist de Deployment

Marca cada paso a medida que lo completas:

---

## 🎯 PASOS REQUERIDOS

- [ ] **Paso 1**: Obtener RPC URL de Base
  - Opción rápida: `https://mainnet.base.org`
  - Opción recomendada: Crear cuenta en Alchemy y obtener URL

- [ ] **Paso 2**: Crear proyecto en Vercel
  - Ir a vercel.com
  - Import: `adriangallery/enginedb`
  - Deploy (sin variables por ahora)

- [ ] **Paso 3**: Crear base de datos Supabase desde Vercel
  - Vercel → Storage → Create Database → Postgres (Supabase)
  - Esperar a que se cree (1-2 minutos)

- [ ] **Paso 4**: Ejecutar schema SQL en Supabase
  - Supabase → SQL Editor → New query
  - Copiar contenido de `supabase/schema.sql`
  - Run
  - Verificar que se crearon las 6 tablas

- [ ] **Paso 5**: Agregar variable RPC_URL_BASE en Vercel
  - Vercel → Settings → Environment Variables
  - Agregar: `RPC_URL_BASE` = tu URL del Paso 1
  - Marcar las 3 opciones (Production, Preview, Development)

- [ ] **Paso 6**: Redeploy en Vercel
  - Vercel → Deployments → Último deployment → Redeploy
  - Sin cache

- [ ] **Paso 7**: Primera sincronización manual (NO ESPERES!)
  - Abrir: `https://TU-URL.vercel.app/api/sync` en el navegador
  - O ejecutar: `curl https://TU-URL.vercel.app/api/sync`
  - Verificar respuesta: `"success": true`
  - Supabase → sync_state → Ver que last_synced_block > 0

- [ ] **Paso 8**: Verificar funcionamiento continuo
  - Vercel → Cron Jobs (ver configuración cada 6 horas)
  - Vercel → Logs (ver logs de sincronización)
  - Todo funcionando ✅

---

## ⚙️ PASOS OPCIONALES

- [ ] **Opcional 1**: Agregar START_BLOCK en Vercel
  - Para empezar desde un bloque específico
  - Settings → Environment Variables → `START_BLOCK`

- [ ] **Opcional 2**: Agregar CRON_SECRET en Vercel
  - Para proteger el endpoint
  - Generar: `openssl rand -base64 32`
  - Settings → Environment Variables → `CRON_SECRET`

---

## 🎉 COMPLETADO

Una vez marcados todos los pasos requeridos (1-7), tu bot está:

✅ Indexando eventos automáticamente cada 5 minutos  
✅ Guardando datos en Supabase  
✅ Listo para usar

---

**Ver detalles completos**: [CONFIGURACION_VARIABLES.md](./CONFIGURACION_VARIABLES.md)

