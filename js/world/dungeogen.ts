// @ts-nocheck
import { LOC_TILE, C, LOC_TYPE } from '../data/constants';
import { MONSTERS } from '../data/monsters';

export const DW = 60; // Dungeon width
export const DH = 45; // Dungeon height

export const DUNGEON_TILES = {
  [LOC_TILE.VOID]:    { char: ' ', fg: C.BLACK,      bg: C.BLACK },
  [LOC_TILE.WALL]:    { char: '█', fg: C.DARK_GRAY,  bg: C.BLACK },
  [LOC_TILE.FLOOR]:   { char: '·', fg: C.DARK_GRAY,  bg: C.BLACK },
  [LOC_TILE.DOOR]:    { char: '+', fg: C.BROWN,      bg: C.BLACK },
  [LOC_TILE.DOOR_OPEN]:{ char: '-', fg: C.BROWN,     bg: C.BLACK },
  [LOC_TILE.WATER]:   { char: '~', fg: C.DARK_BLUE,  bg: C.BLACK },
  [LOC_TILE.STAIRS_DOWN]: { char: '>', fg: C.WHITE,  bg: C.BLACK },
  [LOC_TILE.STAIRS_UP]:   { char: '<', fg: C.WHITE,  bg: C.BLACK },
  [LOC_TILE.CHEST]:   { char: '⌂', fg: C.YELLOW,    bg: C.BLACK },
  [LOC_TILE.CHEST_OPEN]:  { char: 'c', fg: C.BROWN,  bg: C.BLACK },
  [LOC_TILE.ALTAR]:   { char: '†', fg: C.CYAN,       bg: C.BLACK },
  // In-dungeon floor transitions (cyan)
  [LOC_TILE.STAIRS_FLOOR_UP]:   { char: '<', fg: C.CYAN, bg: C.BLACK },
  [LOC_TILE.STAIRS_FLOOR_DOWN]: { char: '>', fg: C.CYAN, bg: C.BLACK },
  // Cave decorations
  [LOC_TILE.CAVE_WATER]:  { char: '≈', fg: C.BLUE,      bg: C.BLACK },
  [LOC_TILE.STALACTITE]:  { char: 'i', fg: C.DARK_GRAY, bg: C.BLACK },
  [LOC_TILE.MUSHROOM]:    { char: '°', fg: C.GREEN,     bg: C.BLACK },
  [LOC_TILE.CRYSTAL]:     { char: '*', fg: C.CYAN,      bg: C.BLACK },
  // Ruin/dungeon debris
  [LOC_TILE.RUBBLE]:      { char: '%', fg: C.DARK_GRAY, bg: C.BLACK },
};

function makeDungeonGrid() {
  const tiles = new Uint8Array(DW * DH).fill(LOC_TILE.WALL);
  return { tiles, width: DW, height: DH, rooms: [], corridors: [], npcs: [], chests: [], exits: [], encounterZones: [] };
}

function setTile(g, x, y, t) {
  if (x < 0 || x >= DW || y < 0 || y >= DH) return;
  g.tiles[y * DW + x] = t;
}

function getTile(g, x, y) {
  if (x < 0 || x >= DW || y < 0 || y >= DH) return LOC_TILE.WALL;
  return g.tiles[y * DW + x];
}

function fillRect(g, x, y, w, h, t) {
  for (let dy = 0; dy < h; dy++)
    for (let dx = 0; dx < w; dx++)
      setTile(g, x + dx, y + dy, t);
}

function carveRoom(g, room) {
  fillRect(g, room.x, room.y, room.w, room.h, LOC_TILE.FLOOR);
}

// Cross-shaped room: two overlapping rectangles
function carveCrossRoom(g, cx, cy, size) {
  const half = Math.floor(size / 2);
  // Horizontal bar
  fillRect(g, cx - size, cy - 1, size * 2, 3, LOC_TILE.FLOOR);
  // Vertical bar
  fillRect(g, cx - 1, cy - size, 3, size * 2, LOC_TILE.FLOOR);
}

