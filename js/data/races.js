// Race definitions - easy to extend by adding entries to this array
export const RACES = [
  {
    id: 'human',
    name: 'Human',
    description: 'Adaptable and ambitious. Humans receive a bonus skill slot and balanced stats, making them excel in any role.',
    symbol: '@',
    statMods: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 1 },
    bonusSkillSlots: 1,
    traits: [
      { id: 'adaptable', name: 'Adaptable', desc: 'Gain +1 to any stat of your choice each level.' },
      { id: 'ambitious', name: 'Ambitious',  desc: 'Gain 10% bonus experience from all sources.' },
    ],
    startHp: 14,
    startMp: 6,
    lore: 'Humans are the most widespread race in the realm, found in every city and hamlet. Their short lives drive them to achieve much in little time.',
  },
  {
    id: 'elf',
    name: 'Elf',
    description: 'Graceful and long-lived. Elves excel in magic and dexterity but are physically fragile.',
    symbol: '@',
    statMods: { str: -1, dex: 2, con: -1, int: 2, wis: 1, cha: 1 },
    bonusSkillSlots: 0,
    traits: [
      { id: 'darkvision',    name: 'Darkvision',    desc: 'Can see in complete darkness within dungeons.' },
      { id: 'arcane_aptitude', name: 'Arcane Aptitude', desc: 'Spells cost 1 less MP (minimum 1).' },
      { id: 'elven_grace',   name: 'Elven Grace',   desc: '+10% dodge chance in combat.' },
    ],
    startHp: 10,
    startMp: 12,
    lore: 'The elves were old when the mountains were young. They dwell in ancient forests and hidden vales, guardians of forgotten lore.',
  },
  {
    id: 'dwarf',
    name: 'Dwarf',
    description: 'Stout and resilient. Dwarves are natural warriors and craftsmen with deep underground knowledge.',
    symbol: '@',
    statMods: { str: 2, dex: -1, con: 3, int: 0, wis: 1, cha: -1 },
    bonusSkillSlots: 0,
    traits: [
      { id: 'stonecunning', name: 'Stonecunning', desc: 'Automatically detect secret doors in dungeons.' },
      { id: 'tough',        name: 'Tough',        desc: 'Reduce all incoming damage by 1 (minimum 1).' },
      { id: 'brew_master',  name: 'Brew Master',  desc: 'Potions restore 25% more health.' },
    ],
    startHp: 18,
    startMp: 4,
    lore: 'Dwarves carve their great halls beneath the mountains, their smiths working tireless forges. They hold grudges for centuries and never forget a debt.',
  },
  {
    id: 'halfling',
    name: 'Halfling',
    description: 'Small but surprisingly lucky. Halflings are nimble, sociable, and difficult to hit.',
    symbol: '@',
    statMods: { str: -2, dex: 2, con: 0, int: 0, wis: 1, cha: 2 },
    bonusSkillSlots: 0,
    traits: [
      { id: 'lucky',      name: 'Lucky',      desc: 'Once per combat, reroll one attack or damage roll and take the better result.' },
      { id: 'small_size', name: 'Small Size', desc: '+15% dodge chance but -1 to damage with heavy weapons.' },
      { id: 'social',     name: 'Social',     desc: 'Shop prices are 10% better for halflings.' },
    ],
    startHp: 12,
    startMp: 6,
    lore: 'Halflings live in cozy burrows and rolling green hills. Do not mistake their cheerful demeanour for weakness—they are tougher than they look.',
  },
  {
    id: 'half_orc',
    name: 'Half-Orc',
    description: 'Powerful warriors caught between two worlds. Half-orcs are among the strongest fighters.',
    symbol: '@',
    statMods: { str: 3, dex: 0, con: 2, int: -1, wis: -1, cha: -2 },
    bonusSkillSlots: 0,
    traits: [
      { id: 'relentless', name: 'Relentless', desc: 'When reduced to 0 HP for the first time in combat, survive with 1 HP instead.' },
      { id: 'savage',     name: 'Savage',     desc: '+20% critical hit damage.' },
      { id: 'intimidate', name: 'Intimidate', desc: '15% chance enemies flee on your first attack.' },
    ],
    startHp: 16,
    startMp: 4,
    lore: 'Born of human and orc heritage, half-orcs struggle to find acceptance in either culture. Many turn to adventuring where strength matters more than lineage.',
  },
];

export function getRace(id) {
  return RACES.find(r => r.id === id);
}
