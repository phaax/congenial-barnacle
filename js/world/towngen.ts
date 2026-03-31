// @ts-nocheck
import { LOC_TILE, C, isWalkableTile } from '../data/constants';
import { NPC_NAMES } from '../data/dialog';
import { MONSTERS } from '../data/monsters';

const TW = 50; // Town width
const TH = 36; // Town height

// Town interior tile characters and colors
export const TOWN_TILES = {
  [LOC_TILE.VOID]:    { char: ' ', fg: C.BLACK,      bg: C.BLACK },
  [LOC_TILE.WALL]:    { char: '#', fg: C.LIGHT_GRAY, bg: C.BLACK },
  [LOC_TILE.FLOOR]:   { char: '.', fg: C.DARK_GRAY,  bg: C.BLACK },
  [LOC_TILE.DOOR]:    { char: '+', fg: C.BROWN,      bg: C.BLACK },
  [LOC_TILE.DOOR_OPEN]:{ char: '-', fg: C.BROWN,     bg: C.BLACK },
  [LOC_TILE.WATER]:   { char: '~', fg: C.BLUE,       bg: C.BLACK },
  [LOC_TILE.PATH]:    { char: '░', fg: C.BROWN,      bg: C.BLACK },
  [LOC_TILE.ROAD]:    { char: '▒', fg: C.DARK_GRAY,  bg: C.BLACK },
  [LOC_TILE.BED]:     { char: '≡', fg: C.LIGHT_GRAY, bg: C.BLACK },
  [LOC_TILE.COUNTER]: { char: '═', fg: C.BROWN,      bg: C.BLACK },
  [LOC_TILE.TABLE]:   { char: '╬', fg: C.BROWN,      bg: C.BLACK },
  [LOC_TILE.TREE]:    { char: '♣', fg: C.DARK_GREEN, bg: C.BLACK },
  [LOC_TILE.ALTAR]:   { char: '†', fg: C.CYAN,       bg: C.BLACK },
  [LOC_TILE.STAIRS_DOWN]: { char: '>', fg: C.WHITE,  bg: C.BLACK },
  [LOC_TILE.STAIRS_UP]:   { char: '<', fg: C.WHITE,  bg: C.BLACK },
  // Building-specific wall variants (auto-tiled at render time — char here is fallback only)
  [LOC_TILE.WALL_INN]:        { char: '█', fg: C.CYAN,       bg: C.BLACK },
  [LOC_TILE.WALL_SHOP]:       { char: '█', fg: C.YELLOW,     bg: C.BLACK },
  [LOC_TILE.WALL_BLACKSMITH]: { char: '█', fg: C.DARK_RED,   bg: C.BLACK },
  [LOC_TILE.WALL_HEALER]:     { char: '█', fg: C.GREEN,      bg: C.BLACK },
  [LOC_TILE.WALL_TAVERN]:     { char: '█', fg: C.BROWN,      bg: C.BLACK },
  [LOC_TILE.WALL_GUILD]:      { char: '█', fg: C.MAGENTA,    bg: C.BLACK },
  [LOC_TILE.WALL_TEMPLE]:     { char: '█', fg: C.WHITE,      bg: C.BLACK },
  // In-building stairs (cyan — distinct from world-exit stairs which are white)
  [LOC_TILE.STAIRS_FLOOR_UP]:   { char: '<', fg: C.CYAN, bg: C.BLACK },
  [LOC_TILE.STAIRS_FLOOR_DOWN]: { char: '>', fg: C.CYAN, bg: C.BLACK },
  // Decorative/debris
  [LOC_TILE.RUBBLE]:  { char: '%', fg: C.DARK_GRAY, bg: C.BLACK },
};

function makeTownGrid() {
  const grid = new Uint8Array(TW * TH).fill(LOC_TILE.PATH);
  return { tiles: grid, width: TW, height: TH, npcs: [], exits: [], chests: [], buildingFloors: [], buildings: [] };
}

function setTile(grid, x, y, tile) {
  if (x < 0 || x >= TW || y < 0 || y >= TH) return;
  grid.tiles[y * TW + x] = tile;
}

