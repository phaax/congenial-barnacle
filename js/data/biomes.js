import { WORLD_TILE, C } from './constants.js';

// Biome definitions for world map rendering and encounter tables
export const BIOMES = {
  [WORLD_TILE.DEEP_OCEAN]: {
    id: WORLD_TILE.DEEP_OCEAN,
    name: 'Deep Ocean',
    symbol: '≈',
    fg: C.DARK_BLUE,
    bg: C.BLACK,
    passable: false,
    dangerLevel: 0,
    encounterRate: 0,
    monsters: [],
    description: 'Vast, deep waters stretch to the horizon.',
  },
  [WORLD_TILE.OCEAN]: {
    id: WORLD_TILE.OCEAN,
    name: 'Ocean',
    symbol: '~',
    fg: C.BLUE,
    bg: C.DARK_BLUE,
    passable: false,
    dangerLevel: 0,
    encounterRate: 0,
    monsters: [],
    description: 'The shimmering sea.',
  },
  [WORLD_TILE.BEACH]: {
    id: WORLD_TILE.BEACH,
    name: 'Beach',
    symbol: '.',
    fg: C.YELLOW,
    bg: C.BLACK,
    passable: true,
    dangerLevel: 1,
    encounterRate: 10,
    monsters: ['crab', 'seagull_swarm', 'sand_snake'],
    description: 'Sandy shores where land meets sea.',
  },
  [WORLD_TILE.GRASSLAND]: {
    id: WORLD_TILE.GRASSLAND,
    name: 'Grassland',
    symbol: '.',
    fg: C.GREEN,
    bg: C.BLACK,
    passable: true,
    dangerLevel: 1,
    encounterRate: 15,
    monsters: ['wolf', 'bandit', 'giant_rat', 'slime'],
    description: 'Rolling green fields, safe enough for the cautious traveller.',
  },
  [WORLD_TILE.FOREST]: {
    id: WORLD_TILE.FOREST,
    name: 'Forest',
    symbol: '♣',
    fg: C.DARK_GREEN,
    bg: C.BLACK,
    passable: true,
    dangerLevel: 2,
    encounterRate: 25,
    monsters: ['wolf', 'bear', 'goblin', 'giant_spider', 'bandit'],
    description: 'Ancient trees cast long shadows over the forest floor.',
  },
  [WORLD_TILE.DENSE_FOREST]: {
    id: WORLD_TILE.DENSE_FOREST,
    name: 'Deep Forest',
    symbol: '♠',
    fg: C.DARK_GREEN,
    bg: C.BLACK,
    passable: true,
    dangerLevel: 3,
    encounterRate: 35,
    monsters: ['bear', 'goblin', 'troll', 'giant_spider', 'dark_elf'],
    description: 'The canopy is so thick that little light reaches the ground. Something watches from the shadows.',
  },
  [WORLD_TILE.HILLS]: {
    id: WORLD_TILE.HILLS,
    name: 'Hills',
    symbol: 'n',
    fg: C.BROWN,
    bg: C.BLACK,
    passable: true,
    dangerLevel: 2,
    encounterRate: 20,
    monsters: ['goblin', 'orc', 'bandit', 'stone_elemental'],
    description: 'Rolling hills of scrubby grass and exposed rock.',
  },
  [WORLD_TILE.MOUNTAINS]: {
    id: WORLD_TILE.MOUNTAINS,
    name: 'Mountains',
    symbol: '^',
    fg: C.LIGHT_GRAY,
    bg: C.BLACK,
    passable: true,
    dangerLevel: 3,
    encounterRate: 30,
    monsters: ['orc', 'mountain_lion', 'harpy', 'ogre', 'wyvern'],
    description: 'Treacherous peaks where only the bold venture.',
  },
  [WORLD_TILE.PEAK]: {
    id: WORLD_TILE.PEAK,
    name: 'Mountain Peak',
    symbol: '▲',
    fg: C.WHITE,
    bg: C.BLACK,
    passable: true,
    dangerLevel: 4,
    encounterRate: 40,
    monsters: ['dragon_young', 'harpy', 'frost_giant', 'wyvern'],
    description: 'Snow-capped peaks wreathed in cloud. Few survive here long.',
  },
  [WORLD_TILE.DESERT]: {
    id: WORLD_TILE.DESERT,
    name: 'Desert',
    symbol: '~',
    fg: C.YELLOW,
    bg: C.BLACK,
    passable: true,
    dangerLevel: 2,
    encounterRate: 20,
    monsters: ['scorpion', 'sand_snake', 'mummy', 'dust_devil'],
    description: 'Vast dunes shimmer in the heat. Water is precious here.',
  },
  [WORLD_TILE.TUNDRA]: {
    id: WORLD_TILE.TUNDRA,
    name: 'Tundra',
    symbol: '-',
    fg: C.CYAN,
    bg: C.BLACK,
    passable: true,
    dangerLevel: 2,
    encounterRate: 20,
    monsters: ['wolf', 'polar_bear', 'ice_elemental', 'yeti'],
    description: 'Frozen ground stretches to the horizon. Wind howls endlessly.',
  },
  [WORLD_TILE.SNOW]: {
    id: WORLD_TILE.SNOW,
    name: 'Snowfield',
    symbol: '*',
    fg: C.WHITE,
    bg: C.BLACK,
    passable: true,
    dangerLevel: 3,
    encounterRate: 25,
    monsters: ['polar_bear', 'ice_elemental', 'yeti', 'frost_giant'],
    description: 'A blank white expanse. The cold is merciless.',
  },
  [WORLD_TILE.SWAMP]: {
    id: WORLD_TILE.SWAMP,
    name: 'Swamp',
    symbol: '%',
    fg: C.DARK_CYAN,
    bg: C.BLACK,
    passable: true,
    dangerLevel: 3,
    encounterRate: 30,
    monsters: ['giant_frog', 'swamp_lizard', 'bog_wraith', 'will_o_wisp'],
    description: 'Fetid water and twisted trees. The air reeks of rot.',
  },
};

