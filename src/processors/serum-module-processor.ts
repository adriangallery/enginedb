/**
 * Procesador de eventos AdrianSerumModule
 * Maneja eventos de aplicación de serums
 */

import { insertEvent } from '../supabase/client.js';
import type { AdrianSerumModuleEvent } from '../contracts/types/adrian-serum-module-events.js';

/**
 * Procesar un evento según su tipo
 */
export async function processSerumModuleEvent(
  event: AdrianSerumModuleEvent,
  contractAddress: string,
  blockTimestamp?: Date
): Promise<void> {
  switch (event.eventName) {
    case 'SerumResult':
      await insertEvent('serum_module_events', {
        contract_address: contractAddress.toLowerCase(),
        user_address: event.user.toLowerCase(),
        token_id: Number(event.tokenId),
        serum_id: Number(event.serumId),
        success: event.success,
        mutation: event.mutation,
        tx_hash: event.txHash,
        log_index: event.logIndex,
        block_number: Number(event.blockNumber),
        created_at: blockTimestamp?.toISOString() || new Date().toISOString(),
      });
      break;
  }
}

