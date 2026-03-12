// @ts-nocheck
import { C, COLS, ROWS, COMBAT_STATE, STATE } from '../../data/constants';
import { Menu } from '../menu';
import { getSkill } from '../../data/skills';
import { getItem } from '../../data/items';
import {
  playerAttack, playerUseAbility, playerFlee, playerUseItem,
  getActiveMonster, startPlayerTurn
} from '../../systems/combat';
const CS = COMBAT_STATE;

export class CombatScreen {
  constructor(game) {
    this.game    = game;
    this.mode    = 'main';  // main, spell, item
    this.logScroll = 0;
    this.newLogLines = 0;
    this._resultTimer = 0;
    this._showResult  = false;
    this._resultMsg   = '';

    this.mainMenu  = new Menu([
      { label: 'Attack',     key: 'a' },
      { label: 'Use Ability', key: 's' },
      { label: 'Use Item',   key: 'i' },
      { label: 'Flee',       key: 'f' },
    ]);

    this.spellMenu = null;
    this.itemMenu  = null;
  }

  enter(data) {
    this.mode      = 'main';
    this.logScroll = 0;
    this._showResult = false;
    this._resultTimer = 0;
    this._buildMenus();

    const combat = this.game.combat;
    if (!combat) return;

    // Process start-of-player-turn effects
    startPlayerTurn(combat);

    this.mainMenu.onSelect = (i, opt) => this._mainAction(opt.key);
  }

  exit() {}

  _buildMenus() {
    const player = this.game.player;
    if (!player) return;

    // Ability menu from skills (exclude passive-only and non-combat abilities)
    const PASSIVE_ABILITIES = ['backstab', 'forage', 'scout'];
    const spells = [];
    for (const skillId of (player.skills || [])) {
      const skill = getSkill(skillId);
      if (!skill || !skill.abilities) continue;
      for (const ab of skill.abilities) {
        if (ab.mpCost !== undefined && !PASSIVE_ABILITIES.includes(ab.id)) {
          spells.push({
            label: `${ab.name} (${ab.mpCost}MP)`,
            key: spells.length === 0 ? '1' : String(spells.length + 1),
            spellId: ab.id,
            disabled: ab.mpCost > 0 && (player.mp || 0) < ab.mpCost,
          });
        }
      }
    }
    spells.push({ label: 'Cancel', key: 'x' });

    this.spellMenu = new Menu(spells);
    this.spellMenu.onSelect = (i, opt) => {
      if (opt.key === 'x') { this.mode = 'main'; return; }
      if (opt.spellId) {
        this._executeTurn(() => playerUseAbility(this.game.combat, opt.spellId));
      }
    };

    // Item menu - consumables only
    const items = (player.inventory || [])
      .filter(inv => {
        const item = getItem(inv.id);
        return item && item.type === 'consumable';
      })
      .map(inv => {
        const item = getItem(inv.id);
        return { label: `${item.name} (x${inv.qty})`, itemId: inv.id };
      });
    items.push({ label: 'Cancel', key: 'x' });

    this.itemMenu = new Menu(items);
    this.itemMenu.onSelect = (i, opt) => {
      if (opt.key === 'x') { this.mode = 'main'; return; }
      if (opt.itemId) {
        this._executeTurn(() => playerUseItem(this.game.combat, opt.itemId));
      }
    };
  }

  _mainAction(key) {
    const combat = this.game.combat;
    if (!combat || combat.state !== CS.PLAYER_TURN) return;
    if (key === 'a') { this._executeTurn(() => playerAttack(combat)); }
    if (key === 's') { this.mode = 'spell'; this._buildMenus(); }
    if (key === 'i') { this.mode = 'item';  this._buildMenus(); }
    if (key === 'f') { this._executeTurn(() => playerFlee(combat)); }
  }

  _executeTurn(action) {
    const combat = this.game.combat;
    if (!combat) return;

    action();
    this.newLogLines = combat.log.length;
    this.logScroll = Math.max(0, combat.log.length - 8);
    this.mode = 'main';

    // Check end conditions
    if (combat.state === CS.VICTORY) {
      this._showResult = true;
      this._resultMsg  = 'VICTORY!';
      this._resultTimer = 2; // seconds
    } else if (combat.state === CS.DEFEAT) {
      if (combat.fled) {
        this.game.endCombat(false, true);
      } else {
        this._showResult = true;
        this._resultMsg  = 'DEFEATED...';
        this._resultTimer = 2; // seconds
      }
    } else {
      // Process start of next turn
      startPlayerTurn(combat);
    }
  }

  update(dt) {
    if (this._showResult) {
      this._resultTimer -= dt;
      if (this._resultTimer <= 0) {
        this._showResult = false;
        const combat = this.game.combat;
        if (combat?.state === CS.VICTORY) {
          this.game.endCombat(true);
        } else if (combat?.state === CS.DEFEAT) {
          this.game.endCombat(false, false);
        }
      }
    }
  }