function getTile(grid, x, y) {
  if (x < 0 || x >= TW || y < 0 || y >= TH) return LOC_TILE.VOID;
  return grid.tiles[y * TW + x];
}

function fillRect(grid, x, y, w, h, tile) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      setTile(grid, x + dx, y + dy, tile);
    }
  }
}

// Finds the nearest walkable tile to (startX, startY) by expanding outward in rings.
// Skips any positions in the optional `occupied` set (format: "x,y").
// Returns null if no walkable tile is found within radius 10.
export function findWalkableNear(grid, startX, startY, occupied = new Set()) {
  for (let r = 0; r <= 10; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue; // Only check the ring edge
        const x = startX + dx;
        const y = startY + dy;
        if (x < 0 || x >= TW || y < 0 || y >= TH) continue;
        if (isWalkableTile(getTile(grid, x, y)) && !occupied.has(`${x},${y}`)) return { x, y };
      }
    }
  }
  return null;
}

// Similar to findWalkableNear but works on a FloorData object (not the main grid)
function findWalkableNearFloor(floorData, startX, startY, occupied = new Set()) {
  const { tiles, width, height } = floorData;
  for (let r = 0; r <= 10; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        const x = startX + dx;
        const y = startY + dy;
        if (x < 0 || x >= width || y < 0 || y >= height) continue;
        const tile = tiles[y * width + x];
        if (isWalkableTile(tile) && !occupied.has(`${x},${y}`)) return { x, y };
      }
    }
  }
  return null;
}

// Assert no two buildings in the array have overlapping footprints.
// Logs a warning (does not throw) so generation continues even if something goes wrong.
function assertNoOverlap(buildings) {
  for (let i = 0; i < buildings.length; i++) {
    for (let j = i + 1; j < buildings.length; j++) {
      const a = buildings[i];
      const b = buildings[j];
      const overlapX = a.x < b.x + b.w && a.x + a.w > b.x;
      const overlapY = a.y < b.y + b.h && a.y + a.h > b.y;
      if (overlapX && overlapY) {
        console.warn(`[towngen] Building overlap detected: ${a.label}@(${a.x},${a.y}) overlaps ${b.label}@(${b.x},${b.y})`);
      }
    }
  }
}

function drawBuilding(grid, x, y, w, h, wallTile = LOC_TILE.WALL, hasUpperFloors = false, hasBasement = false) {
  // Perimeter walls
  for (let dx = 0; dx < w; dx++) {
    setTile(grid, x + dx, y, wallTile);
    setTile(grid, x + dx, y + h - 1, wallTile);
  }
  for (let dy = 0; dy < h; dy++) {
    setTile(grid, x, y + dy, wallTile);
    setTile(grid, x + w - 1, y + dy, wallTile);
  }
  // Floor
  fillRect(grid, x + 1, y + 1, w - 2, h - 2, LOC_TILE.FLOOR);

  // Door in bottom-center (always standard door tile)
  const doorX = x + Math.floor(w / 2);
  setTile(grid, doorX, y + h - 1, LOC_TILE.DOOR);

  // Stair to upper floor at top-interior row (cyan <)
  if (hasUpperFloors && h >= 4) {
    const stairX = x + Math.floor(w / 2);
    setTile(grid, stairX, y + 1, LOC_TILE.STAIRS_FLOOR_UP);
  }

  // Stair to basement at bottom-interior row (cyan >)
  if (hasBasement && h >= 4) {
    const basStairX = x + Math.floor(w / 2) + (hasUpperFloors ? 1 : 0); // offset if upper stair is at same x
    setTile(grid, basStairX, y + h - 2, LOC_TILE.STAIRS_FLOOR_DOWN);
  }

  return { doorX, doorY: y + h - 1 };
}

