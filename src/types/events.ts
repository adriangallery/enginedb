/**
 * Tipos TypeScript para eventos del contrato FloorEngine
 */

import type { Log } from 'viem';

/**
 * Metadata común a todos los eventos
 */
export interface EventMetadata {
  txHash: string;
  logIndex: number;
  blockNumber: bigint;
}

/**
 * Evento: Listed
 * Se emite cuando un token es listado en el marketplace
 */
export interface ListedEvent extends EventMetadata {
  eventName: 'Listed';
  tokenId: bigint;
  seller: string;
  price: bigint;
  isContractOwned: boolean;
}

/**
 * Evento: Cancelled
 * Se emite cuando una listing es cancelada
 */
export interface CancelledEvent extends EventMetadata {
  eventName: 'Cancelled';
  tokenId: bigint;
  seller: string;
}

/**
 * Evento: Bought
 * Se emite cuando un usuario compra un token del marketplace
 */
export interface BoughtEvent extends EventMetadata {
  eventName: 'Bought';
  tokenId: bigint;
  buyer: string;
  seller: string;
  price: bigint;
  isContractOwned: boolean;
}

/**
 * Evento: FloorSweep
 * Se emite cuando el engine ejecuta un floor sweep automático
 */
export interface FloorSweepEvent extends EventMetadata {
  eventName: 'FloorSweep';
  tokenId: bigint;
  buyPrice: bigint;
  relistPrice: bigint;
  caller: string;
  callerReward: bigint;
}

/**
 * Evento: PremiumUpdated
 * Se emite cuando se actualiza el premium (tax) del marketplace
 */
export interface PremiumUpdatedEvent extends EventMetadata {
  eventName: 'PremiumUpdated';
  oldPremiumBps: number;
  newPremiumBps: number;
}

/**
 * Evento: MaxBuyPriceUpdated
 * Se emite cuando se actualiza el precio máximo de compra del engine
 */
export interface MaxBuyPriceUpdatedEvent extends EventMetadata {
  eventName: 'MaxBuyPriceUpdated';
  oldMaxBuyPrice: bigint;
  newMaxBuyPrice: bigint;
}

/**
 * Evento: CallerRewardModeUpdated
 * Se emite cuando cambia el modo de recompensa al caller (porcentaje vs fijo)
 */
export interface CallerRewardModeUpdatedEvent extends EventMetadata {
  eventName: 'CallerRewardModeUpdated';
  isPercentage: boolean;
}

/**
 * Evento: CallerRewardBpsUpdated
 * Se emite cuando se actualiza el porcentaje de recompensa al caller
 */
export interface CallerRewardBpsUpdatedEvent extends EventMetadata {
  eventName: 'CallerRewardBpsUpdated';
  oldBps: number;
  newBps: number;
}

/**
 * Evento: CallerRewardFixedUpdated
 * Se emite cuando se actualiza la recompensa fija al caller
 */
export interface CallerRewardFixedUpdatedEvent extends EventMetadata {
  eventName: 'CallerRewardFixedUpdated';
  oldFixed: bigint;
  newFixed: bigint;
}

/**
 * Evento: OwnershipTransferred
 * Se emite cuando cambia el owner del contrato
 */
export interface OwnershipTransferredEvent extends EventMetadata {
  eventName: 'OwnershipTransferred';
  previousOwner: string;
  newOwner: string;
}

/**
 * Union type de todos los eventos del marketplace
 */
export type MarketplaceEvent =
  | ListedEvent
  | CancelledEvent
  | BoughtEvent
  | FloorSweepEvent;

/**
 * Union type de todos los eventos de configuración
 */
export type ConfigEvent =
  | PremiumUpdatedEvent
  | MaxBuyPriceUpdatedEvent
  | CallerRewardModeUpdatedEvent
  | CallerRewardBpsUpdatedEvent
  | CallerRewardFixedUpdatedEvent
  | OwnershipTransferredEvent;

/**
 * Union type de todos los eventos del contrato
 */
export type FloorEngineEvent = MarketplaceEvent | ConfigEvent;

/**
 * Tipo para los logs raw de viem
 */
export type RawLog = Log<bigint, number, false>;

/**
 * Helper para convertir bigint a string (para Supabase)
 * Supabase no puede manejar bigint directamente, usamos NUMERIC en la DB
 */
export function bigintToString(value: bigint): string {
  return value.toString();
}

/**
 * Helper para convertir valores opcionales
 */
export function optionalBigintToString(value?: bigint): string | null {
  return value !== undefined ? value.toString() : null;
}

/**
 * Type guard para verificar si un evento es de marketplace
 */
export function isMarketplaceEvent(
  event: FloorEngineEvent
): event is MarketplaceEvent {
  return ['Listed', 'Cancelled', 'Bought', 'FloorSweep'].includes(
    event.eventName
  );
}

/**
 * Type guard para verificar si un evento es de configuración
 */
export function isConfigEvent(event: FloorEngineEvent): event is ConfigEvent {
  return [
    'PremiumUpdated',
    'MaxBuyPriceUpdated',
    'CallerRewardModeUpdated',
    'CallerRewardBpsUpdated',
    'CallerRewardFixedUpdated',
    'OwnershipTransferred',
  ].includes(event.eventName);
}

