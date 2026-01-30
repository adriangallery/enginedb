/**
 * Wrapper que provee funciones compatibles con src/supabase/client.ts
 * Permite usar la API SQLite de forma transparente
 */

import { getDBAPIClient } from './client.js';

const dbAPI = getDBAPIClient();

/**
 * Obtener el último bloque sincronizado para un contrato
 */
export async function getLastSyncedBlockByContract(contractAddress: string): Promise<number> {
  const { data, error } = await dbAPI
    .from('sync_state')
    .select('last_synced_block')
    .eq('contract_address', contractAddress.toLowerCase())
    .single();

  if (error || !data) {
    // Si no existe, crear registro inicial
    await dbAPI.from('sync_state').insert({
      contract_address: contractAddress.toLowerCase(),
      last_synced_block: 0,
      updated_at: new Date().toISOString(),
    });
    return 0;
  }

  return (data as any).last_synced_block || 0;
}

/**
 * Actualizar el último bloque sincronizado para un contrato
 */
export async function updateLastSyncedBlockByContract(
  contractAddress: string,
  blockNumber: number
): Promise<void> {
  const { error } = await dbAPI
    .from('sync_state')
    .update({
      last_synced_block: blockNumber,
      updated_at: new Date().toISOString(),
    })
    .eq('contract_address', contractAddress.toLowerCase());

  if (error) {
    // Si no existe, crear registro
    await dbAPI.from('sync_state').insert({
      contract_address: contractAddress.toLowerCase(),
      last_synced_block: blockNumber,
      updated_at: new Date().toISOString(),
    });
  }
}

/**
 * Obtener el último bloque histórico procesado para un contrato
 */
export async function getLastHistoricalBlockByContract(
  contractAddress: string
): Promise<number | null> {
  const { data, error } = await dbAPI
    .from('sync_state')
    .select('last_historical_block')
    .eq('contract_address', contractAddress.toLowerCase())
    .single();

  if (error || !data) {
    return null;
  }

  return (data as any).last_historical_block;
}

/**
 * Actualizar el último bloque histórico para un contrato
 */
export async function updateLastHistoricalBlockByContract(
  contractAddress: string,
  blockNumber: number
): Promise<void> {
  const { error } = await dbAPI
    .from('sync_state')
    .update({
      last_historical_block: blockNumber,
      updated_at: new Date().toISOString(),
    })
    .eq('contract_address', contractAddress.toLowerCase());

  if (error) {
    console.error(`Error actualizando last_historical_block para ${contractAddress}:`, error);
  }
}

/**
 * Obtener el último bloque sincronizado (legacy, para compatibilidad)
 */
export async function getLastSyncedBlock(): Promise<number> {
  const { data, error } = await dbAPI
    .from('sync_state')
    .select('last_synced_block')
    .order('last_synced_block', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return 0;
  }

  return (data as any).last_synced_block || 0;
}

/**
 * Actualizar el último bloque sincronizado (legacy)
 */
export async function updateLastSyncedBlock(blockNumber: number): Promise<void> {
  // Por defecto, actualizar el registro del contrato FloorEngine
  await updateLastSyncedBlockByContract(
    '0x0351F7cBA83277E891D4a85Da498A7eACD764D58',
    blockNumber
  );
}

export default {
  getLastSyncedBlockByContract,
  updateLastSyncedBlockByContract,
  getLastHistoricalBlockByContract,
  updateLastHistoricalBlockByContract,
  getLastSyncedBlock,
  updateLastSyncedBlock,
};