// Generate the tile data for one upper floor of a building.
// The floor has the same outer footprint as the ground floor and is subdivided into 2-4 rooms.
function generateBuildingFloor(rng, building, floorIndex, hasNextFloor) {
  const { w, h } = building;
  const tiles = new Uint8Array(w * h).fill(LOC_TILE.WALL);

  const setF = (fx, fy, tile) => {
    if (fx < 0 || fx >= w || fy < 0 || fy >= h) return;
    tiles[fy * w + fx] = tile;
  };

  // Carve interior
  for (let dy = 1; dy < h - 1; dy++) {
    for (let dx = 1; dx < w - 1; dx++) {
      tiles[dy * w + dx] = LOC_TILE.FLOOR;
    }
  }

  // Subdivide into 2-3 rooms using one interior wall with a gap
  const roomCount = (w >= 9 && h >= 6) ? rng.int(2, 3) : 1;
  if (roomCount >= 2 && w >= 6) {
    // Vertical divider
    const divX = rng.int(Math.floor(w * 0.35), Math.floor(w * 0.65));
    for (let dy = 1; dy < h - 1; dy++) setF(divX, dy, LOC_TILE.WALL);
    // Gap in divider for passage
    const gapY = rng.int(2, h - 3);
    setF(divX, gapY, LOC_TILE.FLOOR);
  }

  // Place stair back down (> in cyan) in center
  const downStairX = Math.floor(w / 2);
  const downStairY = h - 2;
  setF(downStairX, downStairY, LOC_TILE.STAIRS_FLOOR_DOWN);

  // Stair up to next floor if applicable
  if (hasNextFloor) {
    setF(Math.floor(w / 2), 1, LOC_TILE.STAIRS_FLOOR_UP);
  }

  // Place some furniture
  placeFurniture(rng, tiles, w, h, building.label, floorIndex);

  // Player lands near the down-stair position (in floor coordinates)
  const playerStart = { x: downStairX, y: Math.max(1, downStairY - 1) };

  return { tiles, width: w, height: h, npcs: [], chests: [], playerStart, encounterZones: [] };
}

// Generate basement floor data for a building.
function generateBasement(rng, building, loc) {
  const { w, h } = building;
  const tiles = new Uint8Array(w * h).fill(LOC_TILE.WALL);

  // Carve single open room
  for (let dy = 1; dy < h - 1; dy++) {
    for (let dx = 1; dx < w - 1; dx++) {
      tiles[dy * w + dx] = LOC_TILE.FLOOR;
    }
  }

  // Stair back up (< in cyan)
  const upStairX = Math.floor(w / 2);
  const upStairY = h - 2;
  tiles[upStairY * w + upStairX] = LOC_TILE.STAIRS_FLOOR_UP;

  // Player lands just above the stair
  const playerStart = { x: upStairX, y: Math.max(1, upStairY - 1) };

  const npcs = [];
  const chests = [];
  const occupied = new Set();
  const floorData = { tiles, width: w, height: h, npcs, chests, playerStart, encounterZones: [] };

  // Possibly place monster encounter zone
  const hasMonsters = rng.chance(8);
  const hasQuestNPC = !hasMonsters && rng.chance(5);

  if (hasMonsters) {
    // Add encounter zone covering the whole basement interior
    floorData.encounterZones = [{ x: 1, y: 1, w: w - 2, h: h - 2, encounterRate: 20 }];
    // Always place a chest when monsters are present
    const cx = rng.int(1, w - 2);
    const cy = rng.int(1, h - 3);
    tiles[cy * w + cx] = LOC_TILE.CHEST_OPEN; // start closed
    tiles[cy * w + cx] = LOC_TILE.CHEST;
    chests.push({ x: cx, y: cy, tier: loc.dangerLevel || 1, opened: false });
    occupied.add(`${cx},${cy}`);
  } else if (rng.chance(15)) {
    // Independent chest (no monsters)
    const cx = rng.int(1, w - 2);
    const cy = rng.int(1, h - 3);
    tiles[cy * w + cx] = LOC_TILE.CHEST;
    chests.push({ x: cx, y: cy, tier: 1, opened: false });
    occupied.add(`${cx},${cy}`);
  }

  if (hasQuestNPC && loc.questGivers) {
    // 5% chance: place an unplaced quest NPC in the basement
    const giver = (loc.questGivers || []).find(g => !g._placed);
    if (giver) {
      giver._placed = true;
      const pos = findWalkableNearFloor(floorData, Math.floor(w / 2), Math.floor(h / 2), occupied) ?? { x: 2, y: 2 };
      occupied.add(`${pos.x},${pos.y}`);
      npcs.push({
        id: `bsmt_qg_${building.x}`,
        name: giver.name,
        type: 'quest_giver',
        pool: 'quest_giver',
        isQuestGiver: true,
        questIds: giver.questIds || [],
        dialogSeen: false,
        x: pos.x,
        y: pos.y,
      });
    }
  }

  return floorData;
}

