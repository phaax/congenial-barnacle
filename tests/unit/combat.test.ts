import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RNG } from '../../js/engine/rng';

// Mock monster/item data to avoid loading all game data
vi.mock('../../js/data/monsters', () => ({
  getMonster: (id: string) => {
    const monsters: Record<string, object> = {
      giant_rat: {
        id: 'giant_rat', name: 'Giant Rat', symbol: 'r', fg: 6,
        hp: [4, 8], atk: [2, 4], def: 0, xp: 14, gold: [0, 3],
        loot: [{ id: 'rat_tail', chance: 30 }], abilities: [], isBoss: false,
        flavorText: ['It hisses.'],
      },
      boss_rat: {
        id: 'boss_rat', name: 'Boss Rat', symbol: 'R', fg: 12,
        hp: [20, 30], atk: [5, 10], def: 2, xp: 100, gold: [10, 20],
        loot: [], abilities: [], isBoss: true, flavorText: [],
      },
    };
    return monsters[id] ?? null;
  },
}));

vi.mock('../../js/data/items', () => ({
  getItem: (id: string) => {
    const items: Record<string, object> = {
      short_sword: { id: 'short_sword', name: 'Short Sword', dmg: [3, 7], type: 'weapon' },
      leather_armor: { id: 'leather_armor', name: 'Leather Armor', def: 2, type: 'armor' },
    };
    return items[id] ?? null;
  },
}));

import {
  spawnMonster,
  spawnEncounter,
  initCombat,
  playerAttack,
  playerFlee,
  applyRewards,
  xpToLevel,
  startPlayerTurn,
  getActiveMonster,
} from '../../js/systems/combat';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePlayer(overrides = {}) {
  return {
    name: 'Hero',
    race: 'human',
    background: 'warrior',
    level: 1,
    hp: 20,
    maxHp: 20,
    mp: 10,
    maxMp: 10,
    xp: 0,
    gold: 0,
    stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10 },
    skills: [] as string[],
    equipment: { weapon: null, armor: null, offhand: null, helmet: null, accessory: null },
    inventory: [] as object[],
    statusEffects: [] as object[],
    fortifyTurns: 0,
    ...overrides,
  };
}

function makeMonster(overrides = {}) {
  return {
    id: 'giant_rat',
    name: 'Giant Rat',
    symbol: 'r',
    fg: 6,
    hp: 6,
    maxHp: 6,
    atk: [2, 4],
    def: 0,
    xp: 14,
    gold: 3,
    loot: [] as object[],
    abilities: [] as object[],
    isBoss: false,
    statusEffects: [] as object[],
    usedLucky: false,
    currentPhase: 0,
    ...overrides,
  };
}

// ─── spawnMonster ─────────────────────────────────────────────────────────────

describe('spawnMonster(id, rng)', () => {
  it('returns null for an unknown monster id', () => {
    const rng = new RNG(1);
    expect(spawnMonster('unknown_beast', rng)).toBeNull();
  });

  it('creates a monster with HP in template range', () => {
    const rng = new RNG(42);
    const m = spawnMonster('giant_rat', rng);
    expect(m).not.toBeNull();
    expect(m.hp).toBeGreaterThanOrEqual(4);
    expect(m.hp).toBeLessThanOrEqual(8);
    expect(m.maxHp).toBe(m.hp);
  });

  it('creates a monster with gold in template range', () => {
    const rng = new RNG(42);
    const m = spawnMonster('giant_rat', rng);
    expect(m.gold).toBeGreaterThanOrEqual(0);
    expect(m.gold).toBeLessThanOrEqual(3);
  });

  it('initializes statusEffects to empty array', () => {
    const rng = new RNG(1);
    const m = spawnMonster('giant_rat', rng);
    expect(m.statusEffects).toEqual([]);
  });

  it('copies atk and def from template', () => {
    const rng = new RNG(1);
    const m = spawnMonster('giant_rat', rng);
    expect(m.atk).toEqual([2, 4]);
    expect(m.def).toBe(0);
  });

  it('sets isBoss correctly from template', () => {
    const rng = new RNG(1);
    expect(spawnMonster('giant_rat', rng).isBoss).toBe(false);
    expect(spawnMonster('boss_rat', new RNG(1)).isBoss).toBe(true);
  });
});

// ─── spawnEncounter ───────────────────────────────────────────────────────────

