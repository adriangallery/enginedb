# ✅ Checklist de Migración: Supabase → SQLite API

Este checklist te guiará paso a paso en el proceso de migración desde Supabase a la nueva API SQLite.

## 📊 Progreso General

- ✅ **FASE 1**: Preparación y Configuración - COMPLETADA
- ✅ **FASE 2**: Exportación desde Supabase - COMPLETADA (24 tablas, 8,899 registros)
- ✅ **FASE 3**: Inicialización de SQLite - COMPLETADA (27 tablas creadas)
- ✅ **FASE 4**: Importación a SQLite - COMPLETADA (8,899 registros)
- ✅ **FASE 5**: Validación de Migración - COMPLETADA (100% coincidencia)
- ⏳ **FASE 6**: Deploy del API en Railway - EN PROGRESO
- ⏳ **FASE 7**: Actualización del Bot - PENDIENTE
- ⏳ **FASE 8**: Actualización de Frontends - PENDIENTE
- ⏳ **FASE 9**: Testing y Verificación Final - PENDIENTE
- ⏳ **FASE 10**: Cutover y Monitoreo - PENDIENTE
- ⏳ **FASE 11**: Limpieza y Documentación - PENDIENTE

**Progreso**: 5/11 fases completadas (45%)

---

## 📋 FASE 1: Preparación y Configuración ✅ COMPLETADA

### 1.1 Verificar estructura del proyecto
- [x] Verificar que existe la carpeta `api/`
- [x] Verificar que existe `api/.env.example`
- [x] Verificar que `api/.env` está en `.gitignore`

### 1.2 Configurar variables de entorno del API
- [x] Copiar `api/.env.example` a `api/.env`
  ```bash
  cd api
  cp .env.example .env
  ```

- [x] Configurar variables básicas en `api/.env`:
  - [x] `PORT=3000` (o el puerto que prefieras)
  - [x] `DB_PATH=./data/enginedb.sqlite`
  - [x] Generar y configurar `API_KEY` (usar: `openssl rand -base64 32`)
  - [x] Configurar `CORS_ORIGIN` con las URLs de tus frontends

### 1.3 Configurar credenciales de Supabase (temporal)
- [x] Obtener `SUPABASE_URL` desde el dashboard de Supabase
- [x] Obtener `SUPABASE_SERVICE_ROLE_KEY` desde Settings → API
- [x] Agregar ambas variables a `api/.env`

### 1.4 Instalar dependencias
- [x] Navegar a la carpeta `api/`
  ```bash
  cd api
  ```
- [x] Instalar dependencias
  ```bash
  npm install
  ```

---

## 📤 FASE 2: Exportación desde Supabase ✅ COMPLETADA

### 2.1 Verificar conexión a Supabase
- [x] Verificar que `SUPABASE_URL` está configurada correctamente
- [x] Verificar que `SUPABASE_SERVICE_ROLE_KEY` es válida
- [x] (Opcional) Probar conexión manualmente desde Supabase dashboard

### 2.2 Ejecutar exportación
- [x] Ejecutar script de exportación
  ```bash
  npm run export-supabase
  ```
- [x] Verificar que se creó el directorio `api/data/export/`
- [x] Verificar que se generaron archivos JSON para cada tabla
- [x] Revisar los logs para confirmar que todas las tablas se exportaron
- [x] Anotar el número total de registros exportados
  - **Resultado**: 24 tablas exportadas, 8,899 registros totales

### 2.3 Verificar archivos exportados
- [x] Verificar que existen archivos `.json` en `api/data/export/`
- [x] Verificar que los archivos no están vacíos
- [x] (Opcional) Abrir uno de los archivos JSON para verificar formato

---

## 📥 FASE 3: Inicialización de SQLite ✅ COMPLETADA

### 3.1 Crear base de datos SQLite
- [x] Ejecutar migración inicial
  ```bash
  npm run migrate
  ```
- [x] Verificar que se creó `api/data/enginedb.sqlite`
- [x] Verificar en los logs que se crearon todas las tablas (27 tablas)
- [x] Verificar que no hay errores en la salida

### 3.2 Verificar estructura de la base de datos
- [x] (Opcional) Abrir `api/data/enginedb.sqlite` con un visor SQLite
- [x] Verificar que todas las tablas existen
- [x] Verificar que los índices se crearon correctamente

---

## 📥 FASE 4: Importación a SQLite ✅ COMPLETADA

### 4.1 Preparar importación
- [x] Verificar que los archivos JSON están en `api/data/export/`
- [x] Verificar que la base de datos SQLite está vacía (0 registros en todas las tablas)

### 4.2 Ejecutar importación
- [x] Ejecutar script de importación
  ```bash
  npm run import-sqlite
  ```
- [x] Monitorear el progreso en la consola
- [x] Verificar que no hay errores críticos
- [x] Anotar el número total de registros importados
  - **Resultado**: 8,899 registros importados