// Place furniture tiles inside an upper floor based on building type.
function placeFurniture(rng, tiles, w, h, label, floorIndex) {
  const setF = (fx, fy, tile) => {
    if (fx <= 0 || fx >= w - 1 || fy <= 0 || fy >= h - 1) return;
    if (tiles[fy * w + fx] === LOC_TILE.FLOOR) tiles[fy * w + fx] = tile;
  };

  if (label === 'inn') {
    // Place beds along the walls
    for (let dx = 1; dx < w - 2; dx += 2) {
      setF(dx, 1, LOC_TILE.BED);
      if (h > 4) setF(dx, h - 2, LOC_TILE.BED);
    }
  } else if (label === 'guild') {
    // Tables and chairs for a meeting room
    setF(Math.floor(w / 2), Math.floor(h / 2), LOC_TILE.TABLE);
  } else if (label === 'temple') {
    setF(Math.floor(w / 2), 2, LOC_TILE.ALTAR);
  }
}

export function generateTown(rng, loc) {
  const grid = makeTownGrid();

  // Background: grass/path mix
  for (let y = 0; y < TH; y++) {
    for (let x = 0; x < TW; x++) {
      grid.tiles[y * TW + x] = rng.chance(20) ? LOC_TILE.TREE : LOC_TILE.PATH;
    }
  }

  // Central road (horizontal and vertical)
  const roadY = Math.floor(TH / 2);
  const roadX = Math.floor(TW / 2);
  for (let x = 2; x < TW - 2; x++) setTile(grid, x, roadY, LOC_TILE.ROAD);
  for (let y = 2; y < TH - 2; y++) setTile(grid, roadX, y, LOC_TILE.ROAD);

  // Place buildings along the road
  const buildingDefs = [
    { label: 'inn',        w: 10, h: 8,  minTier: 1 },
    { label: 'shop',       w: 8,  h: 6,  minTier: 1 },
    { label: 'tavern',     w: 8,  h: 6,  minTier: 1 },
    { label: 'healer',     w: 6,  h: 5,  minTier: 1 },
    { label: 'temple',     w: 8,  h: 7,  minTier: 2 },
    { label: 'guild',      w: 10, h: 7,  minTier: 2 },
    { label: 'blacksmith', w: 7,  h: 6,  minTier: 1 },
    { label: 'house',      w: 5,  h: 4,  minTier: 1 },
    { label: 'house',      w: 5,  h: 4,  minTier: 1 },
    { label: 'house',      w: 5,  h: 4,  minTier: 1 },
  ];

  const tier = loc.tier || 1;
  const eligible = buildingDefs.filter(b => b.minTier <= tier);

  // Place buildings on four quadrants
  const placements = [
    { col: 2,         row: 2,          limit: 3, maxX: roadX - 1, maxY: roadY - 1 }, // top-left
    { col: roadX + 2, row: 2,          limit: 3, maxX: TW - 3,    maxY: roadY - 1 }, // top-right
    { col: 2,         row: roadY + 2,  limit: 3, maxX: roadX - 1, maxY: TH - 3    }, // bottom-left
    { col: roadX + 2, row: roadY + 2,  limit: 3, maxX: TW - 3,    maxY: TH - 3    }, // bottom-right
  ];

  // Determine floor configuration per building type
  const floorConfig = {
    inn:        { upperFloors: 2, basementChance: 10 },
    guild:      { upperFloors: 2, basementChance: 0  },
    temple:     { upperFloors: 1, basementChance: 0  },
    tavern:     { upperFloors: 0, basementChance: 15 },
    shop:       { upperFloors: 0, basementChance: 0  },
    healer:     { upperFloors: 0, basementChance: 0  },
    blacksmith: { upperFloors: 0, basementChance: 0  },
    house:      { upperFloors: 0, basementChance: 0  },
  };

  const buildingWallMap = {
    inn:        LOC_TILE.WALL_INN,
    shop:       LOC_TILE.WALL_SHOP,
    blacksmith: LOC_TILE.WALL_BLACKSMITH,
    healer:     LOC_TILE.WALL_HEALER,
    tavern:     LOC_TILE.WALL_TAVERN,
    guild:      LOC_TILE.WALL_GUILD,
    temple:     LOC_TILE.WALL_TEMPLE,
    house:      LOC_TILE.WALL,
  };

  const placedBuildings = [];
  const buildQueue = rng.shuffle([...eligible]);
  let queueIdx = 0;
  let buildingId = 0;

  for (const placement of placements) {
    let curX = placement.col;
    let curY = placement.row;
    let count = 0;
    while (queueIdx < buildQueue.length && count < placement.limit) {
      const bdef = buildQueue[queueIdx];
      if (curX + bdef.w > placement.maxX || curY + bdef.h > placement.maxY) break;

      const cfg = floorConfig[bdef.label] || { upperFloors: 0, basementChance: 0 };
      const numUpperFloors = cfg.upperFloors;
      const hasBasement = cfg.basementChance > 0 && rng.chance(cfg.basementChance);
      const wallTile = buildingWallMap[bdef.label] ?? LOC_TILE.WALL;

      const door = drawBuilding(grid, curX, curY, bdef.w, bdef.h, wallTile, numUpperFloors > 0, hasBasement);

      const rec = {
        id: buildingId++,
        label: bdef.label,
        x: curX, y: curY,
        w: bdef.w, h: bdef.h,
        doorX: door.doorX, doorY: door.doorY,
        numUpperFloors,
        hasBasement,
      };
      placedBuildings.push(rec);

      // Clear path in front of door so it's always accessible
      for (let step = 1; step <= 3; step++) {
        setTile(grid, door.doorX, door.doorY + step, LOC_TILE.PATH);
      }
      curX += bdef.w + 2;
      queueIdx++;
      count++;
    }
  }

  // Validate no overlaps (logs warning only)
  assertNoOverlap(placedBuildings);

  // Generate upper floors and basements
  const buildingFloors = [];
  for (const b of placedBuildings) {
    // Upper floors
    for (let fi = 1; fi <= b.numUpperFloors; fi++) {
      const hasNextFloor = fi < b.numUpperFloors;
      const floorData = generateBuildingFloor(rng, b, fi, hasNextFloor);
      buildingFloors.push({ buildingId: b.id, floorIndex: fi, floorData, bx: b.x, by: b.y, bw: b.w, bh: b.h });
    }
    // Basement
    if (b.hasBasement) {
      const floorData = generateBasement(rng, b, loc);
      buildingFloors.push({ buildingId: b.id, floorIndex: -1, floorData, bx: b.x, by: b.y, bw: b.w, bh: b.h });
    }
  }

  // Add trees around border
  for (let x = 0; x < TW; x++) {
    for (let y = 0; y < 2; y++) setTile(grid, x, y, LOC_TILE.TREE);
    for (let y = TH - 2; y < TH; y++) setTile(grid, x, y, LOC_TILE.TREE);
  }
  for (let y = 0; y < TH; y++) {
    for (let x = 0; x < 2; x++) setTile(grid, x, y, LOC_TILE.TREE);
    for (let x = TW - 2; x < TW; x++) setTile(grid, x, y, LOC_TILE.TREE);
  }

  // Add world map exit at bottom-center
  const exitX = Math.floor(TW / 2);
  const exitY = TH - 2;
  setTile(grid, exitX, exitY, LOC_TILE.STAIRS_UP);
  grid.exits.push({ x: exitX, y: exitY, dest: 'world' });

  // Spawn NPCs on the ground floor
  const npcs = [];
  const occupiedPos = new Set();
  for (const b of placedBuildings) {
    const groundNPCs = buildingNPCs(rng, b, loc);
    const cx = b.x + Math.floor(b.w / 2);
    const cy = b.y + Math.floor(b.h / 2);
    groundNPCs.forEach(npc => {
      const pos = findWalkableNear(grid, cx, cy, occupiedPos) ?? { x: cx, y: cy };
      npc.x = pos.x;
      npc.y = pos.y;
      occupiedPos.add(`${npc.x},${npc.y}`);
      npcs.push(npc);
    });

    // Place generic/quest NPCs on upper floors (service NPCs never go up)
    for (const entry of buildingFloors.filter(e => e.buildingId === b.id && e.floorIndex > 0)) {
      const upperOccupied = new Set();
      placeUpperFloorNPCs(rng, b, entry.floorData, loc, upperOccupied);
    }
  }

  // Add quest givers from location (place unplaced ones near the road)
  if (loc.questGivers) {
    for (const qg of loc.questGivers) {
      if (qg._placed) continue;
      const qgRaw = { x: roadX + rng.int(-3, 3), y: roadY + rng.int(-2, 2) };
      const qgPos = findWalkableNear(grid, qgRaw.x, qgRaw.y, occupiedPos) ?? { x: roadX, y: roadY };
      occupiedPos.add(`${qgPos.x},${qgPos.y}`);
      npcs.push({
        id: `qg_${qg.name}`,
        name: qg.name,
        type: 'quest_giver',
        pool: 'quest_giver',
        x: qgPos.x,
        y: qgPos.y,
        dialogSeen: false,
        isQuestGiver: true,
        questIds: qg.questIds || [],
      });
    }
  }

  // Add story characters if any are in this town
  if (loc.storyCharacters) {
    for (const sc of loc.storyCharacters) {
      const scRaw = { x: roadX + rng.int(-5, 5), y: roadY + rng.int(-3, 3) };
      const scPos = findWalkableNear(grid, scRaw.x, scRaw.y, occupiedPos) ?? { x: roadX, y: roadY };
      occupiedPos.add(`${scPos.x},${scPos.y}`);
      npcs.push({
        id: `story_${sc.name}`,
        name: sc.name,
        type: 'story',
        pool: 'story',
        storyRole: sc.role,
        x: scPos.x,
        y: scPos.y,
        isStory: true,
        dialogSeen: false,
      });
    }
  }

  grid.npcs = npcs;
  grid.buildings = placedBuildings;
  grid.buildingFloors = buildingFloors;
  grid.chests = [];
  grid.playerStart = { x: exitX, y: exitY - 1 }; // start just inside the entrance

  return grid;
}

