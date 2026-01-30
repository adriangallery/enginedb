/**
 * Procesador de eventos ERC721
 * Maneja Transfer, Approval, ApprovalForAll y eventos custom de contratos ERC721
 */

import { insertEvent } from '../supabase/client.js';
import type {
  AdrianLabCoreEvent,
  TransferEvent,
  ApprovalEvent,
  ApprovalForAllEvent,
  TokenMintedEvent,
  TokenBurntEvent,
  SkinCreatedEvent,
  SkinAssignedEvent,
  SkinUpdatedEvent,
  SkinRemovedEvent,
  RandomSkinToggledEvent,
  MutationAssignedEvent,
  MutationNameAssignedEvent,
  SerumAppliedEvent,
  MutationSkinSetEvent,
  SpecialSkinAppliedEvent,
  BaseURIUpdatedEvent,
  ExtensionsContractUpdatedEvent,
  TraitsContractUpdatedEvent,
  PaymentTokenUpdatedEvent,
  TreasuryWalletUpdatedEvent,
  AdminContractUpdatedEvent,
  FunctionImplementationUpdatedEvent,
  ProceedsWithdrawnEvent,
  FirstModificationEvent,
} from '../contracts/types/adrian-lab-core-events.js';
import { bigintToString } from '../contracts/types/adrian-lab-core-events.js';

/**
 * Procesar evento Transfer (estándar ERC721)
 */
async function processTransferEvent(
  event: TransferEvent,
  contractAddress: string,
  blockTimestamp?: Date
): Promise<void> {
  await insertEvent('erc721_transfers', {
    contract_address: contractAddress.toLowerCase(),
    from_address: event.from.toLowerCase(),
    to_address: event.to.toLowerCase(),
    token_id: bigintToString(event.tokenId),
    tx_hash: event.txHash,
    log_index: event.logIndex,
    block_number: Number(event.blockNumber),
    created_at: blockTimestamp?.toISOString() || new Date().toISOString(),
  });
}

/**
 * Procesar evento Approval (estándar ERC721)
 */
async function processApprovalEvent(
  event: ApprovalEvent,
  contractAddress: string,
  blockTimestamp?: Date
): Promise<void> {
  await insertEvent('erc721_approvals', {
    contract_address: contractAddress.toLowerCase(),
    owner: event.owner.toLowerCase(),
    approved: event.approved.toLowerCase(),
    token_id: bigintToString(event.tokenId),
    tx_hash: event.txHash,
    log_index: event.logIndex,
    block_number: Number(event.blockNumber),
    created_at: blockTimestamp?.toISOString() || new Date().toISOString(),
  });
}

/**
 * Procesar evento ApprovalForAll (estándar ERC721)
 */
async function processApprovalForAllEvent(
  event: ApprovalForAllEvent,
  contractAddress: string,
  blockTimestamp?: Date
): Promise<void> {
  await insertEvent('erc721_approvals_for_all', {
    contract_address: contractAddress.toLowerCase(),
    owner: event.owner.toLowerCase(),
    operator: event.operator.toLowerCase(),
    approved: event.approved,
    tx_hash: event.txHash,
    log_index: event.logIndex,
    block_number: Number(event.blockNumber),
    created_at: blockTimestamp?.toISOString() || new Date().toISOString(),
  });
}

/**
 * Procesar eventos custom de AdrianLABCore
 */
