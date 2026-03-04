import { RNG } from '../engine/rng.js';
import { COMBAT_CONFIG, COMBAT_STATE } from '../data/constants.js';
import { getMonster } from '../data/monsters.js';
import { getItem } from '../data/items.js';
import { getSkill } from '../data/skills.js';

// Create a monster instance from a template
export function spawnMonster(id, rng) {
  const template = getMonster(id);
  if (!template) return null;
  return {
    id:          template.id,
    name:        template.name,
    symbol:      template.symbol,
    fg:          template.fg,
    hp:          rng.int(template.hp[0], template.hp[1]),
    maxHp:       rng.int(template.hp[0], template.hp[1]),
    atk:         template.atk,
    def:         template.def,
    xp:          template.xp,
    gold:        rng.int(template.gold[0], template.gold[1]),
    loot:        template.loot || [],
    abilities:   template.abilities || [],
    isBoss:      template.isBoss || false,
    statusEffects: [],
    flavorText:  template.flavorText || [],
    usedLucky:   false,
    // Boss specific
    currentPhase: 0,
  };
}

// Spawn a random monster appropriate for biome/location
export function spawnEncounter(biome, dangerLevel, rng) {
  const monsterPool = biome ? biome.monsters : [];
  if (monsterPool.length === 0) return null;
  const monsterId = rng.pick(monsterPool);
  const count = rng.chance(30) ? rng.int(2, 3) : 1;
  const monsters = [];
  for (let i = 0; i < count; i++) {
    const m = spawnMonster(monsterId, rng);
    if (m) {
      // Scale with danger level
      if (dangerLevel > 1) {
        m.hp    = Math.floor(m.hp    * (1 + (dangerLevel - 1) * 0.3));
        m.maxHp = m.hp;
        m.atk   = [m.atk[0], Math.floor(m.atk[1] * (1 + (dangerLevel - 1) * 0.2))];
        m.def   = m.def + Math.floor((dangerLevel - 1) * 0.5);
      }
      monsters.push(m);
    }
  }
  return monsters;
}

// ─── Combat State ────────────────────────────────────────────────────────────

export function initCombat(player, monsters, biome, rng) {
  return {
    state:      COMBAT_STATE.PLAYER_TURN,
    player,
    monsters,
    turn:       0,
    log:        [],
    biome:      biome || null,
    rng,
    canFlee:    true,
    bossMode:   monsters.some(m => m.isBoss),
    // For multi-enemy, current target
    targetIdx:  0,
  };
}

// Get active monster (first alive)
export function getActiveMonster(combat) {
  return combat.monsters.find(m => m.hp > 0) || null;
}

function logMsg(combat, msg, type = 'combat') {
  combat.log.push({ msg, type });
}

// ─── Player Actions ──────────────────────────────────────────────────────────

export function playerAttack(combat, abilityId = null) {
  const player  = combat.player;
  const monster = getActiveMonster(combat);
  if (!monster) return checkVictory(combat);

  const rng = combat.rng;
  let dmg = 0;
  let hit = true;
  let crit = false;

  // Miss chance
  const missChance = COMBAT_CONFIG.MISS_CHANCE - (player.stats.dex - 10) * 0.5;
  if (rng.chance(Math.max(0, missChance))) {
    hit = false;
    logMsg(combat, `You swing at ${monster.name} but miss!`);
  }

  if (hit) {
    // Base damage from equipped weapon or unarmed
    const weapon = player.equipment.weapon;
    let baseDmg;
    if (weapon) {
      const item = getItem(weapon);
      baseDmg = item ? rng.int(item.dmg[0], item.dmg[1]) : rng.int(1, 4);
    } else {
      baseDmg = rng.int(1, 4);
    }

    // Stat bonus
    const strBonus = Math.floor((player.stats.str - 10) / 2);
    baseDmg = Math.max(1, baseDmg + strBonus);

    // Skill modifiers
    if (hasSkill(player, 'swordsmanship') && (!weapon || !getItem(weapon)?.prop?.includes('ranged'))) {
      baseDmg = Math.floor(baseDmg * (1 + 0.15));
    }

    // Critical hit
    let critChance = COMBAT_CONFIG.CRIT_CHANCE;
    if (hasSkill(player, 'swordsmanship')) critChance += 5;
    if (rng.chance(critChance)) {
      crit = true;
      const critMult = player.race === 'half_orc' ? 2.4 : COMBAT_CONFIG.CRIT_MULTIPLIER;
      baseDmg = Math.floor(baseDmg * critMult);
    }

    // Backstab (first turn with stealth)
    if (combat.turn === 0 && hasSkill(player, 'stealth')) {
      baseDmg = Math.floor(baseDmg * 1.5);
      logMsg(combat, `You strike from the shadows!`);
    }

    // Apply ability modifiers
    if (abilityId === 'power_strike') {
      baseDmg = Math.floor(baseDmg * 2);
      logMsg(combat, `You unleash a powerful strike!`);
      player.mp = Math.max(0, (player.mp || 0) - 2);
    }

    // Defense reduction
    dmg = Math.max(1, baseDmg - monster.def);

    // Dwarf trait: enemy damage reduced
    if (player.race === 'dwarf') dmg = Math.max(1, dmg - 1);

    monster.hp -= dmg;
    const critText = crit ? ' (CRITICAL HIT!)' : '';
    logMsg(combat, `You attack ${monster.name} for ${dmg} damage${critText}.`);

    // Intimidate (half-orc): enemy might flee on first attack
    if (combat.turn === 0 && player.race === 'half_orc' && rng.chance(15)) {
      logMsg(combat, `${monster.name} is intimidated and flees!`);
      monster.hp = 0;
    }
  }

  combat.turn++;

  if (monster.hp <= 0) {
    return resolveMonsterDeath(combat, monster);
  }

  return advanceToEnemyTurn(combat);
}

