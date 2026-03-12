// @ts-nocheck
import { RNG } from '../engine/rng';
import { WORLD_TILE, WORLD_W, WORLD_H, WORLD_CONFIG, LOC_TYPE, C } from '../data/constants';
import { getBiomeTile, getBiome, BIOMES } from '../data/biomes';
import { GOAL_TEMPLATES } from '../data/goals';
import { NPC_NAMES, INN_NAMES } from '../data/dialog';
import { generateTown } from './towngen';
import { generateDungeon } from './dungeogen';

// Simple value noise for terrain generation
function valueNoise(rng, w, h, scale) {
  const grid = new Float32Array(w * h);
  // Place random control points
  const freqX = Math.ceil(w / scale);
  const freqY = Math.ceil(h / scale);
  const control = new Float32Array((freqX + 1) * (freqY + 1));
  for (let i = 0; i < control.length; i++) control[i] = rng.next();

  function lerp(a, b, t) { return a + (b - a) * (3 * t * t - 2 * t * t * t); } // smoothstep

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const gx = x / scale;
      const gy = y / scale;
      const xi = Math.floor(gx);
      const yi = Math.floor(gy);
      const fx = gx - xi;
      const fy = gy - yi;

      const v00 = control[yi       * (freqX + 1) + xi    ] || 0;
      const v10 = control[yi       * (freqX + 1) + xi + 1] || 0;
      const v01 = control[(yi + 1) * (freqX + 1) + xi    ] || 0;
      const v11 = control[(yi + 1) * (freqX + 1) + xi + 1] || 0;

      grid[y * w + x] = lerp(lerp(v00, v10, fx), lerp(v01, v11, fx), fy);
    }
  }
  return grid;
}

// Combine octaves of noise
function octaveNoise(rng, w, h, octaves = 4) {
  const result = new Float32Array(w * h);
  let amplitude = 1.0;
  let frequency = 8;
  let max = 0;
  for (let o = 0; o < octaves; o++) {
    const n = valueNoise(rng, w, h, frequency);
    for (let i = 0; i < result.length; i++) result[i] += n[i] * amplitude;
    max += amplitude;
    amplitude *= 0.5;
    frequency *= 0.5;
    if (frequency < 2) frequency = 2;
  }
  for (let i = 0; i < result.length; i++) result[i] /= max;
  return result;
}

// Make elevation fall off at edges (island shape)
function applyIslandMask(elevation, w, h) {
  const cx = w / 2, cy = h / 2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (x - cx) / cx;
      const dy = (y - cy) / cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const mask = Math.max(0, 1 - dist * 1.2);
      elevation[y * w + x] *= mask;
    }
  }
}

// Generate location name
function generateLocationName(rng, type) {
  const prefixes = {
    [LOC_TYPE.TOWN]:    ['North', 'South', 'East', 'West', 'New', 'Old', 'High', 'Low', 'River', 'Stone'],
    [LOC_TYPE.DUNGEON]: ['Dark', 'Shadow', 'Bone', 'Iron', 'Cursed', 'Ancient', 'Forgotten', 'Fell'],
    [LOC_TYPE.CAVE]:    ['Howling', 'Crystal', 'Deep', 'Gnaw', 'Thunder', 'Goblin', 'Bat'],
    [LOC_TYPE.RUINS]:   ['Fallen', 'Lost', 'Ancient', 'Broken', 'Shattered', 'Sunken'],
    [LOC_TYPE.SHRINE]:  ['Sacred', 'Holy', 'Blessed', 'Forgotten', 'Hidden'],
    [LOC_TYPE.CAMP]:    ['Outpost', 'Watch', 'Border', 'Trail'],
  };
  const suffixes = {
    [LOC_TYPE.TOWN]:    ['haven', 'burg', 'ford', 'bridge', 'cross', 'wick', 'stead', 'field', 'vale', 'moor'],
    [LOC_TYPE.DUNGEON]: ['hold', 'keep', 'depths', 'pit', 'vault', 'tomb', 'crypt', 'sanctum'],
    [LOC_TYPE.CAVE]:    ['Cave', 'Cavern', 'Grotto', 'Den', 'Hollow'],
    [LOC_TYPE.RUINS]:   ['Ruins', 'Keep', 'Hall', 'Tower', 'Temple'],
    [LOC_TYPE.SHRINE]:  ['Shrine', 'Altar', 'Stone', 'Circle'],
    [LOC_TYPE.CAMP]:    ['Camp', 'Post', 'Watch'],
  };

  const base = rng.word(1, 2);
  const pre  = rng.pick(prefixes[type] || ['']);
  const suf  = rng.pick(suffixes[type] || ['Place']);

  if (type === LOC_TYPE.TOWN) {
    return `${pre}${suf.charAt(0).toUpperCase()}${suf.slice(1)}`;
  }
  return `${pre} ${base} ${suf}`;
}