### 4.3 Verificar importación
- [x] Revisar los logs para confirmar que todas las tablas se importaron
- [x] Verificar que el número de registros importados coincide con los exportados
- [x] (Opcional) Verificar manualmente algunas tablas con queries SQL

---

## ✅ FASE 5: Validación de Migración ✅ COMPLETADA

### 5.1 Ejecutar validación
- [x] Ejecutar script de validación
  ```bash
  npm run validate
  ```
- [x] Revisar la tabla de comparación de conteos
- [x] Verificar que todas las tablas muestran ✅ (o diferencias aceptables)
  - **Resultado**: 26 tablas validadas, 100% coincidencia, 0 diferencias

### 5.2 Verificación manual (opcional pero recomendado)
- [x] Comparar manualmente algunos registros específicos
- [x] Verificar que los datos críticos se migraron correctamente
- [x] Verificar que los timestamps se preservaron
- [x] Verificar que los JSON fields se migraron correctamente

### 5.3 Resolver diferencias (si las hay)
- [x] Si hay diferencias, investigar la causa
- [x] Verificar si son duplicados que se filtraron (normal)
- [x] Si hay errores, revisar logs y corregir
- [x] Re-ejecutar importación si es necesario
  - **Resultado**: No hubo diferencias, migración perfecta

---

## 🚀 FASE 6: Deploy del API en Railway

### 6.1 Preparar para deploy
- [ ] Crear cuenta en Railway (si no tienes)
- [ ] Conectar tu repositorio de GitHub a Railway
- [ ] Crear un nuevo servicio en Railway

### 6.2 Configurar servicio en Railway
- [ ] Configurar el Root Directory como `api/`
- [ ] Configurar el Start Command: `npm start`
- [ ] Configurar el Build Command: `npm run build`

### 6.3 Configurar volumen persistente
- [ ] Crear un volumen persistente en Railway
- [ ] Montar el volumen en `/data` (o la ruta que uses)
- [ ] Verificar que el volumen está montado correctamente

### 6.4 Configurar variables de entorno en Railway
- [ ] `PORT` (Railway lo asigna automáticamente, pero puedes configurarlo)
- [ ] `DB_PATH=/data/enginedb.sqlite` (o la ruta del volumen)
- [ ] `API_KEY` (el mismo que generaste localmente)
- [ ] `CORS_ORIGIN` (URLs de tus frontends separadas por coma)
- [ ] `NODE_ENV=production`

### 6.5 Subir base de datos al volumen
- [ ] Opción A: Subir archivo SQLite directamente al volumen
- [ ] Opción B: Ejecutar importación en Railway después del deploy
- [ ] Verificar que el archivo está en el volumen

### 6.6 Deploy y verificación
- [ ] Hacer deploy del servicio
- [ ] Verificar que el servicio está corriendo
- [ ] Probar endpoint `/health`
  ```bash
  curl https://tu-api.railway.app/health
  ```
- [ ] Verificar que la base de datos está accesible

---

## 🤖 FASE 7: Actualización del Bot

### 7.1 Preparar configuración del bot
- [ ] Obtener la URL del API desplegado en Railway
- [ ] Obtener el `API_KEY` configurado en Railway

### 7.2 Actualizar variables de entorno del bot
- [ ] Abrir `.env` del proyecto principal (no `api/.env`)
- [ ] Agregar o actualizar:
  ```env
  USE_DB_API=true
  DB_API_URL=https://tu-api.railway.app
  DB_API_KEY=tu-api-key-aqui
  ```

### 7.3 Verificar integración del bot
- [ ] Verificar que el código del bot puede usar `src/db-api/client.ts`
- [ ] (Opcional) Probar una query simple desde el bot
- [ ] Verificar que no hay errores de importación

### 7.4 Testing del bot (en desarrollo)
- [ ] Ejecutar el bot en modo desarrollo
- [ ] Verificar que puede leer datos del API
- [ ] Verificar que puede escribir datos al API
- [ ] Probar sincronización de bloques
- [ ] Verificar que los eventos se guardan correctamente

---

## 🎨 FASE 8: Actualización de Frontends

### 8.1 Identificar frontends que usan Supabase
- [ ] Marketplace frontend
- [ ] Activity frontend
- [ ] Otros frontends que usen la base de datos

### 8.2 Actualizar configuración de cada frontend
- [ ] Obtener la URL del API: `https://tu-api.railway.app`
- [ ] Obtener el `API_KEY` (puede ser el mismo o diferente)
- [ ] Actualizar variables de entorno o configuración

### 8.3 Actualizar código del frontend (si es necesario)
- [ ] Si usan `@supabase/supabase-js`:
  - [ ] Cambiar URL de Supabase por la URL del API
  - [ ] Cambiar `supabaseKey` por `API_KEY`
  - [ ] Verificar que las queries siguen funcionando

