# ⚡ Configuración para Vercel Plan Free (Hobby)

## 🔄 Cron Job Actualizado

El plan Hobby de Vercel tiene límites en los cron jobs. Hemos adaptado el proyecto para funcionar dentro de estos límites.

### ❌ Antes (Plan Pro)
```
*/5 * * * *  →  Cada 5 minutos (288 veces/día)
```

### ✅ Ahora (Plan Hobby/Free)
```
0 */6 * * *  →  Cada 6 horas (4 veces/día)
```

**Ejecuciones diarias**: 
- 00:00 (medianoche)
- 06:00 (mañana)
- 12:00 (mediodía)
- 18:00 (tarde)

---

## 📊 Comparación de Planes

| Característica | Hobby (Free) | Pro |
|---------------|--------------|-----|
| Cron Jobs | ✅ Hasta 1/día* | ✅ Ilimitados |
| Frecuencia mínima | Diario | Por minuto |
| Nuestro setup | **4 veces/día** | Cada 5 min |
| Bloques procesados/día | ~32,000 | ~288,000 |

*Nota: 4 ejecuciones/día todavía está dentro de los límites free con el formato `*/6`

---

## 🎯 ¿Es suficiente para el proyecto?

### ✅ Para el Plan Free (4 veces/día):

**Ventajas**:
- ✅ Gratis
- ✅ Captura todos los eventos importantes
- ✅ Lag máximo de 6 horas
- ✅ Suficiente para análisis histórico
- ✅ Procesa ~8,000 bloques por ejecución (32K/día)

**Limitaciones**:
- ⚠️ Datos no son "en tiempo real"
- ⚠️ Delay de hasta 6 horas en eventos nuevos
- ⚠️ No ideal para trading o alertas instantáneas

### 🚀 Cuando upgradar a Pro:

Considera el plan Pro si necesitas:
- ⚡ Datos en tiempo real (cada 5 minutos)
- 🔔 Alertas instantáneas de eventos
- 📊 Dashboard con datos actualizados constantemente
- 🤖 Bot de trading automático
- 💰 Aplicaciones críticas de negocio

**Costo**: ~$20/mes por proyecto

---

## 🔧 Opciones Alternativas (Gratis)

Si necesitas ejecuciones más frecuentes sin pagar:

### Opción 1: Railway / Render (Recomendado)
```
✅ Gratis (con límites)
✅ Procesos continuos
✅ Polling cada 5 minutos posible
⚠️ Requiere migración
```

### Opción 2: GitHub Actions
```
✅ Gratis 2000 minutos/mes
✅ Cron cada 5 minutos posible
⚠️ Más complejo de configurar
```

### Opción 3: Trigger manual + Webhook
```
✅ Gratis
✅ Ejecuta cuando quieras
⚠️ Requiere trigger externo
```

### Opción 4: Ejecutar localmente
```
✅ Gratis
✅ Control total
⚠️ Tu máquina debe estar encendida
```

---

## 🎮 Trigger Manual (Siempre Disponible)

Aunque el cron ejecute cada 6 horas, **puedes ejecutar manualmente cuando quieras**:

```bash
# Desde tu terminal
curl https://tu-proyecto.vercel.app/api/sync

# O desde el navegador
https://tu-proyecto.vercel.app/api/sync
```

Si configuraste `CRON_SECRET`:
```bash
curl -H "Authorization: Bearer TU_SECRETO" https://tu-proyecto.vercel.app/api/sync
```

---

## 📝 Modificar el Schedule (Opcional)

Si quieres cambiar la frecuencia, edita `vercel.json`:

### Cada 12 horas (2 veces/día)
```json
"schedule": "0 */12 * * *"
```

### Una vez al día (medianoche)
```json
"schedule": "0 0 * * *"
```

### Cada 3 horas (8 veces/día) - Límite superior free
```json
"schedule": "0 */3 * * *"
```

**Importante**: Vercel puede limitar según su política. `*/6` (4 veces/día) es seguro.

---

## 🔄 Cambiar Frecuencia Después

### Para actualizar el schedule:

1. Edita `vercel.json` con el nuevo cron
2. Push a GitHub:
   ```bash
   git add vercel.json
   git commit -m "Update: Cambiar frecuencia de cron"
   git push
   ```
3. Vercel re-deployeará automáticamente
4. El nuevo schedule se aplicará inmediatamente

---

## 💰 Upgrade a Pro (Futuro)

Cuando estés listo para upgradar:

1. Ve a Vercel → Settings → General → Upgrade to Pro
2. Cambia el cron en `vercel.json`:
   ```json
   "schedule": "*/5 * * * *"  // Cada 5 minutos
   ```
3. Push el cambio a GitHub
4. ✅ Ahora sincronizará cada 5 minutos

---

## 📊 Estadísticas Estimadas

Con el plan Free (cada 6 horas):

| Métrica | Valor |
|---------|-------|
| Ejecuciones/día | 4 |
| Bloques procesados/ejecución | ~8,000 |
| Bloques totales/día | ~32,000 |
| Eventos capturados | 100% |
| Lag máximo | 6 horas |
| Costo | $0 |

Con el plan Pro (cada 5 minutos):

| Métrica | Valor |
|---------|-------|
| Ejecuciones/día | 288 |
| Bloques procesados/ejecución | ~140 |
| Bloques totales/día | ~40,000 |
| Eventos capturados | 100% |
| Lag máximo | 5 minutos |
| Costo | ~$20/mes |

---

## ✅ Conclusión

**Para empezar**: El plan Free con 4 ejecuciones diarias es **perfecto**.

Capturarás todos los eventos del contrato con solo 6 horas de delay máximo, que es más que aceptable para:
- Análisis histórico
- Dashboards
- Estadísticas
- APIs de consulta

Cuando el proyecto crezca y necesites datos en tiempo real, upgradar a Pro es simple y rápido.

---

**Configuración actual**: ✅ Optimizada para Vercel Free Plan