// World generation noise thresholds for biome placement
// [elevationMin, elevationMax, moistureMin, moistureMax, biome]
export const BIOME_RULES = [
  { elMin: 0.00, elMax: 0.25, msMin: 0.0, msMax: 1.0, tile: WORLD_TILE.DEEP_OCEAN  },
  { elMin: 0.25, elMax: 0.32, msMin: 0.0, msMax: 1.0, tile: WORLD_TILE.OCEAN       },
  { elMin: 0.32, elMax: 0.37, msMin: 0.0, msMax: 1.0, tile: WORLD_TILE.BEACH       },
  { elMin: 0.37, elMax: 0.55, msMin: 0.0, msMax: 0.3, tile: WORLD_TILE.DESERT      },
  { elMin: 0.37, elMax: 0.55, msMin: 0.3, msMax: 0.5, tile: WORLD_TILE.GRASSLAND   },
  { elMin: 0.37, elMax: 0.55, msMin: 0.5, msMax: 0.7, tile: WORLD_TILE.FOREST      },
  { elMin: 0.37, elMax: 0.55, msMin: 0.7, msMax: 1.0, tile: WORLD_TILE.SWAMP       },
  { elMin: 0.55, elMax: 0.65, msMin: 0.0, msMax: 0.3, tile: WORLD_TILE.HILLS       },
  { elMin: 0.55, elMax: 0.65, msMin: 0.3, msMax: 0.6, tile: WORLD_TILE.HILLS       },
  { elMin: 0.55, elMax: 0.65, msMin: 0.6, msMax: 1.0, tile: WORLD_TILE.DENSE_FOREST},
  { elMin: 0.65, elMax: 0.78, msMin: 0.0, msMax: 0.4, tile: WORLD_TILE.MOUNTAINS   },
  { elMin: 0.65, elMax: 0.78, msMin: 0.4, msMax: 1.0, tile: WORLD_TILE.TUNDRA      },
  { elMin: 0.78, elMax: 0.88, msMin: 0.0, msMax: 1.0, tile: WORLD_TILE.MOUNTAINS   },
  { elMin: 0.88, elMax: 1.00, msMin: 0.0, msMax: 1.0, tile: WORLD_TILE.PEAK        },
];

// Add snow overlay for high latitude/elevation + moisture
export function getBiomeTile(elevation, moisture, latitude) {
  // Latitude: 0 = equator, 1 = pole
  if (latitude > 0.75 && elevation > 0.37) {
    if (elevation > 0.55) return WORLD_TILE.SNOW;
    return WORLD_TILE.TUNDRA;
  }
  for (const rule of BIOME_RULES) {
    if (elevation >= rule.elMin && elevation < rule.elMax &&
        moisture  >= rule.msMin && moisture  < rule.msMax) {
      return rule.tile;
    }
  }
  return WORLD_TILE.GRASSLAND;
}

export function getBiome(tileType) {
  return BIOMES[tileType] || BIOMES[WORLD_TILE.GRASSLAND];
}