export function playerCastSpell(combat, spellId) {
  const player  = combat.player;
  const monster = getActiveMonster(combat);
  const rng     = combat.rng;

  const spells = {
    fireball:     { mpCost: 4, dmg: () => rng.roll(2, 8) + Math.floor((player.stats.int - 10) / 2), type: 'fire',   msg: 'You hurl a fireball at' },
    frost_bolt:   { mpCost: 3, dmg: () => rng.roll(1, 8) + Math.floor((player.stats.int - 10) / 2), type: 'ice',    msg: 'You fire a frost bolt at', freeze: true },
    magic_shield: { mpCost: 3, dmg: () => 0, shield: 10, msg: 'A magical shield surrounds you.' },
    heal:         { mpCost: 3, dmg: () => -(rng.roll(2, 6) + Math.max(0, Math.floor((player.stats.wis - 10) / 2))), msg: 'You cast Heal.' },
    cure:         { mpCost: 2, dmg: () => 0, cure: true, msg: 'You cast Cure.' },
    fortify:      { mpCost: 4, dmg: () => 0, fortify: 3, msg: 'You cast Fortify.' },
  };

  const spell = spells[spellId];
  if (!spell) return;
  if ((player.mp || 0) < spell.mpCost) {
    logMsg(combat, 'Not enough MP!', 'system');
    return;
  }

  // Elven trait: spells cost 1 less
  const actualCost = player.race === 'elf' ? Math.max(1, spell.mpCost - 1) : spell.mpCost;
  player.mp = Math.max(0, (player.mp || 0) - actualCost);

  let dmg = spell.dmg();

  if (dmg < 0) {
    // Healing spell
    const healAmt = -dmg;
    player.hp = Math.min(player.maxHp, (player.hp || 0) + healAmt);
    logMsg(combat, `${spell.msg} You recover ${healAmt} HP.`);
  } else if (spell.shield) {
    player.shield = (player.shield || 0) + spell.shield;
    logMsg(combat, spell.msg);
  } else if (monster) {
    // Spell damage bonus
    if (hasSkill(player, 'magic')) dmg = Math.floor(dmg * 1.20);

    dmg = Math.max(1, dmg - Math.floor(monster.def / 2)); // spells bypass half armor
    monster.hp -= dmg;
    logMsg(combat, `${spell.msg} ${monster.name} for ${dmg} damage.`);

    if (spell.freeze && rng.chance(50)) {
      monster.statusEffects = monster.statusEffects || [];
      monster.statusEffects.push({ type: 'frozen', turns: 1 });
      logMsg(combat, `${monster.name} is frozen solid!`);
    }
  } else if (spell.cure) {
    player.statusEffects = player.statusEffects?.filter(s => s.type !== 'poison') || [];
    logMsg(combat, 'You feel cleansed of ailments.');
  } else if (spell.fortify) {
    player.fortifyTurns = (player.fortifyTurns || 0) + spell.fortify;
    logMsg(combat, 'You feel your defenses strengthen!');
  }

  combat.turn++;
  if (monster && monster.hp <= 0) return resolveMonsterDeath(combat, monster);
  return advanceToEnemyTurn(combat);
}