function carveCorridor(g, x1, y1, x2, y2) {
  // L-shaped corridor
  let x = x1, y = y1;
  while (x !== x2) {
    setTile(g, x, y, LOC_TILE.FLOOR);
    x += x < x2 ? 1 : -1;
  }
  while (y !== y2) {
    setTile(g, x, y, LOC_TILE.FLOOR);
    y += y < y2 ? 1 : -1;
  }
}

function roomCenter(room) {
  return { x: Math.floor(room.x + room.w / 2), y: Math.floor(room.y + room.h / 2) };
}

function roomsOverlap(a, b, margin = 1) {
  return !(a.x + a.w + margin <= b.x ||
           b.x + b.w + margin <= a.x ||
           a.y + a.h + margin <= b.y ||
           b.y + b.h + margin <= a.y);
}

// ─── Cellular Automata Cave Generation ───────────────────────────────────────

// Count wall tiles in the 3×3 neighbourhood of (x,y)
function countWallNeighbours(map, w, h, x, y) {
  let count = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) {
        count++; // out-of-bounds counts as wall
      } else if (map[ny * w + nx] === LOC_TILE.WALL) {
        count++;
      }
    }
  }
  return count;
}

// Flood-fill from (sx, sy), returning array of {x,y} positions reachable as FLOOR
function floodFill(map, w, h, sx, sy) {
  const visited = new Uint8Array(w * h);
  const queue = [];
  const start = sy * w + sx;
  if (map[start] !== LOC_TILE.FLOOR) return [];
  visited[start] = 1;
  queue.push({ x: sx, y: sy });
  let head = 0;
  while (head < queue.length) {
    const { x, y } = queue[head++];
    for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
      const idx = ny * w + nx;
      if (!visited[idx] && map[idx] === LOC_TILE.FLOOR) {
        visited[idx] = 1;
        queue.push({ x: nx, y: ny });
      }
    }
  }
  return queue;
}

// Find all distinct floor regions; return them sorted largest first
function floodFillAll(map, w, h) {
  const seen = new Uint8Array(w * h);
  const regions = [];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      if (map[y * w + x] === LOC_TILE.FLOOR && !seen[y * w + x]) {
        const region = floodFill(map, w, h, x, y);
        for (const cell of region) seen[cell.y * w + cell.x] = 1;
        regions.push(region);
      }
    }
  }
  regions.sort((a, b) => b.length - a.length);
  return regions;
}

function generateCaveCA(rng, w, h) {
  // 1. Random init: ~45% wall fill
  const map = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      map[y * w + x] = (x === 0 || x === w - 1 || y === 0 || y === h - 1)
        ? LOC_TILE.WALL
        : rng.chance(45) ? LOC_TILE.WALL : LOC_TILE.FLOOR;
    }
  }

  // 2. Smooth with 4 CA iterations (birth ≥ 5, survive ≥ 4)
  for (let iter = 0; iter < 4; iter++) {
    const next = new Uint8Array(map);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const walls = countWallNeighbours(map, w, h, x, y);
        next[y * w + x] = walls >= 5 ? LOC_TILE.WALL : LOC_TILE.FLOOR;
      }
    }
    map.set(next);
  }

  // 3. Keep only the largest connected floor region
  const regions = floodFillAll(map, w, h);
  if (regions.length > 1) {
    for (let i = 1; i < regions.length; i++) {
      for (const cell of regions[i]) {
        map[cell.y * w + cell.x] = LOC_TILE.WALL;
      }
    }
  }

  return { map, mainRegion: regions[0] || [] };
}

// ─── Dungeon Generation ───────────────────────────────────────────────────────