export function generateWorld(seed) {
  const rng = new RNG(seed);
  const W = WORLD_W, H = WORLD_H;

  // Step 1: Generate terrain
  const elevation = octaveNoise(new RNG(rng.int(1, 99999)), W, H, 5);
  const moisture  = octaveNoise(new RNG(rng.int(1, 99999)), W, H, 4);
  applyIslandMask(elevation, W, H);

  // Step 2: Assign biome tiles
  const tiles = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const el = elevation[y * W + x];
      const ms = moisture[y * W + x];
      const lat = Math.abs((y - H / 2) / (H / 2)); // 0=equator,1=pole
      tiles[y * W + x] = getBiomeTile(el, ms, lat);
    }
  }

  // Helper: check if position is land
  function isLand(x, y) {
    if (x < 0 || x >= W || y < 0 || y >= H) return false;
    const t = tiles[y * W + x];
    return t !== WORLD_TILE.DEEP_OCEAN && t !== WORLD_TILE.OCEAN;
  }

  function isPassable(x, y) {
    if (!isLand(x, y)) return false;
    return getBiome(tiles[y * W + x]).passable;
  }

  // Build set of all passable tiles connected to the map center (main landmass).
  // BFS flood-fill from center — excludes disconnected secondary islands.
  const mainIsland = new Set<number>();
  (function buildMainIsland() {
    let seedX = Math.floor(W / 2);
    let seedY = Math.floor(H / 2);
    // Find nearest passable tile to center (deterministic, no RNG calls)
    outer: for (let r = 0; r <= 20; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue; // perimeter only
          if (isPassable(seedX + dx, seedY + dy)) {
            seedX += dx; seedY += dy;
            break outer;
          }
        }
      }
    }
    if (!isPassable(seedX, seedY)) return; // degenerate: entire map is ocean
    const queue: number[] = [seedY * W + seedX];
    mainIsland.add(seedY * W + seedX);
    while (queue.length > 0) {
      const idx = queue.shift()!;
      const cx = idx % W;
      const cy = Math.floor(idx / W);
      for (const [nx, ny] of [[cx-1,cy],[cx+1,cy],[cx,cy-1],[cx,cy+1]] as [number,number][]) {
        const nIdx = ny * W + nx;
        if (!mainIsland.has(nIdx) && isPassable(nx, ny)) {
          mainIsland.add(nIdx);
          queue.push(nIdx);
        }
      }
    }
  })();

  // Helper: find a land tile near a position
  function findLandNear(cx, cy, radius = 10) {
    for (let r = 0; r <= radius; r++) {
      for (let attempts = 0; attempts < 20; attempts++) {
        const x = cx + rng.int(-r, r);
        const y = cy + rng.int(-r, r);
        if (isPassable(x, y)) return { x, y };
      }
    }
    return null;
  }

  // Helper: ensure minimum distance from other locations
  function tooClose(x, y, locations, minDist) {
    for (const loc of locations) {
      const dx = loc.x - x, dy = loc.y - y;
      if (Math.sqrt(dx * dx + dy * dy) < minDist) return true;
    }
    return false;
  }

  // Step 3: Place locations
  const locations = [];
  let locId = 0;

  function placeLocations(type, count, minDist, biomeFilter = null) {
    let placed = 0;
    let attempts = 0;
    while (placed < count && attempts < 2000) {
      attempts++;
      const x = rng.int(5, W - 6);
      const y = rng.int(5, H - 6);
      if (!isPassable(x, y)) continue;
      if (!mainIsland.has(y * W + x)) continue;
      if (biomeFilter && !biomeFilter(tiles[y * W + x])) continue;
      if (tooClose(x, y, locations, minDist)) continue;

      const name = generateLocationName(rng, type);
      const loc = { id: locId++, type, name, x, y, visited: false, cleared: false, level: 1 };

      if (type === LOC_TYPE.TOWN) {
        loc.tier = Math.floor(rng.float(1, 3.5));
        loc.innName = rng.pick(INN_NAMES);
        loc.layout = null; // generated lazily
      } else {
        loc.dangerLevel = rng.int(1, 4);
        loc.layout = null; // generated lazily
      }

      locations.push(loc);
      placed++;
    }
  }

  const cfg = WORLD_CONFIG;
  placeLocations(LOC_TYPE.TOWN,    rng.int(cfg.MIN_TOWNS,    cfg.MAX_TOWNS),    15);
  placeLocations(LOC_TYPE.DUNGEON, rng.int(cfg.MIN_DUNGEONS, cfg.MAX_DUNGEONS), 10);
  placeLocations(LOC_TYPE.CAVE,    rng.int(cfg.MIN_CAVES,    cfg.MAX_CAVES),    8);
  placeLocations(LOC_TYPE.RUINS,   rng.int(cfg.MIN_RUINS,    cfg.MAX_RUINS),    8);
  placeLocations(LOC_TYPE.SHRINE,  rng.int(cfg.MIN_SHRINES,  cfg.MAX_SHRINES),  10);

  // Step 4: Select game goal
  const goal = selectGoal(rng, locations);

  // Step 5: Place story characters
  placeStoryCharacters(rng, goal, locations);

  // Step 6: Assign quest givers to locations (towns and some safe spots)
  assignQuestGivers(rng, locations);

  // Step 7: Designate starting town (safest, most central)
  const towns = locations.filter(l => l.type === LOC_TYPE.TOWN);
  const startTown = towns.reduce((best, t) => {
    const dx = t.x - W / 2, dy = t.y - H / 2;
    const dist = dx * dx + dy * dy;
    const bdx = best.x - W / 2, bdy = best.y - H / 2;
    return dist < bdx * bdx + bdy * bdy ? t : best;
  }, towns[0]);

  startTown.isStart = true;

  // Step 8: Place key items for the goal
  placeKeyItems(rng, goal, locations);

  // Step 9: Place boss at designated location
  placeBoss(rng, goal, locations);

  return {
    seed,
    tiles,
    width: W,
    height: H,
    locations,
    startTown,
    goal,
    fog: new Uint8Array(W * H), // 0=unseen, 1=seen, 2=visible
  };
}

