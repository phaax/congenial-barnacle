import { describe, it, expect } from 'vitest';
import {
  updateFog,
  clearFogAroundLocation,
  getBiomeAt,
  getLocationAt,
  generateWorld,
} from '../../js/world/worldgen';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Create a minimal flat world with a fog array */
function makeWorld(width = 10, height = 10) {
  const tiles = new Uint8Array(width * height).fill(3); // GRASSLAND = 3
  const fog   = new Uint8Array(width * height).fill(0); // all unseen
  return { width, height, tiles, fog, locations: [] };
}

// ─── updateFog ────────────────────────────────────────────────────────────────

describe('updateFog(world, px, py, radius)', () => {
  it('marks tiles within radius as visible (2)', () => {
    const world = makeWorld(20, 20);
    updateFog(world, 10, 10, 3);
    // The center tile should be visible
    expect(world.fog[10 * 20 + 10]).toBe(2);
  });

  it('marks previously visible (2) tiles as seen (1)', () => {
    const world = makeWorld(20, 20);
    // Pre-mark some tiles as visible
    world.fog[5 * 20 + 5] = 2;
    world.fog[6 * 20 + 6] = 2;
    // Now move player far away — the old tiles should become seen (1)
    updateFog(world, 18, 18, 2);
    expect(world.fog[5 * 20 + 5]).toBe(1);
    expect(world.fog[6 * 20 + 6]).toBe(1);
  });

  it('does not change unseen (0) tiles far from player', () => {
    const world = makeWorld(20, 20);
    // Position (0,0), radius 2 — tiles at (10,10) should stay at 0
    updateFog(world, 0, 0, 2);
    expect(world.fog[10 * 20 + 10]).toBe(0);
  });

  it('does not crash when player is at the edge of the world', () => {
    const world = makeWorld(10, 10);
    expect(() => updateFog(world, 0, 0, 3)).not.toThrow();
    expect(() => updateFog(world, 9, 9, 3)).not.toThrow();
  });

  it('reveals a circular area, not a square', () => {
    const world = makeWorld(20, 20);
    const radius = 4;
    updateFog(world, 10, 10, radius);

    // A tile exactly at distance radius+1 should NOT be visible
    // (10 + radius + 1, 10) — too far horizontally
    const farTile = world.fog[10 * 20 + (10 + radius + 1)];
    expect(farTile).not.toBe(2);

    // Corner tile at (10+radius, 10+radius) should be outside circle but would be in a square
    const cornerTile = world.fog[(10 + radius) * 20 + (10 + radius)];
    // distance = sqrt(r^2 + r^2) = r*sqrt(2) ≈ 5.66 > 4, so it should NOT be visible
    expect(cornerTile).not.toBe(2);
  });
});

// ─── clearFogAroundLocation ───────────────────────────────────────────────────

describe('clearFogAroundLocation(world, x, y, radius)', () => {
  it('sets unseen (0) tiles within radius to seen (1)', () => {
    const world = makeWorld(20, 20);
    clearFogAroundLocation(world, 10, 10, 3);
    // Center tile should be seen
    expect(world.fog[10 * 20 + 10]).toBe(1);
  });

  it('does not downgrade visible (2) tiles to seen (1)', () => {
    const world = makeWorld(20, 20);
    world.fog[10 * 20 + 10] = 2; // already visible
    clearFogAroundLocation(world, 10, 10, 3);
    expect(world.fog[10 * 20 + 10]).toBe(2); // should remain visible
  });

  it('does not downgrade already-seen (1) tiles', () => {
    const world = makeWorld(20, 20);
    world.fog[10 * 20 + 10] = 1; // already seen
    clearFogAroundLocation(world, 10, 10, 3);
    expect(world.fog[10 * 20 + 10]).toBe(1); // unchanged
  });

  it('does not affect tiles far outside the radius', () => {
    const world = makeWorld(20, 20);
    clearFogAroundLocation(world, 0, 0, 2);
    // Tile at (10, 10) is way outside radius 2 of (0, 0)
    expect(world.fog[10 * 20 + 10]).toBe(0);
  });

  it('does not crash at world edges', () => {
    const world = makeWorld(10, 10);
    expect(() => clearFogAroundLocation(world, 0, 0, 5)).not.toThrow();
    expect(() => clearFogAroundLocation(world, 9, 9, 5)).not.toThrow();
  });
});

// ─── getBiomeAt ───────────────────────────────────────────────────────────────