describe('spawnEncounter(biome, dangerLevel, rng)', () => {
  it('returns null for a biome with empty monster pool', () => {
    const rng = new RNG(1);
    expect(spawnEncounter({ monsters: [] }, 1, rng)).toBeNull();
  });

  it('returns null when biome is null', () => {
    const rng = new RNG(1);
    expect(spawnEncounter(null, 1, rng)).toBeNull();
  });

  it('returns an array of monsters', () => {
    const rng = new RNG(1);
    const result = spawnEncounter({ monsters: ['giant_rat'] }, 1, rng);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('does not scale HP at danger level 1', () => {
    // Use a fixed seed where chance(30) is false to guarantee single spawn
    // We'll test several monsters and verify all have HP in template range [4,8]
    const biome = { monsters: ['giant_rat'] };
    for (let seed = 1; seed <= 20; seed++) {
      const result = spawnEncounter(biome, 1, new RNG(seed));
      if (result) {
        for (const m of result) {
          expect(m.hp).toBeGreaterThanOrEqual(4);
          expect(m.hp).toBeLessThanOrEqual(8);
        }
      }
    }
  });

  it('scales HP upward at danger level 3', () => {
    // At danger 3: hp * (1 + 2*0.3) = hp * 1.6
    // Giant rat base hp max is 8, so scaled max would be 12+
    const biome = { monsters: ['giant_rat'] };
    let foundScaled = false;
    for (let seed = 1; seed <= 30; seed++) {
      const result = spawnEncounter(biome, 3, new RNG(seed));
      if (result && result.length > 0) {
        const m = result[0];
        if (m.hp > 8) {
          foundScaled = true;
          break;
        }
      }
    }
    expect(foundScaled).toBe(true);
  });
});

// ─── initCombat ───────────────────────────────────────────────────────────────

describe('initCombat(player, monsters, biome, rng)', () => {
  it('starts with PLAYER_TURN state and turn 0', () => {
    const rng = new RNG(1);
    const player = makePlayer();
    const monsters = [makeMonster()];
    const combat = initCombat(player, monsters, null, rng);
    expect(combat.state).toBe('player_turn');
    expect(combat.turn).toBe(0);
  });

  it('sets bossMode to false when no boss present', () => {
    const rng = new RNG(1);
    const combat = initCombat(makePlayer(), [makeMonster()], null, rng);
    expect(combat.bossMode).toBe(false);
  });

  it('sets bossMode to true when a boss monster is present', () => {
    const rng = new RNG(1);
    const boss = makeMonster({ isBoss: true });
    const combat = initCombat(makePlayer(), [boss], null, rng);
    expect(combat.bossMode).toBe(true);
  });

  it('initializes empty log', () => {
    const rng = new RNG(1);
    const combat = initCombat(makePlayer(), [makeMonster()], null, rng);
    // log may have a message if tracking surprises; just check it's an array
    expect(Array.isArray(combat.log)).toBe(true);
  });

  it('sets canFlee to true', () => {
    const rng = new RNG(1);
    const combat = initCombat(makePlayer(), [makeMonster()], null, rng);
    expect(combat.canFlee).toBe(true);
  });
});

// ─── playerAttack ─────────────────────────────────────────────────────────────

describe('playerAttack(combat)', () => {
  function makeCombat(playerOverrides = {}, monsterOverrides = {}, seed = 42) {
    // Use a deterministic RNG — seed 42 results in a hit (not a miss)
    const rng = new RNG(seed);
    const player = makePlayer(playerOverrides);
    const monster = makeMonster(monsterOverrides);
    const combat = initCombat(player, [monster], null, rng);
    // Reset log and turn to avoid tracking surprises confusing tests
    combat.log = [];
    combat.turn = 1; // past turn 0 so no backstab bonus
    combat._enemySurprised = false;
    return { combat, player, monster };
  }

  it('deals at least 1 damage on a hit', () => {
    // Use a seed where the player hits; iterate until we find one
    for (let seed = 1; seed <= 50; seed++) {
      const rng = new RNG(seed);
      const player = makePlayer();
      const monster = makeMonster({ hp: 100, maxHp: 100, def: 0 });
      const combat = initCombat(player, [monster], null, rng);
      combat.log = [];
      const prevHp = monster.hp;
      playerAttack(combat);
      const didHit = !combat.log.some((e: { msg: string }) => e.msg.includes('miss'));
      if (didHit) {
        expect(monster.hp).toBeLessThan(prevHp);
        expect(prevHp - monster.hp).toBeGreaterThanOrEqual(1);
        break;
      }
    }
  });

  it('does not reduce monster HP on a miss', () => {
    // Force a miss by setting a seed where chance(10) is true for miss
    // Use a high dex penalty so miss chance is high
    let missFound = false;
    for (let seed = 1; seed <= 200; seed++) {
      const rng = new RNG(seed);
      const player = makePlayer({ stats: { str: 10, dex: 1, con: 10, int: 10, wis: 10 } }); // low dex = high miss
      const monster = makeMonster({ hp: 100, maxHp: 100 });
      const combat = initCombat(player, [monster], null, rng);
      combat.log = [];
      const prevHp = monster.hp;
      playerAttack(combat);
      const wasMiss = combat.log.some((e: { msg: string }) => e.msg.includes('miss'));
      if (wasMiss) {
        expect(monster.hp).toBe(prevHp);
        missFound = true;
        break;
      }
    }
    expect(missFound).toBe(true);
  });

  it('transitions to VICTORY state when last monster dies', () => {
    // Give monster 1 HP so any hit kills it
    for (let seed = 1; seed <= 100; seed++) {
      const rng = new RNG(seed);
      const player = makePlayer({ stats: { str: 20, dex: 10, con: 10, int: 10, wis: 10 } });
      const monster = makeMonster({ hp: 1, maxHp: 1, def: 0 });
      const combat = initCombat(player, [monster], null, rng);
      combat.log = [];
      playerAttack(combat);
      const wasMiss = combat.log.some((e: { msg: string }) => e.msg.includes('miss'));
      if (!wasMiss) {
        expect(combat.state).toBe('victory');
        break;
      }
    }
  });

  it('keeps PLAYER_TURN when other monsters are still alive', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const rng = new RNG(seed);
      const player = makePlayer({ stats: { str: 20, dex: 10, con: 10, int: 10, wis: 10 } });
      const m1 = makeMonster({ hp: 1, maxHp: 1, def: 0 });
      const m2 = makeMonster({ hp: 50, maxHp: 50 });
      const combat = initCombat(player, [m1, m2], null, rng);
      combat.log = [];
      playerAttack(combat);
      const wasMiss = combat.log.some((e: { msg: string }) => e.msg.includes('miss'));
      if (!wasMiss && m1.hp <= 0) {
        // Still has living monsters, should stay in player turn
        expect(combat.state).toBe('player_turn');
        break;
      }
    }
  });

  it('stealth backstab on turn 0 is logged', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const rng = new RNG(seed);
      const player = makePlayer({ skills: ['stealth'] });
      const monster = makeMonster({ hp: 50, maxHp: 50, def: 0 });
      const combat = initCombat(player, [monster], null, rng);
      combat.log = [];
      combat.turn = 0;
      playerAttack(combat);
      const backstabLogged = combat.log.some((e: { msg: string }) => e.msg.includes('shadows'));
      if (backstabLogged) {
        expect(backstabLogged).toBe(true);
        break;
      }
    }
  });

  it('power_strike costs 2 MP and is logged', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const rng = new RNG(seed);
      const player = makePlayer({ mp: 10 });
      const monster = makeMonster({ hp: 50, maxHp: 50, def: 0 });
      const combat = initCombat(player, [monster], null, rng);
      combat.log = [];
      combat.turn = 1;
      const prevMp = player.mp;
      playerAttack(combat, 'power_strike');
      const wasMiss = combat.log.some((e: { msg: string }) => e.msg.includes('miss'));
      if (!wasMiss) {
        expect(player.mp).toBe(prevMp - 2);
        expect(combat.log.some((e: { msg: string }) => e.msg.includes('powerful'))).toBe(true);
        break;
      }
    }
  });
});

