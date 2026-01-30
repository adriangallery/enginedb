/**
 * Procesador de eventos PunkQuest
 * Maneja eventos de staking, items y quests
 */

import { insertEvent } from '../supabase/client.js';
import type { PunkQuestEvent } from '../contracts/types/punk-quest-events.js';
import { bigintToString } from '../contracts/types/punk-quest-events.js';

/**
 * Procesar un evento según su tipo
 */
export async function processPunkQuestEvent(
  event: PunkQuestEvent,
  contractAddress: string,
  blockTimestamp?: Date
): Promise<void> {
  const contractAddr = contractAddress.toLowerCase();

  switch (event.eventName) {
    case 'Staked':
    case 'Unstaked':
    case 'RewardClaimed':
    case 'FastLevelUpgradePurchased': {
      await insertEvent('punk_quest_staking_events', {
        contract_address: contractAddr,
        event_type: event.eventName,
        user_address: event.user.toLowerCase(),
        token_id: Number(event.id),
        reward_wei:
          event.eventName === 'RewardClaimed'
            ? bigintToString(event.reward)
            : null,
        bonus_added:
          event.eventName === 'FastLevelUpgradePurchased'
            ? bigintToString(event.bonusAdded)
            : null,
        timestamp:
          event.eventName === 'Staked' || event.eventName === 'Unstaked'
            ? Number(event.ts)
            : null,
        tx_hash: event.txHash,
        log_index: event.logIndex,
        block_number: Number(event.blockNumber),
        created_at: blockTimestamp?.toISOString() || new Date().toISOString(),
      });
      break;
    }

    case 'ItemAdded':
    case 'ItemUpdated':
    case 'ItemPurchasedInStore':
    case 'ItemEquipped':
    case 'ArmoryBonusUpdated': {
      let insertData: any = {
        contract_address: contractAddr,
        event_type: event.eventName,
        tx_hash: event.txHash,
        log_index: event.logIndex,
        block_number: Number(event.blockNumber),
        created_at: blockTimestamp?.toISOString() || new Date().toISOString(),
      };

      if (event.eventName === 'ItemAdded' || event.eventName === 'ItemUpdated') {
        insertData.item_id = Number(event.id);
        insertData.item_type = event.t;
        insertData.price_wei = bigintToString(event.p);
        insertData.bonus = bigintToString(event.b);
        insertData.durability = Number(event.d);
      } else if (event.eventName === 'ItemPurchasedInStore') {
        insertData.user_address = event.user.toLowerCase();
        insertData.item_id = Number(event.id);
        insertData.quantity = Number(event.q);
      } else if (event.eventName === 'ItemEquipped') {
        insertData.user_address = event.user.toLowerCase();
        insertData.token_id = Number(event.id);
        insertData.item_id = Number(event.itm);
      } else if (event.eventName === 'ArmoryBonusUpdated') {
        insertData.token_id = Number(event.id);
        insertData.bonus = bigintToString(event.bonus);
      }

      await insertEvent('punk_quest_item_events', insertData);
      break;
    }

    case 'EventDefinitionAdded':
    case 'EventTriggered':
    case 'AdvancedEventDefinitionAdded':
    case 'AdvancedEventTriggered': {
      let insertData: any = {
        contract_address: contractAddr,
        event_type: event.eventName,
        tx_hash: event.txHash,
        log_index: event.logIndex,
        block_number: Number(event.blockNumber),
        created_at: blockTimestamp?.toISOString() || new Date().toISOString(),
      };

      if (event.eventName === 'EventDefinitionAdded') {
        insertData.event_id = Number(event.id);
        insertData.event_name = event.n;
        insertData.adjustment = bigintToString(BigInt(event.adj));
        insertData.description = event.d;
      } else if (event.eventName === 'EventTriggered') {
        insertData.operator_address = event.op.toLowerCase();
        insertData.token_id = Number(event.id);
        insertData.event_id = Number(event.ev);
        insertData.event_name = event.n;
        insertData.adjustment = bigintToString(BigInt(event.adj));
      } else if (event.eventName === 'AdvancedEventDefinitionAdded') {
        insertData.event_id = Number(event.id);
        insertData.event_name = event.n;
        insertData.adjustment = bigintToString(BigInt(event.adj));
        insertData.description = event.d;
        insertData.degrade_amount = bigintToString(event.deg);
      } else if (event.eventName === 'AdvancedEventTriggered') {
        insertData.operator_address = event.op.toLowerCase();
        insertData.token_id = Number(event.id);
        insertData.event_id = Number(event.ev);
        insertData.event_name = event.n;
        insertData.adjustment = bigintToString(BigInt(event.adj));
      }

      await insertEvent('punk_quest_event_events', insertData);
      break;
    }
  }
}