// Unified handler for all player skill abilities
export function playerUseAbility(combat, abilityId) {
  const player  = combat.player;
  const monster = getActiveMonster(combat);
  const rng     = combat.rng;

  // Route magic/healing abilities to existing handler
  const magicAbilities = ['fireball', 'frost_bolt', 'magic_shield', 'heal', 'cure', 'fortify'];
  if (magicAbilities.includes(abilityId)) {
    return playerCastSpell(combat, abilityId);
  }

  switch (abilityId) {
    case 'power_strike':
      return playerAttack(combat, 'power_strike');

    case 'aimed_shot': {
      if ((player.mp || 0) < 3) { logMsg(combat, 'Not enough MP!', 'system'); return; }
      player.mp = Math.max(0, (player.mp || 0) - 3);
      if (!monster) { logMsg(combat, 'No target!', 'system'); return; }
      const weapon = player.equipment?.weapon;
      const wItem  = weapon ? getItem(weapon) : null;
      const base   = wItem ? rng.int(wItem.dmg[0], wItem.dmg[1]) : rng.int(1, 4);
      const str    = Math.floor((player.stats.str - 10) / 2);
      const dmg    = Math.max(1, Math.floor((base + str) * 3) - monster.def);
      monster.hp -= dmg;
      combat.playerSkipTurn = true;
      logMsg(combat, `Aimed Shot! ${dmg} damage — you need a moment to recover.`);
      combat.turn++;
      if (monster.hp <= 0) return resolveMonsterDeath(combat, monster);
      return advanceToEnemyTurn(combat);
    }

    case 'vanish': {
      if ((player.mp || 0) < 2) { logMsg(combat, 'Not enough MP!', 'system'); return; }
      player.mp = Math.max(0, (player.mp || 0) - 2);
      if (rng.chance(70)) {
        logMsg(combat, 'You vanish into the shadows and escape!');
        combat.state = COMBAT_STATE.DEFEAT;
        combat.fled = true;
      } else {
        logMsg(combat, 'You fail to vanish!');
        combat.turn++;
        advanceToEnemyTurn(combat);
      }
      return;
    }

    case 'second_wind': {
      if (combat._secondWindUsed) {
        logMsg(combat, 'Second Wind already used this combat!', 'system');
        return;
      }
      const heal = Math.max(1, Math.floor(player.maxHp * 0.25));
      player.hp = Math.min(player.maxHp, player.hp + heal);
      combat._secondWindUsed = true;
      logMsg(combat, `Second Wind! You recover ${heal} HP.`);
      combat.turn++;
      return advanceToEnemyTurn(combat);
    }

    case 'scout': {
      if ((player.mp || 0) < 1) { logMsg(combat, 'Not enough MP!', 'system'); return; }
      player.mp = Math.max(0, (player.mp || 0) - 1);
      if (monster) {
        logMsg(combat, `Scout: ${monster.name} — ATK ${monster.atk[0]}-${monster.atk[1]}, DEF ${monster.def}, HP ~${monster.hp}`, 'system');
      }
      combat.turn++;
      return advanceToEnemyTurn(combat);
    }

    case 'forage':
      logMsg(combat, 'Cannot forage during combat!', 'system');
      return; // Don't advance turn

    case 'backstab':
      logMsg(combat, 'Backstab triggers automatically on the first turn.', 'system');
      return;

    default:
      logMsg(combat, `Unknown ability: ${abilityId}`, 'system');
  }
}

