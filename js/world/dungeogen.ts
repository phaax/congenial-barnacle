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

export function generateDungeon(rng, loc) {
  const g = makeDungeonGrid();

  const isCave   = loc.type === LOC_TYPE.CAVE;
  const isRuins  = loc.type === LOC_TYPE.RUINS;
  const danger   = loc.dangerLevel || 1;

  // Generate rooms
  const targetRooms = rng.int(8, 16);
  const rooms = [];

  for (let attempt = 0; attempt < 500 && rooms.length < targetRooms; attempt++) {
    const w = rng.int(4, 10);
    const h = rng.int(4, 8);
    const x = rng.int(1, DW - w - 2);
    const y = rng.int(1, DH - h - 2);
    const room = { x, y, w, h };

    if (rooms.some(r => roomsOverlap(r, room))) continue;

    carveRoom(g, room);
    rooms.push(room);
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
      // Place door on a wall adjacent to the room
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

  g.rooms = rooms;

  // Place entrance (stairs up) in first room
  const entrance = roomCenter(rooms[0]);
  setTile(g, entrance.x, entrance.y, LOC_TILE.STAIRS_UP);
  g.exits.push({ x: entrance.x, y: entrance.y, dest: 'world' });
  g.playerStart = { x: entrance.x, y: entrance.y };

  // Place exit (stairs down or boss room marker) in last room
  const lastRoom = rooms[rooms.length - 1];
  const lastCenter = roomCenter(lastRoom);

  if (loc.hasBoss) {
    // Boss altar/throne
    setTile(g, lastCenter.x, lastCenter.y, LOC_TILE.ALTAR);
    g.bossRoom = lastRoom;
    g.bossPos  = lastCenter;
  } else if (rng.chance(30)) {
    // Multi-level indicator
    setTile(g, lastCenter.x, lastCenter.y, LOC_TILE.STAIRS_DOWN);
  }

  // Place chests
  const chestRooms = rng.shuffle([...rooms]).slice(0, rng.int(2, 5));
  for (const room of chestRooms) {
    const cx = room.x + rng.int(1, room.w - 2);
    const cy = room.y + rng.int(1, room.h - 2);
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
      x: lastCenter.x,
      y: lastCenter.y,
      defeated: false,
    });
  }

  // Add wall decorations for atmosphere (cave stalactites, ruin cracks, etc.)
  if (isCave) {
    addCaveDecorations(g, rng);
  } else if (isRuins) {
    addRuinDecorations(g, rng);
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
  // Scatter water pools and stalactite indicators
  for (let y = 1; y < DH - 1; y++) {
    for (let x = 1; x < DW - 1; x++) {
      if (getTile(g, x, y) === LOC_TILE.FLOOR && rng.chance(3)) {
        setTile(g, x, y, LOC_TILE.WATER);
      }
    }
  }
}

function addRuinDecorations(g, rng) {
  // Some walls become partial (floor) for ruin feel
  for (let y = 1; y < DH - 1; y++) {
    for (let x = 1; x < DW - 1; x++) {
      if (getTile(g, x, y) === LOC_TILE.WALL && rng.chance(5)) {
        // Check surrounded by non-wall to avoid big holes
        let neighbors = 0;
        for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
          if (getTile(g, x+dx, y+dy) === LOC_TILE.FLOOR) neighbors++;
        }
        if (neighbors >= 2) setTile(g, x, y, LOC_TILE.FLOOR);
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
  const zone = layout.encounterZones.find(z =>
    x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h
  );
  return zone ? zone.encounterRate : 0;
}
