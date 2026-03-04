// Quest templates - the quest system uses these to generate actual quest instances
// All quest data should be defined here for easy extensibility

export const QUEST_TEMPLATES = [
  // ─── SLAY QUESTS ────────────────────────────────────────────────────────────
  {
    id: 'slay_wolves',
    type: 'slay',
    title: 'Wolf Problem',
    description: 'The wolves have been attacking livestock and farmers. Slay {count} wolves near {location}.',
    giver_type: 'quest_giver',
    target: { monster: 'wolf', count: [3, 6] },
    reward: { gold: [20, 50], xp: [30, 50], items: [] },
    dangerLevel: 1,
    hint: 'Wolves roam the grasslands and forests nearby.',
    completionText: 'The farms are safer now. Here\'s your reward, well earned.',
    tags: ['outside', 'nature'],
  },
  {
    id: 'slay_goblins',
    type: 'slay',
    title: 'Goblin Trouble',
    description: 'A goblin warband has been raiding travelers. Deal with {count} goblins at {location}.',
    giver_type: 'quest_giver',
    target: { monster: 'goblin', count: [4, 8] },
    reward: { gold: [30, 60], xp: [40, 60], items: [] },
    dangerLevel: 1,
    hint: 'Goblins camp in the hills and forests.',
    completionText: 'That should send them packing. Thank you, adventurer.',
    tags: ['combat', 'banditry'],
  },
  {
    id: 'slay_bandits',
    type: 'slay',
    title: 'Road Bandits',
    description: 'Bandits have been preying on merchants. Slay {count} bandits and make the road safe.',
    giver_type: 'quest_giver',
    target: { monster: 'bandit', count: [3, 5] },
    reward: { gold: [50, 100], xp: [50, 80], items: [{ id: 'healing_potion', qty: 1 }] },
    dangerLevel: 2,
    hint: 'The bandits ambush travellers between towns.',
    completionText: 'Excellent work! The merchant guild will hear of this.',
    tags: ['combat', 'road'],
  },
  {
    id: 'slay_spiders',
    type: 'slay',
    title: 'Spider Infestation',
    description: 'Giant spiders have nested near the mine. Clear out {count} spiders.',
    giver_type: 'quest_giver',
    target: { monster: 'giant_spider', count: [3, 5] },
    reward: { gold: [40, 80], xp: [40, 70], items: [{ id: 'antidote', qty: 2 }] },
    dangerLevel: 2,
    hint: 'Spiders prefer dark, enclosed spaces like caves and dense forest.',
    completionText: 'The workers can return to the mine safely now.',
    tags: ['dungeon', 'nature'],
  },

  // ─── FETCH / DELIVERY QUESTS ─────────────────────────────────────────────────
  {
    id: 'fetch_herb',
    type: 'fetch',
    title: 'Rare Herbs',
    description: 'The healer needs {count} healing herbs from the forest. Bring them back safely.',
    giver_type: 'healer',
    target: { item: 'healing_herb', count: [3, 5] },
    reward: { gold: [15, 30], xp: [20, 35], items: [{ id: 'healing_potion', qty: 1 }] },
    dangerLevel: 1,
    hint: 'Herbs grow in forests and meadows. Use Herbalism to find more.',
    completionText: 'These are exactly what I needed. Here is something for your trouble.',
    tags: ['gather', 'nature'],
  },
  {
    id: 'deliver_message',
    type: 'deliver',
    title: 'Urgent Correspondence',
    description: 'Deliver this sealed letter to {target_npc} in {target_town}. It is most urgent.',
    giver_type: 'quest_giver',
    target: { deliver: 'letter', toNpcType: 'quest_giver' },
    reward: { gold: [25, 45], xp: [25, 40], items: [] },
    dangerLevel: 1,
    hint: 'The recipient is in a nearby town.',
    completionText: 'Thank the stars you\'ve arrived. I\'ve been waiting for this message.',
    tags: ['travel', 'social'],
  },
  {
    id: 'fetch_ingredient',
    type: 'fetch',
    title: 'Alchemical Ingredient',
    description: 'I need a {item} for my experiments. Find one and bring it to me.',
    giver_type: 'quest_giver',
    target: { item: 'random_monster_drop', count: [1, 1] },
    reward: { gold: [30, 60], xp: [30, 50], items: [{ id: 'mana_potion', qty: 1 }] },
    dangerLevel: 2,
    hint: 'Monster drops can be found by defeating creatures in the wild.',
    completionText: 'Wonderful! This will make a most potent reagent.',
    tags: ['gather', 'combat'],
  },
  {
    id: 'buy_item',
    type: 'fetch',
    title: 'Shop Errand',
    description: 'Could you buy a {item} from the local shop? I\'m too busy to go myself.',
    giver_type: 'villager',
    target: { item: 'healing_potion', count: [1, 1], source: 'shop' },
    reward: { gold: [20, 35], xp: [15, 25], items: [] },
    dangerLevel: 0,
    hint: 'Visit the local shop.',
    completionText: 'Oh wonderful, exactly what I needed. Here, take a little extra for your trouble.',
    tags: ['social', 'easy'],
  },

  // ─── ESCORT QUESTS ──────────────────────────────────────────────────────────
  {
    id: 'escort_merchant',
    type: 'escort',
    title: 'Safe Passage',
    description: 'Escort this merchant safely to {target_town}. The roads are not safe.',
    giver_type: 'quest_giver',
    target: { escort: 'merchant', toTown: 'nearest' },
    reward: { gold: [60, 100], xp: [60, 90], items: [] },
    dangerLevel: 2,
    hint: 'Travel to the destination town without the escort dying.',
    completionText: 'We made it! I thought for sure those bandits would finish us.',
    tags: ['travel', 'combat'],
  },

  // ─── INVESTIGATION QUESTS ─────────────────────────────────────────────────────
  {
    id: 'investigate_ruins',
    type: 'investigate',
    title: 'Strange Ruins',
    description: 'Strange sounds come from the ruins at {location}. Investigate and report back.',
    giver_type: 'quest_giver',
    target: { investigate: 'ruins', location: 'ruins' },
    reward: { gold: [40, 70], xp: [50, 80], items: [{ id: 'scroll_fire', qty: 1 }] },
    dangerLevel: 2,
    hint: 'Find the ruins on the world map and enter them.',
    completionText: 'Just as I feared. Thank you for the report—and for returning alive.',
    tags: ['exploration', 'dungeon'],
  },
  {
    id: 'clear_dungeon',
    type: 'clear',
    title: 'Dungeon Delve',
    description: 'The dungeon at {location} harbours dangerous creatures. Clear it out.',
    giver_type: 'quest_giver',
    target: { clear: 'dungeon', location: 'dungeon' },
    reward: { gold: [80, 150], xp: [100, 150], items: [] },
    dangerLevel: 3,
    hint: 'Explore the entire dungeon and defeat its inhabitants.',
    completionText: 'The region is safer thanks to you. Take this as a token of gratitude.',
    tags: ['dungeon', 'combat'],
  },
];

// Status constants for quest instances
export const QUEST_STATUS = {
  AVAILABLE:   'available',
  ACTIVE:      'active',
  COMPLETED:   'completed',
  FAILED:      'failed',
  TURNED_IN:   'turned_in',
};

// Max concurrent active quests
export const MAX_ACTIVE_QUESTS = 5;

export function getQuestTemplate(id) {
  return QUEST_TEMPLATES.find(q => q.id === id);
}
