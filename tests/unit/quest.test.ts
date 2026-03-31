import { describe, it, expect, vi } from 'vitest';

// Mock items module to avoid loading full game data
vi.mock('../../js/data/items', () => ({
  getItem: (id: string) => {
    const items: Record<string, object> = {
      healing_potion: { id: 'healing_potion', name: 'Healing Potion', type: 'consumable' },
      letter: { id: 'letter', name: 'Letter', type: 'quest' },
    };
    return items[id] ?? null;
  },
  addToInventory: (player: { inventory: { id: string; qty: number }[] }, itemId: string, qty = 1) => {
    const existing = player.inventory.find((i) => i.id === itemId);
    if (existing) existing.qty += qty;
    else player.inventory.push({ id: itemId, qty });
  },
}));

import {
  onMonsterKilled,
  onItemPickedUp,
  onLocationVisited,
  acceptQuest,
  turnInQuest,
  getActiveQuests,
  getAvailableQuestsAt,
  getCompletedQuestsAt,
  checkGoalProgress,
} from '../../js/systems/quest';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeQuest(overrides = {}) {
  return {
    id: 'q_0',
    templateId: 'slay_rats',
    type: 'slay',
    title: 'Rat Problem',
    status: 'available',
    dangerLevel: 1,
    giverLocId: 'town_1',
    giverLocName: 'Maplewood',
    reward: { gold: 50, xp: 30, items: [] },
    progress: 0,
    progressMax: 3,
    targetMonster: 'giant_rat',
    targetLocId: null,
    ...overrides,
  };
}

function makePlayer(overrides = {}) {
  return {
    gold: 0,
    xp: 0,
    level: 1,
    inventory: [] as { id: string; qty: number; questId?: string }[],
    ...overrides,
  };
}

// ─── onMonsterKilled ──────────────────────────────────────────────────────────

describe('onMonsterKilled(quests, monsterId)', () => {
  it('returns null when there are no active quests', () => {
    const quests = [makeQuest({ status: 'available' })];
    expect(onMonsterKilled(quests, 'giant_rat')).toBeNull();
  });

  it('returns null when monster does not match quest target', () => {
    const quests = [makeQuest({ status: 'active', targetMonster: 'giant_rat' })];
    expect(onMonsterKilled(quests, 'wolf')).toBeNull();
  });

  it('increments progress when correct monster is killed', () => {
    const quest = makeQuest({ status: 'active', progress: 0, progressMax: 3 });
    onMonsterKilled([quest], 'giant_rat');
    expect(quest.progress).toBe(1);
  });

  it('returns null and keeps ACTIVE status until progressMax reached', () => {
    const quest = makeQuest({ status: 'active', progress: 1, progressMax: 3 });
    const result = onMonsterKilled([quest], 'giant_rat');
    expect(result).toBeNull();
    expect(quest.status).toBe('active');
    expect(quest.progress).toBe(2);
  });

  it('returns the quest and marks it COMPLETED when progressMax reached', () => {
    const quest = makeQuest({ status: 'active', progress: 2, progressMax: 3 });
    const result = onMonsterKilled([quest], 'giant_rat');
    expect(result).toBe(quest);
    expect(quest.status).toBe('completed');
  });
});

// ─── onItemPickedUp ───────────────────────────────────────────────────────────

describe('onItemPickedUp(quests, itemId)', () => {
  it('returns empty array when no active fetch quests', () => {
    const quests = [makeQuest({ status: 'available', type: 'fetch', targetItem: 'healing_potion' })];
    expect(onItemPickedUp(quests, 'healing_potion')).toEqual([]);
  });

  it('returns empty array when item does not match', () => {
    const quests = [makeQuest({ status: 'active', type: 'fetch', targetItem: 'healing_potion' })];
    expect(onItemPickedUp(quests, 'wolf_pelt')).toEqual([]);
  });

  it('increments progress for matching active fetch quest', () => {
    const quest = makeQuest({ status: 'active', type: 'fetch', targetItem: 'healing_potion', progress: 0, progressMax: 2 });
    onItemPickedUp([quest], 'healing_potion');
    expect(quest.progress).toBe(1);
  });

  it('returns completed quests when progressMax reached', () => {
    const quest = makeQuest({ status: 'active', type: 'fetch', targetItem: 'healing_potion', progress: 1, progressMax: 2 });
    const result = onItemPickedUp([quest], 'healing_potion');
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(quest);
    expect(quest.status).toBe('completed');
  });

  it('can complete multiple quests at once', () => {
    const q1 = makeQuest({ id: 'q_0', status: 'active', type: 'fetch', targetItem: 'wolf_pelt', progress: 0, progressMax: 1 });
    const q2 = makeQuest({ id: 'q_1', status: 'active', type: 'fetch', targetItem: 'wolf_pelt', progress: 0, progressMax: 1 });
    const result = onItemPickedUp([q1, q2], 'wolf_pelt');
    expect(result).toHaveLength(2);
  });
});

