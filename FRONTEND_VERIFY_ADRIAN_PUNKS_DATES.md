# Verificación de Fechas - AdrianPunks

## Prompt JSON para Frontend

```json
{
  "task": "Verificar que las fechas de transacciones de AdrianPunks se están guardando y mostrando correctamente",
  "contract_address": "0x79be8acdd339c7b92918fcc3fd3875b5aaad7566",
  "tables": [
    "erc721_transfers",
    "erc721_approvals",
    "erc721_approvals_for_all"
  ],
  "verifications": [
    {
      "name": "Verificar que hay datos con timestamps",
      "sql": "SELECT COUNT(*) as total, MIN(created_at) as earliest, MAX(created_at) as latest FROM erc721_transfers WHERE contract_address = '0x79be8acdd339c7b92918fcc3fd3875b5aaad7566'",
      "expected": {
        "total": "> 0",
        "earliest": "debe ser una fecha válida (ISO 8601)",
        "latest": "debe ser una fecha válida (ISO 8601)"
      }
    },
    {
      "name": "Verificar que no hay timestamps NULL",
      "sql": "SELECT COUNT(*) as null_count FROM erc721_transfers WHERE contract_address = '0x79be8acdd339c7b92918fcc3fd3875b5aaad7566' AND created_at IS NULL",
      "expected": {
        "null_count": 0
      }
    },
    {
      "name": "Verificar consistencia entre block_number y created_at",
      "sql": "SELECT block_number, created_at, COUNT(*) as transfers FROM erc721_transfers WHERE contract_address = '0x79be8acdd339c7b92918fcc3fd3875b5aaad7566' GROUP BY block_number, created_at ORDER BY block_number ASC LIMIT 10",
      "expected": {
        "note": "Los bloques más antiguos deben tener timestamps más antiguos. Los bloques más recientes deben tener timestamps más recientes."
      }
    },
    {
      "name": "Verificar formato de fechas (ISO 8601)",
      "sql": "SELECT created_at, tx_hash FROM erc721_transfers WHERE contract_address = '0x79be8acdd339c7b92918fcc3fd3875b5aaad7566' ORDER BY created_at DESC LIMIT 5",
      "expected": {
        "format": "YYYY-MM-DDTHH:mm:ss.sssZ (ISO 8601 con timezone)",
        "example": "2024-01-15T14:30:45.123Z"
      }
    },
    {
      "name": "Verificar rango de fechas válido",
      "sql": "SELECT COUNT(*) as invalid_dates FROM erc721_transfers WHERE contract_address = '0x79be8acdd339c7b92918fcc3fd3875b5aaad7566' AND (created_at < '2023-01-01'::timestamp OR created_at > NOW())",
      "expected": {
        "invalid_dates": 0,
        "note": "Base mainnet empezó en 2023, fechas anteriores serían incorrectas"
      }
    }
  ],
  "frontend_code_examples": {
    "typescript_supabase": {
      "verify_timestamps": "async function verifyAdrianPunksTimestamps() {\n  const { data, error } = await supabase\n    .from('erc721_transfers')\n    .select('created_at, block_number, tx_hash')\n    .eq('contract_address', '0x79be8acdd339c7b92918fcc3fd3875b5aaad7566')\n    .order('block_number', { ascending: true })\n    .limit(10);\n  \n  if (error) {\n    console.error('Error:', error);\n    return;\n  }\n  \n  // Verificar que todas las fechas son válidas\n  const invalidDates = data?.filter(item => {\n    const date = new Date(item.created_at);\n    return isNaN(date.getTime());\n  });\n  \n  if (invalidDates && invalidDates.length > 0) {\n    console.error('❌ Fechas inválidas encontradas:', invalidDates);\n  } else {\n    console.log('✅ Todas las fechas son válidas');\n  }\n  \n  // Verificar consistencia: bloques más antiguos = fechas más antiguas\n  const sorted = data?.sort((a, b) => a.block_number - b.block_number);\n  const dates = sorted?.map(item => new Date(item.created_at).getTime());\n  const isConsistent = dates?.every((date, index) => {\n    if (index === 0) return true;\n    return date >= dates[index - 1];\n  });\n  \n  if (isConsistent) {\n    console.log('✅ Las fechas son consistentes con los block_numbers');\n  } else {\n    console.warn('⚠️  Algunas fechas no son consistentes con los block_numbers');\n  }\n  \n  return data;\n}",
      "format_date_for_display": "function formatAdrianPunksDate(isoString: string): string {\n  const date = new Date(isoString);\n  \n  // Verificar que la fecha es válida\n  if (isNaN(date.getTime())) {\n    console.error('Fecha inválida:', isoString);\n    return 'Fecha inválida';\n  }\n  \n  // Formatear para mostrar\n  return date.toLocaleString('es-ES', {\n    year: 'numeric',\n    month: 'long',\n    day: 'numeric',\n    hour: '2-digit',\n    minute: '2-digit',\n    timeZoneName: 'short'\n  });\n}",
      "get_recent_transfers": "async function getRecentAdrianPunksTransfers(limit = 10) {\n  const { data, error } = await supabase\n    .from('erc721_transfers')\n    .select('*')\n    .eq('contract_address', '0x79be8acdd339c7b92918fcc3fd3875b5aaad7566')\n    .order('created_at', { ascending: false })\n    .limit(limit);\n  \n  if (error) {\n    console.error('Error obteniendo transfers:', error);\n    return [];\n  }\n  \n  // Verificar y formatear fechas\n  return data?.map(transfer => ({\n    ...transfer,\n    created_at: new Date(transfer.created_at),\n    formatted_date: formatAdrianPunksDate(transfer.created_at)\n  })) || [];\n}"
    },
    "javascript_react": {
      "hook_with_date_verification": "import { useState, useEffect } from 'react';\nimport { supabase } from './supabaseClient';\n\nfunction useAdrianPunksTransfers() {\n  const [transfers, setTransfers] = useState([]);\n  const [dateErrors, setDateErrors] = useState([]);\n  \n  useEffect(() => {\n    async function fetchTransfers() {\n      const { data, error } = await supabase\n        .from('erc721_transfers')\n        .select('*')\n        .eq('contract_address', '0x79be8acdd339c7b92918fcc3fd3875b5aaad7566')\n        .order('created_at', { ascending: false })\n        .limit(50);\n      \n      if (error) {\n        console.error('Error:', error);\n        return;\n      }\n      \n      // Verificar fechas\n      const errors = [];\n      const validTransfers = data?.map(transfer => {\n        const date = new Date(transfer.created_at);\n        \n        if (isNaN(date.getTime())) {\n          errors.push({\n            tx_hash: transfer.tx_hash,\n            created_at: transfer.created_at,\n            error: 'Fecha inválida'\n          });\n          return null;\n        }\n        \n        return {\n          ...transfer,\n          created_at: date,\n          formatted_date: date.toLocaleString()\n        };\n      }).filter(Boolean) || [];\n      \n      setDateErrors(errors);\n      setTransfers(validTransfers);\n      \n      if (errors.length > 0) {\n        console.warn('⚠️  Fechas inválidas encontradas:', errors);\n      }\n    }\n    \n    fetchTransfers();\n  }, []);\n  \n  return { transfers, dateErrors };\n}"
    }
  },
  "common_issues": [
    {
      "issue": "Fechas mostradas como strings en lugar de Date objects",
      "solution": "Convertir con new Date(isoString) antes de mostrar",
      "code": "const date = new Date(transfer.created_at);"
    },
    {
      "issue": "Timezone incorrecto al mostrar",
      "solution": "Usar toLocaleString() con timezone específico",
      "code": "date.toLocaleString('es-ES', { timeZone: 'UTC' })"
    },
    {
      "issue": "Fechas futuras o muy antiguas",
      "solution": "Verificar que created_at está entre 2023-01-01 y NOW()",
      "code": "const isValid = date >= new Date('2023-01-01') && date <= new Date();"
    }
  ],
  "test_queries": [
    {
      "description": "Obtener 5 transfers más recientes con sus fechas",
      "sql": "SELECT tx_hash, block_number, created_at, from_address, to_address, token_id FROM erc721_transfers WHERE contract_address = '0x79be8acdd339c7b92918fcc3fd3875b5aaad7566' ORDER BY created_at DESC LIMIT 5"
    },
    {
      "description": "Verificar distribución de transfers por día",
      "sql": "SELECT DATE(created_at) as date, COUNT(*) as count FROM erc721_transfers WHERE contract_address = '0x79be8acdd339c7b92918fcc3fd3875b5aaad7566' GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 30"
    },
    {
      "description": "Encontrar transfers con fechas sospechosas",
      "sql": "SELECT tx_hash, block_number, created_at FROM erc721_transfers WHERE contract_address = '0x79be8acdd339c7b92918fcc3fd3875b5aaad7566' AND (created_at IS NULL OR created_at < '2023-01-01'::timestamp OR created_at > NOW())"
    }
  ]
}
```

