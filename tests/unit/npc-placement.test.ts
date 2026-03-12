import { describe, it, expect } from 'vitest';
import { LOC_TILE, isWalkableTile } from '../../js/data/constants';
import { generateTown, findWalkableNear } from '../../js/world/towngen';
import { generateDungeon } from '../../js/world/dungeogen';
import { RNG } from '../../js/engine/rng';

// ---------------------------------------------------------------------------
// Suite 1: isWalkableTile helper
// ---------------------------------------------------------------------------

describe('isWalkableTile', () => {
  it('returns true for FLOOR', () => {
    expect(isWalkableTile(LOC_TILE.FLOOR)).toBe(true);
  });

  it('returns true for PATH', () => {
    expect(isWalkableTile(LOC_TILE.PATH)).toBe(true);
  });

  it('returns true for ROAD', () => {
    expect(isWalkableTile(LOC_TILE.ROAD)).toBe(true);
  });

  it('returns true for DOOR_OPEN', () => {
    expect(isWalkableTile(LOC_TILE.DOOR_OPEN)).toBe(true);
  });

  it('returns false for WALL', () => {
    expect(isWalkableTile(LOC_TILE.WALL)).toBe(false);
  });

  it('returns false for VOID', () => {
    expect(isWalkableTile(LOC_TILE.VOID)).toBe(false);
  });

  it('returns false for TREE', () => {
    expect(isWalkableTile(LOC_TILE.TREE)).toBe(false);
  });

  it('returns false for DOOR (closed)', () => {
    expect(isWalkableTile(LOC_TILE.DOOR)).toBe(false);
  });

  it('returns false for WATER', () => {
    expect(isWalkableTile(LOC_TILE.WATER)).toBe(false);
  });

  it('returns false for interactive tiles (ALTAR, STAIRS, CHEST, furniture)', () => {
    const interactive = [
      LOC_TILE.ALTAR,
      LOC_TILE.STAIRS_UP,
      LOC_TILE.STAIRS_DOWN,
      LOC_TILE.CHEST,
      LOC_TILE.CHEST_OPEN,
      LOC_TILE.BED,
      LOC_TILE.COUNTER,
      LOC_TILE.TABLE,
    ];
    for (const tile of interactive) {
      expect(isWalkableTile(tile), `tile ${tile} should not be walkable`).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// Suite 2: findWalkableNear utility
// ---------------------------------------------------------------------------

/** Build a minimal town-shaped grid (50×36) filled with the given tile type. */
function makeTestGrid(fillTile: number) {
  const TW = 50, TH = 36;
  const tiles = new Uint8Array(TW * TH).fill(fillTile);
  return { tiles, width: TW, height: TH, npcs: [], exits: [] };
}

describe('findWalkableNear', () => {
  it('returns the start position when it is already walkable', () => {
    const grid = makeTestGrid(LOC_TILE.FLOOR);
    const result = findWalkableNear(grid, 10, 10);
    expect(result).toEqual({ x: 10, y: 10 });
  });

  it('returns a nearby walkable position when start is a wall', () => {
    // Fill with walls, punch a floor tile nearby
    const TW = 50, TH = 36;
    const grid = makeTestGrid(LOC_TILE.WALL);
    // Place a floor tile 2 steps to the right
    grid.tiles[10 * TW + 12] = LOC_TILE.FLOOR;

    const result = findWalkableNear(grid, 10, 10);
    expect(result).not.toBeNull();
    expect(isWalkableTile(grid.tiles[result!.y * TW + result!.x])).toBe(true);
  });

  it('returns null when the entire grid is walls (no walkable tile within radius)', () => {
    // Small isolated patch of walls around start — findWalkableNear searches up to radius 10
    // Use a fully-wall grid so there is truly nothing walkable
    const grid = makeTestGrid(LOC_TILE.WALL);
    const result = findWalkableNear(grid, 25, 18);
    expect(result).toBeNull();
  });

  it('finds a ROAD tile as walkable', () => {
    const TW = 50;
    const grid = makeTestGrid(LOC_TILE.WALL);
    grid.tiles[5 * TW + 5] = LOC_TILE.ROAD;
    const result = findWalkableNear(grid, 5, 5);
    expect(result).toEqual({ x: 5, y: 5 });
  });
});

// ---------------------------------------------------------------------------
// Suite 3: Town NPC placement — end-to-end
// ---------------------------------------------------------------------------

/** Minimal loc fixture for a tier-1 town */
function makeTownLoc(overrides = {}) {
  return {
    id: 'test_town',
    type: 'TOWN',
    tier: 1,
    innName: 'The Rusty Flagon',
    questGivers: [],
    storyCharacters: [],
    ...overrides,
  };
}

describe('generateTown — NPC placement', () => {
  const seeds = [1, 42, 12345, 99999, 314159];

  for (const seed of seeds) {
    it(`all NPCs land on walkable tiles (seed=${seed})`, () => {
      const rng = new RNG(seed);
      const grid = generateTown(rng, makeTownLoc());
      const { tiles, width } = grid;

      for (const npc of grid.npcs) {
        const tile = tiles[npc.y * width + npc.x];
        expect(
          isWalkableTile(tile),
          `NPC "${npc.name}" at (${npc.x},${npc.y}) is on non-walkable tile ${tile}`
        ).toBe(true);
      }
    });
  }

  it('no two NPCs share the same position', () => {
    const rng = new RNG(42);
    const grid = generateTown(rng, makeTownLoc());

    const positions = new Set<string>();
    for (const npc of grid.npcs) {
      const key = `${npc.x},${npc.y}`;
      expect(positions.has(key), `Two NPCs share position (${npc.x},${npc.y})`).toBe(false);
      positions.add(key);
    }
  });

  it('quest givers land on walkable tiles', () => {
    const rng = new RNG(42);
    const loc = makeTownLoc({
      questGivers: [
        { name: 'Aldric', questIds: ['q1'], _placed: false },
        { name: 'Mira',   questIds: ['q2'], _placed: false },
      ],
    });
    const grid = generateTown(rng, loc);
    const { tiles, width } = grid;

    const questGiverNpcs = grid.npcs.filter((n: { type: string }) => n.type === 'quest_giver');
    expect(questGiverNpcs.length).toBe(2);

    for (const npc of questGiverNpcs) {
      const tile = tiles[npc.y * width + npc.x];
      expect(
        isWalkableTile(tile),
        `Quest giver "${npc.name}" at (${npc.x},${npc.y}) is on non-walkable tile ${tile}`
      ).toBe(true);
    }
  });

  it('story characters land on walkable tiles', () => {
    const rng = new RNG(7);
    const loc = makeTownLoc({
      storyCharacters: [
        { name: 'The Wanderer', role: 'herald' },
        { name: 'Old Myra',     role: 'sage'   },
        { name: 'Captain Rex',  role: 'guard'  },
      ],
    });
    const grid = generateTown(rng, loc);
    const { tiles, width } = grid;

    const storyNpcs = grid.npcs.filter((n: { type: string }) => n.type === 'story');
    expect(storyNpcs.length).toBe(3);

    for (const npc of storyNpcs) {
      const tile = tiles[npc.y * width + npc.x];
      expect(
        isWalkableTile(tile),
        `Story character "${npc.name}" at (${npc.x},${npc.y}) is on non-walkable tile ${tile}`
      ).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Suite 4: Dungeon boss placement
// ---------------------------------------------------------------------------

function makeDungeonLoc(overrides = {}) {
  return {
    id: 'test_dungeon',
    type: 'DUNGEON',
    tier: 1,
    dangerLevel: 1,
    hasBoss: true,
    bossId: 'dragon',
    ...overrides,
  };
}

describe('generateDungeon — boss NPC placement', () => {
  it('boss NPC coordinates are within grid bounds', () => {
    const rng = new RNG(42);
    const grid = generateDungeon(rng, makeDungeonLoc());
    const boss = grid.npcs.find((n: { isBoss?: boolean }) => n.isBoss);

    expect(boss).toBeDefined();
    expect(boss!.x).toBeGreaterThanOrEqual(0);
    expect(boss!.x).toBeLessThan(grid.width);
    expect(boss!.y).toBeGreaterThanOrEqual(0);
    expect(boss!.y).toBeLessThan(grid.height);
  });

  it('boss NPC is placed at the altar tile (boss room center)', () => {
    const rng = new RNG(42);
    const grid = generateDungeon(rng, makeDungeonLoc());
    const boss = grid.npcs.find((n: { isBoss?: boolean }) => n.isBoss);

    expect(boss).toBeDefined();
    const tile = grid.tiles[boss!.y * grid.width + boss!.x];
    // Boss is intentionally placed on the ALTAR tile — this is the design
    expect(tile).toBe(LOC_TILE.ALTAR);
  });

  it('no boss NPC is spawned when hasBoss is false', () => {
    const rng = new RNG(42);
    const grid = generateDungeon(rng, makeDungeonLoc({ hasBoss: false }));
    const boss = grid.npcs.find((n: { isBoss?: boolean }) => n.isBoss);
    expect(boss).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Suite 5: Edge cases
// ---------------------------------------------------------------------------

describe('Edge cases', () => {
  it('town with high story character count (stress test)', () => {
    const rng = new RNG(1337);
    const loc = makeTownLoc({
      storyCharacters: Array.from({ length: 8 }, (_, i) => ({
        name: `Char${i}`,
        role: 'extra',
      })),
    });
    const grid = generateTown(rng, loc);
    const { tiles, width } = grid;

    const storyNpcs = grid.npcs.filter((n: { type: string }) => n.type === 'story');
    for (const npc of storyNpcs) {
      const tile = tiles[npc.y * width + npc.x];
      expect(
        isWalkableTile(tile),
        `Story NPC "${npc.name}" at (${npc.x},${npc.y}) is on non-walkable tile ${tile}`
      ).toBe(true);
    }
  });

  it('building NPCs (innkeeper etc.) are on FLOOR tiles', () => {
    const rng = new RNG(999);
    const grid = generateTown(rng, makeTownLoc());
    const { tiles, width } = grid;

    const buildingNpcs = grid.npcs.filter(
      (n: { type: string }) => !['quest_giver', 'story'].includes(n.type)
    );
    expect(buildingNpcs.length).toBeGreaterThan(0);

    for (const npc of buildingNpcs) {
      const tile = tiles[npc.y * width + npc.x];
      expect(
        isWalkableTile(tile),
        `Building NPC "${npc.name}" at (${npc.x},${npc.y}) is on non-walkable tile ${tile}`
      ).toBe(true);
    }
  });

  it('town generation is deterministic (same seed → same NPC positions)', () => {
    const loc = makeTownLoc({
      questGivers: [{ name: 'TestQG', questIds: [], _placed: false }],
      storyCharacters: [{ name: 'TestSC', role: 'herald' }],
    });

    const grid1 = generateTown(new RNG(12345), loc);
    const grid2 = generateTown(new RNG(12345), loc);

    const positions1 = grid1.npcs.map((n: { x: number; y: number }) => `${n.x},${n.y}`).sort();
    const positions2 = grid2.npcs.map((n: { x: number; y: number }) => `${n.x},${n.y}`).sort();
    expect(positions1).toEqual(positions2);
  });

  it('dungeon generation works with multiple seeds', () => {
    for (const seed of [1, 50, 200, 1000]) {
      const rng = new RNG(seed);
      const grid = generateDungeon(rng, makeDungeonLoc());
      const boss = grid.npcs.find((n: { isBoss?: boolean }) => n.isBoss);
      expect(boss).toBeDefined();
      expect(boss!.x).toBeGreaterThanOrEqual(0);
      expect(boss!.y).toBeGreaterThanOrEqual(0);
    }
  });
});
