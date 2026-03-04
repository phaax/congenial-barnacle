import { DIALOG_POOLS, processDialog, getLine } from '../data/dialog.js';

// Build dialog tags from game state
export function buildTags(game) {
  const player = game.player;
  const loc    = game.currentLocation;
  const world  = game.world;
  return {
    name:      player.name,
    town:      loc ? loc.name : 'town',
    inn:       loc ? (loc.innName || 'the inn') : 'the inn',
    location:  getNearbyLocationName(world, player.worldX, player.worldY),
    goal_item: world?.goal?.keyItem?.name || 'the artifact',
    boss:      world?.goal?.bossId || 'the enemy',
    key_item:  world?.goal?.keyItem?.name || 'the key',
    items:     world?.goal?.keyItem?.name + 's' || 'the items',
    price:     '0',   // override per context
    need:      'possession',
    task:      'a task',
    target_npc:  'someone',
    target_town: 'a nearby town',
    item:        'an item',
    count:       '3',
    location2:   'nearby',
  };
}

function getNearbyLocationName(world, x, y) {
  if (!world) return 'somewhere';
  let nearest = null;
  let nearDist = Infinity;
  for (const loc of world.locations) {
    const d = Math.abs(loc.x - x) + Math.abs(loc.y - y);
    if (d < nearDist) { nearDist = d; nearest = loc; }
  }
  return nearest ? nearest.name : 'the wilderness';
}

// Start a dialog session with an NPC
export function startDialog(npc, game) {
  const tags    = buildTags(game);
  tags.inn      = npc.innName || tags.inn;

  const pool    = npc.pool || 'villager';
  const lines   = [];

  // Greeting
  lines.push({ text: getLine(pool, 'greet', tags), speaker: npc.name });

  // Story characters get special lines based on goal steps
  if (npc.isStory) {
    const goal = game.world?.goal;
    if (goal && goal.currentStep === 0 && !npc.dialogSeen) {
      const hintLines = DIALOG_POOLS.story?.hint || [];
      if (hintLines.length > 0) {
        lines.push({ text: processDialog(hintLines[0], tags), speaker: npc.name });
      }
      npc.dialogSeen = true;
      // Advance goal step
      if (goal.steps[0]) {
        goal.steps[0].done = true;
        goal.currentStep = 1;
      }
    } else if (goal && goal.currentStep > 0) {
      lines.push({ text: getLine('story', 'urgent', tags), speaker: npc.name });
    }
  }

  // Innkeeper offers services
  if (npc.isInnkeeper) {
    lines.push({ text: getLine(pool, 'rest', tags), speaker: npc.name, action: 'inn' });
  }

  // Barkeep/villager rumour
  if (pool === 'barkeep' || pool === 'villager') {
    if (!npc._rumourSeen) {
      lines.push({ text: getLine(pool, 'rumour', tags), speaker: npc.name });
      npc._rumourSeen = true;
    }
  }

  // Quest giver: add quest-specific intro line based on the NPC's assigned quest
  if (npc.isQuestGiver && npc.questIds?.length > 0) {
    const myQuest = game.quests?.find(q =>
      npc.questIds.includes(q.id) && q.status === 'available'
    );
    if (myQuest) {
      lines.push({ text: buildQuestIntro(myQuest, tags), speaker: npc.name });
    }
    const activeQuest = game.quests?.find(q =>
      npc.questIds.includes(q.id) && q.status === 'active'
    );
    if (activeQuest) {
      lines.push({ text: 'Return when the task is done.', speaker: npc.name });
    }
    const completedQuest = game.quests?.find(q =>
      npc.questIds.includes(q.id) && q.status === 'completed'
    );
    if (completedQuest) {
      lines.push({ text: getLine('quest_giver', 'quest_complete', tags), speaker: npc.name });
    }
  } else if (npc.isQuestGiver && npc.activeQuest) {
    if (npc.activeQuest.status === 'completed') {
      lines.push({ text: getLine('quest_giver', 'quest_complete', tags), speaker: npc.name, action: 'turn_in' });
    } else if (npc.activeQuest.status === 'active') {
      lines.push({ text: 'Return when the task is done.', speaker: npc.name });
    } else {
      lines.push({ text: getLine('quest_giver', 'quest_intro', tags), speaker: npc.name, action: 'quest_offer' });
    }
  }

  // Farewell
  lines.push({ text: getLine(pool, 'farewell', tags), speaker: npc.name, isFarewell: true });

  return { npc, lines, idx: 0, tags };
}

// Advance dialog by one line, return current line
export function advanceDialog(session) {
  if (session.idx >= session.lines.length) return null;
  const line = session.lines[session.idx];
  session.idx++;
  return line;
}

export function isDialogDone(session) {
  return session.idx >= session.lines.length;
}

export function getCurrentLine(session) {
  return session.lines[session.idx] || null;
}

// Build quest-specific intro line from quest data
function buildQuestIntro(quest, tags) {
  const desc = quest.description || '';
  const firstSentence = desc.split('.')[0];
  const intros = {
    slay:        `I need a capable adventurer! ${firstSentence}.`,
    fetch:       `I have an urgent need. ${firstSentence}.`,
    deliver:     `Time is short! ${firstSentence}.`,
    investigate: `Something strange is happening. ${firstSentence}.`,
    clear:       `The situation grows dire. ${firstSentence}.`,
    escort:      `I need protection. ${firstSentence}.`,
  };
  return intros[quest.type] || `I have a task that requires help. ${firstSentence}.`;
}

// Build shop dialog tags
export function buildShopTags(npc, price, itemName) {
  return {
    name:  npc.name,
    price: String(price),
    item:  itemName,
  };
}