function selectGoal(rng, locations) {
  const template = rng.pick(GOAL_TEMPLATES);
  // Deep copy the goal and its steps
  const goal = JSON.parse(JSON.stringify(template));
  goal.templateId = template.id;
  goal.completed = false;
  goal.currentStep = 0;
  return goal;
}

function placeStoryCharacters(rng, goal, locations) {
  const towns = locations.filter(l => l.type === LOC_TYPE.TOWN);
  if (!goal.storyCharacters) return;

  goal.storyCharacters = goal.storyCharacters.map((sc, i) => {
    const town = towns[i % towns.length];
    return {
      ...sc,
      townId: town.id,
      name: rng.pick(NPC_NAMES.story || ['The Sage']),
      dialogSeen: false,
    };
  });
}

function assignQuestGivers(rng, locations) {
  const questGiverNames = NPC_NAMES.quest_giver;
  locations.forEach(loc => {
    if (loc.type === LOC_TYPE.TOWN) {
      const count = rng.int(1, 3);
      loc.questGivers = [];
      for (let i = 0; i < count; i++) {
        loc.questGivers.push({
          name: rng.pick(questGiverNames),
          questIds: [], // filled by quest system
          dialogSeen: false,
        });
      }
    }
    // Occasionally place a quest giver at a shrine or camp (not dangerous locations)
    if (loc.type === LOC_TYPE.SHRINE && rng.chance(40)) {
      loc.questGiver = {
        name: rng.pick(NPC_NAMES.quest_giver),
        questIds: [],
        dialogSeen: false,
      };
    }
  });
}