export function generateDungeon(rng, loc) {
  const g = makeDungeonGrid();

  const isCave   = loc.type === LOC_TYPE.CAVE;
  const isRuins  = loc.type === LOC_TYPE.RUINS;
  const danger   = loc.dangerLevel || 1;

  let rooms = [];

  if (isCave) {
    // ── Cellular Automata Cave ──────────────────────────────────────────────
    const { map, mainRegion } = generateCaveCA(rng, DW, DH);
    g.tiles.set(map);

    // Extract pseudo-rooms from the main region by sampling clusters
    if (mainRegion.length >= 4) {
      // Divide main region into clusters as "rooms" for encounter zones
      const shuffled = rng.shuffle([...mainRegion]);
      const clusterCount = Math.min(8, Math.floor(mainRegion.length / 20));
      for (let i = 0; i < clusterCount; i++) {
        const seed = shuffled[Math.floor(i * shuffled.length / clusterCount)];
        rooms.push({ x: seed.x - 1, y: seed.y - 1, w: 3, h: 3 }); // small notional room
      }
    }

    // Ensure at least 2 pseudo-rooms for entrance/exit
    if (rooms.length < 2 && mainRegion.length >= 2) {
      rooms = [
        { x: mainRegion[0].x - 1, y: mainRegion[0].y - 1, w: 3, h: 3 },
        { x: mainRegion[mainRegion.length - 1].x - 1, y: mainRegion[mainRegion.length - 1].y - 1, w: 3, h: 3 },
      ];
    }

  } else {
    // ── BSP Room + Corridor Dungeon ─────────────────────────────────────────
    const targetRooms = rng.int(8, 16);
    let attempts = 0;

    while (attempts < 500 && rooms.length < targetRooms) {
      attempts++;
      // Occasionally generate a cross or wide-hall room shape
      const variant = rng.int(0, 9);
      if (variant === 0 && rooms.length >= 2) {
        // Cross room
        const cx = rng.int(8, DW - 9);
        const cy = rng.int(8, DH - 9);
        const size = rng.int(3, 5);
        const rect = { x: cx - size - 1, y: cy - size - 1, w: size * 2 + 3, h: size * 2 + 3 };
        if (!rooms.some(r => roomsOverlap(r, rect))) {
          carveCrossRoom(g, cx, cy, size);
          rooms.push({ x: cx - size, y: cy - 1, w: size * 2, h: 3 }); // notional center for corridor purposes
        }
        continue;
      }
      if (variant === 1 && rooms.length >= 2) {
        // Wide corridor hall
        const w = rng.int(12, 16);
        const h = rng.int(3, 4);
        const x = rng.int(1, DW - w - 2);
        const y = rng.int(1, DH - h - 2);
        const room = { x, y, w, h };
        if (!rooms.some(r => roomsOverlap(r, room))) {
          carveRoom(g, room);
          rooms.push(room);
        }
        continue;
      }
      // Standard rectangular room
      const w = rng.int(4, 10);
      const h = rng.int(4, 8);
      const x = rng.int(1, DW - w - 2);
      const y = rng.int(1, DH - h - 2);
      const room = { x, y, w, h };
      if (!rooms.some(r => roomsOverlap(r, room))) {
        carveRoom(g, room);
        rooms.push(room);
      }
    }

    // Connect rooms with corridors
    for (let i = 1; i < rooms.length; i++) {
      const c1 = roomCenter(rooms[i - 1]);
      const c2 = roomCenter(rooms[i]);
      carveCorridor(g, c1.x, c1.y, c2.x, c2.y);
    }

    // Add doors at some room entrances
    for (const room of rooms) {
      if (rng.chance(40)) {
        const edges = [];
        for (let dx = 0; dx < room.w; dx++) {
          edges.push({ x: room.x + dx, y: room.y - 1 });
          edges.push({ x: room.x + dx, y: room.y + room.h });
        }
        for (let dy = 0; dy < room.h; dy++) {
          edges.push({ x: room.x - 1, y: room.y + dy });
          edges.push({ x: room.x + room.w, y: room.y + dy });
        }
        for (const edge of edges) {
          if (getTile(g, edge.x, edge.y) === LOC_TILE.FLOOR) {
            setTile(g, edge.x, edge.y, LOC_TILE.DOOR);
            break;
          }
        }
      }
    }
  }

  g.rooms = rooms;

  // Place entrance (stairs up) in first room
  const entrance = roomCenter(rooms[0] || { x: 1, y: 1, w: 3, h: 3 });
  // Ensure entrance is on a floor tile
  let entrancePos = entrance;
  if (getTile(g, entrance.x, entrance.y) !== LOC_TILE.FLOOR) {
    // Find nearest floor tile
    for (let r = 0; r <= 10; r++) {
      let found = false;
      for (let dx = -r; dx <= r && !found; dx++) {
        for (let dy = -r; dy <= r && !found; dy++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
          const tx = entrance.x + dx;
          const ty = entrance.y + dy;
          if (getTile(g, tx, ty) === LOC_TILE.FLOOR) {
            entrancePos = { x: tx, y: ty };
            found = true;
          }
        }
      }
      if (found) break;
    }
  }
  setTile(g, entrancePos.x, entrancePos.y, LOC_TILE.STAIRS_UP);
  g.exits.push({ x: entrancePos.x, y: entrancePos.y, dest: 'world' });
  g.playerStart = { x: entrancePos.x, y: entrancePos.y };

  // Place exit (stairs down or boss room marker) in last room
  const lastRoom = rooms[rooms.length - 1] || rooms[0] || { x: DW - 4, y: DH - 4, w: 3, h: 3 };
  const lastCenter = roomCenter(lastRoom);

  // Ensure last room center is floor
  let lastPos = lastCenter;
  if (getTile(g, lastCenter.x, lastCenter.y) !== LOC_TILE.FLOOR) {
    for (let r = 0; r <= 10; r++) {
      let found = false;
      for (let dx = -r; dx <= r && !found; dx++) {
        for (let dy = -r; dy <= r && !found; dy++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
          const tx = lastCenter.x + dx;
          const ty = lastCenter.y + dy;
          if (getTile(g, tx, ty) === LOC_TILE.FLOOR && !(tx === entrancePos.x && ty === entrancePos.y)) {
            lastPos = { x: tx, y: ty };
            found = true;
          }
        }
      }
      if (found) break;
    }
  }

  if (loc.hasBoss) {
    setTile(g, lastPos.x, lastPos.y, LOC_TILE.ALTAR);
    g.bossRoom = lastRoom;
    g.bossPos  = lastPos;
  } else if (rng.chance(60)) {
    setTile(g, lastPos.x, lastPos.y, LOC_TILE.STAIRS_DOWN);
    g.exits.push({ x: lastPos.x, y: lastPos.y, dest: 'world' });
  }

  // Place chests
  const chestRooms = rng.shuffle([...rooms]).slice(0, rng.int(2, 5));
  for (const room of chestRooms) {
    const cx = room.x + rng.int(1, Math.max(1, room.w - 2));
    const cy = room.y + rng.int(1, Math.max(1, room.h - 2));
    if (getTile(g, cx, cy) === LOC_TILE.FLOOR) {
      setTile(g, cx, cy, LOC_TILE.CHEST);
      g.chests.push({ x: cx, y: cy, tier: danger, opened: false });
    }
  }

  // Designate encounter zones (rooms other than first)
  for (let i = 1; i < rooms.length; i++) {
    g.encounterZones.push({ ...rooms[i], encounterRate: 60 + danger * 10 });
  }

  // Place boss NPC if applicable
  if (loc.hasBoss) {
    g.npcs.push({
      id: `boss_${loc.id}`,
      name: getBossName(loc.bossId),
      type: 'boss',
      isBoss: true,
      monsterId: loc.bossId,
      x: lastPos.x,
      y: lastPos.y,
      defeated: false,
    });
  }

  // Add wall decorations for atmosphere
  if (isCave) {
    addCaveDecorations(g, rng);
  } else if (isRuins) {
    addRuinDecorations(g, rng);
  } else {
    addDungeonDecorations(g, rng);
  }

  return g;
}

