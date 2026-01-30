/**
 * Tipos TypeScript para eventos del contrato AdrianTraitsExtensions
 */

/**
 * Metadata común a todos los eventos
 */
export interface EventMetadata {
  txHash: string;
  logIndex: number;
  blockNumber: bigint;
}

/**
 * Helper para convertir bigint a string (para JSON)
 */
export function bigintToString(value: bigint | number): string {
  return value.toString();
}

/**
 * Evento: TraitEquipped
 */
export interface TraitEquippedEvent extends EventMetadata {
  eventName: 'TraitEquipped';
  tokenId: bigint;
  category: string;
  traitId: bigint;
}

/**
 * Evento: TraitUnequipped
 */
export interface TraitUnequippedEvent extends EventMetadata {
  eventName: 'TraitUnequipped';
  tokenId: bigint;
  category: string;
  traitId: bigint;
}

/**
 * Evento: TraitApplied
 */
export interface TraitAppliedEvent extends EventMetadata {
  eventName: 'TraitApplied';
  tokenId: bigint;
  category: string;
  traitId: bigint;
}

/**
 * Evento: TraitsAppliedBatch
 */
export interface TraitsAppliedBatchEvent extends EventMetadata {
  eventName: 'TraitsAppliedBatch';
  tokenId: bigint;
  traitIds: bigint[];
  categories: string[];
}

/**
 * Evento: AssetAddedToInventory
 */
export interface AssetAddedToInventoryEvent extends EventMetadata {
  eventName: 'AssetAddedToInventory';
  tokenId: bigint;
  assetId: bigint;
  amount: bigint;
}

/**
 * Evento: AssetRemovedFromInventory
 */
export interface AssetRemovedFromInventoryEvent extends EventMetadata {
  eventName: 'AssetRemovedFromInventory';
  tokenId: bigint;
  assetId: bigint;
  amount: bigint;
}

/**
 * Evento: CoreContractCallReceived
 */
export interface CoreContractCallReceivedEvent extends EventMetadata {
  eventName: 'CoreContractCallReceived';
  core: string;
  timestamp: bigint;
}

/**
 * Union type de todos los eventos de AdrianTraitsExtensions
 */
export type AdrianTraitsExtensionsEvent =
  | TraitEquippedEvent
  | TraitUnequippedEvent
  | TraitAppliedEvent
  | TraitsAppliedBatchEvent
  | AssetAddedToInventoryEvent
  | AssetRemovedFromInventoryEvent
  | CoreContractCallReceivedEvent;