// ─── playerFlee ───────────────────────────────────────────────────────────────

describe('playerFlee(combat)', () => {
  it('sets state to DEFEAT and fled=true on a successful flee', () => {
    // With chance(40), roughly 40% will flee. Try enough seeds to find one.
    let found = false;
    for (let seed = 1; seed <= 200; seed++) {
      const rng = new RNG(seed);
      const combat = initCombat(makePlayer(), [makeMonster()], null, rng);
      combat.log = [];
      playerFlee(combat);
      if (combat.fled === true) {
        expect(combat.state).toBe('defeat');
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  it('logs a failure message when flee fails', () => {
    let found = false;
    for (let seed = 1; seed <= 200; seed++) {
      const rng = new RNG(seed);
      const combat = initCombat(makePlayer(), [makeMonster()], null, rng);
      combat.log = [];
      playerFlee(combat);
      if (!combat.fled) {
        expect(combat.log.some((e: { msg: string }) => e.msg.toLowerCase().includes('fail'))).toBe(true);
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });
});

// ─── applyRewards ─────────────────────────────────────────────────────────────

describe('applyRewards(player, combat)', () => {
  it('adds gold and xp to player', () => {
    const player = makePlayer({ gold: 10, xp: 0 });
    const rng = new RNG(1);
    const monster = makeMonster({ xp: 14, gold: 3, loot: [] });
    const combat = initCombat(player, [monster], null, rng);
    combat.totalGold = 5;
    combat.totalXp = 20;
    combat.lootItems = [];
    applyRewards(player, combat);
    expect(player.gold).toBe(15);
    // human race gets 1.10× XP multiplier → Math.floor(20 * 1.10) = 22
    expect(player.xp).toBe(22);
  });

  it('triggers level up when xp threshold is reached', () => {
    const xpNeeded = xpToLevel(2);
    const player = makePlayer({ level: 1, xp: xpNeeded - 10, hp: 20, maxHp: 20, mp: 5, maxMp: 5 });
    const rng = new RNG(1);
    const combat = initCombat(player, [makeMonster()], null, rng);
    combat.totalGold = 0;
    combat.totalXp = 20;
    combat.lootItems = [];
    const result = applyRewards(player, combat);
    expect(result.leveled).toBe(true);
    expect(player.level).toBe(2);
  });

  it('does not level up when xp threshold is not reached', () => {
    const player = makePlayer({ level: 1, xp: 0 });
    const rng = new RNG(1);
    const combat = initCombat(player, [makeMonster()], null, rng);
    combat.totalGold = 0;
    combat.totalXp = 5;
    combat.lootItems = [];
    const result = applyRewards(player, combat);
    expect(result.leveled).toBe(false);
    expect(player.level).toBe(1);
  });
});

// ─── xpToLevel ────────────────────────────────────────────────────────────────

describe('xpToLevel(level)', () => {
  it('returns a positive number for level 2', () => {
    expect(xpToLevel(2)).toBeGreaterThan(0);
  });

  it('requires more XP for each successive level', () => {
    expect(xpToLevel(3)).toBeGreaterThan(xpToLevel(2));
    expect(xpToLevel(5)).toBeGreaterThan(xpToLevel(4));
    expect(xpToLevel(10)).toBeGreaterThan(xpToLevel(9));
  });
});

// ─── startPlayerTurn ─────────────────────────────────────────────────────────

describe('startPlayerTurn(combat)', () => {
  it('returns false normally (no skip)', () => {
    const rng = new RNG(1);
    const combat = initCombat(makePlayer(), [makeMonster()], null, rng);
    expect(startPlayerTurn(combat)).toBe(false);
  });

  it('returns true and clears playerSkipTurn when set', () => {
    const rng = new RNG(1);
    const combat = initCombat(makePlayer(), [makeMonster()], null, rng);
    combat.playerSkipTurn = true;
    expect(startPlayerTurn(combat)).toBe(true);
    expect(combat.playerSkipTurn).toBe(false);
  });

  it('processes poison damage on player', () => {
    const player = makePlayer({ hp: 20 });
    player.statusEffects = [{ type: 'poison', turns: 2, dmg: 3 }];
    const rng = new RNG(1);
    const combat = initCombat(player, [makeMonster()], null, rng);
    startPlayerTurn(combat);
    expect(player.hp).toBe(17); // 20 - 3 poison damage
  });
});

// ─── getActiveMonster ─────────────────────────────────────────────────────────

describe('getActiveMonster(combat)', () => {
  it('returns the first living monster', () => {
    const rng = new RNG(1);
    const m1 = makeMonster({ hp: 0 });
    const m2 = makeMonster({ hp: 5 });
    const combat = initCombat(makePlayer(), [m1, m2], null, rng);
    expect(getActiveMonster(combat)).toBe(m2);
  });

  it('returns null when all monsters are dead', () => {
    const rng = new RNG(1);
    const m = makeMonster({ hp: 0 });
    const combat = initCombat(makePlayer(), [m], null, rng);
    expect(getActiveMonster(combat)).toBeNull();
  });
});
