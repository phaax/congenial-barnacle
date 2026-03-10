// Terminal dimensions
export const COLS = 80;
export const ROWS = 30;

// Layout regions
export const MAIN_COLS = 60;   // Left area width (game view)
export const SIDE_COLS = 20;   // Right panel width
export const MSG_ROWS = 5;     // Bottom message log rows
export const VIEW_ROWS = ROWS - MSG_ROWS; // 25 rows for main + side

// Cell pixel dimensions
export const CELL_W = 12;
export const CELL_H = 20;

// DOS-style 16-color palette indices
export const C = {
  BLACK:        0,
  DARK_BLUE:    1,
  DARK_GREEN:   2,
  DARK_CYAN:    3,
  DARK_RED:     4,
  DARK_MAGENTA: 5,
  BROWN:        6,
  LIGHT_GRAY:   7,
  DARK_GRAY:    8,
  BLUE:         9,
  GREEN:        10,
  CYAN:         11,
  RED:          12,
  MAGENTA:      13,
  YELLOW:       14,
  WHITE:        15,
};

// Actual hex colors for the DOS palette
export const PALETTE = [
  '#000000', // 0  BLACK
  '#0000AA', // 1  DARK_BLUE
  '#00AA00', // 2  DARK_GREEN
  '#00AAAA', // 3  DARK_CYAN
  '#AA0000', // 4  DARK_RED
  '#AA00AA', // 5  DARK_MAGENTA
  '#AA5500', // 6  BROWN
  '#AAAAAA', // 7  LIGHT_GRAY
  '#555555', // 8  DARK_GRAY
  '#5555FF', // 9  BLUE
  '#55FF55', // 10 GREEN
  '#55FFFF', // 11 CYAN
  '#FF5555', // 12 RED
  '#FF55FF', // 13 MAGENTA
  '#FFFF55', // 14 YELLOW
  '#FFFFFF', // 15 WHITE
];

// Game states
export const STATE = {
  MAIN_MENU:        'MAIN_MENU',
  CHAR_CREATE:      'CHAR_CREATE',
  WORLD_GEN:        'WORLD_GEN',
  WORLD_MAP:        'WORLD_MAP',
  LOCATION:         'LOCATION',   // Town or dungeon interior
  COMBAT:           'COMBAT',
  DIALOG:           'DIALOG',
  INVENTORY:        'INVENTORY',
  QUEST_LOG:        'QUEST_LOG',
  SHOP:             'SHOP',
  INN:              'INN',
  GAME_OVER:        'GAME_OVER',
  VICTORY:          'VICTORY',
  JUKEBOX:          'JUKEBOX',    // Music player overlay
};

// Location types
export const LOC_TYPE = {
  TOWN:    'TOWN',
  DUNGEON: 'DUNGEON',
  CAVE:    'CAVE',
  RUINS:   'RUINS',
  SHRINE:  'SHRINE',
  CAMP:    'CAMP',
};

// Tile types for world map
export const WORLD_TILE = {
  DEEP_OCEAN:  0,
  OCEAN:       1,
  BEACH:       2,
  GRASSLAND:   3,
  FOREST:      4,
  DENSE_FOREST:5,
  HILLS:       6,
  MOUNTAINS:   7,
  PEAK:        8,
  DESERT:      9,
  TUNDRA:      10,
  SNOW:        11,
  SWAMP:       12,
};

// Tile types for location interiors
export const LOC_TILE = {
  VOID:        0,
  WALL:        1,
  FLOOR:       2,
  DOOR:        3,
  DOOR_OPEN:   4,
  WATER:       5,
  STAIRS_DOWN: 6,
  STAIRS_UP:   7,
  CHEST:       8,
  CHEST_OPEN:  9,
  ALTAR:       10,
  BED:         11,
  COUNTER:     12,
  TABLE:       13,
  TREE:        14,
  PATH:        15,
  ROAD:        16,
};

// Gender options
export const GENDER = {
  MALE:   'Male',
  FEMALE: 'Female',
  OTHER:  'Other',
};

// Directions
export const DIR = {
  N:  { dx: 0,  dy: -1, name: 'north' },
  S:  { dx: 0,  dy:  1, name: 'south' },
  E:  { dx: 1,  dy:  0, name: 'east' },
  W:  { dx: -1, dy:  0, name: 'west' },
  NE: { dx: 1,  dy: -1, name: 'northeast' },
  NW: { dx: -1, dy: -1, name: 'northwest' },
  SE: { dx: 1,  dy:  1, name: 'southeast' },
  SW: { dx: -1, dy:  1, name: 'southwest' },
};

// Equipment slots
export const SLOT = {
  WEAPON:    'weapon',
  ARMOR:     'armor',
  HELMET:    'helmet',
  ACCESSORY: 'accessory',
  OFFHAND:   'offhand',
};

// Item types
export const ITEM_TYPE = {
  WEAPON:    'weapon',
  ARMOR:     'armor',
  HELMET:    'helmet',
  ACCESSORY: 'accessory',
  OFFHAND:   'offhand',
  CONSUMABLE:'consumable',
  QUEST:     'quest',
  KEY:       'key',
  MISC:      'misc',
};

// Combat states
export const COMBAT_STATE = {
  PLAYER_TURN: 'player_turn',
  ENEMY_TURN:  'enemy_turn',
  VICTORY:     'victory',
  DEFEAT:      'defeat',
};

// Message log categories
export const MSG_CAT = {
  NORMAL:  'normal',
  COMBAT:  'combat',
  LOOT:    'loot',
  QUEST:   'quest',
  SYSTEM:  'system',
  DIALOG:  'dialog',
};

// World map dimensions
export const WORLD_W = 120;
export const WORLD_H = 80;

// World generation config
export const WORLD_CONFIG = {
  MIN_TOWNS:    5,
  MAX_TOWNS:    8,
  MIN_DUNGEONS: 4,
  MAX_DUNGEONS: 7,
  MIN_CAVES:    3,
  MAX_CAVES:    5,
  MIN_RUINS:    2,
  MAX_RUINS:    4,
  MIN_SHRINES:  2,
  MAX_SHRINES:  3,
};

// Combat config
export const COMBAT_CONFIG = {
  FLEE_BASE_CHANCE: 40,
  CRIT_CHANCE:      10,
  CRIT_MULTIPLIER:  2.0,
  MISS_CHANCE:      10,
};