function getBossName(id) {
  const names = {
    lich:          'The Lich',
    ancient_dragon:'Ancient Dragon',
    demon_lord:    'Demon Lord',
  };
  return names[id] || 'The Boss';
}

function addCaveDecorations(g, rng) {
  for (let y = 1; y < DH - 1; y++) {
    for (let x = 1; x < DW - 1; x++) {
      const t = getTile(g, x, y);
      if (t === LOC_TILE.FLOOR) {
        // Water pools (calm cave water)
        if (rng.chance(3)) {
          setTile(g, x, y, LOC_TILE.CAVE_WATER);
          continue;
        }
        // Stalactite drips near walls
        let wallNeighbours = 0;
        for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
          if (getTile(g, x+dx, y+dy) === LOC_TILE.WALL) wallNeighbours++;
        }
        if (wallNeighbours >= 1 && rng.chance(2)) {
          setTile(g, x, y, LOC_TILE.STALACTITE);
          continue;
        }
        // Mushrooms away from water
        if (wallNeighbours === 0 && rng.chance(1)) {
          setTile(g, x, y, LOC_TILE.MUSHROOM);
          continue;
        }
      } else if (t === LOC_TILE.WALL) {
        // Crystals on walls adjacent to multiple floor tiles
        let floorNeighbours = 0;
        for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
          if (getTile(g, x+dx, y+dy) === LOC_TILE.FLOOR) floorNeighbours++;
        }
        if (floorNeighbours >= 2 && rng.chance(2)) {
          setTile(g, x, y, LOC_TILE.CRYSTAL);
        }
      }
    }
  }
}

