/**
 * Cliente de Supabase para interactuar con la base de datos
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Validar que las variables de entorno necesarias estén presentes
 */
function validateEnv() {
  const requiredVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de entorno requeridas: ${missing.join(', ')}`
    );
  }
}

/**
 * Crear y exportar el cliente de Supabase
 * Usa el service role key para tener acceso completo (necesario para el bot)
 */
export function createSupabaseClient(): SupabaseClient {
  validateEnv();

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

/**
 * Obtener el cliente de Supabase (singleton)
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createSupabaseClient();
  }
  return supabaseClient;
}

/**
 * Obtener el último bloque sincronizado desde Supabase
 */
export async function getLastSyncedBlock(): Promise<number> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('sync_state')
    .select('last_synced_block')
    .single();

  if (error) {
    console.error('Error al obtener último bloque sincronizado:', error);
    throw error;
  }

  return data?.last_synced_block ?? 0;
}

/**
 * Actualizar el último bloque sincronizado en Supabase
 */
export async function updateLastSyncedBlock(blockNumber: number): Promise<void> {
  const client = getSupabaseClient();

  const { error } = await client
    .from('sync_state')
    .update({ last_synced_block: blockNumber })
    .eq('id', 1); // Asumimos que siempre hay una fila con id=1

  if (error) {
    console.error('Error al actualizar último bloque sincronizado:', error);
    throw error;
  }
}