## Uso Rápido

### 1. Verificar en Supabase SQL Editor

Ejecuta estas queries en orden:

```sql
-- Query 1: Verificar que hay datos
SELECT COUNT(*) as total, MIN(created_at) as earliest, MAX(created_at) as latest 
FROM erc721_transfers 
WHERE contract_address = '0x79be8acdd339c7b92918fcc3fd3875b5aaad7566';

-- Query 2: Verificar formato de fechas
SELECT created_at, tx_hash, block_number 
FROM erc721_transfers 
WHERE contract_address = '0x79be8acdd339c7b92918fcc3fd3875b5aaad7566' 
ORDER BY created_at DESC 
LIMIT 10;

-- Query 3: Verificar consistencia
SELECT block_number, created_at, COUNT(*) as transfers
FROM erc721_transfers 
WHERE contract_address = '0x79be8acdd339c7b92918fcc3fd3875b5aaad7566' 
GROUP BY block_number, created_at 
ORDER BY block_number ASC 
LIMIT 20;
```

### 2. Verificar en el Frontend (TypeScript)

```typescript
// Función de verificación rápida
async function quickDateCheck() {
  const { data, error } = await supabase
    .from('erc721_transfers')
    .select('created_at, block_number, tx_hash')
    .eq('contract_address', '0x79be8acdd339c7b92918fcc3fd3875b5aaad7566')
    .limit(10);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('📊 Verificando fechas...');
  
  data?.forEach((item, index) => {
    const date = new Date(item.created_at);
    const isValid = !isNaN(date.getTime());
    
    console.log(`${index + 1}. Block ${item.block_number}:`, {
      raw: item.created_at,
      parsed: date.toISOString(),
      valid: isValid ? '✅' : '❌',
      formatted: isValid ? date.toLocaleString() : 'INVÁLIDA'
    });
  });
}
```

