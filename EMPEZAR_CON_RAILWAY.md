# 🚀 Empezar con Railway - Resumen Ejecutivo

## ✅ TODO LISTO PARA RAILWAY

El código ya está completamente adaptado y pusheado a GitHub.

---

## 🎯 TU PLAN DE ACCIÓN (10-15 minutos)

### 1️⃣ Resolver Supabase (5 min)

**Problema**: Supabase está conectado a Vercel

**Solución A** - Desconectar (Recomendado):
1. Vercel → Integrations → Supabase → Disconnect
2. Ir a supabase.com → Podrás crear proyectos
3. ✅ Listo

**Solución B** - Cuenta nueva:
1. Ir a supabase.com
2. Sign up con email diferente (ej: `tumail+railway@gmail.com`)
3. ✅ Listo

📖 **Guía**: [DESCONECTAR_SUPABASE.md](./DESCONECTAR_SUPABASE.md)

---

### 2️⃣ Crear Proyecto Supabase (3 min)

1. supabase.com → New Project
2. Nombre: `floorengine-db`
3. Password: Genera uno seguro
4. Region: El más cercano
5. Create → Espera 1-2 min

---

### 3️⃣ Ejecutar Schema SQL (2 min)

1. Tu proyecto → SQL Editor → New query
2. Copia: https://github.com/adriangallery/enginedb/blob/main/supabase/schema.sql
3. Pega todo y Run
4. ✅ "Success. No rows returned"

---

### 4️⃣ Copiar Credenciales (1 min)

1. Settings → API
2. Copia y guarda:
   - **Project URL** (SUPABASE_URL)
   - **service_role key** (SUPABASE_SERVICE_ROLE_KEY)

---

### 5️⃣ Deploy en Railway (5 min)

1. Ir a: https://railway.app/
2. Sign up con GitHub
3. New Project → Deploy from GitHub repo
4. Seleccionar: `adriangallery/enginedb`
5. Deploy (fallará, es normal)

---

### 6️⃣ Configurar Variables (3 min)

En Railway → Tu servicio → Variables, agregar:

```bash
# Requeridas
RPC_URL_BASE=https://mainnet.base.org
SUPABASE_URL=tu-url-del-paso-4
SUPABASE_SERVICE_ROLE_KEY=tu-key-del-paso-4

# Opcionales
START_BLOCK=10000000
SYNC_INTERVAL_MINUTES=5
```

---

### 7️⃣ Redeploy (1 min)

1. Deployments → Redeploy
2. Ver logs → Deberías ver:
   ```
   🚀 FloorEngine Continuous Listener Bot
   🔄 Intervalo: 5 minutos
   📊 Iteración #1
   ✅ Sincronización completada
   ```

---

## 🎉 ¡LISTO!

Tu bot está:
- ✅ Corriendo 24/7 en Railway
- ✅ Sincronizando cada 5 minutos
- ✅ Guardando datos en Supabase

---

## 📚 Guías Disponibles

**Empezar**:
- 📖 [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) - Guía paso a paso completa
- ☑️ [RAILWAY_CHECKLIST.md](./RAILWAY_CHECKLIST.md) - Checklist para marcar

**Comparaciones**:
- ⚖️ [RAILWAY_VS_VERCEL.md](./RAILWAY_VS_VERCEL.md) - ¿Por qué Railway?

**Supabase**:
- 🔓 [DESCONECTAR_SUPABASE.md](./DESCONECTAR_SUPABASE.md) - Desconectar de Vercel

**Alternativa Vercel** (si cambias de opinión):
- ☁️ [CONFIGURACION_VARIABLES.md](./CONFIGURACION_VARIABLES.md) - Setup Vercel
- 🆓 [VERCEL_FREE_PLAN.md](./VERCEL_FREE_PLAN.md) - Plan gratis

---

## 💰 Costos

Railway Plan Hobby:
- **Gratis**: $5/mes de crédito
- **Uso estimado**: $5-7/mes
- **Optimización**: Ajusta `SYNC_INTERVAL_MINUTES` a 10-15 para estar en $5/mes

---

## 🆘 ¿Problemas?

1. **Logs en Railway**: Deployments → Ver logs en tiempo real
2. **Datos en Supabase**: Table Editor → Verificar tablas
3. **Guía completa**: Abre RAILWAY_DEPLOYMENT.md

---

**¿Listo para empezar?** 👉 [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md)