- [ ] Si usan `fetch` directamente:
  - [ ] Actualizar la URL base
  - [ ] Agregar header `apikey` o `Authorization: Bearer API_KEY`
  - [ ] Verificar formato de queries (debe ser compatible)

### 8.4 Testing de cada frontend
- [ ] Probar queries de lectura
- [ ] Probar filtros y ordenamiento
- [ ] Probar paginación
- [ ] Verificar que los datos se muestran correctamente
- [ ] Verificar que no hay errores en la consola

---

## 🧪 FASE 9: Testing y Verificación Final

### 9.1 Testing del API
- [ ] Probar endpoint `/health`
- [ ] Probar query GET a una tabla
- [ ] Probar query con filtros
- [ ] Probar query con ordenamiento
- [ ] Probar query con límite
- [ ] Probar INSERT (POST)
- [ ] Probar UPDATE (PATCH)
- [ ] Probar DELETE

### 9.2 Testing del bot en producción
- [ ] Verificar que el bot puede conectarse al API
- [ ] Verificar que puede leer `sync_state`
- [ ] Verificar que puede actualizar `sync_state`
- [ ] Verificar que puede insertar eventos
- [ ] Monitorear logs por errores

### 9.3 Testing de frontends en producción
- [ ] Verificar que todos los frontends cargan datos
- [ ] Verificar que las queries complejas funcionan
- [ ] Verificar que no hay errores 401 (autenticación)
- [ ] Verificar que no hay errores 404 (tablas no encontradas)
- [ ] Verificar rendimiento (tiempos de respuesta)

### 9.4 Verificación de datos
- [ ] Comparar algunos datos entre Supabase y SQLite API
- [ ] Verificar que los conteos coinciden
- [ ] Verificar que los datos críticos están correctos

---

## 🔄 FASE 10: Cutover y Monitoreo

### 10.1 Preparar cutover
- [ ] Decidir momento de cutover (horario de bajo tráfico recomendado)
- [ ] Notificar a usuarios si es necesario
- [ ] Preparar rollback plan (volver a Supabase si es necesario)

### 10.2 Ejecutar cutover
- [ ] Activar `USE_DB_API=true` en el bot (si no está activo)
- [ ] Actualizar frontends para usar el nuevo API
- [ ] Verificar que todo sigue funcionando

### 10.3 Monitoreo inicial (primeras 24 horas)
- [ ] Monitorear logs del API
- [ ] Monitorear logs del bot
- [ ] Verificar que no hay errores críticos
- [ ] Verificar que el rendimiento es aceptable
- [ ] Verificar que los backups se están ejecutando

### 10.4 Monitoreo continuo
- [ ] Verificar backups automáticos (cada 6 horas por defecto)
- [ ] Monitorear uso de recursos en Railway
- [ ] Verificar que no hay problemas de rendimiento
- [ ] Revisar logs periódicamente

---

## 🧹 FASE 11: Limpieza y Documentación

### 11.1 Limpiar credenciales temporales
- [ ] Remover `SUPABASE_URL` de `api/.env` (ya no se necesita)
- [ ] Remover `SUPABASE_SERVICE_ROLE_KEY` de `api/.env`
- [ ] (Opcional) Mantener archivos de exportación como backup

### 11.2 Documentación
- [ ] Documentar la nueva URL del API
- [ ] Documentar el `API_KEY` en un lugar seguro (password manager)
- [ ] Actualizar README si es necesario
- [ ] Documentar proceso de backup y restore

### 11.3 Archivar Supabase (opcional)
- [ ] Decidir si mantener Supabase como backup
- [ ] Si no, documentar cómo restaurar desde backups de GitHub
- [ ] (Opcional) Pausar proyecto Supabase para ahorrar recursos

---

## 📝 Notas Adicionales

### Comandos útiles durante la migración

```bash
# Verificar estado de la base de datos
cd api
npm run migrate

# Exportar desde Supabase
npm run export-supabase

# Importar a SQLite
npm run import-sqlite

# Validar migración
npm run validate

# Crear backup manual
npm run backup

# Iniciar servidor localmente
npm run dev
```

### Troubleshooting

- **Error de conexión a Supabase**: Verificar `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`
- **Error de importación**: Verificar que los archivos JSON están en `api/data/export/`
- **Errores de constraint**: Normal si hay duplicados, se ignoran automáticamente
- **API no responde**: Verificar que Railway está corriendo y el volumen está montado
- **Errores 401**: Verificar que `API_KEY` está configurado correctamente

### Contacto y soporte

Si encuentras problemas durante la migración:
1. Revisar logs detallados
2. Verificar que todas las variables de entorno están configuradas
3. Comparar con el checklist paso a paso
4. Revisar documentación en `api/README.md`

---

**Última actualización**: 2026-01-26  
**Versión del checklist**: 1.0