function placeKeyItems(rng, goal, locations) {
  if (!goal.keyItem) return;
  const dungeons = locations.filter(l =>
    l.type === LOC_TYPE.DUNGEON || l.type === LOC_TYPE.CAVE || l.type === LOC_TYPE.RUINS
  );
  rng.shuffle(dungeons);
  goal.keyItemLocations = dungeons.slice(0, goal.keyItem.count).map(d => ({
    locationId: d.id,
    found: false,
  }));
}

function placeBoss(rng, goal, locations) {
  const candidates = locations.filter(l =>
    l.type === LOC_TYPE.DUNGEON || l.type === LOC_TYPE.RUINS || l.type === LOC_TYPE.CAVE
  );
  if (candidates.length === 0) return;
  const bossLoc = rng.pick(candidates);
  bossLoc.hasBoss = true;
  bossLoc.bossId  = goal.bossId;
  bossLoc.isBossLair = true;
  goal.bossLocationId = bossLoc.id;
}

// Lazy-generate town layout when entering
export function getTownLayout(world, locId, seed) {
  const loc = world.locations.find(l => l.id === locId);
  if (!loc || loc.type !== LOC_TYPE.TOWN) return null;
  if (!loc.layout) {
    loc.layout = generateTown(new RNG(seed + locId), loc);
  }
  return loc.layout;
}

// Lazy-generate dungeon layout when entering
export function getDungeonLayout(world, locId, seed) {
  const loc = world.locations.find(l => l.id === locId);
  if (!loc) return null;
  if (!loc.layout) {
    loc.layout = generateDungeon(new RNG(seed + locId), loc);
  }
  return loc.layout;
}

// Get location at world tile
export function getLocationAt(world, x, y) {
  return world.locations.find(l => l.x === x && l.y === y) || null;
}

// Get biome info at world tile
export function getBiomeAt(world, x, y) {
  if (x < 0 || x >= world.width || y < 0 || y >= world.height) return null;
  return getBiome(world.tiles[y * world.width + x]);
}

// Update fog of war around player position (reveal area)
export function updateFog(world, px, py, radius = 5) {
  const W = world.width, H = world.height;
  // First set current visibility to seen (1) from visible (2)
  for (let i = 0; i < world.fog.length; i++) {
    if (world.fog[i] === 2) world.fog[i] = 1;
  }
  // Set visible around player
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > radius * radius) continue;
      const nx = px + dx, ny = py + dy;
      if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
      world.fog[ny * W + nx] = 2;
    }
  }
}

// Clear fog in a radius around a point, setting unseen (0) tiles to seen (1).
// Tiles already seen (1) or visible (2) are not downgraded.
export function clearFogAroundLocation(world, x: number, y: number, radius: number) {
  const W = world.width, H = world.height;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > radius * radius) continue;
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
      if (world.fog[ny * W + nx] === 0) world.fog[ny * W + nx] = 1;
    }
  }
}

// Location type display info
export const LOC_DISPLAY = {
  [LOC_TYPE.TOWN]:    { symbol: 'Ω', fg: C.YELLOW,    name: 'Town'    },
  [LOC_TYPE.DUNGEON]: { symbol: '▼', fg: C.RED,       name: 'Dungeon' },
  [LOC_TYPE.CAVE]:    { symbol: '∩', fg: C.DARK_GRAY, name: 'Cave'    },
  [LOC_TYPE.RUINS]:   { symbol: 'Δ', fg: C.BROWN,     name: 'Ruins'   },
  [LOC_TYPE.SHRINE]:  { symbol: '†', fg: C.CYAN,      name: 'Shrine'  },
  [LOC_TYPE.CAMP]:    { symbol: 'Ψ', fg: C.LIGHT_GRAY,name: 'Camp'    },
};
