// @ts-nocheck
import { LOC_TILE } from '../data/constants';

// All tile variants that are considered "wall" for auto-tiling purposes
const WALL_TILE_SET = new Set([
  LOC_TILE.WALL,
  LOC_TILE.WALL_INN,
  LOC_TILE.WALL_SHOP,
  LOC_TILE.WALL_BLACKSMITH,
  LOC_TILE.WALL_HEALER,
  LOC_TILE.WALL_TAVERN,
  LOC_TILE.WALL_GUILD,
  LOC_TILE.WALL_TEMPLE,
]);

export function isWallTile(tile: number): boolean {
  return WALL_TILE_SET.has(tile);
}

/**
 * Given a tile grid and position, return the appropriate box-drawing character
 * for a wall tile based on which of its 4 cardinal neighbors are also walls.
 *
 * Uses rounded corners (╭╮╰╯) for a softer building appearance.
 * Runs at render time only — does NOT mutate tile data.
 *
 * Bitmask encoding: N=8, S=4, E=2, W=1
 */
export function computeWallChar(
  tiles: Uint8Array,
  x: number,
  y: number,
  w: number,
  h: number,
  isWallFn: (tile: number) => boolean = isWallTile,
): string {
  const get = (tx: number, ty: number): boolean => {
    if (tx < 0 || tx >= w || ty < 0 || ty >= h) return true; // treat out-of-bounds as wall
    return isWallFn(tiles[ty * w + tx]);
  };

  const n  = get(x, y - 1);
  const s  = get(x, y + 1);
  const e  = get(x + 1, y);
  const ww = get(x - 1, y);

  const mask = (n ? 8 : 0) | (s ? 4 : 0) | (e ? 2 : 0) | (ww ? 1 : 0);

  // 16 possible combinations (N=8, S=4, E=2, W=1)
  // Uses rounded corners for buildings
  switch (mask) {
    case 0:  return '·';  // isolated (shouldn't normally appear)
    case 1:  return '─';  // W only
    case 2:  return '─';  // E only
    case 3:  return '─';  // E+W — horizontal run
    case 4:  return '│';  // S only
    case 5:  return '╮';  // S+W — top-right corner (rounded)
    case 6:  return '╭';  // S+E — top-left corner (rounded)
    case 7:  return '┬';  // S+E+W — T pointing down
    case 8:  return '│';  // N only
    case 9:  return '╯';  // N+W — bottom-right corner (rounded)
    case 10: return '╰';  // N+E — bottom-left corner (rounded)
    case 11: return '┴';  // N+E+W — T pointing up
    case 12: return '│';  // N+S — vertical run
    case 13: return '┤';  // N+S+W — T pointing left
    case 14: return '├';  // N+S+E — T pointing right
    case 15: return '┼';  // all — cross
    default: return '█';  // fallback
  }
}