function addDungeonDecorations(g, rng) {
  for (let y = 1; y < DH - 1; y++) {
    for (let x = 1; x < DW - 1; x++) {
      const t = getTile(g, x, y);
      if (t === LOC_TILE.FLOOR) {
        // Rubble in corners (2+ wall neighbours)
        let wallNeighbours = 0;
        for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
          if (getTile(g, x+dx, y+dy) === LOC_TILE.WALL) wallNeighbours++;
        }
        if (wallNeighbours >= 2 && rng.chance(3)) {
          setTile(g, x, y, LOC_TILE.RUBBLE);
        }
      } else if (t === LOC_TILE.WALL) {
        // Crystals deep in dungeon
        let floorNeighbours = 0;
        for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
          if (getTile(g, x+dx, y+dy) === LOC_TILE.FLOOR) floorNeighbours++;
        }
        if (floorNeighbours >= 2 && rng.chance(1)) {
          setTile(g, x, y, LOC_TILE.CRYSTAL);
        }
      }
    }
  }
}

function addRuinDecorations(g, rng) {
  for (let y = 1; y < DH - 1; y++) {
    for (let x = 1; x < DW - 1; x++) {
      if (getTile(g, x, y) === LOC_TILE.WALL && rng.chance(5)) {
        let floorNeighbours = 0;
        for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
          if (getTile(g, x+dx, y+dy) === LOC_TILE.FLOOR) floorNeighbours++;
        }
        // Replace wall with rubble (walkable) instead of floor for better ruin feel
        if (floorNeighbours >= 2) setTile(g, x, y, LOC_TILE.RUBBLE);
      }
    }
  }
}

// Check if a position is an encounter zone
export function isEncounterZone(layout, x, y) {
  if (!layout || !layout.encounterZones) return false;
  return layout.encounterZones.some(z =>
    x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h
  );
}

// Get encounter rate at position
export function getEncounterRate(layout, x, y) {
  const zone = layout.encounterZones?.find(z =>
    x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h
  );
  return zone ? zone.encounterRate : 0;
}
