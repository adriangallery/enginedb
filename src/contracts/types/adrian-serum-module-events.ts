/**
 * Tipos de eventos del contrato AdrianSerumModule
 */

export type AdrianSerumModuleEvent = SerumResultEvent;

export interface BaseEvent {
  txHash: string;
  logIndex: number;
  blockNumber: bigint;
}

export interface SerumResultEvent extends BaseEvent {
  eventName: 'SerumResult';
  user: string;
  tokenId: bigint;
  serumId: bigint;
  success: boolean;
  mutation: string;
}

export function bigintToString(value: bigint): string {
  return value.toString();
}

