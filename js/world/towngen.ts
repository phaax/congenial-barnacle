// @ts-nocheck
import { LOC_TILE, C } from '../data/constants';
import { NPC_NAMES } from '../data/dialog';

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
};

function makeTownGrid() {
  const grid = new Uint8Array(TW * TH).fill(LOC_TILE.PATH);
  return { tiles: grid, width: TW, height: TH, npcs: [], exits: [] };
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

function drawBuilding(grid, x, y, w, h) {
  // Walls
  for (let dx = 0; dx < w; dx++) {
    setTile(grid, x + dx, y, LOC_TILE.WALL);
    setTile(grid, x + dx, y + h - 1, LOC_TILE.WALL);
  }
  for (let dy = 0; dy < h; dy++) {
    setTile(grid, x, y + dy, LOC_TILE.WALL);
    setTile(grid, x + w - 1, y + dy, LOC_TILE.WALL);
  }
  // Floor
  fillRect(grid, x + 1, y + 1, w - 2, h - 2, LOC_TILE.FLOOR);
  // Door in bottom-center
  const doorX = x + Math.floor(w / 2);
  setTile(grid, doorX, y + h - 1, LOC_TILE.DOOR);
  return { doorX, doorY: y + h - 1 };
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

  const buildings = [];

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
    { col: 2,          row: 2,       limit: 3 }, // top-left
    { col: roadX + 2,  row: 2,       limit: 3 }, // top-right
    { col: 2,          row: roadY + 2, limit: 3 }, // bottom-left
    { col: roadX + 2,  row: roadY + 2, limit: 3 }, // bottom-right
  ];

  for (const placement of placements) {
    let curX = placement.col;
    let curY = placement.row;
    let count = 0;
    for (const bdef of rng.shuffle([...eligible])) {
      if (count >= placement.limit) break;
      if (curX + bdef.w >= TW - 2) break;
      if (curY + bdef.h >= TH - 2) break;

      const door = drawBuilding(grid, curX, curY, bdef.w, bdef.h);
      buildings.push({ ...bdef, x: curX, y: curY, doorX: door.doorX, doorY: door.doorY });
      // Clear path in front of door so it's always accessible
      for (let step = 1; step <= 3; step++) {
        setTile(grid, door.doorX, door.doorY + step, LOC_TILE.PATH);
      }
      curX += bdef.w + 2;
      count++;
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

  // Spawn NPCs inside buildings
  const npcs = [];
  for (const b of buildings) {
    const npcList = buildingNPCs(rng, b, loc);
    npcList.forEach(npc => {
      npc.x = b.x + Math.floor(b.w / 2);
      npc.y = b.y + Math.floor(b.h / 2);
      npcs.push(npc);
    });
  }

  // Add quest givers from location (place unplaced ones near the road)
  if (loc.questGivers) {
    for (const qg of loc.questGivers) {
      if (qg._placed) continue; // already placed inside a building
      npcs.push({
        id: `qg_${qg.name}`,
        name: qg.name,
        type: 'quest_giver',
        pool: 'quest_giver',
        x: roadX + rng.int(-3, 3),
        y: roadY + rng.int(-2, 2),
        dialogSeen: false,
        isQuestGiver: true,
        questIds: qg.questIds || [],
      });
    }
  }

  // Add story characters if any are in this town
  if (loc.storyCharacters) {
    for (const sc of loc.storyCharacters) {
      npcs.push({
        id: `story_${sc.name}`,
        name: sc.name,
        type: 'story',
        pool: 'story',
        storyRole: sc.role,
        x: roadX + rng.int(-5, 5),
        y: roadY + rng.int(-3, 3),
        isStory: true,
        dialogSeen: false,
      });
    }
  }

  grid.npcs = npcs;
  grid.buildings = buildings;
  grid.playerStart = { x: roadX, y: roadY }; // start at road center

  return grid;
}

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
        shopLabel: 'General Store',
      });
      break;
    case 'healer':
      npcs.push({
        id: `heal_${building.x}`, name: rng.pick(NPC_NAMES.healer),
        type: 'healer', pool: 'healer',
        isShopkeeper: true, shopRole: 'healer', shopTier: tier,
        shopLabel: 'Healer\'s Supplies',
      });
      break;
    case 'temple':
      npcs.push({
        id: `temp_${building.x}`, name: rng.pick(NPC_NAMES.healer),
        type: 'healer', pool: 'healer',
        isShopkeeper: true, shopRole: 'healer', shopTier: tier,
        shopLabel: 'Temple Stores',
      });
      break;
    case 'guild': {
      // Place one of this town's quest givers inside the guild hall
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
