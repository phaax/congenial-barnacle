// @ts-nocheck
// Main game goal templates - one is randomly selected per new game
// Goals drive the narrative and define the win condition

export const GOAL_TEMPLATES = [
  {
    id: 'destroy_boss_lich',
    name: 'The Undying Menace',
    shortName: 'Slay the Lich',
    bossId: 'lich',
    description: [
      'An ancient Lich has returned from beyond death, spreading corruption across the realm.',
      'Ancient texts speak of a phylactery—the source of its immortality.',
      'Destroy the phylactery to make the Lich mortal, then end its reign of terror forever.',
    ],
    steps: [
      { id: 'find_clue',      text: 'Learn the location of the Lich\'s lair from a story character.',    done: false },
      { id: 'gather_keys',    text: 'Collect 3 Crystal Shards to unlock the Lich\'s sanctum.',           done: false, count: 0, target: 3 },
      { id: 'enter_sanctum',  text: 'Enter the Lich\'s Sanctum.',                                          done: false },
      { id: 'defeat_boss',    text: 'Destroy the Lich and end its curse.',                                 done: false },
    ],
    keyItem: { id: 'crystal_shard', name: 'Crystal Shard', count: 3, symbol: '*', fg: 11 },
    bossLocation: 'dungeon',
    storyCharacters: [
      { type: 'sage',     pool: 'story', role: 'guide',   placement: 'town' },
      { type: 'scholar',  pool: 'story', role: 'hint',    placement: 'town' },
    ],
    victoryText: [
      'With a final cry, the Lich dissolves into ash and shadow.',
      'The phylactery shatters, and the dark power holding the Lich together collapses.',
      'A wave of warm light washes over the land as the ancient evil is undone.',
      '{name} has saved the realm. Songs will be sung of this day for generations.',
    ],
    defeatText: 'The Lich laughs as darkness swallows the realm whole.',
  },
  {
    id: 'destroy_boss_dragon',
    name: 'The Dragon\'s Wrath',
    shortName: 'Slay the Dragon',
    bossId: 'ancient_dragon',
    description: [
      'An Ancient Dragon has awoken from its centuries-long slumber, incensed beyond reason.',
      'It burns villages and hoards the wealth of the realm in its mountain lair.',
      'Only a hero bearing the Dragon Ward can withstand its fury long enough to strike it down.',
    ],
    steps: [
      { id: 'find_sage',     text: 'Seek out the dragon sage for guidance.',                              done: false },
      { id: 'forge_ward',    text: 'Collect 2 Dragon Scales and 1 Dragon Fang to forge the Dragon Ward.', done: false, items: ['dragon_scale', 'dragon_tooth'] },
      { id: 'find_lair',     text: 'Locate the Dragon\'s Mountain Lair.',                                  done: false },
      { id: 'defeat_boss',   text: 'Defeat the Ancient Dragon.',                                            done: false },
    ],
    keyItem: null,
    bossLocation: 'peak',
    storyCharacters: [
      { type: 'sage',     pool: 'story', role: 'guide',   placement: 'town' },
      { type: 'ranger',   pool: 'story', role: 'hint',    placement: 'wilderness' },
    ],
    victoryText: [
      'The Ancient Dragon crashes to the earth, its fire extinguished at last.',
      'A roar that shakes the mountains becomes a dying gasp.',
      'The dragon\'s hoard lies open before you. You have avenged the burned villages.',
      '{name}, Dragonslayer. The name will echo through history.',
    ],
    defeatText: 'The dragon\'s laughter echoes across a ruined land.',
  },
  {
    id: 'destroy_boss_demon',
    name: 'The Demon Unleashed',
    shortName: 'Banish the Demon',
    bossId: 'demon_lord',
    description: [
      'A Demon Lord has broken free from the ancient seal that imprisoned it beneath the earth.',
      'Its corruption spreads from its lair like a plague, twisting beasts and driving men mad.',
      'Find the four Seal Stones and perform the Ritual of Banishment to send it back.',
    ],
    steps: [
      { id: 'find_priest',   text: 'Speak with the High Priest to learn the banishment ritual.',          done: false },
      { id: 'seal_stones',   text: 'Collect the 4 Seal Stones scattered across the realm.',               done: false, count: 0, target: 4 },
      { id: 'enter_lair',    text: 'Enter the Demon\'s Lair.',                                             done: false },
      { id: 'defeat_boss',   text: 'Perform the ritual and banish the Demon Lord.',                        done: false },
    ],
    keyItem: { id: 'seal_stone', name: 'Seal Stone', count: 4, symbol: '◙', fg: 14 },
    bossLocation: 'dungeon',
    storyCharacters: [
      { type: 'priest',   pool: 'story', role: 'guide',   placement: 'town' },
      { type: 'scholar',  pool: 'story', role: 'hint',    placement: 'town' },
    ],
    victoryText: [
      'The ritual takes hold. With an earth-shaking howl, the Demon is torn back to its prison.',
      'The corruption recedes. The sky clears. Birds dare to sing again.',
      'You have done what armies could not—sealed the darkness away.',
      '{name} has saved the realm from damnation. The gods themselves take note.',
    ],
    defeatText: 'The Demon Lord\'s laughter becomes the last sound the realm ever hears.',
  },
  {
    id: 'retrieve_artifact',
    name: 'The Lost Artifact',
    shortName: 'Retrieve the Artifact',
    bossId: 'lich',
    description: [
      'The legendary Sunstone—capable of healing any wound—has been stolen.',
      'It was taken deep into a dungeon by a powerful sorcerer who seeks to corrupt its power.',
      'Retrieve the Sunstone before it is turned to evil purpose.',
    ],
    steps: [
      { id: 'trace_theft',  text: 'Learn where the Sunstone was taken.',                                  done: false },
      { id: 'find_keys',    text: 'Collect 2 Vault Keys to open the sorcerer\'s vault.',                  done: false, count: 0, target: 2 },
      { id: 'enter_vault',  text: 'Enter the Sorcerer\'s Vault.',                                          done: false },
      { id: 'retrieve',     text: 'Defeat the Sorcerer and claim the Sunstone.',                           done: false },
    ],
    keyItem: { id: 'vault_key', name: 'Vault Key', count: 2, symbol: '♀', fg: 14 },
    bossLocation: 'dungeon',
    storyCharacters: [
      { type: 'sage',     pool: 'story', role: 'guide',   placement: 'town' },
      { type: 'merchant', pool: 'story', role: 'witness', placement: 'town' },
    ],
    victoryText: [
      'The Sunstone glows warmly in your hands as the sorcerer falls.',
      'You can feel the artifact\'s healing light pulsing through you.',
      'The realm can be healed now. You have made it possible.',
      '{name}—the one who recovered the Sunstone and saved the realm\'s hope.',
    ],
    defeatText: 'The corrupted Sunstone\'s dark light signals the end of all healing.',
  },
];

export function getGoalTemplate(id) {
  return GOAL_TEMPLATES.find(g => g.id === id);
}

export function getRandomGoalTemplate(rng) {
  return rng.pick(GOAL_TEMPLATES);
}
