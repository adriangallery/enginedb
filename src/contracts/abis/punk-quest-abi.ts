/**
 * ABI del contrato PunkQuest
 * Eventos de staking, items y quests
 */

export const PUNK_QUEST_ABI = [
  {
    type: 'event',
    name: 'Staked',
    anonymous: false,
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'id', type: 'uint256', indexed: true },
      { name: 'ts', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'RewardClaimed',
    anonymous: false,
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'id', type: 'uint256', indexed: true },
      { name: 'reward', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Unstaked',
    anonymous: false,
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'id', type: 'uint256', indexed: true },
      { name: 'ts', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'FastLevelUpgradePurchased',
    anonymous: false,
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'id', type: 'uint256', indexed: true },
      { name: 'bonusAdded', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ItemAdded',
    anonymous: false,
    inputs: [
      { name: 'id', type: 'uint256', indexed: false },
      { name: 't', type: 'string', indexed: false },
      { name: 'p', type: 'uint256', indexed: false },
      { name: 'b', type: 'uint256', indexed: false },
      { name: 'd', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ItemUpdated',
    anonymous: false,
    inputs: [
      { name: 'id', type: 'uint256', indexed: false },
      { name: 't', type: 'string', indexed: false },
      { name: 'p', type: 'uint256', indexed: false },
      { name: 'b', type: 'uint256', indexed: false },
      { name: 'd', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ItemPurchasedInStore',
    anonymous: false,
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'id', type: 'uint256', indexed: false },
      { name: 'q', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ItemEquipped',
    anonymous: false,
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'id', type: 'uint256', indexed: true },
      { name: 'itm', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ArmoryBonusUpdated',
    anonymous: false,
    inputs: [
      { name: 'id', type: 'uint256', indexed: true },
      { name: 'bonus', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'EventDefinitionAdded',
    anonymous: false,
    inputs: [
      { name: 'id', type: 'uint256', indexed: false },
      { name: 'n', type: 'string', indexed: false },
      { name: 'adj', type: 'int256', indexed: false },
      { name: 'd', type: 'string', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'EventTriggered',
    anonymous: false,
    inputs: [
      { name: 'op', type: 'address', indexed: true },
      { name: 'id', type: 'uint256', indexed: false },
      { name: 'ev', type: 'uint256', indexed: false },
      { name: 'adj', type: 'int256', indexed: false },
      { name: 'n', type: 'string', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'AdvancedEventDefinitionAdded',
    anonymous: false,
    inputs: [
      { name: 'id', type: 'uint256', indexed: false },
      { name: 'n', type: 'string', indexed: false },
      { name: 'adj', type: 'int256', indexed: false },
      { name: 'd', type: 'string', indexed: false },
      { name: 'deg', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'AdvancedEventTriggered',
    anonymous: false,
    inputs: [
      { name: 'op', type: 'address', indexed: true },
      { name: 'id', type: 'uint256', indexed: false },
      { name: 'ev', type: 'uint256', indexed: false },
      { name: 'adj', type: 'int256', indexed: false },
      { name: 'n', type: 'string', indexed: false },
    ],
  },
] as const;

