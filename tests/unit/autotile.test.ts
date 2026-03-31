import { describe, it, expect } from 'vitest';
import { LOC_TILE } from '../../js/data/constants';
import { isWallTile, computeWallChar } from '../../js/world/autotile';

// ─── isWallTile ───────────────────────────────────────────────────────────────

describe('isWallTile(tile)', () => {
  const wallTiles = [
    LOC_TILE.WALL,
    LOC_TILE.WALL_INN,
    LOC_TILE.WALL_SHOP,
    LOC_TILE.WALL_BLACKSMITH,
    LOC_TILE.WALL_HEALER,
    LOC_TILE.WALL_TAVERN,
    LOC_TILE.WALL_GUILD,
    LOC_TILE.WALL_TEMPLE,
  ];

  for (const tile of wallTiles) {
    it(`returns true for tile ${tile}`, () => {
      expect(isWallTile(tile)).toBe(true);
    });
  }

  const nonWallTiles = [
    LOC_TILE.FLOOR,
    LOC_TILE.VOID,
    LOC_TILE.DOOR,
    LOC_TILE.DOOR_OPEN,
    LOC_TILE.PATH,
    LOC_TILE.ROAD,
  ];

  for (const tile of nonWallTiles) {
    it(`returns false for non-wall tile ${tile}`, () => {
      expect(isWallTile(tile)).toBe(false);
    });
  }
});

// ─── computeWallChar ─────────────────────────────────────────────────────────

/**
 * Helper: creates a 3×3 grid where the center tile is a WALL and
 * the surrounding tiles are controlled by the N/S/E/W booleans.
 *
 * Bitmask encoding used in computeWallChar: N=8, S=4, E=2, W=1
 */
function makeGrid(n: boolean, s: boolean, e: boolean, w: boolean): Uint8Array {
  // 3×3 layout (indices 0..8), center at index 4
  //   [0][1][2]
  //   [3][4][5]
  //   [6][7][8]
  const tiles = new Uint8Array(9).fill(LOC_TILE.FLOOR);
  tiles[4] = LOC_TILE.WALL; // center tile
  if (n) tiles[1] = LOC_TILE.WALL; // north
  if (s) tiles[7] = LOC_TILE.WALL; // south
  if (e) tiles[5] = LOC_TILE.WALL; // east
  if (w) tiles[3] = LOC_TILE.WALL; // west
  return tiles;
}

function wallChar(n: boolean, s: boolean, e: boolean, w: boolean): string {
  return computeWallChar(makeGrid(n, s, e, w), 1, 1, 3, 3);
}

describe('computeWallChar(tiles, x, y, w, h)', () => {
  it('mask 0 — isolated wall returns "·"', () => {
    expect(wallChar(false, false, false, false)).toBe('·');
  });

  it('mask 3 — E+W (horizontal run) returns "─"', () => {
    expect(wallChar(false, false, true, true)).toBe('─');
  });

  it('mask 12 — N+S (vertical run) returns "│"', () => {
    expect(wallChar(true, true, false, false)).toBe('│');
  });

  it('mask 6 — S+E (top-left rounded corner) returns "╭"', () => {
    expect(wallChar(false, true, true, false)).toBe('╭');
  });

  it('mask 5 — S+W (top-right rounded corner) returns "╮"', () => {
    expect(wallChar(false, true, false, true)).toBe('╮');
  });

  it('mask 10 — N+E (bottom-left rounded corner) returns "╰"', () => {
    expect(wallChar(true, false, true, false)).toBe('╰');
  });

  it('mask 9 — N+W (bottom-right rounded corner) returns "╯"', () => {
    expect(wallChar(true, false, false, true)).toBe('╯');
  });

  it('mask 7 — S+E+W (T pointing down) returns "┬"', () => {
    expect(wallChar(false, true, true, true)).toBe('┬');
  });

  it('mask 11 — N+E+W (T pointing up) returns "┴"', () => {
    expect(wallChar(true, false, true, true)).toBe('┴');
  });

  it('mask 13 — N+S+W (T pointing left) returns "┤"', () => {
    expect(wallChar(true, true, false, true)).toBe('┤');
  });

  it('mask 14 — N+S+E (T pointing right) returns "├"', () => {
    expect(wallChar(true, true, true, false)).toBe('├');
  });

  it('mask 15 — all neighbors (cross) returns "┼"', () => {
    expect(wallChar(true, true, true, true)).toBe('┼');
  });

  it('mask 1 — W only returns "─"', () => {
    expect(wallChar(false, false, false, true)).toBe('─');
  });

  it('mask 2 — E only returns "─"', () => {
    expect(wallChar(false, false, true, false)).toBe('─');
  });

  it('mask 4 — S only returns "│"', () => {
    expect(wallChar(false, true, false, false)).toBe('│');
  });

  it('mask 8 — N only returns "│"', () => {
    expect(wallChar(true, false, false, false)).toBe('│');
  });

  it('treats out-of-bounds neighbors as walls', () => {
    // Place a single wall at corner (0,0) of a 1×1 grid
    // All 4 neighbors are out-of-bounds → treated as walls → mask 15 → '┼'
    const tiles = new Uint8Array([LOC_TILE.WALL]);
    expect(computeWallChar(tiles, 0, 0, 1, 1)).toBe('┼');
  });

  it('accepts a custom isWallFn', () => {
    // Create a grid where all tiles are FLOOR, but the custom fn treats FLOOR as a wall
    const tiles = new Uint8Array(9).fill(LOC_TILE.FLOOR);
    tiles[4] = LOC_TILE.FLOOR; // center is "wall" according to custom fn
    const customIsWall = (_tile: number) => true; // everything is a wall
    // All neighbors are walls → mask 15 → '┼'
    expect(computeWallChar(tiles, 1, 1, 3, 3, customIsWall)).toBe('┼');
  });
});