  handleKey(e) {
    if (this._showResult) return;
    const combat = this.game.combat;
    if (!combat || combat.state !== CS.PLAYER_TURN) return;

    if (this.mode === 'spell') {
      if (e.key === 'x' || e.key === 'X' || e.key === 'Escape') { this.mode = 'main'; return; }
      this.spellMenu?.handleKey(e);
      return;
    }
    if (this.mode === 'item') {
      if (e.key === 'x' || e.key === 'X' || e.key === 'Escape') { this.mode = 'main'; return; }
      this.itemMenu?.handleKey(e);
      return;
    }

    // Direct letter shortcuts — intercept before Menu (which maps 's' to moveDown)
    const k = e.key.toLowerCase();
    if (k === 'a' || k === 's' || k === 'i' || k === 'f') {
      this._mainAction(k);
      return;
    }

    this.mainMenu.handleKey(e);
  }

  handleClick(col, row, button) {
    if (this._showResult) return;
    const combat = this.game.combat;
    if (!combat || combat.state !== CS.PLAYER_TURN) return;
    // Main/spell/item menus render at col 4, row 21
    if (row >= 21 && row <= 24) {
      if (this.mode === 'main')  this.mainMenu.handleClick(col, row, 4, 21);
      if (this.mode === 'spell') this.spellMenu?.handleClick(col, row, 4, 21);
      if (this.mode === 'item')  this.itemMenu?.handleClick(col, row, 4, 21);
    }
  }

  handleMove(col, row) {
    if (this._showResult) return;
    const combat = this.game.combat;
    if (!combat || combat.state !== CS.PLAYER_TURN) return;
    if (row >= 21 && row <= 24) {
      if (this.mode === 'main')  this.mainMenu.handleHover(col, row, 4, 21);
      if (this.mode === 'spell') this.spellMenu?.handleHover(col, row, 4, 21);
      if (this.mode === 'item')  this.itemMenu?.handleHover(col, row, 4, 21);
    }
  }

  handleScroll(dir) {
    const combat = this.game.combat;
    if (!combat) return;
    const maxScroll = Math.max(0, combat.log.length - 8);
    this.logScroll = Math.max(0, Math.min(maxScroll, this.logScroll + dir));
  }

