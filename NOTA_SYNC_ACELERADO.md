# ⚡ Sincronización Acelerada - TEMPORAL

## 📋 Estado Actual

El bot está configurado para sincronizar **cada 1 minuto** (en lugar de 5 minutos) para acelerar la sincronización histórica.

**Fecha de cambio**: 2025-11-18  
**Razón**: Sincronización rápida de datos históricos

---

## ⚙️ Configuración Actual

```bash
SYNC_INTERVAL_MINUTES=1  # (default en código)
```

**Velocidad**:
- 10 bloques/minuto
- 600 bloques/hora
- ~14,400 bloques/día

---

## 🔄 Volver a Configuración Normal

Una vez que la sincronización esté al día, cambiar a:

### Opción 1: Via Variable de Entorno (Recomendado)

En Railway → Variables:
```bash
SYNC_INTERVAL_MINUTES=5
```

Esto sobrescribe el default y mantiene el código flexible.

### Opción 2: Cambiar Default en Código

Editar `src/continuous-listener.ts`:
```typescript
const SYNC_INTERVAL_MINUTES = process.env.SYNC_INTERVAL_MINUTES
  ? parseInt(process.env.SYNC_INTERVAL_MINUTES)
  : 5; // Volver a 5 minutos
```

---

## 📊 Impacto

### Con 1 minuto (actual):
- ✅ Sincronización 5x más rápida
- ✅ Datos más actualizados
- ⚠️ Mayor uso de Railway (~$7-8/mes)
- ⚠️ Más requests a Alchemy

### Con 5 minutos (normal):
- ✅ Balance perfecto
- ✅ Costo optimizado (~$5-6/mes)
- ✅ Suficiente para eventos importantes

---

## ✅ Checklist para Volver a Normal

- [ ] Verificar en Supabase que `last_synced_block` esté cerca del bloque actual
- [ ] Cambiar `SYNC_INTERVAL_MINUTES=5` en Railway Variables
- [ ] O cambiar el default en código a 5
- [ ] Verificar logs que muestren intervalo de 5 minutos

---

**Nota**: Esta configuración es temporal. Una vez sincronizado, volver a 5 minutos para operación normal.

