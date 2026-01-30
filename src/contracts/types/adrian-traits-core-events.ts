/**
 * Tipos TypeScript para eventos del contrato AdrianTraitsCore (ERC1155)
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
 * Evento: TransferSingle (estándar ERC1155)
 */
export interface TransferSingleEvent extends EventMetadata {
  eventName: 'TransferSingle';
  operator: string;
  from: string;
  to: string;
  id: bigint;
  value: bigint;
}

/**
 * Evento: TransferBatch (estándar ERC1155)
 */
export interface TransferBatchEvent extends EventMetadata {
  eventName: 'TransferBatch';
  operator: string;
  from: string;
  to: string;
  ids: bigint[];
  values: bigint[];
}

/**
 * Evento: ApprovalForAll (estándar ERC1155)
 */
export interface ApprovalForAllEvent extends EventMetadata {
  eventName: 'ApprovalForAll';
  account: string;
  operator: string;
  approved: boolean;
}

/**
 * Evento: URI (estándar ERC1155)
 */
export interface URIEvent extends EventMetadata {
  eventName: 'URI';
  value: string;
  id: bigint;
}

/**
 * Evento: AssetRegistered
 */
export interface AssetRegisteredEvent extends EventMetadata {
  eventName: 'AssetRegistered';
  assetId: bigint;
  category: string;
  assetType: number; // 0=VISUAL_TRAIT, 1=INVENTORY_ITEM, 2=CONSUMABLE, 3=SERUM, 4=PACK
}

/**
 * Evento: AssetMinted
 */
export interface AssetMintedEvent extends EventMetadata {
  eventName: 'AssetMinted';
  assetId: bigint;
  to: string;
  amount: bigint;
}

/**
 * Evento: AssetBurned
 */
export interface AssetBurnedEvent extends EventMetadata {
  eventName: 'AssetBurned';
  assetId: bigint;
  from: string;
  amount: bigint;
}

/**
 * Evento: CategoryAdded
 */
export interface CategoryAddedEvent extends EventMetadata {
  eventName: 'CategoryAdded';
  category: string;
}

/**
 * Evento: CategoryRemoved
 */
export interface CategoryRemovedEvent extends EventMetadata {
  eventName: 'CategoryRemoved';
  category: string;
}

/**
 * Evento: AssetTypeAdded
 */
export interface AssetTypeAddedEvent extends EventMetadata {
  eventName: 'AssetTypeAdded';
  typeName: string;
}

/**
 * Evento: ExtensionAdded
 */
export interface ExtensionAddedEvent extends EventMetadata {
  eventName: 'ExtensionAdded';
  extension: string;
}

/**
 * Evento: ExtensionRemoved
 */
export interface ExtensionRemovedEvent extends EventMetadata {
  eventName: 'ExtensionRemoved';
  extension: string;
}

/**
 * Evento: PaymentTokenUpdated
 */
export interface PaymentTokenUpdatedEvent extends EventMetadata {
  eventName: 'PaymentTokenUpdated';
  newToken: string;
}

/**
 * Evento: AssetUpdated
 */
export interface AssetUpdatedEvent extends EventMetadata {
  eventName: 'AssetUpdated';
  assetId: bigint;
  field: string;
  newValue: string;
}

/**
 * Evento: BaseURIUpdated
 */
export interface BaseURIUpdatedEvent extends EventMetadata {
  eventName: 'BaseURIUpdated';
  newURI: string;
}

/**
 * Union type de todos los eventos de AdrianTraitsCore
 */
export type AdrianTraitsCoreEvent =
  | TransferSingleEvent
  | TransferBatchEvent
  | ApprovalForAllEvent
  | URIEvent
  | AssetRegisteredEvent
  | AssetMintedEvent
  | AssetBurnedEvent
  | CategoryAddedEvent
  | CategoryRemovedEvent
  | AssetTypeAddedEvent
  | ExtensionAddedEvent
  | ExtensionRemovedEvent
  | PaymentTokenUpdatedEvent
  | AssetUpdatedEvent
  | BaseURIUpdatedEvent;