  render(renderer) {
    renderer.clear(C.BLACK);
    const combat = this.game.combat;
    if (!combat) { renderer.write(0, 0, 'No combat active', C.RED, C.BLACK); return; }

    const monster = getActiveMonster(combat);
    const player  = combat.player;

    // ── Enemy section (rows 0-6) ──
    renderer.drawBox(0, 0, COLS, 7, C.DARK_RED, C.BLACK);
    if (monster) {
      // Monster symbol large
      renderer.write(3, 2, monster.symbol, monster.fg, C.BLACK);
      renderer.write(3, 3, monster.symbol, monster.fg, C.BLACK);

      // Monster name and HP
      renderer.write(6, 1, monster.name, C.RED, C.BLACK);
      renderer.write(6, 2, `HP: ${monster.hp}/${monster.maxHp}`, C.WHITE, C.BLACK);
      renderer.progressBar(6, 3, 30, monster.hp, monster.maxHp, C.RED, C.DARK_RED, C.BLACK);

      // Status effects
      const statuses = (monster.statusEffects || []).map(s => s.type.toUpperCase()).join(' ');
      if (statuses) renderer.write(6, 4, statuses, C.MAGENTA, C.BLACK);

      // Boss indicator
      if (monster.isBoss) {
        renderer.write(6, 5, '  *** BOSS ENCOUNTER ***', C.YELLOW, C.BLACK);
      }

      // Flavor text (rotating) — clip to available width
      const flavor = monster.flavorText?.length > 0
        ? monster.flavorText[Math.floor(Date.now() / 4000) % monster.flavorText.length]
        : '';
      if (flavor) {
        const maxFlavor = COLS - 43;
        const clipped = flavor.length > maxFlavor ? flavor.slice(0, maxFlavor - 3) + '...' : flavor;
        renderer.write(40, 2, `"${clipped}"`, C.DARK_GRAY, C.BLACK);
      }

      // All enemies in group — show symbol + HP fraction for each
      if (combat.monsters.length > 1) {
        let ex = 40;
        renderer.write(ex, 3, 'Group:', C.DARK_GRAY, C.BLACK);
        ex = 40;
        for (let i = 0; i < combat.monsters.length; i++) {
          const m = combat.monsters[i];
          const isActive = m === monster;
          const dead = m.hp <= 0;
          const fg = dead ? C.DARK_GRAY : (isActive ? C.YELLOW : m.fg);
          const hpStr = dead ? '✗' : `${m.hp}/${m.maxHp}`;
          const entry = `${m.symbol}${hpStr}`;
          renderer.write(ex, 4, entry, fg, C.BLACK);
          ex += entry.length + 1;
          if (ex >= COLS - 2) break; // don't overflow
        }
      }
    } else {
      renderer.writeCenter(3, '[ All enemies defeated ]', C.GREEN, C.BLACK);
    }

    // ── Combat log (rows 7-18) ──
    renderer.drawBox(0, 7, COLS, 12, C.DARK_GRAY, C.BLACK);
    renderer.write(1, 7, ' COMBAT LOG ', C.YELLOW, C.BLACK);

    const catColors = { combat: C.LIGHT_GRAY, system: C.CYAN };
    const visibleLog = combat.log.slice(this.logScroll, this.logScroll + 10);
    for (let i = 0; i < visibleLog.length; i++) {
      const entry = visibleLog[i];
      const fg    = catColors[entry.type] || C.LIGHT_GRAY;
      const text  = entry.msg.length > COLS - 3 ? entry.msg.slice(0, COLS - 6) + '...' : entry.msg;
      renderer.write(2, 8 + i, text, fg, C.BLACK);
    }

    if (combat.log.length > 10) {
      renderer.write(COLS - 3, 18, '▲▼', C.DARK_GRAY, C.BLACK);
    }

    // ── Player status (rows 19-22, right side) ──
    renderer.drawBox(42, 19, 38, 6, C.DARK_CYAN, C.BLACK);
    renderer.write(43, 19, ' PLAYER ', C.CYAN, C.BLACK);
    renderer.write(44, 20, `HP: ${player.hp}/${player.maxHp}`, C.WHITE, C.BLACK);
    renderer.progressBar(44, 21, 30, player.hp, player.maxHp, C.GREEN, C.DARK_GREEN, C.BLACK);
    renderer.write(44, 22, `MP: ${player.mp || 0}/${player.maxMp}`, C.WHITE, C.BLACK);
    renderer.progressBar(44, 23, 30, player.mp || 0, player.maxMp, C.BLUE, C.DARK_BLUE, C.BLACK);

    // Status effects on player
    const pStatuses = (player.statusEffects || []).map(s => s.type.toUpperCase()).join(' ');
    if (pStatuses) renderer.write(44, 24, pStatuses, C.MAGENTA, C.BLACK);

    // ── Action menu (rows 19-24, left side) ──
    if (!this._showResult) {
      renderer.drawBox(0, 19, 41, 11, C.WHITE, C.BLACK);

      if (combat.state === CS.PLAYER_TURN) {
        if (this.mode === 'main') {
          renderer.write(1, 19, ' ACTIONS ', C.YELLOW, C.BLACK);
          this.mainMenu.render(renderer, 4, 21, { width: 20 });
          renderer.write(2, 28, '[A]ttack [S]kills [I]tem [F]lee', C.DARK_GRAY, C.BLACK);
        } else if (this.mode === 'spell') {
          renderer.write(1, 19, ' ABILITIES ', C.CYAN, C.BLACK);
          this.spellMenu?.render(renderer, 4, 21, { width: 30 });
          renderer.write(2, 28, '↑↓ Navigate  Enter: Use  [X] Cancel', C.DARK_GRAY, C.BLACK);
        } else if (this.mode === 'item') {
          renderer.write(1, 19, ' ITEMS ', C.YELLOW, C.BLACK);
          this.itemMenu?.render(renderer, 4, 21, { width: 30 });
          renderer.write(2, 28, '↑↓ Navigate  Enter: Use  [X] Cancel', C.DARK_GRAY, C.BLACK);
        }
      } else if (combat.state === CS.ENEMY_TURN) {
        renderer.writeCenter(22, '-- Enemy turn --', C.DARK_GRAY, C.BLACK, 1, 40);
      }
    }

    // ── Result overlay ──
    if (this._showResult) {
      const isVic = this._resultMsg === 'VICTORY!';
      renderer.drawPanel(20, 10, 40, 10, '', isVic ? C.GREEN : C.RED, C.BLACK, 'double');
      renderer.writeCenter(13, this._resultMsg, isVic ? C.YELLOW : C.RED, C.BLACK, 21, 58);
      if (isVic && combat.totalXp) {
        renderer.writeCenter(15, `+${combat.totalXp} XP  +${combat.totalGold} Gold`, C.WHITE, C.BLACK, 21, 58);
        if (combat.lootItems?.length > 0) {
          const lootStr = combat.lootItems.join(', ');
          const display = lootStr.length > 30 ? lootStr.slice(0, 27) + '...' : lootStr;
          renderer.writeCenter(16, `Found: ${display}`, C.YELLOW, C.BLACK, 21, 58);
        }
      }
    }
  }
}