// ─── onLocationVisited ────────────────────────────────────────────────────────

describe('onLocationVisited(quests, locId)', () => {
  it('does not update slay quests', () => {
    const quest = makeQuest({ status: 'active', type: 'slay', targetLocId: 'dungeon_1' });
    onLocationVisited([quest], 'dungeon_1');
    expect(quest.progress).toBe(0);
  });

  it('updates investigate quests when location matches', () => {
    const quest = makeQuest({ status: 'active', type: 'investigate', targetLocId: 'dungeon_1', progressMax: 1 });
    const result = onLocationVisited([quest], 'dungeon_1');
    expect(result).toHaveLength(1);
    expect(quest.status).toBe('completed');
  });

  it('updates clear quests when location matches', () => {
    const quest = makeQuest({ status: 'active', type: 'clear', targetLocId: 'ruins_1', progressMax: 1 });
    onLocationVisited([quest], 'ruins_1');
    expect(quest.status).toBe('completed');
  });

  it('does not update when location does not match', () => {
    const quest = makeQuest({ status: 'active', type: 'investigate', targetLocId: 'dungeon_1', progressMax: 1 });
    onLocationVisited([quest], 'dungeon_99');
    expect(quest.status).toBe('active');
  });
});

// ─── acceptQuest ──────────────────────────────────────────────────────────────

describe('acceptQuest(quests, questId, player)', () => {
  it('returns false for unknown quest id', () => {
    const player = makePlayer();
    expect(acceptQuest([], 'nonexistent', player)).toBe(false);
  });

  it('returns false when quest is not available', () => {
    const quest = makeQuest({ status: 'active' });
    const player = makePlayer();
    expect(acceptQuest([quest], 'q_0', player)).toBe(false);
  });

  it('returns false when MAX_ACTIVE_QUESTS already reached', () => {
    const available = makeQuest({ id: 'q_new', status: 'available' });
    const active = Array.from({ length: 5 }, (_, i) =>
      makeQuest({ id: `q_${i}`, status: 'active' })
    );
    const player = makePlayer();
    expect(acceptQuest([...active, available], 'q_new', player)).toBe(false);
  });

  it('sets quest status to ACTIVE', () => {
    const quest = makeQuest({ status: 'available' });
    const player = makePlayer();
    const result = acceptQuest([quest], 'q_0', player);
    expect(result).toBe(true);
    expect(quest.status).toBe('active');
  });

  it('adds letter to inventory for deliver quest type', () => {
    const quest = makeQuest({ status: 'available', type: 'deliver', carryItem: 'letter' });
    const player = makePlayer();
    acceptQuest([quest], 'q_0', player);
    const letter = player.inventory.find((i) => i.id === 'letter');
    expect(letter).toBeDefined();
    expect(letter?.questId).toBe('q_0');
  });
});

// ─── turnInQuest ──────────────────────────────────────────────────────────────

describe('turnInQuest(quests, questId, player)', () => {
  it('returns null for unknown quest id', () => {
    const player = makePlayer();
    expect(turnInQuest([], 'nonexistent', player)).toBeNull();
  });

  it('returns null when quest is not completed', () => {
    const quest = makeQuest({ status: 'active' });
    const player = makePlayer();
    expect(turnInQuest([quest], 'q_0', player)).toBeNull();
  });

  it('awards gold and xp to the player', () => {
    const quest = makeQuest({ status: 'completed', reward: { gold: 50, xp: 30, items: [] } });
    const player = makePlayer({ gold: 10, xp: 5 });
    turnInQuest([quest], 'q_0', player);
    expect(player.gold).toBe(60);
    expect(player.xp).toBe(35);
  });

  it('sets quest status to TURNED_IN', () => {
    const quest = makeQuest({ status: 'completed', reward: { gold: 0, xp: 0, items: [] } });
    const player = makePlayer();
    turnInQuest([quest], 'q_0', player);
    expect(quest.status).toBe('turned_in');
  });

  it('returns the reward object', () => {
    const reward = { gold: 50, xp: 30, items: [] };
    const quest = makeQuest({ status: 'completed', reward });
    const player = makePlayer();
    const result = turnInQuest([quest], 'q_0', player);
    expect(result).toEqual(reward);
  });

  it('removes carry item from inventory on turn-in', () => {
    const quest = makeQuest({ status: 'completed', reward: { gold: 0, xp: 0, items: [] }, carryItem: 'letter' });
    const player = makePlayer({
      inventory: [{ id: 'letter', qty: 1, questId: 'q_0' }],
    });
    turnInQuest([quest], 'q_0', player);
    const letter = player.inventory.find((i) => i.id === 'letter');
    expect(letter).toBeUndefined();
  });
});

