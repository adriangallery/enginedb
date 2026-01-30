# 🔍 Verificar Registros en Railway

## 📋 Resumen

Este script te permite verificar cuántos registros hay en la base de datos de Railway y compararlos con la migración inicial (8899 registros).

## 🚀 Cómo Obtener la URL Pública de Railway

### Opción 1: Desde Railway Dashboard

1. Ve a: https://railway.app/
2. Selecciona tu proyecto `enginedb`
3. Click en tu servicio
4. Ve a la pestaña **"Settings"** o **"Networking"**
5. Busca la sección **"Public Networking"**
6. Si no hay dominio generado:
   - Click en **"Generate Domain"**
   - Railway generará una URL como: `https://enginedb-production-xxxx.up.railway.app`
7. Copia esa URL completa

### Opción 2: Desde Variables de Entorno

Railway puede exponer la URL como variable de entorno `RAILWAY_PUBLIC_DOMAIN`. Verifica en:
- Railway Dashboard → Tu servicio → Variables
- Busca `RAILWAY_PUBLIC_DOMAIN` o similar

## 📝 Uso del Script

### Método 1: Con Variable de Entorno

```bash
cd api
RAILWAY_PUBLIC_URL=https://tu-dominio.railway.app npm run check-railway
```

### Método 2: Como Argumento

```bash
cd api
npm run check-railway https://tu-dominio.railway.app
```

### Método 3: Configurar en .env

Agrega a `api/.env`:
```
RAILWAY_PUBLIC_URL=https://tu-dominio.railway.app
DB_API_KEY=tu-api-key-si-la-tienes
```

Luego ejecuta:
```bash
cd api
npm run check-railway
```

## 🔑 API Key (Opcional)

Si configuraste una API Key en Railway (`API_KEY` o `DB_API_KEY`), puedes pasarla:

```bash
DB_API_KEY=tu-key npm run check-railway https://tu-dominio.railway.app
```

O agregarla a `api/.env`:
```
DB_API_KEY=tu-key
```

## 📊 Qué Verifica

El script consulta las siguientes tablas principales:
- `listing_events`
- `trade_events`
- `sweep_events`
- `erc721_transfers`
- `erc20_transfers`
- `erc1155_transfers_single`
- `erc1155_transfers_batch`
- `punk_listings`
- `sync_state`

Y compara el total con los **8899 registros iniciales** de la migración.

## ✅ Resultado Esperado

Si el bot está funcionando correctamente, deberías ver:
- ✅ Total mayor a 8899 (nuevos eventos guardados)
- ✅ Mensaje: "El bot está guardando nuevos eventos correctamente!"

## ⚠️ Troubleshooting

### Error: "No se proporcionó URL de Railway"
- Asegúrate de pasar la URL como argumento o variable de entorno
- Verifica que la URL sea completa (incluye `https://`)

### Error: "API no disponible" o timeout
- Verifica que el servicio esté corriendo en Railway
- Verifica que Public Networking esté habilitado
- Prueba acceder a `https://tu-dominio.railway.app/health` en el navegador

### Error: "401 Unauthorized"
- Si configuraste API Key, asegúrate de pasarla correctamente
- Verifica que la variable `API_KEY` o `DB_API_KEY` esté configurada en Railway

### Health check falla pero las consultas funcionan
- Es normal, el script continuará con las consultas de registros

## 📈 Ejemplo de Salida

```
═══════════════════════════════════════════════════════════
  📊 Verificación de Registros en Railway
═══════════════════════════════════════════════════════════

📍 Railway URL: https://enginedb-production-xxxx.up.railway.app
✅ API disponible - Estado: healthy
   Base de datos: ✅ Conectada
   Tamaño: 5.2 MB

  📦 Consultando listing_events... 150 registros
  📦 Consultando trade_events... 95 registros
  ...

═══════════════════════════════════════════════════════════
  📊 Resumen
═══════════════════════════════════════════════════════════

  listing_events                      150 registros
  trade_events                         95 registros
  ...

  Total (tablas principales): 9200 registros

═══════════════════════════════════════════════════════════
  📈 Comparación con Migración Inicial
═══════════════════════════════════════════════════════════

  Registros iniciales (migración): 8899
  Registros actuales (Railway):   9200
  Nuevos registros:               +301

  ✅ El bot está guardando nuevos eventos correctamente!
```
