/**
 * Tipos de eventos del contrato PunkQuest
 */

export type PunkQuestEvent =
  | StakedEvent
  | RewardClaimedEvent
  | UnstakedEvent
  | FastLevelUpgradePurchasedEvent
  | ItemAddedEvent
  | ItemUpdatedEvent
  | ItemPurchasedInStoreEvent
  | ItemEquippedEvent
  | ArmoryBonusUpdatedEvent
  | EventDefinitionAddedEvent
  | EventTriggeredEvent
  | AdvancedEventDefinitionAddedEvent
  | AdvancedEventTriggeredEvent;

export interface BaseEvent {
  txHash: string;
  logIndex: number;
  blockNumber: bigint;
}

export interface StakedEvent extends BaseEvent {
  eventName: 'Staked';
  user: string;
  id: bigint;
  ts: bigint;
}

export interface RewardClaimedEvent extends BaseEvent {
  eventName: 'RewardClaimed';
  user: string;
  id: bigint;
  reward: bigint;
}

export interface UnstakedEvent extends BaseEvent {
  eventName: 'Unstaked';
  user: string;
  id: bigint;
  ts: bigint;
}

export interface FastLevelUpgradePurchasedEvent extends BaseEvent {
  eventName: 'FastLevelUpgradePurchased';
  user: string;
  id: bigint;
  bonusAdded: bigint;
}

export interface ItemAddedEvent extends BaseEvent {
  eventName: 'ItemAdded';
  id: bigint;
  t: string;
  p: bigint;
  b: bigint;
  d: bigint;
}

export interface ItemUpdatedEvent extends BaseEvent {
  eventName: 'ItemUpdated';
  id: bigint;
  t: string;
  p: bigint;
  b: bigint;
  d: bigint;
}

export interface ItemPurchasedInStoreEvent extends BaseEvent {
  eventName: 'ItemPurchasedInStore';
  user: string;
  id: bigint;
  q: bigint;
}

export interface ItemEquippedEvent extends BaseEvent {
  eventName: 'ItemEquipped';
  user: string;
  id: bigint;
  itm: bigint;
}

export interface ArmoryBonusUpdatedEvent extends BaseEvent {
  eventName: 'ArmoryBonusUpdated';
  id: bigint;
  bonus: bigint;
}

export interface EventDefinitionAddedEvent extends BaseEvent {
  eventName: 'EventDefinitionAdded';
  id: bigint;
  n: string;
  adj: bigint;
  d: string;
}

export interface EventTriggeredEvent extends BaseEvent {
  eventName: 'EventTriggered';
  op: string;
  id: bigint;
  ev: bigint;
  adj: bigint;
  n: string;
}

export interface AdvancedEventDefinitionAddedEvent extends BaseEvent {
  eventName: 'AdvancedEventDefinitionAdded';
  id: bigint;
  n: string;
  adj: bigint;
  d: string;
  deg: bigint;
}

export interface AdvancedEventTriggeredEvent extends BaseEvent {
  eventName: 'AdvancedEventTriggered';
  op: string;
  id: bigint;
  ev: bigint;
  adj: bigint;
  n: string;
}

export function bigintToString(value: bigint): string {
  return value.toString();
}

