/**
 * Tipos TypeScript para eventos del contrato $ADRIAN Token
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
 * Evento: Transfer (estándar ERC20)
 */
export interface TransferEvent extends EventMetadata {
  eventName: 'Transfer';
  from: string;
  to: string;
  value: bigint;
}

/**
 * Evento: Approval (estándar ERC20)
 */
export interface ApprovalEvent extends EventMetadata {
  eventName: 'Approval';
  owner: string;
  spender: string;
  value: bigint;
}

/**
 * Evento: TaxFeeUpdated
 */
export interface TaxFeeUpdatedEvent extends EventMetadata {
  eventName: 'TaxFeeUpdated';
  newTaxFee: bigint;
}

/**
 * Evento: CreatorFeeUpdated
 */
export interface CreatorFeeUpdatedEvent extends EventMetadata {
  eventName: 'CreatorFeeUpdated';
  newCreatorFee: bigint;
}

/**
 * Evento: BurnFeeUpdated
 */
export interface BurnFeeUpdatedEvent extends EventMetadata {
  eventName: 'BurnFeeUpdated';
  newBurnFee: bigint;
}

/**
 * Evento: TaxAddressUpdated
 */
export interface TaxAddressUpdatedEvent extends EventMetadata {
  eventName: 'TaxAddressUpdated';
  newTaxAddress: string;
}

/**
 * Evento: CreatorAddressUpdated
 */
export interface CreatorAddressUpdatedEvent extends EventMetadata {
  eventName: 'CreatorAddressUpdated';
  newCreatorAddress: string;
}

/**
 * Evento: FeeExemptionUpdated
 */
export interface FeeExemptionUpdatedEvent extends EventMetadata {
  eventName: 'FeeExemptionUpdated';
  account: string;
  isExempt: boolean;
}

/**
 * Evento: Staked
 */
export interface StakedEvent extends EventMetadata {
  eventName: 'Staked';
  staker: string;
  amount: bigint;
}

/**
 * Evento: WithdrawnStake
 */
export interface WithdrawnStakeEvent extends EventMetadata {
  eventName: 'WithdrawnStake';
  staker: string;
  amount: bigint;
  reward: bigint;
}

/**
 * Evento: RewardRateUpdated
 */
export interface RewardRateUpdatedEvent extends EventMetadata {
  eventName: 'RewardRateUpdated';
  newRewardRate: bigint;
}

/**
 * Evento: GalleryAction
 */
export interface GalleryActionEvent extends EventMetadata {
  eventName: 'GalleryAction';
  from: string;
  to: string;
  amount: bigint;
  action: string;
}

/**
 * Unión de todos los eventos posibles
 */
export type AdrianTokenEvent =
  | TransferEvent
  | ApprovalEvent
  | TaxFeeUpdatedEvent
  | CreatorFeeUpdatedEvent
  | BurnFeeUpdatedEvent
  | TaxAddressUpdatedEvent
  | CreatorAddressUpdatedEvent
  | FeeExemptionUpdatedEvent
  | StakedEvent
  | WithdrawnStakeEvent
  | RewardRateUpdatedEvent
  | GalleryActionEvent;

/**
 * Helper para convertir bigint a string (para almacenamiento en DB)
 */
export function bigintToString(value: bigint): string {
  return value.toString();
}

