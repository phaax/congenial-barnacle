// @ts-nocheck
// Skill definitions - extendable array
// Each skill has passive effects and/or active abilities
export const SKILLS = [
  {
    id: 'swordsmanship',
    name: 'Swordsmanship',
    shortName: 'Sword',
    description: 'Master of bladed weapons. Deal more damage and unlock powerful combat moves.',
    icon: '†',
    passive: { meleeDmgBonus: 0.15, critChance: 5 },
    abilities: [
      { id: 'power_strike', name: 'Power Strike', desc: 'Deal 2x damage, -5 to hit.', mpCost: 2 },
    ],
    category: 'combat',
    lore: 'A lifetime of drills and battles hones the blade to perfection.',
  },
  {
    id: 'archery',
    name: 'Archery',
    shortName: 'Archery',
    description: 'Expert with ranged weapons. Fire arrows from a distance, striking before enemies can close.',
    icon: '↑',
    passive: { rangedDmgBonus: 0.15, firstStrikeChance: 30 },
    abilities: [
      { id: 'aimed_shot', name: 'Aimed Shot', desc: 'Triple damage but skip your next turn.', mpCost: 3 },
    ],
    category: 'combat',
    lore: 'Patience and a steady hand are the archer\'s greatest weapons.',
  },
  {
    id: 'magic',
    name: 'Arcane Magic',
    shortName: 'Magic',
    description: 'Wield powerful spells. Cast fireballs, lightning and other devastating attacks.',
    icon: '★',
    passive: { mpBonus: 0.25, spellDmgBonus: 0.20 },
    abilities: [
      { id: 'fireball',    name: 'Fireball',    desc: 'Deal 2d8 fire damage.',    mpCost: 4 },
      { id: 'frost_bolt',  name: 'Frost Bolt',  desc: 'Deal 1d8 ice damage, enemy loses next turn.', mpCost: 3 },
      { id: 'magic_shield', name: 'Magic Shield', desc: 'Absorb next hit, up to 10 damage.', mpCost: 3 },
    ],
    category: 'magic',
    lore: 'The arcane arts are dangerous and exhilarating in equal measure.',
  },
  {
    id: 'healing',
    name: 'Healing Arts',
    shortName: 'Healing',
    description: 'Mend wounds with nature and divine power. Recover more at inns and use herbs effectively.',
    icon: '♥',
    passive: { innHealBonus: 0.25, herbEfficiency: 0.50 },
    abilities: [
      { id: 'heal',       name: 'Heal',       desc: 'Restore 2d6+WIS HP.',              mpCost: 3 },
      { id: 'cure',       name: 'Cure',       desc: 'Remove one status ailment.',        mpCost: 2 },
      { id: 'fortify',    name: 'Fortify',    desc: '+3 defense for 3 turns.',           mpCost: 4 },
    ],
    category: 'magic',
    lore: 'A healer saves more lives on one battlefield than a warrior could in a year.',
  },
  {
    id: 'stealth',
    name: 'Stealth',
    shortName: 'Stealth',
    description: 'Move unseen. Avoid random encounters on the world map and deal bonus damage on first strike.',
    icon: '░',
    passive: { encounterReduction: 30, backstabBonus: 0.50 },
    abilities: [
      { id: 'vanish',     name: 'Vanish',     desc: '70% chance to flee from any combat.', mpCost: 2 },
      { id: 'backstab',   name: 'Backstab',   desc: 'On first turn, deal 2.5x damage.',   mpCost: 0 },
    ],
    category: 'rogue',
    lore: 'In the shadows, one figure moves where others dare not tread.',
  },
  {
    id: 'lockpicking',
    name: 'Lockpicking',
    shortName: 'Locks',
    description: 'Open locked chests and doors without keys. Find better loot in dungeons.',
    icon: '♦',
    passive: { lockSuccessBonus: 40, lootQualityBonus: 0.15 },
    abilities: [],
    category: 'rogue',
    lore: 'Every lock is a puzzle waiting to be solved.',
  },
  {
    id: 'bargaining',
    name: 'Bargaining',
    shortName: 'Barter',
    description: 'Negotiate better prices. Buy for less and sell for more at any shop.',
    icon: '$',
    passive: { buyDiscount: 0.15, sellBonus: 0.15 },
    abilities: [],
    category: 'social',
    lore: 'Gold spent wisely is gold doubled.',
  },
  {
    id: 'tracking',
    name: 'Tracking',
    shortName: 'Track',
    description: 'Read the land like a book. Know what monsters lurk in an area and gain tactical advantages.',
    icon: '…',
    passive: { encounterPreview: true, initiativeBonus: 3 },
    abilities: [
      { id: 'scout', name: 'Scout', desc: 'Preview next 3 possible encounters.', mpCost: 1 },
    ],
    category: 'exploration',
    lore: 'A broken twig, a disturbed stone—the world speaks to those who listen.',
  },
  {
    id: 'herbalism',
    name: 'Herbalism',
    shortName: 'Herbs',
    description: 'Find medicinal plants while travelling. Craft potions from gathered ingredients.',
    icon: '¿',
    passive: { herbFindChance: 25, herbPotency: 0.20 },
    abilities: [
      { id: 'forage', name: 'Forage', desc: 'Search for useful herbs. (Once per area)', mpCost: 0 },
    ],
    category: 'exploration',
    lore: 'Nature provides all the medicine one needs, if only you know where to look.',
  },
  {
    id: 'fortitude',
    name: 'Fortitude',
    shortName: 'Fortitude',
    description: 'Toughen your body and will. Gain significantly more HP and resist status effects.',
    icon: '█',
    passive: { hpBonus: 0.20, statusResist: 25 },
    abilities: [
      { id: 'second_wind', name: 'Second Wind', desc: 'Recover 25% of max HP instantly.', mpCost: 0, cooldown: 1 },
    ],
    category: 'combat',
    lore: 'Pain is temporary. Victory is eternal.',
  },
];

export function getSkill(id) {
  return SKILLS.find(s => s.id === id);
}

export function getSkillsByCategory(category) {
  return SKILLS.filter(s => s.category === category);
}
