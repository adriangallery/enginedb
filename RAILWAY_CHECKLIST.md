# ✅ Checklist Railway Deployment

Sigue estos pasos para deployar en Railway.

---

## 🎯 PASOS REQUERIDOS

- [ ] **Paso 1**: Preparar Supabase
  - Opción A: Desconectar de Vercel ([guía](./DESCONECTAR_SUPABASE.md))
  - Opción B: Crear cuenta nueva en Supabase
  - Crear proyecto nuevo en Supabase
  - Ejecutar `supabase/schema.sql` completo
  - Copiar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY

- [ ] **Paso 2**: Crear cuenta en Railway
  - Ir a https://railway.app/
  - Sign up con GitHub
  - ✅ Recibes $5/mes gratis

- [ ] **Paso 3**: Deploy desde GitHub
  - Railway → New Project
  - Deploy from GitHub repo
  - Seleccionar: adriangallery/enginedb
  - Deploy (fallará, es normal)

- [ ] **Paso 4**: Configurar Variables
  - Click en tu servicio → Variables
  - Agregar RPC_URL_BASE
  - Agregar SUPABASE_URL
  - Agregar SUPABASE_SERVICE_ROLE_KEY
  - (Opcional) Agregar START_BLOCK
  - (Opcional) Agregar SYNC_INTERVAL_MINUTES

- [ ] **Paso 5**: Verificar Start Command
  - Settings → Start Command = `npm start`

- [ ] **Paso 6**: Redeploy
  - Deployments → Redeploy
  - Ver logs en tiempo real
  - Ver mensaje: "🚀 FloorEngine Continuous Listener Bot"

- [ ] **Paso 7**: Verificar en Supabase
  - Table Editor → sync_state
  - Verificar last_synced_block > 0
  - Ver eventos procesados (si los hay)

---

## ⚙️ CONFIGURACIÓN OPCIONAL

- [ ] Ajustar frecuencia de sync
  - Variables → SYNC_INTERVAL_MINUTES
  - Valores recomendados: 1, 3, 5, 10

- [ ] Configurar alertas
  - Railway → Settings → Notifications

- [ ] Monitorear métricas
  - Metrics → Ver CPU, Memory, Network

---

## ✅ COMPLETADO

Una vez marcados todos los pasos:

✅ Tu bot está corriendo 24/7  
✅ Sincronizando cada X minutos  
✅ Guardando datos en Supabase  
✅ Monitoreado con logs en tiempo real

---

**Ver guía completa**: [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)

**Tiempo estimado**: 10-15 minutos