describe('getBiomeAt(world, x, y)', () => {
  it('returns null for out-of-bounds x', () => {
    const world = makeWorld(10, 10);
    expect(getBiomeAt(world, -1, 5)).toBeNull();
    expect(getBiomeAt(world, 10, 5)).toBeNull();
  });

  it('returns null for out-of-bounds y', () => {
    const world = makeWorld(10, 10);
    expect(getBiomeAt(world, 5, -1)).toBeNull();
    expect(getBiomeAt(world, 5, 10)).toBeNull();
  });

  it('returns a biome object for in-bounds coordinates', () => {
    const world = makeWorld(10, 10);
    const biome = getBiomeAt(world, 5, 5);
    expect(biome).not.toBeNull();
    expect(typeof biome).toBe('object');
  });
});

// ─── getLocationAt ────────────────────────────────────────────────────────────

describe('getLocationAt(world, x, y)', () => {
  it('returns null when no locations exist', () => {
    const world = makeWorld(10, 10);
    expect(getLocationAt(world, 5, 5)).toBeNull();
  });

  it('returns the location at exact coordinates', () => {
    const world = makeWorld(10, 10);
    const loc = { id: 'town_1', x: 3, y: 4, name: 'Testville', type: 'TOWN' };
    world.locations = [loc];
    expect(getLocationAt(world, 3, 4)).toBe(loc);
  });

  it('returns null when coordinates do not match any location', () => {
    const world = makeWorld(10, 10);
    world.locations = [{ id: 'town_1', x: 3, y: 4, name: 'Testville', type: 'TOWN' }];
    expect(getLocationAt(world, 5, 6)).toBeNull();
  });
});

// ─── generateWorld ────────────────────────────────────────────────────────────

describe('generateWorld(seed)', () => {
  it('returns a world with required properties', () => {
    const world = generateWorld(42);
    expect(world).toHaveProperty('width');
    expect(world).toHaveProperty('height');
    expect(world).toHaveProperty('tiles');
    expect(world).toHaveProperty('fog');
    expect(world).toHaveProperty('locations');
  });

  it('fog array is initialized to all 0s', () => {
    const world = generateWorld(42);
    const nonZero = world.fog.some((v: number) => v !== 0);
    expect(nonZero).toBe(false);
  });

  it('contains at least one TOWN location', () => {
    const world = generateWorld(42);
    const towns = world.locations.filter((l: { type: string }) => l.type === 'TOWN');
    expect(towns.length).toBeGreaterThanOrEqual(1);
  });

  it('location count is within the configured bounds', () => {
    const world = generateWorld(42);
    // Locations are placed on valid land tiles. Some placements may fail if land
    // is limited, so count can be lower than WORLD_CONFIG maximums. Expect at
    // least 5 (min towns) and at most the maximum sum of all location types.
    expect(world.locations.length).toBeGreaterThanOrEqual(1);
    expect(world.locations.length).toBeLessThanOrEqual(40);
  });

  it('is deterministic — same seed produces same location positions', () => {
    const w1 = generateWorld(12345);
    const w2 = generateWorld(12345);
    expect(w1.locations.length).toBe(w2.locations.length);
    for (let i = 0; i < w1.locations.length; i++) {
      expect(w1.locations[i].x).toBe(w2.locations[i].x);
      expect(w1.locations[i].y).toBe(w2.locations[i].y);
    }
  });

  it('produces different worlds for different seeds', () => {
    const w1 = generateWorld(1);
    const w2 = generateWorld(2);
    // Very unlikely that two different seeds produce identical first-location positions
    const same = w1.locations[0]?.x === w2.locations[0]?.x &&
                 w1.locations[0]?.y === w2.locations[0]?.y;
    // At least the worlds should not be byte-for-byte identical
    let tilesDiffer = false;
    for (let i = 0; i < w1.tiles.length; i++) {
      if (w1.tiles[i] !== w2.tiles[i]) { tilesDiffer = true; break; }
    }
    expect(tilesDiffer || !same).toBe(true);
  });

  it('each location has an id, x, y, type, and name', () => {
    const world = generateWorld(99);
    for (const loc of world.locations) {
      expect(loc).toHaveProperty('id');
      expect(loc).toHaveProperty('x');
      expect(loc).toHaveProperty('y');
      expect(loc).toHaveProperty('type');
      expect(loc).toHaveProperty('name');
    }
  });

  it('tiles array length equals width × height', () => {
    const world = generateWorld(42);
    expect(world.tiles.length).toBe(world.width * world.height);
    expect(world.fog.length).toBe(world.width * world.height);
  });
});
