import { QUEST_TEMPLATES, QUEST_STATUS, MAX_ACTIVE_QUESTS } from '../data/quests.js';
import { getItem } from '../data/items.js';
import { RNG } from '../engine/rng.js';

// Generate quest instances for a world
export function generateQuests(world, rng) {
  const quests = [];
  let questId = 0;

  for (const loc of world.locations) {
    if (!loc.questGivers) continue;

    for (const giver of loc.questGivers) {
      // Assign 1-2 quests per giver
      const count = rng.int(1, 2);
      const templates = rng.shuffle([...QUEST_TEMPLATES]);

      giver.questIds = [];
      for (let i = 0; i < count; i++) {
        const template = templates[i % templates.length];
        if (!template) continue;

        const quest = instantiateQuest(template, world, loc, rng, questId++);
        quests.push(quest);
        giver.questIds.push(quest.id);
        giver.activeQuest = null; // set when player picks up
      }
    }
  }

  return quests;
}

function instantiateQuest(template, world, giverLoc, rng, id) {
  const q = {
    id:           `q_${id}`,
    templateId:   template.id,
    type:         template.type,
    title:        template.title,
    status:       QUEST_STATUS.AVAILABLE,
    dangerLevel:  template.dangerLevel,
    giverLocId:   giverLoc.id,
    giverLocName: giverLoc.name,
    reward:       instantiateReward(template.reward, rng),
    progress:     0,
    progressMax:  0,
    targetLocId:  null,
    targetLocName:'somewhere',
  };

  // Find a target location
  const candidates = world.locations.filter(l => l.id !== giverLoc.id);
  const nearby = candidates
    .map(l => ({ loc: l, dist: Math.hypot(l.x - giverLoc.x, l.y - giverLoc.y) }))
    .sort((a, b) => a.dist - b.dist);

  // Customize by type
  if (template.type === 'slay') {
    const count = rng.int(template.target.count[0], template.target.count[1]);
    q.description    = template.description
      .replace('{count}', count)
      .replace('{location}', q.targetLocName);
    q.targetMonster  = template.target.monster;
    q.progressMax    = count;
    q.hint           = template.hint;
  } else if (template.type === 'fetch') {
    const count  = rng.int(template.target.count[0], template.target.count[1]);
    const item   = getItem(template.target.item) || { name: 'a rare item' };
    q.description    = template.description
      .replace('{count}', count)
      .replace('{item}', item.name);
    q.targetItem     = template.target.item;
    q.progressMax    = count;
    q.fromShop       = template.target.source === 'shop';
    q.hint           = template.hint;
  } else if (template.type === 'deliver') {
    const target = nearby[1]?.loc;
    if (target) {
      q.targetLocId   = target.id;
      q.targetLocName = target.name;
    }
    q.description    = template.description
      .replace('{target_npc}', 'the contact')
      .replace('{target_town}', q.targetLocName);
    q.progressMax    = 1;
    q.carryItem      = 'letter';
    q.hint           = template.hint;
  } else if (template.type === 'investigate' || template.type === 'clear') {
    const dungeonCandidates = nearby.filter(n =>
      ['DUNGEON','CAVE','RUINS'].includes(n.loc.type)
    );
    const target = dungeonCandidates[0]?.loc || nearby[0]?.loc;
    if (target) {
      q.targetLocId   = target.id;
      q.targetLocName = target.name;
    }
    q.description    = template.description
      .replace('{location}', q.targetLocName);
    q.progressMax    = 1;
    q.hint           = template.hint;
  } else {
    q.description = template.description;
    q.progressMax = 1;
  }

  q.completionText = template.completionText;
  return q;
}

function instantiateReward(rewardTemplate, rng) {
  return {
    gold:  rng.int(rewardTemplate.gold[0], rewardTemplate.gold[1]),
    xp:    rng.int(rewardTemplate.xp[0],   rewardTemplate.xp[1]),
    items: rewardTemplate.items ? [...rewardTemplate.items] : [],
  };
}

