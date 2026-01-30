/**
 * Listener para el contrato PunkQuest
 * Decodifica eventos de staking, items y quests
 */

import { decodeEventLog, type Log } from 'viem';
import { PUNK_QUEST_ABI } from '../../contracts/abis/punk-quest-abi.js';
import type { PunkQuestEvent } from '../../contracts/types/punk-quest-events.js';

/**
 * Decodificar un log raw en un evento tipado
 */
export function decodeLog(log: Log): PunkQuestEvent | null {
  try {
    const decoded = decodeEventLog({
      abi: PUNK_QUEST_ABI,
      data: log.data,
      topics: log.topics,
    });

    const eventName = decoded.eventName as string;
    const metadata = {
      txHash: log.transactionHash!,
      logIndex: log.logIndex!,
      blockNumber: log.blockNumber!,
    };

    const args = decoded.args as any;

    switch (eventName) {
      case 'Staked':
        return {
          ...metadata,
          eventName: 'Staked',
          user: args.user,
          id: args.id,
          ts: args.ts,
        };

      case 'RewardClaimed':
        return {
          ...metadata,
          eventName: 'RewardClaimed',
          user: args.user,
          id: args.id,
          reward: args.reward,
        };

      case 'Unstaked':
        return {
          ...metadata,
          eventName: 'Unstaked',
          user: args.user,
          id: args.id,
          ts: args.ts,
        };

      case 'FastLevelUpgradePurchased':
        return {
          ...metadata,
          eventName: 'FastLevelUpgradePurchased',
          user: args.user,
          id: args.id,
          bonusAdded: args.bonusAdded,
        };

      case 'ItemAdded':
        return {
          ...metadata,
          eventName: 'ItemAdded',
          id: args.id,
          t: args.t,
          p: args.p,
          b: args.b,
          d: args.d,
        };

      case 'ItemUpdated':
        return {
          ...metadata,
          eventName: 'ItemUpdated',
          id: args.id,
          t: args.t,
          p: args.p,
          b: args.b,
          d: args.d,
        };

      case 'ItemPurchasedInStore':
        return {
          ...metadata,
          eventName: 'ItemPurchasedInStore',
          user: args.user,
          id: args.id,
          q: args.q,
        };

      case 'ItemEquipped':
        return {
          ...metadata,
          eventName: 'ItemEquipped',
          user: args.user,
          id: args.id,
          itm: args.itm,
        };

      case 'ArmoryBonusUpdated':
        return {
          ...metadata,
          eventName: 'ArmoryBonusUpdated',
          id: args.id,
          bonus: args.bonus,
        };

      case 'EventDefinitionAdded':
        return {
          ...metadata,
          eventName: 'EventDefinitionAdded',
          id: args.id,
          n: args.n,
          adj: args.adj,
          d: args.d,
        };

      case 'EventTriggered':
        return {
          ...metadata,
          eventName: 'EventTriggered',
          op: args.op,
          id: args.id,
          ev: args.ev,
          adj: args.adj,
          n: args.n,
        };

      case 'AdvancedEventDefinitionAdded':
        return {
          ...metadata,
          eventName: 'AdvancedEventDefinitionAdded',
          id: args.id,
          n: args.n,
          adj: args.adj,
          d: args.d,
          deg: args.deg,
        };

      case 'AdvancedEventTriggered':
        return {
          ...metadata,
          eventName: 'AdvancedEventTriggered',
          op: args.op,
          id: args.id,
          ev: args.ev,
          adj: args.adj,
          n: args.n,
        };

      default:
        return null;
    }
  } catch (error) {
    // Log no corresponde a este contrato o no se pudo decodificar
    return null;
  }
}

