/**
 * Procesador de eventos AdrianNameRegistry
 * Maneja eventos de nombres y configuración
 */

import { getSupabaseClient } from '../supabase/client.js';
import type { AdrianNameRegistryEvent } from '../contracts/types/adrian-name-registry-events.js';
import { bigintToString } from '../contracts/types/adrian-name-registry-events.js';

/**
 * Procesar un evento según su tipo
 */
export async function processNameRegistryEvent(
  event: AdrianNameRegistryEvent,
  contractAddress: string,
  blockTimestamp?: Date
): Promise<void> {
  const supabase = getSupabaseClient();

  switch (event.eventName) {
    case 'NameSet':
      const { error: nameSetError } = await supabase
        .from('name_registry_events')
        .insert({
          contract_address: contractAddress.toLowerCase(),
          token_id: Number(event.tokenId),
          new_name: event.newName,
          setter: event.setter.toLowerCase(),
          paid: event.paid,
          price_wei: event.paid ? bigintToString(event.price) : null,
          tx_hash: event.txHash,
          log_index: event.logIndex,
          block_number: Number(event.blockNumber),
          created_at: blockTimestamp?.toISOString() || new Date().toISOString(),
        });

      if (nameSetError) {
        if (nameSetError.code === '23505') {
          return; // Duplicado, ignorar
        }
        console.error(
          `[NameRegistry] Error al insertar evento NameSet:`,
          nameSetError
        );
        throw nameSetError;
      }
      break;

    case 'PriceUpdated':
      const { error: priceError } = await supabase
        .from('name_registry_config_events')
        .insert({
          contract_address: contractAddress.toLowerCase(),
          event_type: 'PriceUpdated',
          old_price_wei: bigintToString(event.oldPrice),
          new_price_wei: bigintToString(event.newPrice),
          tx_hash: event.txHash,
          log_index: event.logIndex,
          block_number: Number(event.blockNumber),
          created_at: blockTimestamp?.toISOString() || new Date().toISOString(),
        });

      if (priceError) {
        if (priceError.code === '23505') {
          return;
        }
        console.error(
          `[NameRegistry] Error al insertar evento PriceUpdated:`,
          priceError
        );
        throw priceError;
      }
      break;

    case 'TreasuryUpdated':
      const { error: treasuryError } = await supabase
        .from('name_registry_config_events')
        .insert({
          contract_address: contractAddress.toLowerCase(),
          event_type: 'TreasuryUpdated',
          old_treasury: event.oldTreasury.toLowerCase(),
          new_treasury: event.newTreasury.toLowerCase(),
          tx_hash: event.txHash,
          log_index: event.logIndex,
          block_number: Number(event.blockNumber),
          created_at: blockTimestamp?.toISOString() || new Date().toISOString(),
        });

      if (treasuryError) {
        if (treasuryError.code === '23505') {
          return;
        }
        console.error(
          `[NameRegistry] Error al insertar evento TreasuryUpdated:`,
          treasuryError
        );
        throw treasuryError;
      }
      break;
  }
}

