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
 * Función legacy para FloorEngine (mantiene compatibilidad)
 */
export async function getLastSyncedBlock(): Promise<number> {
  return getLastSyncedBlockByContract(
    '0x0351F7cBA83277E891D4a85Da498A7eACD764D58'
  );
}

/**
 * Actualizar el último bloque sincronizado en Supabase
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
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('sync_state')
    .select('last_synced_block')
    .eq('contract_address', contractAddress.toLowerCase())
    .single();

  if (error) {
    // Si no existe registro, retornar 0
    if (error.code === 'PGRST116') {
      return 0;
    }
    console.error(
      `Error al obtener último bloque sincronizado para ${contractAddress}:`,
      error
    );
    throw error;
  }

  return data?.last_synced_block ?? 0;
}

/**
 * Actualizar el último bloque sincronizado por contrato
 * Nueva función multi-contrato
 */
export async function updateLastSyncedBlockByContract(
  contractAddress: string,
  blockNumber: number
): Promise<void> {
  const client = getSupabaseClient();

  // Intentar actualizar registro existente
  const { error: selectError } = await client
    .from('sync_state')
    .select('id')
    .eq('contract_address', contractAddress.toLowerCase())
    .single();

  if (selectError && selectError.code === 'PGRST116') {
    // No existe registro, crear uno nuevo
    const { error: insertError } = await client.from('sync_state').insert({
      contract_address: contractAddress.toLowerCase(),
      last_synced_block: blockNumber,
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
      .update({ last_synced_block: blockNumber })
      .eq('contract_address', contractAddress.toLowerCase());

    if (updateError) {
      console.error(
        `Error al actualizar último bloque sincronizado para ${contractAddress}:`,
        updateError
      );
      throw updateError;
    }
  }
}