// Place non-service NPCs on an upper floor (villagers, quest givers).
function placeUpperFloorNPCs(rng, building, floorData, loc, occupied) {
  const cx = Math.floor(floorData.width / 2);
  const cy = Math.floor(floorData.height / 2);

  // Generic villager: 30% chance
  if (rng.chance(30)) {
    const pos = findWalkableNearFloor(floorData, cx, cy, occupied);
    if (pos) {
      occupied.add(`${pos.x},${pos.y}`);
      floorData.npcs.push({
        id: `vil_up_${building.id}_${floorData.width}_${pos.x}`,
        name: (NPC_NAMES && NPC_NAMES.villager) ? NPC_NAMES.villager[Math.floor(Math.random() * NPC_NAMES.villager.length)] : 'Traveller',
        type: 'villager', pool: 'villager',
        x: pos.x, y: pos.y,
      });
    }
  }

  // Quest NPC: 20% chance (only if loc has unplaced quest givers)
  if (rng.chance(20) && loc.questGivers) {
    const giver = (loc.questGivers || []).find(g => !g._placed);
    if (giver) {
      const pos = findWalkableNearFloor(floorData, cx, cy, occupied);
      if (pos) {
        giver._placed = true;
        occupied.add(`${pos.x},${pos.y}`);
        floorData.npcs.push({
          id: `qg_up_${building.id}_${pos.x}`,
          name: giver.name,
          type: 'quest_giver', pool: 'quest_giver',
          isQuestGiver: true, questIds: giver.questIds || [],
          dialogSeen: false,
          x: pos.x, y: pos.y,
        });
      }
    }
  }

  // Upper floor chest: 20% chance
  if (rng.chance(20)) {
    const pos = findWalkableNearFloor(floorData, cx, cy + 1, occupied);
    if (pos) {
      occupied.add(`${pos.x},${pos.y}`);
      floorData.tiles[pos.y * floorData.width + pos.x] = LOC_TILE.CHEST;
      floorData.chests.push({ x: pos.x, y: pos.y, tier: 1, opened: false });
    }
  }
}