// ─── getActiveQuests / getAvailableQuestsAt / getCompletedQuestsAt ────────────

describe('getActiveQuests(quests)', () => {
  it('returns only active quests', () => {
    const quests = [
      makeQuest({ id: 'q_0', status: 'available' }),
      makeQuest({ id: 'q_1', status: 'active' }),
      makeQuest({ id: 'q_2', status: 'completed' }),
    ];
    const active = getActiveQuests(quests);
    expect(active).toHaveLength(1);
    expect(active[0].id).toBe('q_1');
  });
});

describe('getAvailableQuestsAt(quests, locId)', () => {
  it('returns only available quests at the given location', () => {
    const quests = [
      makeQuest({ id: 'q_0', status: 'available', giverLocId: 'town_1' }),
      makeQuest({ id: 'q_1', status: 'available', giverLocId: 'town_2' }),
      makeQuest({ id: 'q_2', status: 'active', giverLocId: 'town_1' }),
    ];
    const result = getAvailableQuestsAt(quests, 'town_1', 'npc');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('q_0');
  });
});

describe('getCompletedQuestsAt(quests, locId)', () => {
  it('returns only completed quests at the given location', () => {
    const quests = [
      makeQuest({ id: 'q_0', status: 'completed', giverLocId: 'town_1' }),
      makeQuest({ id: 'q_1', status: 'completed', giverLocId: 'town_2' }),
      makeQuest({ id: 'q_2', status: 'active', giverLocId: 'town_1' }),
    ];
    const result = getCompletedQuestsAt(quests, 'town_1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('q_0');
  });
});

// ─── checkGoalProgress ────────────────────────────────────────────────────────

describe('checkGoalProgress(goal, player, world)', () => {
  it('returns null when goal is null', () => {
    expect(checkGoalProgress(null, makePlayer(), {})).toBeNull();
  });

  it('returns null when goal is already completed', () => {
    const goal = { completed: true, steps: [] };
    expect(checkGoalProgress(goal, makePlayer(), {})).toBeNull();
  });

  it('returns victory event when player.defeatedBoss is true', () => {
    const goal = {
      completed: false,
      steps: [{ id: 'defeat_boss', done: false }],
    };
    const player = makePlayer({ defeatedBoss: true });
    const result = checkGoalProgress(goal, player, {});
    expect(result).toEqual({ event: 'victory' });
    expect(goal.completed).toBe(true);
  });

  it('does not return victory when boss step already done', () => {
    const goal = {
      completed: false,
      steps: [{ id: 'defeat_boss', done: true }],
    };
    const player = makePlayer({ defeatedBoss: true });
    const result = checkGoalProgress(goal, player, {});
    expect(result).toBeNull();
  });

  it('returns goal_step event when enough key items found', () => {
    const goal = {
      completed: false,
      keyItem: { name: 'Shard', count: 2 },
      keyItemLocations: [{ found: true }, { found: true }, { found: false }],
      steps: [{ count: 0, done: false }],
      currentStep: 0,
    };
    const result = checkGoalProgress(goal, makePlayer(), {});
    expect(result?.event).toBe('goal_step');
    expect(goal.steps[0].done).toBe(true);
  });

  it('returns null when not enough key items found', () => {
    const goal = {
      completed: false,
      keyItem: { name: 'Shard', count: 3 },
      keyItemLocations: [{ found: true }, { found: false }, { found: false }],
      steps: [{ count: 0, done: false }],
      currentStep: 0,
    };
    const result = checkGoalProgress(goal, makePlayer(), {});
    expect(result).toBeNull();
  });
});
