# 🔗 Links Importantes

Guarda estos links para acceso rápido durante la configuración.

---

## 📦 REPOSITORIO
**GitHub**: https://github.com/adriangallery/enginedb

---

## 🛠️ HERRAMIENTAS NECESARIAS

### Vercel (Deployment)
- **Website**: https://vercel.com/
- **Dashboard**: https://vercel.com/dashboard
- **Acción**: Import repo `adriangallery/enginedb`

### Supabase (Base de Datos)
- **Website**: https://supabase.com/
- **Dashboard**: https://supabase.com/dashboard/projects
- **Acción**: Se crea automáticamente desde Vercel

### Alchemy (RPC Opcional pero Recomendado)
- **Website**: https://www.alchemy.com/
- **Dashboard**: https://dashboard.alchemy.com/
- **Acción**: Create App → Base → Base Mainnet

---

## 📄 ARCHIVOS DEL REPO

### Para Configuración
- **Guía completa**: [CONFIGURACION_VARIABLES.md](./CONFIGURACION_VARIABLES.md)
- **Checklist**: [CHECKLIST.md](./CHECKLIST.md)
- **Quick Start**: [QUICKSTART.md](./QUICKSTART.md)

### Schema de Base de Datos
- **SQL completo**: [supabase/schema.sql](./supabase/schema.sql)
- **Direct link**: https://github.com/adriangallery/enginedb/blob/main/supabase/schema.sql

### Documentación Técnica
- **README completo**: [README.md](./README.md)
- **Deployment guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 🔑 VARIABLES DE ENTORNO

Configurar en: **Vercel → Settings → Environment Variables**

| Variable | Dónde Obtenerla | Requerida |
|----------|-----------------|-----------|
| `RPC_URL_BASE` | Alchemy o usar `https://mainnet.base.org` | ✅ Sí |
| `SUPABASE_URL` | Auto-configurado por Vercel | ✅ Sí (auto) |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-configurado por Vercel | ✅ Sí (auto) |
| `START_BLOCK` | Bloque de inicio (ej: `10000000`) | ⚪ Opcional |
| `CRON_SECRET` | `openssl rand -base64 32` | ⚪ Opcional |

---

## 📊 INFORMACIÓN DEL CONTRATO

- **Nombre**: FloorEngine
- **Dirección**: `0x0351F7cBA83277E891D4a85Da498A7eACD764D58`
- **Red**: Base Mainnet
- **Chain ID**: 8453
- **Explorer**: https://basescan.org/address/0x0351F7cBA83277E891D4a85Da498A7eACD764D58

---

## 🆘 VERIFICACIÓN RÁPIDA

### Después del Deployment

**Ver Cron Jobs**:
```
Vercel → Tu proyecto → Cron Jobs
```

**Ver Logs en Tiempo Real**:
```
Vercel → Tu proyecto → Logs
```

**Verificar Datos en Supabase**:
```
Supabase → Tu proyecto → Table Editor → sync_state
```

**Test Manual**:
```bash
curl https://TU-PROYECTO.vercel.app/api/sync
```

---

## 💬 COMANDOS ÚTILES

### Generar secreto aleatorio
```bash
openssl rand -base64 32
```

### Ver tablas en Supabase (SQL Editor)
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Ver último bloque sincronizado (SQL Editor)
```sql
SELECT * FROM sync_state;
```

### Ver últimos eventos (SQL Editor)
```sql
SELECT * FROM listing_events 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 🎯 ORDEN RECOMENDADO

1. Lee: [CONFIGURACION_VARIABLES.md](./CONFIGURACION_VARIABLES.md)
2. Sigue: [CHECKLIST.md](./CHECKLIST.md)
3. Si tienes problemas: Revisa logs en Vercel y Supabase
4. Para desarrollo local: Lee [QUICKSTART.md](./QUICKSTART.md)

---

**Todo listo para empezar** ✨

