/**
 * Tipos TypeScript para eventos del contrato AdrianLABCore (ERC721)
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
 * Evento: Transfer (estándar ERC721)
 */
export interface TransferEvent extends EventMetadata {
  eventName: 'Transfer';
  from: string;
  to: string;
  tokenId: bigint;
}

/**
 * Evento: Approval (estándar ERC721)
 */
export interface ApprovalEvent extends EventMetadata {
  eventName: 'Approval';
  owner: string;
  approved: string;
  tokenId: bigint;
}

/**
 * Evento: ApprovalForAll (estándar ERC721)
 */
export interface ApprovalForAllEvent extends EventMetadata {
  eventName: 'ApprovalForAll';
  owner: string;
  operator: string;
  approved: boolean;
}

/**
 * Evento: TokenMinted
 */
export interface TokenMintedEvent extends EventMetadata {
  eventName: 'TokenMinted';
  to: string;
  tokenId: bigint;
}

/**
 * Evento: TokenBurnt
 */
export interface TokenBurntEvent extends EventMetadata {
  eventName: 'TokenBurnt';
  tokenId: bigint;
  burner: string;
}

/**
 * Evento: SkinCreated
 */
export interface SkinCreatedEvent extends EventMetadata {
  eventName: 'SkinCreated';
  skinId: bigint;
  name: string;
  rarity: bigint;
}

/**
 * Evento: SkinAssigned
 */
export interface SkinAssignedEvent extends EventMetadata {
  eventName: 'SkinAssigned';
  tokenId: bigint;
  skinId: bigint;
  name: string;
}

/**
 * Evento: SkinUpdated
 */
export interface SkinUpdatedEvent extends EventMetadata {
  eventName: 'SkinUpdated';
  skinId: bigint;
  name: string;
  rarity: bigint;
  active: boolean;
}

/**
 * Evento: SkinRemoved
 */
export interface SkinRemovedEvent extends EventMetadata {
  eventName: 'SkinRemoved';
  skinId: bigint;
}

/**
 * Evento: RandomSkinToggled
 */
export interface RandomSkinToggledEvent extends EventMetadata {
  eventName: 'RandomSkinToggled';
  enabled: boolean;
}

/**
 * Evento: MutationAssigned
 */
export interface MutationAssignedEvent extends EventMetadata {
  eventName: 'MutationAssigned';
  tokenId: bigint;
}

/**
 * Evento: MutationNameAssigned
 */
export interface MutationNameAssignedEvent extends EventMetadata {
  eventName: 'MutationNameAssigned';
  tokenId: bigint;
  newMutation: string;
}

/**
 * Evento: SerumApplied
 */
export interface SerumAppliedEvent extends EventMetadata {
  eventName: 'SerumApplied';
  tokenId: bigint;
  serumId: bigint;
}

/**
 * Evento: MutationSkinSet
 */
export interface MutationSkinSetEvent extends EventMetadata {
  eventName: 'MutationSkinSet';
  mutation: string;
  skinId: bigint;
}

/**
 * Evento: SpecialSkinApplied
 */
export interface SpecialSkinAppliedEvent extends EventMetadata {
  eventName: 'SpecialSkinApplied';
  tokenId: bigint;
  skinId: bigint;
  mutation: string;
}

/**
 * Evento: BaseURIUpdated
 */
export interface BaseURIUpdatedEvent extends EventMetadata {
  eventName: 'BaseURIUpdated';
  newURI: string;
}

/**
 * Evento: ExtensionsContractUpdated
 */
export interface ExtensionsContractUpdatedEvent extends EventMetadata {
  eventName: 'ExtensionsContractUpdated';
  newContract: string;
}

/**
 * Evento: TraitsContractUpdated
 */
export interface TraitsContractUpdatedEvent extends EventMetadata {
  eventName: 'TraitsContractUpdated';
  newContract: string;
}

/**
 * Evento: PaymentTokenUpdated
 */
export interface PaymentTokenUpdatedEvent extends EventMetadata {
  eventName: 'PaymentTokenUpdated';
  newToken: string;
}

/**
 * Evento: TreasuryWalletUpdated
 */
export interface TreasuryWalletUpdatedEvent extends EventMetadata {
  eventName: 'TreasuryWalletUpdated';
  newWallet: string;
}

/**
 * Evento: AdminContractUpdated
 */
export interface AdminContractUpdatedEvent extends EventMetadata {
  eventName: 'AdminContractUpdated';
  newAdmin: string;
}

/**
 * Evento: FunctionImplementationUpdated
 */
export interface FunctionImplementationUpdatedEvent extends EventMetadata {
  eventName: 'FunctionImplementationUpdated';
  selector: string;
  implementation: string;
}

/**
 * Evento: ProceedsWithdrawn
 */
export interface ProceedsWithdrawnEvent extends EventMetadata {
  eventName: 'ProceedsWithdrawn';
  wallet: string;
  amount: bigint;
}

/**
 * Evento: FirstModification
 */
export interface FirstModificationEvent extends EventMetadata {
  eventName: 'FirstModification';
  tokenId: bigint;
}

/**
 * Unión de todos los eventos de AdrianLABCore
 */
export type AdrianLabCoreEvent =
  | TransferEvent
  | ApprovalEvent
  | ApprovalForAllEvent
  | TokenMintedEvent
  | TokenBurntEvent
  | SkinCreatedEvent
  | SkinAssignedEvent
  | SkinUpdatedEvent
  | SkinRemovedEvent
  | RandomSkinToggledEvent
  | MutationAssignedEvent
  | MutationNameAssignedEvent
  | SerumAppliedEvent
  | MutationSkinSetEvent
  | SpecialSkinAppliedEvent
  | BaseURIUpdatedEvent
  | ExtensionsContractUpdatedEvent
  | TraitsContractUpdatedEvent
  | PaymentTokenUpdatedEvent
  | TreasuryWalletUpdatedEvent
  | AdminContractUpdatedEvent
  | FunctionImplementationUpdatedEvent
  | ProceedsWithdrawnEvent
  | FirstModificationEvent;

/**
 * Helper para convertir bigint a string (para JSONB)
 */
export function bigintToString(value: bigint): string {
  return value.toString();
}

