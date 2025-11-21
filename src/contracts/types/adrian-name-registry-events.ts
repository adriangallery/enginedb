/**
 * Tipos de eventos del contrato AdrianNameRegistry
 */

export type AdrianNameRegistryEvent =
  | NameSetEvent
  | PriceUpdatedEvent
  | TreasuryUpdatedEvent;

export interface BaseEvent {
  txHash: string;
  logIndex: number;
  blockNumber: bigint;
}

export interface NameSetEvent extends BaseEvent {
  eventName: 'NameSet';
  tokenId: bigint;
  newName: string;
  setter: string;
  paid: boolean;
  price: bigint;
}

export interface PriceUpdatedEvent extends BaseEvent {
  eventName: 'PriceUpdated';
  oldPrice: bigint;
  newPrice: bigint;
}

export interface TreasuryUpdatedEvent extends BaseEvent {
  eventName: 'TreasuryUpdated';
  oldTreasury: string;
  newTreasury: string;
}

export function bigintToString(value: bigint): string {
  return value.toString();
}