export function playerUseItem(combat, itemId) {
  const player = combat.player;
  const rng    = combat.rng;
  const item   = getItem(itemId);
  if (!item) return;

  // Remove from inventory
  const idx = player.inventory.findIndex(i => i.id === itemId);
  if (idx === -1) { logMsg(combat, 'Item not found.', 'system'); return; }
  player.inventory.splice(idx, 1);

  if (item.heal) {
    let healAmt = item.heal;
    if (hasSkill(player, 'healing')) healAmt = Math.floor(healAmt * 1.5);
    if (hasSkill(player, 'herbalism') && item.id === 'healing_herb') healAmt = Math.floor(healAmt * 1.2);
    player.hp = Math.min(player.maxHp, player.hp + healAmt);
    logMsg(combat, `You use ${item.name} and recover ${healAmt} HP.`);
  }
  if (item.mp) {
    player.mp = Math.min(player.maxMp, (player.mp || 0) + item.mp);
    logMsg(combat, `You use ${item.name} and restore ${item.mp} MP.`);
  }
  if (item.fullHeal) {
    player.hp = player.maxHp;
    player.mp = player.maxMp;
    logMsg(combat, `You drink the ${item.name}. Full health and magic restored!`);
  }
  if (item.flee) {
    combat.fleeing = true;
    logMsg(combat, 'You throw a smoke bomb and run!');
    combat.state = COMBAT_STATE.DEFEAT; // special flee state
    combat.fled = true;
    return;
  }
  if (item.cure) {
    player.statusEffects = player.statusEffects?.filter(s => s.type !== item.cure) || [];
    logMsg(combat, `${item.name} cures ${item.cure}!`);
  }
  if (item.dmg) {
    const monster = getActiveMonster(combat);
    if (monster) {
      const dmg = rng.roll(item.dmg[0], item.dmg[1]);
      monster.hp -= dmg;
      logMsg(combat, `The ${item.name} deals ${dmg} damage to ${monster.name}!`);
      if (monster.hp <= 0) return resolveMonsterDeath(combat, monster);
    }
  }

  combat.turn++;
  return advanceToEnemyTurn(combat);
}

export function playerFlee(combat) {
  const rng = combat.rng;
  const monster = getActiveMonster(combat);
  let chance = COMBAT_CONFIG.FLEE_BASE_CHANCE;

  // Stealth makes fleeing easier
  if (hasSkill(combat.player, 'stealth')) chance = 70;
  // Bosses are harder to flee from
  if (monster && monster.isBoss) chance = Math.max(5, chance - 20);

  if (rng.chance(chance)) {
    logMsg(combat, 'You flee from combat!');
    combat.state = COMBAT_STATE.DEFEAT;
    combat.fled = true;
  } else {
    logMsg(combat, 'You fail to escape!');
    combat.turn++;
    advanceToEnemyTurn(combat);
  }
}

// ─── Enemy AI ────────────────────────────────────────────────────────────────

function advanceToEnemyTurn(combat) {
  combat.state = COMBAT_STATE.ENEMY_TURN;
  const monster = getActiveMonster(combat);
  if (!monster) return checkVictory(combat);

  // Process status effects first
  processMonsterStatus(combat, monster);
  if (combat.state !== COMBAT_STATE.ENEMY_TURN) return;

  // Frozen monsters skip turn
  const frozen = monster.statusEffects?.find(s => s.type === 'frozen');
  if (frozen) {
    frozen.turns--;
    if (frozen.turns <= 0) {
      monster.statusEffects = monster.statusEffects.filter(s => s !== frozen);
    }
    logMsg(combat, `${monster.name} is frozen and cannot act.`);
    combat.state = COMBAT_STATE.PLAYER_TURN;
    return;
  }

  // Goblin flee when low HP
  if (monster.id === 'goblin' && monster.hp < monster.maxHp * 0.25) {
    logMsg(combat, `${monster.name} panics and flees!`);
    monster.hp = 0;
    return resolveMonsterDeath(combat, monster);
  }

  // Choose ability or normal attack
  const rng = combat.rng;
  let usedAbility = false;
  for (const ability of (monster.abilities || [])) {
    if (rng.chance(ability.chance)) {
      usedAbility = true;
      executeMonsterAbility(combat, monster, ability);
      break;
    }
  }

  if (!usedAbility) {
    monsterAttack(combat, monster);
  }

  // Troll regeneration
  if (monster.id === 'troll' && monster.hp > 0) {
    const regen = 3;
    monster.hp = Math.min(monster.maxHp, monster.hp + regen);
    logMsg(combat, `${monster.name} regenerates ${regen} HP.`);
  }

  // Check if player is dead
  if (combat.player.hp <= 0) {
    // Half-orc Relentless trait: survive once at 1 HP
    if (combat.player.race === 'half_orc' && !combat.player.usedRelentless) {
      combat.player.hp = 1;
      combat.player.usedRelentless = true;
      logMsg(combat, 'RELENTLESS! You survive with 1 HP!', 'system');
      combat.state = COMBAT_STATE.PLAYER_TURN;
    } else {
      combat.state = COMBAT_STATE.DEFEAT;
    }
    return;
  }

  combat.state = COMBAT_STATE.PLAYER_TURN;
}

