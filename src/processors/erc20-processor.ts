/**
 * Procesador de eventos ERC20
 * Maneja Transfer, Approval y eventos custom de contratos ERC20
 */

import { getSupabaseClient } from '../supabase/client.js';
import type {
  AdrianTokenEvent,
  TransferEvent,
  ApprovalEvent,
  TaxFeeUpdatedEvent,
  CreatorFeeUpdatedEvent,
  BurnFeeUpdatedEvent,
  TaxAddressUpdatedEvent,
  CreatorAddressUpdatedEvent,
  FeeExemptionUpdatedEvent,
  StakedEvent,
  WithdrawnStakeEvent,
  RewardRateUpdatedEvent,
  GalleryActionEvent,
} from '../contracts/types/adrian-token-events.js';
import { bigintToString } from '../contracts/types/adrian-token-events.js';

/**
 * Procesar evento Transfer
 */
async function processTransferEvent(
  event: TransferEvent,
  contractAddress: string,
  blockTimestamp?: Date
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.from('erc20_transfers').insert({
    contract_address: contractAddress.toLowerCase(),
    from_address: event.from.toLowerCase(),
    to_address: event.to.toLowerCase(),
    value_wei: bigintToString(event.value),
    tx_hash: event.txHash,
    log_index: event.logIndex,
    block_number: Number(event.blockNumber),
    created_at: blockTimestamp?.toISOString() || new Date().toISOString(),
  });

  if (error) {
    // Ignorar errores de duplicados (idempotencia)
    if (error.code === '23505') {
      return;
    }
    console.error(
      `[ADRIAN-ERC20] Error al insertar Transfer:`,
      error,
      event
    );
    throw error;
  }
}

/**
 * Procesar evento Approval
 */
async function processApprovalEvent(
  event: ApprovalEvent,
  contractAddress: string,
  blockTimestamp?: Date
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.from('erc20_approvals').insert({
    contract_address: contractAddress.toLowerCase(),
    owner: event.owner.toLowerCase(),
    spender: event.spender.toLowerCase(),
    value_wei: bigintToString(event.value),
    tx_hash: event.txHash,
    log_index: event.logIndex,
    block_number: Number(event.blockNumber),
    created_at: blockTimestamp?.toISOString() || new Date().toISOString(),
  });

  if (error) {
    // Ignorar errores de duplicados (idempotencia)
    if (error.code === '23505') {
      return;
    }
    console.error(
      `[ADRIAN-ERC20] Error al insertar Approval:`,
      error,
      event
    );
    throw error;
  }
}

/**
 * Procesar eventos custom
 */
async function processCustomEvent(
  event:
    | TaxFeeUpdatedEvent
    | CreatorFeeUpdatedEvent
    | BurnFeeUpdatedEvent
    | TaxAddressUpdatedEvent
    | CreatorAddressUpdatedEvent
    | FeeExemptionUpdatedEvent
    | StakedEvent
    | WithdrawnStakeEvent
    | RewardRateUpdatedEvent
    | GalleryActionEvent,
  contractAddress: string,
  blockTimestamp?: Date
): Promise<void> {
  const supabase = getSupabaseClient();

  // Convertir evento a JSONB según su tipo
  let eventData: Record<string, any> = {};

  switch (event.eventName) {
    case 'TaxFeeUpdated':
      eventData = { newTaxFee: bigintToString(event.newTaxFee) };
      break;
    case 'CreatorFeeUpdated':
      eventData = { newCreatorFee: bigintToString(event.newCreatorFee) };
      break;
    case 'BurnFeeUpdated':
      eventData = { newBurnFee: bigintToString(event.newBurnFee) };
      break;
    case 'TaxAddressUpdated':
      eventData = { newTaxAddress: event.newTaxAddress.toLowerCase() };
      break;
    case 'CreatorAddressUpdated':
      eventData = {
        newCreatorAddress: event.newCreatorAddress.toLowerCase(),
      };
      break;
    case 'FeeExemptionUpdated':
      eventData = {
        account: event.account.toLowerCase(),
        isExempt: event.isExempt,
      };
      break;
    case 'Staked':
      eventData = {
        staker: event.staker.toLowerCase(),
        amount: bigintToString(event.amount),
      };
      break;
    case 'WithdrawnStake':
      eventData = {
        staker: event.staker.toLowerCase(),
        amount: bigintToString(event.amount),
        reward: bigintToString(event.reward),
      };
      break;
    case 'RewardRateUpdated':
      eventData = { newRewardRate: bigintToString(event.newRewardRate) };
      break;
    case 'GalleryAction':
      eventData = {
        from: event.from.toLowerCase(),
        to: event.to.toLowerCase(),
        amount: bigintToString(event.amount),
        action: event.action,
      };
      break;
  }

  const { error } = await supabase.from('erc20_custom_events').insert({
    contract_address: contractAddress.toLowerCase(),
    event_name: event.eventName,
    event_data: eventData,
    tx_hash: event.txHash,
    log_index: event.logIndex,
    block_number: Number(event.blockNumber),
    created_at: blockTimestamp?.toISOString() || new Date().toISOString(),
  });

  if (error) {
    // Ignorar errores de duplicados (idempotencia)
    if (error.code === '23505') {
      return;
    }
    console.error(
      `[ADRIAN-ERC20] Error al insertar evento custom ${event.eventName}:`,
      error,
      event
    );
    throw error;
  }
}

/**
 * Procesar un evento según su tipo
 */
export async function processERC20Event(
  event: AdrianTokenEvent,
  contractAddress: string,
  blockTimestamp?: Date
): Promise<void> {
  switch (event.eventName) {
    case 'Transfer':
      await processTransferEvent(event, contractAddress, blockTimestamp);
      break;
    case 'Approval':
      await processApprovalEvent(event, contractAddress, blockTimestamp);
      break;
    case 'TaxFeeUpdated':
    case 'CreatorFeeUpdated':
    case 'BurnFeeUpdated':
    case 'TaxAddressUpdated':
    case 'CreatorAddressUpdated':
    case 'FeeExemptionUpdated':
    case 'Staked':
    case 'WithdrawnStake':
    case 'RewardRateUpdated':
    case 'GalleryAction':
      await processCustomEvent(event, contractAddress, blockTimestamp);
      break;
    default:
      console.warn(
        `[ADRIAN-ERC20] Evento desconocido:`,
        (event as any).eventName
      );
  }
}

