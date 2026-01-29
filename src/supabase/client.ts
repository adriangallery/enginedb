/**
 * Cliente de base de datos unificado
 * Usa SQLite API por defecto, Supabase solo si USE_SUPABASE=true
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getDBAPIClient } from '../db-api/client.js';
import { getEventBuffer } from './event-buffer.js';
import { getSQLiteEventBuffer } from '../sqlite/event-buffer.js';
import * as SQLiteClient from '../sqlite/client.js';

// Determinar qué backend usar
// SQLite es el default, Supabase solo si se especifica explícitamente
const USE_SUPABASE = process.env.USE_SUPABASE === 'true';

// Variable para trackear si estamos en modo buffer
let USE_BUFFER = false;

/**
 * Validar que las variables de entorno de Supabase estén presentes
 */
function validateSupabaseEnv() {
  const requiredVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de entorno requeridas: ${missing.join(', ')}`
    );
  }
}

/**
 * Crear cliente de Supabase (solo si USE_SUPABASE=true)
 */
export function createSupabaseClient(): SupabaseClient {
  validateSupabaseEnv();

  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Tipo helper para las tablas de la base de datos
 */
export interface Database {
  sync_state: {
    id: number;
    last_synced_block: number;
    last_historical_block: number | null;
    updated_at: string;
  };
  punk_listings: {
    id: number;
    token_id: number;
    seller: string;
    price_wei: string;
    is_contract_owned: boolean;
    is_listed: boolean;
    last_event: string;
    last_tx_hash: string;
    last_block_number: number;
    updated_at: string;
  };
  listing_events: {
    id: number;
    event_type: 'Listed' | 'Cancelled';
    token_id: number;
    seller: string;
    price_wei: string | null;
    is_contract_owned: boolean | null;
    tx_hash: string;
    log_index: number;
    block_number: number;
    created_at: string;
  };
  trade_events: {
    id: number;
    token_id: number;
    buyer: string;
    seller: string;
    price_wei: string;
    is_contract_owned: boolean;
    tx_hash: string;
    log_index: number;
    block_number: number;
    created_at: string;
  };
  sweep_events: {
    id: number;
    token_id: number;
    buy_price_wei: string;
    relist_price_wei: string;
    caller: string;
    caller_reward_wei: string;
    tx_hash: string;
    log_index: number;
    block_number: number;
    created_at: string;
  };
  engine_config_events: {
    id: number;
    event_type:
      | 'PremiumUpdated'
      | 'MaxBuyPriceUpdated'
      | 'CallerRewardModeUpdated'
      | 'CallerRewardBpsUpdated'
      | 'CallerRewardFixedUpdated'
      | 'OwnershipTransferred';
    old_value: string | null;
    new_value: string | null;
    tx_hash: string;
    log_index: number;
    block_number: number;
    created_at: string;
  };
}

// Instancia singleton del cliente (se crea bajo demanda)
let supabaseClient: SupabaseClient | null = null;
let dbClient: ReturnType<typeof getDBAPIClient> | null = null;

/**
 * Tipo unificado para el cliente de base de datos
 */
type DatabaseClient = SupabaseClient | ReturnType<typeof getDBAPIClient>;

/**
 * Habilitar modo buffer - eventos se acumulan antes de escribir
 */
export function enableBufferMode(): void {
  USE_BUFFER = true;
  console.log('✅ Modo buffer activado - eventos se acumularán antes de escribir');
}

/**
 * Insertar evento (usa buffer si está habilitado)
 */
export async function insertEvent(
  table: string,
  data: Record<string, any>
): Promise<void> {
  if (USE_SUPABASE) {
    // Modo Supabase
    if (USE_BUFFER) {
      // Buffer para Supabase
      const buffer = getEventBuffer();
      buffer.addEvent(table, data);
    } else {
      // Directo a Supabase
      const client = getSupabaseClient();
      const { error } = await client.from(table).insert(data);
      if (error && error.code !== '23505') {
        console.error(`Error insertando en ${table}:`, error);
      }
    }
  } else {
    // Modo SQLite
    if (USE_BUFFER) {
      // Buffer para SQLite
      const buffer = getSQLiteEventBuffer();
      buffer.addEvent(table, data);
    } else {
      // Directo a SQLite
      SQLiteClient.insertEvent(table, data);
    }
  }
}

/**
 * Upsert evento (bypass del buffer, siempre escribe directamente)
 * Usado para sync_state y punk_listings que necesitan upsert
 */
export async function upsertEvent(
  table: string,
  data: Record<string, any>,
  onConflict: string
): Promise<void> {
  if (USE_SUPABASE) {
    // Upsert a Supabase
    const client = getSupabaseClient();
    const { error } = await client.from(table).upsert(data, { onConflict });
    if (error) {
      console.error(`Error en upsert de ${table}:`, error);
      throw error;
    }
  } else {
    // Upsert a SQLite
    SQLiteClient.upsertEvent(table, data, onConflict);
  }
}

/**
 * Obtener el cliente de base de datos (singleton)
 * Usa SQLite API por defecto, Supabase solo si USE_SUPABASE=true
 */
export function getSupabaseClient(): DatabaseClient {
  if (USE_SUPABASE) {
    if (!supabaseClient) {
      console.log('📦 Usando Supabase como backend de datos');
      supabaseClient = createSupabaseClient();
    }
    return supabaseClient;
  } else {
    if (!dbClient) {
      const apiUrl = process.env.DB_API_URL || 'http://localhost:8080';
      console.log(`📦 Usando SQLite API como backend de datos (${apiUrl})`);
      dbClient = getDBAPIClient();
    }
    return dbClient;
  }
}

/**
 * Obtener el último bloque sincronizado desde base de datos
 * Función legacy para FloorEngine (mantiene compatibilidad)
 */
export async function getLastSyncedBlock(): Promise<number> {
  return getLastSyncedBlockByContract(
    '0x0351F7cBA83277E891D4a85Da498A7eACD764D58'
  );
}

/**
 * Actualizar el último bloque sincronizado en base de datos
 * Función legacy para FloorEngine (mantiene compatibilidad)
 */
export async function updateLastSyncedBlock(blockNumber: number): Promise<void> {
  return updateLastSyncedBlockByContract(
    '0x0351F7cBA83277E891D4a85Da498A7eACD764D58',
    blockNumber
  );
}

/**
 * Obtener el último bloque sincronizado por contrato
 * Nueva función multi-contrato
 */
export async function getLastSyncedBlockByContract(
  contractAddress: string
): Promise<number> {
  if (USE_SUPABASE) {
    // Modo Supabase
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('sync_state')
      .select('last_synced_block')
      .eq('contract_address', contractAddress.toLowerCase())
      .single();

    if (error) {
      // Si no existe registro, retornar 0
      if (error.code === 'PGRST116' || (error as any).code === '404') {
        return 0;
      }
      console.error(
        `Error al obtener último bloque sincronizado para ${contractAddress}:`,
        error
      );
      throw error;
    }

    return (data as any)?.last_synced_block ?? 0;
  } else {
    // Modo SQLite
    const result = SQLiteClient.get<{ last_synced_block: number }>(
      'SELECT last_synced_block FROM sync_state WHERE contract_address = ?',
      [contractAddress.toLowerCase()]
    );
    return result?.last_synced_block ?? 0;
  }
}

/**
 * Actualizar el último bloque sincronizado por contrato
 * Nueva función multi-contrato
 */
export async function updateLastSyncedBlockByContract(
  contractAddress: string,
  blockNumber: number
): Promise<void> {
  if (USE_SUPABASE) {
    // Modo Supabase
    const client = getSupabaseClient();

    // Intentar actualizar registro existente
    const { error: selectError } = await client
      .from('sync_state')
      .select('id')
      .eq('contract_address', contractAddress.toLowerCase())
      .single();

    const notFound = selectError && (selectError.code === 'PGRST116' || (selectError as any).code === '404');

    if (notFound) {
      // No existe registro, crear uno nuevo
      const { error: insertError } = await client.from('sync_state').insert({
        contract_address: contractAddress.toLowerCase(),
        last_synced_block: blockNumber,
        updated_at: new Date().toISOString(),
      });

      if (insertError) {
        console.error(
          `Error al crear registro de sync_state para ${contractAddress}:`,
          insertError
        );
        throw insertError;
      }
    } else if (selectError) {
      console.error(
        `Error al buscar registro de sync_state para ${contractAddress}:`,
        selectError
      );
      throw selectError;
    } else {
      // Actualizar registro existente
      const { error: updateError } = await client
        .from('sync_state')
        .update({
          last_synced_block: blockNumber,
          updated_at: new Date().toISOString(),
        })
        .eq('contract_address', contractAddress.toLowerCase());

      if (updateError) {
        console.error(
          `Error al actualizar último bloque sincronizado para ${contractAddress}:`,
          updateError
        );
        throw updateError;
      }
    }
  } else {
    // Modo SQLite
    SQLiteClient.upsertEvent(
      'sync_state',
      {
        contract_address: contractAddress.toLowerCase(),
        last_synced_block: blockNumber,
        updated_at: new Date().toISOString(),
      },
      'contract_address'
    );
  }
}

/**
 * Obtener el último bloque histórico procesado por contrato
 * Usado para sincronización hacia atrás
 */
export async function getLastHistoricalBlockByContract(
  contractAddress: string
): Promise<number | null> {
  if (USE_SUPABASE) {
    // Modo Supabase
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('sync_state')
      .select('last_historical_block')
      .eq('contract_address', contractAddress.toLowerCase())
      .single();

    if (error) {
      // Si no existe registro, retornar null
      if (error.code === 'PGRST116' || (error as any).code === '404') {
        return null;
      }
      console.error(
        `Error al obtener último bloque histórico para ${contractAddress}:`,
        error
      );
      throw error;
    }

    return (data as any)?.last_historical_block ?? null;
  } else {
    // Modo SQLite
    const result = SQLiteClient.get<{ last_historical_block: number | null }>(
      'SELECT last_historical_block FROM sync_state WHERE contract_address = ?',
      [contractAddress.toLowerCase()]
    );
    return result?.last_historical_block ?? null;
  }
}

/**
 * Actualizar el último bloque histórico procesado por contrato
 * Usado para sincronización hacia atrás
 */
export async function updateLastHistoricalBlockByContract(
  contractAddress: string,
  blockNumber: number
): Promise<void> {
  if (USE_SUPABASE) {
    // Modo Supabase
    const client = getSupabaseClient();

    // Intentar actualizar registro existente
    const { error: selectError } = await client
      .from('sync_state')
      .select('id')
      .eq('contract_address', contractAddress.toLowerCase())
      .single();

    const notFound = selectError && (selectError.code === 'PGRST116' || (selectError as any).code === '404');

    if (notFound) {
      // No existe registro, crear uno nuevo
      const { error: insertError } = await client.from('sync_state').insert({
        contract_address: contractAddress.toLowerCase(),
        last_synced_block: 0,
        last_historical_block: blockNumber,
        updated_at: new Date().toISOString(),
      });

      if (insertError) {
        console.error(
          `Error al crear registro de sync_state para ${contractAddress}:`,
          insertError
        );
        throw insertError;
      }
    } else if (selectError) {
      console.error(
        `Error al buscar registro de sync_state para ${contractAddress}:`,
        selectError
      );
      throw selectError;
    } else {
      // Actualizar registro existente
      const { error: updateError } = await client
        .from('sync_state')
        .update({
          last_historical_block: blockNumber,
          updated_at: new Date().toISOString(),
        })
        .eq('contract_address', contractAddress.toLowerCase());

      if (updateError) {
        console.error(
          `Error al actualizar último bloque histórico para ${contractAddress}:`,
          updateError
        );
        throw updateError;
      }
    }
  } else {
    // Modo SQLite
    // Primero verificar si existe
    const existing = SQLiteClient.get<{ last_synced_block: number }>(
      'SELECT last_synced_block FROM sync_state WHERE contract_address = ?',
      [contractAddress.toLowerCase()]
    );

    if (!existing) {
      // Crear nuevo
      SQLiteClient.insertEvent('sync_state', {
        contract_address: contractAddress.toLowerCase(),
        last_synced_block: 0,
        last_historical_block: blockNumber,
        updated_at: new Date().toISOString(),
      });
    } else {
      // Actualizar existente
      SQLiteClient.run(
        'UPDATE sync_state SET last_historical_block = ?, updated_at = ? WHERE contract_address = ?',
        [blockNumber, new Date().toISOString(), contractAddress.toLowerCase()]
      );
    }
  }
}