function monsterAttack(combat, monster) {
  const player = combat.player;
  const rng    = combat.rng;

  // Aura of Fear (demon lord)
  if (monster.abilities?.find(a => a.id === 'fear') && rng.chance(20)) {
    combat.playerSkipTurn = true;
    logMsg(combat, `${monster.name}'s aura of fear paralyzes you for a moment!`);
    return;
  }

  const baseDmg = rng.int(monster.atk[0], monster.atk[1]);
  const playerDef = getPlayerDefense(player);
  let dmg = Math.max(1, baseDmg - playerDef);

  // Fortify bonus
  if (player.fortifyTurns > 0) {
    dmg = Math.max(1, dmg - 3);
    player.fortifyTurns--;
  }

  // Shield absorption
  if (player.shield > 0) {
    const absorbed = Math.min(player.shield, dmg);
    dmg -= absorbed;
    player.shield -= absorbed;
    if (absorbed > 0) logMsg(combat, `Your magic shield absorbs ${absorbed} damage.`);
  }

  // Halfling dodge bonus
  let dodgeChance = 0;
  if (player.race === 'halfling') dodgeChance += 15;
  if (hasSkill(player, 'stealth'))    dodgeChance += 10;
  if (player.race === 'elf')          dodgeChance += 10;
  if (rng.chance(dodgeChance)) {
    logMsg(combat, `${monster.name} attacks but you dodge!`);
    return;
  }

  // Halfling lucky: reroll damage for player
  if (player.race === 'halfling' && !combat._usedLucky && rng.chance(50)) {
    const rerollDmg = Math.max(1, rng.int(monster.atk[0], monster.atk[1]) - playerDef);
    if (rerollDmg < dmg) {
      dmg = rerollDmg;
      combat._usedLucky = true;
      logMsg(combat, `Lucky! The attack deals less damage.`);
    }
  }

  player.hp -= dmg;
  logMsg(combat, `${monster.name} attacks you for ${dmg} damage.`);

  // Apply status effects from attack
  for (const ability of (monster.abilities || [])) {
    if (ability.id === 'poison' && rng.chance(ability.chance)) {
      player.statusEffects = player.statusEffects || [];
      if (!player.statusEffects.find(s => s.type === 'poison')) {
        player.statusEffects.push({ type: 'poison', turns: 3, dmg: 1 });
        logMsg(combat, `You are poisoned!`);
      }
    }
    if (ability.id === 'drain') {
      const drain = 5;
      monster.hp = Math.min(monster.maxHp, monster.hp + drain);
      logMsg(combat, `${monster.name} drains ${drain} HP from you!`);
    }
    if (ability.id === 'trip' && rng.chance(ability.chance)) {
      combat.playerSkipTurn = true;
      logMsg(combat, `You are tripped! You lose your next turn.`);
    }
    if (ability.id === 'corruption' && rng.chance(ability.chance)) {
      player.maxHp = Math.max(1, player.maxHp - 10);
      logMsg(combat, `${monster.name} corrupts your life force! Max HP reduced by 10.`);
    }
  }
}

function executeMonsterAbility(combat, monster, ability) {
  const player = combat.player;
  const rng    = combat.rng;

  switch (ability.id) {
    case 'battle_cry':
      monster._atkBonus = (monster._atkBonus || 0) + 3;
      monster._atkBonusTurns = 2;
      logMsg(combat, `${monster.name} lets out a battle cry! (+3 attack)`);
      break;
    case 'maul': {
      const dmg = Math.max(1, rng.int(monster.atk[0], monster.atk[1]) * 2 - getPlayerDefense(player));
      player.hp -= dmg;
      logMsg(combat, `${monster.name} mauls you for ${dmg} damage!`);
      break;
    }
    case 'smash': {
      const dmg = Math.max(1, rng.int(monster.atk[0], monster.atk[1]) * 3 - getPlayerDefense(player));
      player.hp -= dmg;
      combat.playerSkipTurn = true;
      logMsg(combat, `${monster.name} SMASHES you for ${dmg} damage and stuns you!`);
      break;
    }
    case 'fire_breath': {
      const dmg = rng.roll(3, 8);
      player.hp -= dmg;
      logMsg(combat, `${monster.name} breathes fire! You take ${dmg} fire damage!`);
      break;
    }
    case 'inferno': {
      const dmg = rng.roll(5, 10);
      player.hp -= dmg;
      logMsg(combat, `${monster.name} unleashes INFERNO! ${dmg} fire damage!`);
      break;
    }
    case 'death_bolt': {
      const dmg = rng.roll(4, 10);
      player.hp -= dmg;
      logMsg(combat, `The Lich fires a death bolt! You take ${dmg} necrotic damage!`);
      break;
    }
    case 'drain_life': {
      const drain = 20;
      player.hp -= drain;
      monster.hp = Math.min(monster.maxHp, monster.hp + drain);
      logMsg(combat, `The Lich drains ${drain} HP from your life force!`);
      break;
    }
    case 'wing_gust':
      combat.playerSkipTurn = true;
      logMsg(combat, `${monster.name}'s wing gust blows you back! Stunned for 2 turns.`);
      break;
    default:
      monsterAttack(combat, monster);
  }
}