// Returns ground-floor service NPCs for a building.
// Service NPCs (innkeeper, shopkeeper, healer, etc.) always stay on ground floor.
function buildingNPCs(rng, building, loc) {
  const npcs = [];
  const tier = loc.tier || 1;
  switch (building.label) {
    case 'inn':
      npcs.push({
        id: `inn_${building.x}`, name: rng.pick(NPC_NAMES.innkeeper),
        type: 'innkeeper', pool: 'innkeeper',
        isInnkeeper: true, innName: loc.innName || 'The Inn',
        shopLabel: loc.innName || 'The Inn',
      });
      break;
    case 'tavern': {
      const barName = rng.pick(NPC_NAMES.barkeep);
      npcs.push({
        id: `bar_${building.x}`, name: barName,
        type: 'barkeep', pool: 'barkeep',
        isShopkeeper: true, shopRole: 'tavern', shopTier: tier,
        shopRegion: loc.region || null,
        shopLabel: 'The Tavern Bar',
      });
      npcs.push({ id: `vil_${building.x}`, name: rng.pick(NPC_NAMES.villager), type: 'villager', pool: 'villager' });
      break;
    }
    case 'shop':
      npcs.push({
        id: `shop_${building.x}`, name: rng.pick(NPC_NAMES.shopkeeper),
        type: 'shopkeeper', pool: 'shopkeeper',
        isShopkeeper: true, shopRole: 'general', shopTier: tier,
        shopRegion: loc.region || null,
        shopLabel: 'General Store',
      });
      break;
    case 'healer':
      npcs.push({
        id: `heal_${building.x}`, name: rng.pick(NPC_NAMES.healer),
        type: 'healer', pool: 'healer',
        isShopkeeper: true, shopRole: 'healer', shopTier: tier,
        shopRegion: loc.region || null,
        shopLabel: 'Healer\'s Supplies',
      });
      break;
    case 'temple':
      npcs.push({
        id: `temp_${building.x}`, name: rng.pick(NPC_NAMES.healer),
        type: 'healer', pool: 'healer',
        isShopkeeper: true, shopRole: 'healer', shopTier: tier,
        shopRegion: loc.region || null,
        shopLabel: 'Temple Stores',
      });
      break;
    case 'guild': {
      // Place one of this town's quest givers inside the guild hall on ground floor
      const giver = (loc.questGivers || []).find(g => !g._placed);
      if (giver) {
        giver._placed = true;
        npcs.push({
          id: `guild_${building.x}`, name: giver.name,
          type: 'quest_giver', pool: 'quest_giver',
          isQuestGiver: true, questIds: giver.questIds || [],
          dialogSeen: false,
        });
      }
      break;
    }
    case 'blacksmith':
      npcs.push({
        id: `smith_${building.x}`, name: rng.pick(NPC_NAMES.shopkeeper),
        type: 'shopkeeper', pool: 'shopkeeper',
        isShopkeeper: true, shopRole: 'blacksmith', shopTier: tier,
        shopRegion: loc.region || null,
        shopLabel: 'Blacksmith\'s Forge',
      });
      break;
    default: // house
      if (rng.chance(60)) {
        npcs.push({ id: `vil_${building.x}_${building.y}`, name: rng.pick(NPC_NAMES.villager), type: 'villager', pool: 'villager' });
      }
      break;
  }
  return npcs;
}