### 3. Verificar en React Component

```tsx
import { useEffect, useState } from 'react';

function AdrianPunksDateVerifier() {
  const [status, setStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [issues, setIssues] = useState<string[]>([]);

  useEffect(() => {
    async function check() {
      const { data } = await supabase
        .from('erc721_transfers')
        .select('created_at, block_number')
        .eq('contract_address', '0x79be8acdd339c7b92918fcc3fd3875b5aaad7566')
        .limit(100);

      const foundIssues: string[] = [];

      data?.forEach(item => {
        const date = new Date(item.created_at);
        
        if (isNaN(date.getTime())) {
          foundIssues.push(`Fecha inválida en block ${item.block_number}`);
        }
        
        if (date < new Date('2023-01-01')) {
          foundIssues.push(`Fecha muy antigua en block ${item.block_number}`);
        }
        
        if (date > new Date()) {
          foundIssues.push(`Fecha futura en block ${item.block_number}`);
        }
      });

      setIssues(foundIssues);
      setStatus(foundIssues.length === 0 ? 'ok' : 'error');
    }

    check();
  }, []);

  return (
    <div>
      <h3>Verificación de Fechas AdrianPunks</h3>
      <p>Estado: {status === 'checking' ? 'Verificando...' : status === 'ok' ? '✅ OK' : '❌ Errores encontrados'}</p>
      {issues.length > 0 && (
        <ul>
          {issues.map((issue, i) => <li key={i}>{issue}</li>)}
        </ul>
      )}
    </div>
  );
}
```

## Resultados Esperados

Si todo está correcto, deberías ver:
- ✅ Todas las fechas en formato ISO 8601 válido
- ✅ Fechas consistentes con block_numbers (bloques más antiguos = fechas más antiguas)
- ✅ Fechas entre 2023-01-01 y la fecha actual
- ✅ Sin fechas NULL
- ✅ Formato: `2024-01-15T14:30:45.123Z`

