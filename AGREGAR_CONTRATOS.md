# 📝 Guía: Cómo Agregar Nuevos Contratos

El sistema ahora usa un **Unified Listener** que lee cada bloque UNA SOLA VEZ para todos los contratos. Esto es mucho más eficiente que leer cada contrato por separado.

## 🚀 Ventajas del Sistema Unificado

- **3x más rápido**: Lee cada bloque solo una vez
- **Menos llamadas RPC**: Reduce el consumo de datos drásticamente
- **Escalable**: Agregar contratos no multiplica las llamadas
- **Histórico automático**: Cada contrato puede sincronizar su histórico independientemente

## ✅ Pasos para Agregar un Nuevo Contrato

### 1. Crear la Configuración del Contrato

Crea un archivo en `src/contracts/config/` con la información del contrato:

```typescript
// src/contracts/config/mi-nuevo-contrato.ts
export const MI_NUEVO_CONTRATO_CONFIG = {
  address: '0x...', // Dirección del contrato
  startBlock: 12345678n, // Bloque de deployment (opcional, 0n para desde el inicio)
  name: 'MiNuevoContrato',
};
```

### 2. Agregar el ABI

Crea el ABI en `src/contracts/abis/`:

```typescript
// src/contracts/abis/mi-nuevo-contrato-abi.ts
export const MI_NUEVO_CONTRATO_ABI = [
  // ... eventos del contrato
] as const;
```

### 3. Definir Tipos de Eventos

Crea los tipos en `src/contracts/types/`:

```typescript
// src/contracts/types/mi-nuevo-contrato-events.ts
export type MiNuevoContratoEvent = {
  eventName: string;
  // ... propiedades del evento
};
```

### 4. Crear el Listener

Crea un listener en `src/listeners/`:

```typescript
// src/listeners/mi-nuevo-contrato-listener.ts
import { decodeEventLog, type Log } from 'viem';
import { MI_NUEVO_CONTRATO_ABI } from '../contracts/abis/mi-nuevo-contrato-abi.js';

export function decodeLog(log: Log): MiNuevoContratoEvent | null {
  try {
    const decoded = decodeEventLog({
      abi: MI_NUEVO_CONTRATO_ABI,
      data: log.data,
      topics: log.topics,
    });

    return {
      eventName: decoded.eventName,
      // ... mapear propiedades
    };
  } catch (error) {
    return null;
  }
}
```

### 5. Crear el Procesador

Crea un procesador en `src/processors/`:

```typescript
// src/processors/mi-nuevo-contrato-processor.ts
import { insertEvent } from '../supabase/client.js';

export async function processMiNuevoContratoEvent(
  event: MiNuevoContratoEvent,
  contractAddress: string
): Promise<void> {
  await insertEvent({
    contract_address: contractAddress,
    event_name: event.eventName,
    // ... datos del evento
  });
}
```

### 6. Registrar en el Unified Listener

**Este es el paso clave**: Agrega tu contrato al `CONTRACT_REGISTRY` en `src/unified-listener.ts`:

```typescript
// src/unified-listener.ts
import { MI_NUEVO_CONTRATO_CONFIG } from './contracts/config/mi-nuevo-contrato.js';
import { decodeLog as decodeMiNuevoContratoLog } from './listeners/mi-nuevo-contrato-listener.js';
import { processMiNuevoContratoEvent } from './processors/mi-nuevo-contrato-processor.js';

const CONTRACT_REGISTRY: ContractDefinition[] = [
  // ... contratos existentes
  {
    name: 'MiNuevoContrato',
    address: MI_NUEVO_CONTRATO_CONFIG.address,
    startBlock: MI_NUEVO_CONTRATO_CONFIG.startBlock || 0n,
    decoder: decodeMiNuevoContratoLog,
    processor: processMiNuevoContratoEvent,
    color: '🔵', // Emoji para logs
  },
];
```

## 🎉 ¡Listo!

Tu nuevo contrato ahora:
- ✅ Se sincroniza automáticamente con el sistema unificado
- ✅ Puede hacer su histórico independientemente
- ✅ Se procesa en la misma lectura de bloques que los demás
- ✅ Guarda su progreso individual en la base de datos

## 📊 Seguimiento del Progreso

El sistema guarda el progreso de cada contrato en la tabla `sync_state`:

```sql
SELECT contract_address, last_synced_block 
FROM sync_state;
```

Cada contrato mantiene su propio `last_synced_block`, permitiendo que:
- Contratos nuevos puedan sincronizar desde su bloque de deployment
- Contratos antiguos continúen desde donde se quedaron
- El sistema sea resiliente a errores en contratos individuales

## 🔄 Eficiencia del Sistema

**Antes** (sistema antiguo):
- 3 contratos = 3 llamadas por bloque
- 10,000 bloques = **30,000 llamadas RPC**

**Ahora** (sistema unificado):
- N contratos = 1 llamada por bloque
- 10,000 bloques = **10,000 llamadas RPC**

**Ahorro**: 66% menos llamadas, ¡y mejora con más contratos!

## 💡 Notas Importantes

1. **Bloque de inicio**: Si especificas un `startBlock`, el contrato empezará a sincronizar desde ahí
2. **Histórico**: El sistema automáticamente detecta si hay histórico pendiente y lo procesa
3. **Errores**: Si un contrato falla, los demás continúan procesándose normalmente
4. **Progreso**: Se guarda cada 50 batches para no perder datos en caso de reinicio