// Update quest progress based on game events
export function onMonsterKilled(quests, monsterId) {
  for (const q of quests) {
    if (q.status !== QUEST_STATUS.ACTIVE) continue;
    if (q.type === 'slay' && q.targetMonster === monsterId) {
      q.progress++;
      if (q.progress >= q.progressMax) {
        q.status = QUEST_STATUS.COMPLETED;
        return q;
      }
    }
  }
  return null;
}

export function onItemPickedUp(quests, itemId) {
  const updated = [];
  for (const q of quests) {
    if (q.status !== QUEST_STATUS.ACTIVE) continue;
    if (q.type === 'fetch' && q.targetItem === itemId) {
      q.progress++;
      if (q.progress >= q.progressMax) {
        q.status = QUEST_STATUS.COMPLETED;
        updated.push(q);
      }
    }
  }
  return updated;
}

export function onLocationVisited(quests, locId) {
  const updated = [];
  for (const q of quests) {
    if (q.status !== QUEST_STATUS.ACTIVE) continue;
    if ((q.type === 'investigate' || q.type === 'clear') && q.targetLocId === locId) {
      q.progress++;
      if (q.progress >= q.progressMax) {
        q.status = QUEST_STATUS.COMPLETED;
        updated.push(q);
      }
    }
  }
  return updated;
}

export function acceptQuest(quests, questId, player) {
  const q = quests.find(q => q.id === questId);
  if (!q || q.status !== QUEST_STATUS.AVAILABLE) return false;
  if (getActiveQuests(quests).length >= MAX_ACTIVE_QUESTS) return false;

  q.status = QUEST_STATUS.ACTIVE;
  // Give carry items if needed
  if (q.carryItem === 'letter') {
    player.inventory.push({ id: 'letter', qty: 1, questId: q.id });
  }
  return true;
}

export function turnInQuest(quests, questId, player) {
  const q = quests.find(q => q.id === questId);
  if (!q || q.status !== QUEST_STATUS.COMPLETED) return null;

  q.status = QUEST_STATUS.TURNED_IN;
  player.gold += q.reward.gold;
  player.xp   += q.reward.xp;

  for (const item of q.reward.items) {
    if (player.inventory.length < 20) {
      player.inventory.push({ id: item.id, qty: item.qty || 1 });
    }
  }

  // Remove quest items
  if (q.carryItem) {
    const idx = player.inventory.findIndex(i => i.questId === q.id);
    if (idx !== -1) player.inventory.splice(idx, 1);
  }

  return q.reward;
}

export function getActiveQuests(quests) {
  return quests.filter(q => q.status === QUEST_STATUS.ACTIVE);
}

export function getAvailableQuestsAt(quests, locId, giverName) {
  return quests.filter(q =>
    q.status === QUEST_STATUS.AVAILABLE && q.giverLocId === locId
  );
}

export function getCompletedQuestsAt(quests, locId) {
  return quests.filter(q =>
    q.status === QUEST_STATUS.COMPLETED && q.giverLocId === locId
  );
}

// Check main goal progress
export function checkGoalProgress(goal, player, world) {
  if (!goal || goal.completed) return null;

  // Check key item collection
  if (goal.keyItem && goal.keyItemLocations) {
    const found = goal.keyItemLocations.filter(kl => kl.found).length;
    const step  = goal.steps.find(s => s.count !== undefined && !s.done);
    if (step) {
      step.count = found;
      if (found >= goal.keyItem.count) {
        step.done = true;
        const stepIdx = goal.steps.indexOf(step);
        if (stepIdx + 1 < goal.steps.length) goal.currentStep = stepIdx + 1;
        return { event: 'goal_step', step };
      }
    }
  }

  // Check boss defeated
  const bossStep = goal.steps.find(s => s.id === 'defeat_boss');
  if (bossStep && !bossStep.done) {
    if (player.defeatedBoss) {
      bossStep.done = true;
      goal.completed = true;
      return { event: 'victory' };
    }
  }

  return null;
}
