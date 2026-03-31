// Shared type definitions for Chronicles of the Realm

// ─── Screen ──────────────────────────────────────────────────────────────────

export interface Screen {
  enter(data: unknown): void;
  exit(): void;
  handleKey(e: KeyboardEvent): void;
  handleClick(col: number, row: number, btn: number): void;
  handleScroll(dir: number): void;
  handleMove?(col: number, row: number): void;
  update(dt: number): void;
  render(renderer: import('./engine/renderer').Renderer): void;
}

// ─── Stats & Player ──────────────────────────────────────────────────────────

export interface PlayerStats {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface InventoryItem {
  id: string;
  qty: number;
  questId?: string;
}

export interface Equipment {
  weapon: string | null;
  armor: string | null;
  helmet: string | null;
  accessory: string | null;
  offhand: string | null;
}

export interface StatusEffect {
  type: string;
  turns: number;
  dmg?: number;
}

export interface Player {
  name: string;
  race: string;
  gender: string;
  background: string;
  skills: string[];
  stats: PlayerStats;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  level: number;
  xp: number;
  gold: number;
  inventory: InventoryItem[];
  equipment: Equipment;
  statusEffects: StatusEffect[];
  worldX: number;
  worldY: number;
  locX: number;
  locY: number;
  currentFloor: number;   // 0 = ground, 1+ = upper floors, -1 = basement
  usedRelentless: boolean;
  defeatedBoss: boolean;
  // Temporary combat state
  shield?: number;
  fortifyTurns?: number;
}

export interface PlayerConfig {
  name: string;
  race: string;
  gender: string;
  background: string;
  skills: string[];
}

// ─── World ───────────────────────────────────────────────────────────────────

export interface KeyItemLocation {
  locationId: number;
  found: boolean;
}

export interface GoalStep {
  id: string;
  text: string;
  done: boolean;
  count?: number;
  target?: number;
  items?: string[];
}

export interface KeyItem {
  id: string;
  name: string;
  count: number;
  symbol: string;
  fg: number;
}

export interface StoryCharacter {
  type: string;
  pool: string;
  role: string;
  placement: string;
  townId?: number;
  name?: string;
  dialogSeen?: boolean;
}

export interface Goal {
  id: string;
  templateId: string;
  name: string;
  shortName: string;
  bossId: string;
  description: string[];
  steps: GoalStep[];
  keyItem: KeyItem | null;
  keyItemLocations?: KeyItemLocation[];
  bossLocation: string;
  bossLocationId?: number;
  storyCharacters?: StoryCharacter[];
  victoryText: string[];
  defeatText: string;
  completed: boolean;
  currentStep: number;
}

export interface QuestGiver {
  name: string;
  questIds: string[];
  dialogSeen: boolean;
  activeQuest?: Quest | null;
  isQuestGiver?: boolean;
  isInnkeeper?: boolean;
  isStory?: boolean;
  pool?: string;
  innName?: string;
  _placed?: boolean;
  _rumourSeen?: boolean;
}

export interface Location {
  id: number;
  type: string;
  name: string;
  x: number;
  y: number;
  visited: boolean;
  cleared: boolean;
  level: number;
  tier?: number;
  innName?: string;
  dangerLevel?: number;
  layout: Layout | null;
  questGivers?: QuestGiver[];
  questGiver?: QuestGiver;
  hasBoss?: boolean;
  bossId?: string;
  isBossLair?: boolean;
  isStart?: boolean;
  mapPurchased?: boolean;
}

export interface World {
  seed: number;
  tiles: Uint8Array;
  fog: Uint8Array;
  width: number;
  height: number;
  locations: Location[];
  startTown: Location;
  goal: Goal;
}

// ─── Layout (Town / Dungeon) ─────────────────────────────────────────────────

export interface NPC {
  id: string;
  name: string;
  x: number;
  y: number;
  symbol: string;
  fg: number;
  pool: string;
  isInnkeeper?: boolean;
  isQuestGiver?: boolean;
  isStory?: boolean;
  questIds?: string[];
  innName?: string;
  dialogSeen?: boolean;
  activeQuest?: Quest | null;
  _placed?: boolean;
  _rumourSeen?: boolean;
}

export interface Chest {
  x: number;
  y: number;
  open: boolean;
  items: InventoryItem[];
}

export interface PlayerStart {
  x: number;
  y: number;
}

// A single floor's tile data (ground floor, upper floor, or basement)
export interface FloorData {
  tiles: Uint8Array;
  width: number;
  height: number;
  npcs: NPC[];
  chests: Chest[];
  playerStart: PlayerStart;       // where the player lands when entering this floor
  encounterZones?: EncounterZone[];
}

// One entry in layout.buildingFloors
export interface BuildingFloorEntry {
  buildingId: number;             // index into layout.buildings[]
  floorIndex: number;             // -1 = basement, 1+ = upper floor (0 = ground, stored on layout directly)
  floorData: FloorData;
  // bounding box of the building on the town grid (for dimming checks)
  bx: number;
  by: number;
  bw: number;
  bh: number;
}

export interface EncounterZone {
  x: number;
  y: number;
  w: number;
  h: number;
  encounterRate: number;
}

export interface Layout {
  tiles: Uint8Array | number[][];
  width: number;
  height: number;
  playerStart: PlayerStart;
  npcs?: NPC[];
  chests?: Chest[];
  encounters?: unknown[];
  // Multi-floor extension
  buildingFloors?: BuildingFloorEntry[];   // upper floors and basements for town buildings
  buildings?: BuildingRecord[];            // town building metadata
  rooms?: unknown[];                       // dungeon rooms
  encounterZones?: EncounterZone[];
  bossRoom?: unknown;
  bossPos?: unknown;
  exits?: unknown[];
}

// Metadata for a placed building in a town (stored on Layout.buildings)
export interface BuildingRecord {
  id: number;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  doorX: number;
  doorY: number;
  numUpperFloors: number;    // 0 = ground only
  hasBasement: boolean;
}

// ─── Combat ──────────────────────────────────────────────────────────────────

export interface MonsterAbility {
  id: string;
  name: string;
  desc: string;
  chance: number;
}

export interface LootDrop {
  id: string;
  chance: number;
}

export interface Monster {
  id: string;
  name: string;
  symbol: string;
  fg: number;
  hp: number;
  maxHp: number;
  atk: [number, number];
  def: number;
  xp: number;
  gold: number;
  loot: LootDrop[];
  abilities: MonsterAbility[];
  isBoss: boolean;
  statusEffects: StatusEffect[];
  flavorText: string[];
  usedLucky: boolean;
  currentPhase: number;
  _atkBonus?: number;
  _atkBonusTurns?: number;
}

export interface CombatLog {
  msg: string;
  type: string;
}

export interface Combat {
  state: string;
  player: Player;
  monsters: Monster[];
  turn: number;
  log: CombatLog[];
  biome: unknown | null;
  rng: import('./engine/rng').RNG;
  canFlee: boolean;
  bossMode: boolean;
  targetIdx: number;
  returnState?: string;
  returnData?: { loc: Location | null; layout: Layout | null };
  totalXp?: number;
  totalGold?: number;
  lootItems?: string[];
  fled?: boolean;
  fleeing?: boolean;
  playerSkipTurn?: boolean;
  _secondWindUsed?: boolean;
  _usedLucky?: boolean;
}

// ─── Quests ──────────────────────────────────────────────────────────────────

export interface QuestReward {
  gold: number;
  xp: number;
  items: InventoryItem[];
}

export interface Quest {
  id: string;
  templateId: string;
  type: string;
  title: string;
  status: string;
  description: string;
  dangerLevel: number;
  giverLocId: number;
  giverLocName: string;
  reward: QuestReward;
  progress: number;
  progressMax: number;
  targetLocId: number | null;
  targetLocName: string;
  targetMonster?: string;
  targetItem?: string;
  carryItem?: string;
  fromShop?: boolean;
  hint?: string;
  completionText?: string;
}

// ─── Messages ────────────────────────────────────────────────────────────────

export interface Message {
  text: string;
  cat: string;
  turn: number;
}

// ─── Items ───────────────────────────────────────────────────────────────────

export interface Item {
  id: string;
  name: string;
  type: string;
  slot?: string;
  value: number;
  weight: number;
  dmg?: [number, number, string?];
  def?: number;
  symbol: string;
  fg: number;
  desc: string;
  tier: number;
  prop?: string;
  region?: string;   // 'mountain' | 'forest' | 'desert' | 'swamp' | 'plains' | 'arctic' | 'coastal'
  cursed?: boolean;
  effect?: string;
  heal?: number;
  mp?: number;
  fullHeal?: boolean;
  flee?: boolean;
  cure?: string;
  stackable?: boolean;
}

// ─── Dialog ──────────────────────────────────────────────────────────────────

export interface DialogTags {
  [key: string]: string;
}

export interface DialogLine {
  text: string;
  speaker: string;
  action?: string;
  isFarewell?: boolean;
}

export interface DialogSession {
  npc: NPC;
  lines: DialogLine[];
  idx: number;
  tags: DialogTags;
}