function processMonsterStatus(combat, monster) {
  // Process monster status effects
}

function processPlayerStatus(player, log) {
  if (!player.statusEffects) return;
  player.statusEffects = player.statusEffects.filter(s => {
    if (s.type === 'poison') {
      player.hp -= s.dmg;
      log.push({ msg: `You take ${s.dmg} poison damage.`, type: 'combat' });
      s.turns--;
      if (s.turns <= 0) {
        log.push({ msg: 'The poison wears off.', type: 'combat' });
        return false;
      }
    }
    return true;
  });
}

function resolveMonsterDeath(combat, monster) {
  logMsg(combat, `${monster.name} is defeated!`, 'combat');

  // Check for remaining monsters
  const remaining = combat.monsters.filter(m => m.hp > 0);
  if (remaining.length > 0) {
    combat.state = COMBAT_STATE.PLAYER_TURN;
    return;
  }

  return checkVictory(combat);
}

function checkVictory(combat) {
  const allDead = combat.monsters.every(m => m.hp <= 0);
  if (allDead) {
    combat.state = COMBAT_STATE.VICTORY;
    // Calculate total rewards
    combat.totalXp   = combat.monsters.reduce((sum, m) => sum + m.xp, 0);
    combat.totalGold = combat.monsters.reduce((sum, m) => sum + m.gold, 0);
    combat.lootItems = collectLoot(combat.monsters, combat.rng);
  }
}

function collectLoot(monsters, rng) {
  const items = [];
  for (const m of monsters) {
    for (const drop of (m.loot || [])) {
      if (rng.chance(drop.chance)) {
        items.push(drop.id);
      }
    }
  }
  return items;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hasSkill(player, skillId) {
  return player.skills && player.skills.includes(skillId);
}

function getPlayerDefense(player) {
  let def = Math.floor((player.stats.con - 10) / 2);
  if (player.equipment.armor) {
    const armor = getItem(player.equipment.armor);
    if (armor) def += armor.def || 0;
  }
  if (player.equipment.offhand) {
    const offhand = getItem(player.equipment.offhand);
    if (offhand) def += offhand.def || 0;
  }
  return Math.max(0, def);
}

// Apply combat rewards to player
export function applyRewards(player, combat) {
  player.gold = (player.gold || 0) + (combat.totalGold || 0);

  const xpGained = Math.floor((combat.totalXp || 0) * getXpMultiplier(player));
  player.xp  = (player.xp || 0) + xpGained;

  // Add loot to inventory
  const loot = [];
  for (const itemId of (combat.lootItems || [])) {
    if (player.inventory.length < 20) {
      player.inventory.push({ id: itemId, qty: 1 });
      loot.push(itemId);
    }
  }

  // Level up
  let leveled = false;
  while (player.xp >= xpToLevel(player.level + 1)) {
    player.level++;
    player.maxHp += 5;
    player.hp = player.maxHp; // full heal on level up
    player.maxMp += 2;
    player.mp = player.maxMp;
    leveled = true;
  }

  return { xpGained, leveled, loot };
}

function getXpMultiplier(player) {
  let mult = 1.0;
  if (player.race === 'human') mult *= 1.10;
  if (player.background === 'farmhand' && player.level < 3) mult *= 2.0;
  return mult;
}

export function xpToLevel(level) {
  return level * level * 60;
}

// Process beginning-of-player-turn effects (poison, etc.)
export function startPlayerTurn(combat) {
  processPlayerStatus(combat.player, combat.log);

  if (combat.playerSkipTurn) {
    combat.playerSkipTurn = false;
    combat.turn++;
    advanceToEnemyTurn(combat);
    return true; // turn was skipped
  }
  return false;
}
