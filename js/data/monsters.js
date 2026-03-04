// Monster definitions - extend this array to add new enemies
// Stats scale with level; base values are for level 1
export const MONSTERS = [
  // ─── Tier 1: Weak ───────────────────────────────────────────────────────────
  {
    id: 'giant_rat',
    name: 'Giant Rat',
    symbol: 'r',
    fg: 6, // BROWN
    tier: 1,
    hp: [4, 8],       // [min, max] rolled on spawn
    atk: [2, 4],
    def: 0,
    xp: 14,
    gold: [0, 3],
    loot: [{ id: 'rat_tail', chance: 30 }],
    abilities: [],
    description: 'A rat the size of a dog. Filthy and aggressive.',
    flavorText: ['It hisses at you.', 'Its red eyes gleam in the darkness.'],
  },
  {
    id: 'slime',
    name: 'Slime',
    symbol: 's',
    fg: 10, // GREEN
    tier: 1,
    hp: [6, 10],
    atk: [1, 3],
    def: 1,
    xp: 16,
    gold: [0, 2],
    loot: [{ id: 'slime_jelly', chance: 50 }],
    abilities: [{ id: 'corrode', name: 'Corrode', desc: 'Reduces armor by 1.', chance: 20 }],
    description: 'A gelatinous blob of corrosive goo.',
    flavorText: ['It squelches menacingly.', 'The slime oozes toward you.'],
  },
  {
    id: 'wolf',
    name: 'Wolf',
    symbol: 'w',
    fg: 7, // LIGHT_GRAY
    tier: 1,
    hp: [8, 14],
    atk: [3, 6],
    def: 1,
    xp: 26,
    gold: [0, 2],
    loot: [{ id: 'wolf_pelt', chance: 40 }, { id: 'wolf_fang', chance: 25 }],
    abilities: [{ id: 'pack_tactics', name: 'Pack Tactics', desc: '+2 attack if another wolf is present.', chance: 0 }],
    description: 'A large grey wolf with hungry eyes.',
    flavorText: ['It snarls, exposing yellowed fangs.', 'The wolf circles you warily.'],
  },
  {
    id: 'goblin',
    name: 'Goblin',
    symbol: 'g',
    fg: 2, // DARK_GREEN
    tier: 1,
    hp: [5, 10],
    atk: [2, 5],
    def: 1,
    xp: 20,
    gold: [1, 8],
    loot: [{ id: 'crude_dagger', chance: 15 }, { id: 'stolen_coin', chance: 30 }],
    abilities: [{ id: 'flee', name: 'Flee', desc: 'Runs away when below 25% HP.', chance: 0 }],
    description: 'A small, cunning creature with a talent for ambush.',
    flavorText: ['The goblin cackles. "Your gold or your life!"', '"Stupid adventurer! Skreek will get you!"'],
  },
  {
    id: 'bandit',
    name: 'Bandit',
    symbol: 'B',
    fg: 6, // BROWN
    tier: 1,
    hp: [10, 18],
    atk: [3, 7],
    def: 2,
    xp: 32,
    gold: [5, 20],
    loot: [{ id: 'short_sword', chance: 10 }, { id: 'leather_armor', chance: 8 }],
    abilities: [{ id: 'trip', name: 'Trip', desc: 'Target loses next turn.', chance: 15 }],
    description: 'A desperate criminal who\'d rather take your valuables than earn them.',
    flavorText: ['"Hand over your coin and we\'ll let you live."', '"Nothing personal. Just business."'],
  },
  {
    id: 'sand_snake',
    name: 'Sand Snake',
    symbol: 's',
    fg: 14, // YELLOW
    tier: 1,
    hp: [4, 8],
    atk: [3, 5],
    def: 0,
    xp: 22,
    gold: [0, 1],
    loot: [{ id: 'venom_sac', chance: 35 }],
    abilities: [{ id: 'poison', name: 'Poison', desc: 'Deals 1 damage per turn for 3 turns.', chance: 30 }],
    description: 'A sun-baked serpent with a venomous bite.',
    flavorText: ['The snake coils and strikes.', 'It hisses a warning.'],
  },
  {
    id: 'giant_spider',
    name: 'Giant Spider',
    symbol: 'S',
    fg: 5, // DARK_MAGENTA
    tier: 1,
    hp: [8, 14],
    atk: [3, 7],
    def: 1,
    xp: 28,
    gold: [0, 5],
    loot: [{ id: 'spider_silk', chance: 45 }, { id: 'venom_sac', chance: 20 }],
    abilities: [{ id: 'web', name: 'Web', desc: 'Target loses next turn.', chance: 25 }],
    description: 'Eight-legged horror with glistening fangs and spinning silk.',
    flavorText: ['It drops silently from the ceiling.', 'Multiple eyes watch your every move.'],
  },

  // ─── Tier 2: Medium ────────────────────────────────────────────────────────
  {
    id: 'orc',
    name: 'Orc',
    symbol: 'O',
    fg: 2, // DARK_GREEN
    tier: 2,
    hp: [16, 26],
    atk: [6, 12],
    def: 3,
    xp: 50,
    gold: [5, 25],
    loot: [{ id: 'iron_axe', chance: 12 }, { id: 'chain_mail', chance: 8 }],
    abilities: [{ id: 'battle_cry', name: 'Battle Cry', desc: '+3 attack for 2 turns.', chance: 20 }],
    description: 'A brutal warrior driven by bloodlust and tribal loyalty.',
    flavorText: ['"Waaagh!" it bellows.', 'The orc raises its axe with a terrifying roar.'],
  },
  {
    id: 'bear',
    name: 'Bear',
    symbol: 'B',
    fg: 6, // BROWN
    tier: 2,
    hp: [20, 32],
    atk: [7, 14],
    def: 3,
    xp: 55,
    gold: [0, 5],
    loot: [{ id: 'bear_pelt', chance: 50 }, { id: 'bear_claw', chance: 40 }],
    abilities: [{ id: 'maul', name: 'Maul', desc: 'Double damage.', chance: 15 }],
    description: 'A massive brown bear, territorial and short-tempered.',
    flavorText: ['The bear rears up on its hind legs.', 'An enormous roar shakes the ground.'],
  },
  {
    id: 'troll',
    name: 'Troll',
    symbol: 'T',
    fg: 2, // DARK_GREEN
    tier: 2,
    hp: [28, 40],
    atk: [8, 15],
    def: 4,
    xp: 80,
    gold: [3, 15],
    loot: [{ id: 'troll_hide', chance: 30 }],
    abilities: [{ id: 'regenerate', name: 'Regenerate', desc: 'Heals 3 HP at the start of each turn.', chance: 100 }],
    description: 'A hulking, dim-witted brute that heals at an alarming rate. Fire and acid stop the regeneration.',
    flavorText: ['The troll\'s wounds knit closed before your eyes.', '"Troll smell meat!"'],
  },
  {
    id: 'dark_elf',
    name: 'Dark Elf',
    symbol: 'E',
    fg: 13, // MAGENTA
    tier: 2,
    hp: [14, 22],
    atk: [8, 14],
    def: 3,
    xp: 70,
    gold: [10, 40],
    loot: [{ id: 'dark_elf_blade', chance: 10 }, { id: 'mana_potion', chance: 25 }],
    abilities: [
      { id: 'shadow_step', name: 'Shadow Step', desc: 'Evades one attack.', chance: 20 },
      { id: 'poison_blade', name: 'Poison Blade', desc: 'Attack poisons target.', chance: 25 },
    ],
    description: 'An exiled elf who dwells in darkness. Swift and deadly.',
    flavorText: ['"You shouldn\'t have come here, surface dweller."', 'It moves like a shadow.'],
  },

  // ─── Tier 3: Tough ─────────────────────────────────────────────────────────
  {
    id: 'ogre',
    name: 'Ogre',
    symbol: 'O',
    fg: 4, // DARK_RED
    tier: 3,
    hp: [40, 60],
    atk: [12, 20],
    def: 5,
    xp: 150,
    gold: [10, 50],
    loot: [{ id: 'ogre_club', chance: 15 }, { id: 'large_gem', chance: 8 }],
    abilities: [{ id: 'smash', name: 'Smash', desc: 'Deal 3x damage, stun for 1 turn.', chance: 20 }],
    description: 'A massive humanoid that can shatter rock with its fists.',
    flavorText: ['"SMASH!"', 'The ground trembles with each lumbering step.'],
  },
  {
    id: 'bog_wraith',
    name: 'Bog Wraith',
    symbol: 'W',
    fg: 11, // CYAN
    tier: 3,
    hp: [25, 40],
    atk: [10, 18],
    def: 2,
    xp: 130,
    gold: [5, 20],
    loot: [{ id: 'ectoplasm', chance: 40 }, { id: 'cursed_amulet', chance: 5 }],
    abilities: [
      { id: 'drain', name: 'Life Drain', desc: 'Steal 5 HP from target.', chance: 30 },
      { id: 'phase', name: 'Phase Shift', desc: '30% chance to dodge all attacks.', chance: 100 },
    ],
    description: 'A spectral horror formed from the restless dead of the marshes.',
    flavorText: ['It wails with the voice of the forgotten.', 'The temperature drops as it approaches.'],
  },

  // ─── Tier 4: Boss ──────────────────────────────────────────────────────────
  {
    id: 'dragon_young',
    name: 'Young Dragon',
    symbol: 'D',
    fg: 12, // RED
    tier: 4,
    hp: [80, 120],
    atk: [18, 28],
    def: 8,
    xp: 500,
    gold: [100, 300],
    loot: [{ id: 'dragon_scale', chance: 70 }, { id: 'dragon_tooth', chance: 50 }],
    abilities: [
      { id: 'fire_breath', name: 'Fire Breath', desc: 'Deal 3d8 fire damage to all.', chance: 25 },
      { id: 'tail_sweep', name: 'Tail Sweep', desc: 'Knock back and stun.', chance: 15 },
    ],
    description: 'Not yet fully grown, but still deadly enough to level a village.',
    flavorText: ['"Another fool seeking glory at my claws!"', 'Wings beat the air as it draws breath.'],
    isBoss: false,
  },
  {
    id: 'lich',
    name: 'The Lich',
    symbol: 'L',
    fg: 13, // MAGENTA
    tier: 5,
    hp: [150, 200],
    atk: [20, 35],
    def: 10,
    xp: 1000,
    gold: [200, 500],
    loot: [{ id: 'phylactery', chance: 100 }, { id: 'necro_staff', chance: 80 }],
    abilities: [
      { id: 'death_bolt', name: 'Death Bolt', desc: 'Deal 4d10 necrotic damage.', chance: 30 },
      { id: 'summon_undead', name: 'Summon Undead', desc: 'Summon 2 skeletons.', chance: 20 },
      { id: 'drain_life',  name: 'Drain Life',   desc: 'Steal 20 HP from target.', chance: 25 },
    ],
    description: 'An ancient undead wizard of immeasurable power. The source of all corruption in the land.',
    flavorText: ['"DEATH IS ONLY THE BEGINNING."', '"I have waited centuries. A few more moments mean nothing."'],
    isBoss: true,
  },
  {
    id: 'ancient_dragon',
    name: 'Ancient Dragon',
    symbol: 'D',
    fg: 14, // YELLOW
    tier: 5,
    hp: [200, 250],
    atk: [25, 40],
    def: 12,
    xp: 1200,
    gold: [500, 1000],
    loot: [{ id: 'dragon_heart', chance: 100 }, { id: 'epic_scale_armor', chance: 60 }],
    abilities: [
      { id: 'inferno', name: 'Inferno', desc: 'Deal 5d10 fire damage.', chance: 30 },
      { id: 'wing_gust', name: 'Wing Gust', desc: 'Stun all for 2 turns.', chance: 20 },
      { id: 'bite', name: 'Savage Bite', desc: 'Triple damage.', chance: 15 },
    ],
    description: 'A wyrm older than kingdoms. Its very breath can melt steel.',
    flavorText: ['"Another morsel arrives."', '"Thousands have failed before you. You will be no different."'],
    isBoss: true,
  },
  {
    id: 'demon_lord',
    name: 'Demon Lord',
    symbol: 'X',
    fg: 12, // RED
    tier: 5,
    hp: [180, 220],
    atk: [22, 38],
    def: 11,
    xp: 1100,
    gold: [300, 600],
    loot: [{ id: 'demon_core', chance: 100 }, { id: 'hellfire_blade', chance: 50 }],
    abilities: [
      { id: 'hellfire', name: 'Hellfire', desc: 'Deal 4d8 fire+shadow damage.', chance: 30 },
      { id: 'fear', name: 'Aura of Fear', desc: 'Player loses turn (20% chance each turn).', chance: 100 },
      { id: 'corruption', name: 'Corrupt', desc: 'Reduces max HP by 10 for the battle.', chance: 15 },
    ],
    description: 'A lord of the infernal realms, imprisoned beneath the earth for millennia and now free.',
    flavorText: ['"Your soul will burn for eternity."', '"I have devoured gods. What are you?"'],
    isBoss: true,
  },
];

export function getMonster(id) {
  return MONSTERS.find(m => m.id === id);
}

export function getMonstersByTier(tier) {
  return MONSTERS.filter(m => m.tier === tier);
}

export function getBossMonsters() {
  return MONSTERS.filter(m => m.isBoss);
}