async function processCustomEvent(
  event:
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
    | FirstModificationEvent,
  contractAddress: string,
  blockTimestamp?: Date
): Promise<void> {
  // Convertir evento a JSONB según su tipo
  let eventData: Record<string, any> = {};

  switch (event.eventName) {
    case 'TokenMinted':
      eventData = {
        to: event.to.toLowerCase(),
        tokenId: bigintToString(event.tokenId),
      };
      break;
    case 'TokenBurnt':
      eventData = {
        tokenId: bigintToString(event.tokenId),
        burner: event.burner.toLowerCase(),
      };
      break;
    case 'SkinCreated':
      eventData = {
        skinId: bigintToString(event.skinId),
        name: event.name,
        rarity: bigintToString(event.rarity),
      };
      break;
    case 'SkinAssigned':
      eventData = {
        tokenId: bigintToString(event.tokenId),
        skinId: bigintToString(event.skinId),
        name: event.name,
      };
      break;
    case 'SkinUpdated':
      eventData = {
        skinId: bigintToString(event.skinId),
        name: event.name,
        rarity: bigintToString(event.rarity),
        active: event.active,
      };
      break;
    case 'SkinRemoved':
      eventData = {
        skinId: bigintToString(event.skinId),
      };
      break;
    case 'RandomSkinToggled':
      eventData = {
        enabled: event.enabled,
      };
      break;
    case 'MutationAssigned':
      eventData = {
        tokenId: bigintToString(event.tokenId),
      };
      break;
    case 'MutationNameAssigned':
      eventData = {
        tokenId: bigintToString(event.tokenId),
        newMutation: event.newMutation,
      };
      break;
    case 'SerumApplied':
      eventData = {
        tokenId: bigintToString(event.tokenId),
        serumId: bigintToString(event.serumId),
      };
      break;
    case 'MutationSkinSet':
      eventData = {
        mutation: event.mutation,
        skinId: bigintToString(event.skinId),
      };
      break;
    case 'SpecialSkinApplied':
      eventData = {
        tokenId: bigintToString(event.tokenId),
        skinId: bigintToString(event.skinId),
        mutation: event.mutation,
      };
      break;
    case 'BaseURIUpdated':
      eventData = {
        newURI: event.newURI,
      };
      break;
    case 'ExtensionsContractUpdated':
      eventData = {
        newContract: event.newContract.toLowerCase(),
      };
      break;
    case 'TraitsContractUpdated':
      eventData = {
        newContract: event.newContract.toLowerCase(),
      };
      break;
    case 'PaymentTokenUpdated':
      eventData = {
        newToken: event.newToken.toLowerCase(),
      };
      break;
    case 'TreasuryWalletUpdated':
      eventData = {
        newWallet: event.newWallet.toLowerCase(),
      };
      break;
    case 'AdminContractUpdated':
      eventData = {
        newAdmin: event.newAdmin.toLowerCase(),
      };
      break;
    case 'FunctionImplementationUpdated':
      eventData = {
        selector: event.selector,
        implementation: event.implementation.toLowerCase(),
      };
      break;
    case 'ProceedsWithdrawn':
      eventData = {
        wallet: event.wallet.toLowerCase(),
        amount: bigintToString(event.amount),
      };
      break;
    case 'FirstModification':
      eventData = {
        tokenId: bigintToString(event.tokenId),
      };
      break;
  }

  await insertEvent('erc721_custom_events', {
    contract_address: contractAddress.toLowerCase(),
    event_name: event.eventName,
    event_data: eventData,
    tx_hash: event.txHash,
    log_index: event.logIndex,
    block_number: Number(event.blockNumber),
    created_at: blockTimestamp?.toISOString() || new Date().toISOString(),
  });
}

/**
 * Procesar un evento según su tipo
 */
export async function processERC721Event(
  event: AdrianLabCoreEvent,
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
    case 'ApprovalForAll':
      await processApprovalForAllEvent(event, contractAddress, blockTimestamp);
      break;
    case 'TokenMinted':
    case 'TokenBurnt':
    case 'SkinCreated':
    case 'SkinAssigned':
    case 'SkinUpdated':
    case 'SkinRemoved':
    case 'RandomSkinToggled':
    case 'MutationAssigned':
    case 'MutationNameAssigned':
    case 'SerumApplied':
    case 'MutationSkinSet':
    case 'SpecialSkinApplied':
    case 'BaseURIUpdated':
    case 'ExtensionsContractUpdated':
    case 'TraitsContractUpdated':
    case 'PaymentTokenUpdated':
    case 'TreasuryWalletUpdated':
    case 'AdminContractUpdated':
    case 'FunctionImplementationUpdated':
    case 'ProceedsWithdrawn':
    case 'FirstModification':
      await processCustomEvent(event, contractAddress, blockTimestamp);
      break;
    default:
      console.warn(
        `[ERC721] Evento desconocido:`,
        (event as any).eventName
      );
  }
}

