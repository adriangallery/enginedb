/**
 * ABI estándar ERC1155
 * Eventos: TransferSingle, TransferBatch, ApprovalForAll, URI
 */

export const ERC1155_STANDARD_ABI = [
  {
    type: 'event',
    name: 'TransferSingle',
    anonymous: false,
    inputs: [
      { name: 'operator', type: 'address', indexed: true },
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'id', type: 'uint256', indexed: false },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'TransferBatch',
    anonymous: false,
    inputs: [
      { name: 'operator', type: 'address', indexed: true },
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'ids', type: 'uint256[]', indexed: false },
      { name: 'values', type: 'uint256[]', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ApprovalForAll',
    anonymous: false,
    inputs: [
      { name: 'account', type: 'address', indexed: true },
      { name: 'operator', type: 'address', indexed: true },
      { name: 'approved', type: 'bool', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'URI',
    anonymous: false,
    inputs: [
      { name: 'value', type: 'string', indexed: false },
      { name: 'id', type: 'uint256', indexed: true },
    ],
  },
] as const;

