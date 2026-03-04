import { Renderer } from './renderer.js';
import { InputManager, KEY } from './input.js';
import { RNG } from './rng.js';
import { STATE, C, COLS, ROWS, MSG_ROWS, VIEW_ROWS, MAIN_COLS } from '../data/constants.js';
import { generateWorld, updateFog, getBiomeAt, getLocationAt, getTownLayout, getDungeonLayout } from '../world/worldgen.js';
import { generateQuests, onMonsterKilled, onItemPickedUp, onLocationVisited, checkGoalProgress } from '../systems/quest.js';
import { getRace } from '../data/races.js';
import { getBackground } from '../data/backgrounds.js';
import { getSkill } from '../data/skills.js';
import { getItem } from '../data/items.js';
import { spawnEncounter, spawnMonster, initCombat, applyRewards, xpToLevel } from '../systems/combat.js';
import { startDialog } from '../systems/dialog.js';

const SAVE_KEY = 'chronicles_save';
const MAX_MESSAGES = 100;

export class Game {
  constructor(canvas) {
    this.canvas   = canvas;
    this.renderer = new Renderer(canvas);
    this.input    = new InputManager(canvas, this.renderer);

    this.rng      = new RNG(Date.now());
    this.player   = null;
    this.world    = null;
    this.quests   = [];
    this.messages = [];
    this.combat   = null;
    this.dialogSession = null;

    this.currentLocation = null;
    this.currentLayout   = null;
    this.currentState    = null;
    this.screens         = {};
    this.pendingState    = null;

    // Track monsters killed for quests
    this.monstersKilled  = {};
    this.questsCompleted = 0;

    // Animation
    this._lastTime = 0;
    this._frameId  = null;
    this._blinkTimer = 0;
    this.blinkOn = true;

    this._loadScreens();
    this.changeState(STATE.MAIN_MENU);
    this._loop(0);
  }

  async _loadScreens() {
    // Dynamically import screens
    const [
      { MainMenuScreen },
      { CharCreateScreen },
      { WorldMapScreen },
      { LocationScreen },
      { CombatScreen },
      { DialogScreen },
      { InventoryScreen },
      { QuestLogScreen },
      { InnScreen },
      { ShopScreen },
      { GameOverScreen },
      { VictoryScreen },
    ] = await Promise.all([
      import('../ui/screens/mainmenu.js'),
      import('../ui/screens/charCreate.js'),
      import('../ui/screens/worldmap.js'),
      import('../ui/screens/location.js'),
      import('../ui/screens/combat.js'),
      import('../ui/screens/dialogScreen.js'),
      import('../ui/screens/inventory.js'),
      import('../ui/screens/questlog.js'),
      import('../ui/screens/innScreen.js'),
      import('../ui/screens/shopScreen.js'),
      import('../ui/screens/gameover.js'),
      import('../ui/screens/victory.js'),
    ]);

    this.screens = {
      [STATE.MAIN_MENU]:  new MainMenuScreen(this),
      [STATE.CHAR_CREATE]:new CharCreateScreen(this),
      [STATE.WORLD_MAP]:  new WorldMapScreen(this),
      [STATE.LOCATION]:   new LocationScreen(this),
      [STATE.COMBAT]:     new CombatScreen(this),
      [STATE.DIALOG]:     new DialogScreen(this),
      [STATE.INVENTORY]:  new InventoryScreen(this),
      [STATE.QUEST_LOG]:  new QuestLogScreen(this),
      [STATE.INN]:        new InnScreen(this),
      [STATE.SHOP]:       new ShopScreen(this),
      [STATE.GAME_OVER]:  new GameOverScreen(this),
      [STATE.VICTORY]:    new VictoryScreen(this),
    };

    // Hide loading overlay
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = 'none';

    // If we have a pending state transition, apply it now
    if (this.pendingState) {
      this._doChangeState(this.pendingState.state, this.pendingState.data);
      this.pendingState = null;
    } else {
      this._doChangeState(STATE.MAIN_MENU, null);
    }
  }

  changeState(stateName, data = null) {
    if (!this.screens[stateName]) {
      // Screens not loaded yet - queue it
      this.pendingState = { state: stateName, data };
      return;
    }
    this._doChangeState(stateName, data);
  }

  _doChangeState(stateName, data) {
    const current = this.screens[this.currentState];
    if (current) current.exit();

    this.currentState = stateName;
    const next = this.screens[stateName];
    if (next) {
      // Set up input handlers
      this.input.setHandlers({
        key:    (e) => next.handleKey(e),
        click:  (col, row, btn) => next.handleClick(col, row, btn),
        scroll: (dir) => next.handleScroll(dir),
        move:   (col, row) => next.handleMove?.(col, row),
      });
      next.enter(data);
    }

    // Force full re-render
    this.renderer.clear();
  }

  _loop(timestamp) {
    const dt = Math.min(timestamp - this._lastTime, 100);
    this._lastTime = timestamp;

    this._blinkTimer += dt;
    if (this._blinkTimer > 500) { this._blinkTimer = 0; this.blinkOn = !this.blinkOn; }

    const dtSec = dt / 1000; // screens use seconds for timers
    const screen = this.screens[this.currentState];
    if (screen) {
      screen.update(dtSec);
      screen.render(this.renderer);
    }
    this.renderer.render();

    this._frameId = requestAnimationFrame((t) => this._loop(t));
  }

  // ─── Game Management ────────────────────────────────────────────────────────

  startNewGame(playerConfig) {
    const seed = Date.now();
    this.rng   = new RNG(seed);

    // Build player
    const race = getRace(playerConfig.race);
    const bg   = getBackground(playerConfig.background);

    const baseStats = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
    if (race) Object.entries(race.statMods).forEach(([k,v]) => baseStats[k] += v);
    if (bg)   Object.entries(bg.statMods).forEach(([k,v]) => { if (k in baseStats) baseStats[k] += v; });

    // Skill HP/MP bonuses
    const skills = playerConfig.skills || [];
    let hpMult = 1.0, mpMult = 1.0;
    if (skills.includes('fortitude')) hpMult += 0.20;
    if (skills.includes('magic'))     mpMult += 0.25;

    const baseHp = (race?.startHp || 10) + Math.floor((baseStats.con - 10) / 2) * 2;
    const baseMp = (race?.startMp || 6)  + Math.floor((baseStats.int - 10) / 2) * 2;
    const maxHp  = Math.floor(baseHp * hpMult);
    const maxMp  = Math.floor(baseMp * mpMult);

    this.player = {
      name:       playerConfig.name,
      race:       playerConfig.race,
      gender:     playerConfig.gender,
      background: playerConfig.background,
      skills,
      stats:      baseStats,
      hp:   maxHp, maxHp,
      mp:   maxMp, maxMp,
      level: 1, xp: 0,
      gold:  bg?.startingGold || 10,
      inventory: [...(bg?.startingItems || []).map(i => ({ id: i.id, qty: i.qty || 1 }))],
      equipment: { weapon: null, armor: null, helmet: null, accessory: null, offhand: null },
      statusEffects: [],
      worldX: 0, worldY: 0,
      locX: 0,   locY: 0,
      usedRelentless: false,
      defeatedBoss:   false,
    };

    // Equip starting items
    for (const invItem of this.player.inventory) {
      const item = getItem(invItem.id);
      if (item && item.slot && !this.player.equipment[item.slot]) {
        this.player.equipment[item.slot] = invItem.id;
      }
    }

    // Generate world
    this.world  = generateWorld(seed);
    this.quests = generateQuests(this.world, new RNG(seed + 1));

    // Start at start town
    const start = this.world.startTown;
    this.player.worldX = start.x;
    this.player.worldY = start.y;
    updateFog(this.world, start.x, start.y, 5);

    this.messages = [];
    this.addMessage(`Welcome to the realm, ${this.player.name}!`, 'system');
    this.addMessage(`Your quest: ${this.world.goal.shortName}.`, 'quest');

    // Start player inside the starting town
    this.enterLocation(start);
  }

  // ─── Location Entry ──────────────────────────────────────────────────────────

  enterLocation(loc) {
    if (!loc) return;
    const layoutSeed = this.world.seed || Date.now();

    let layout;
    if (loc.type === 'TOWN') {
      layout = getTownLayout(this.world, loc.id, layoutSeed);
    } else {
      layout = getDungeonLayout(this.world, loc.id, layoutSeed);
    }

    if (!layout) return;

    this.currentLocation = loc;
    this.currentLayout   = layout;

    // Place player at entry point
    if (layout.playerStart) {
      this.player.locX = layout.playerStart.x;
      this.player.locY = layout.playerStart.y;
    }

    // Mark visited
    if (!loc.visited) {
      loc.visited = true;
      const completed = onLocationVisited(this.quests, loc.id);
      for (const q of completed) {
        this.addMessage(`Quest completed: "${q.title}"!`, 'quest');
      }
    }

    this.addMessage(`You enter ${loc.name}.`, 'normal');
    this.changeState(STATE.LOCATION, { loc, layout });
  }

  exitLocation() {
    this.currentLocation = null;
    this.currentLayout   = null;
    this.changeState(STATE.WORLD_MAP);
    this.addMessage('You return to the world map.', 'normal');
  }

  // ─── Combat ──────────────────────────────────────────────────────────────────

  startCombat(monsters, returnState = null, biome = null) {
    const combatRng = new RNG(this.rng.int(1, 9999999));
    this.combat = initCombat(this.player, monsters, biome, combatRng);
    this.combat.returnState = returnState || this.currentState;
    this.combat.returnData  = {
      loc:    this.currentLocation,
      layout: this.currentLayout,
    };
    this.changeState(STATE.COMBAT, { combat: this.combat });
  }

  endCombat(won, fled = false) {
    if (!this.combat) return;

    if (won) {
      const { xpGained, leveled, loot } = applyRewards(this.player, this.combat);
      this.addMessage(`Victory! +${xpGained} XP, +${this.combat.totalGold} gold.`, 'loot');
      if (leveled) this.addMessage(`You reached level ${this.player.level}!`, 'system');

      for (const itemId of loot) {
        const item = getItem(itemId);
        if (item) this.addMessage(`Found: ${item.name}.`, 'loot');
      }

      // Quest tracking for kills
      for (const m of this.combat.monsters) {
        this.monstersKilled[m.id] = (this.monstersKilled[m.id] || 0) + 1;
        const completed = onMonsterKilled(this.quests, m.id);
        if (completed) {
          this.addMessage(`Quest completed: "${completed.title}"!`, 'quest');
        }
        // Boss defeat
        if (m.isBoss && this.world?.goal?.bossId === m.id) {
          this.player.defeatedBoss = true;
          const result = checkGoalProgress(this.world.goal, this.player, this.world);
          if (result?.event === 'victory') {
            this.changeState(STATE.VICTORY);
            return;
          }
        }
      }
    } else if (!fled) {
      this.changeState(STATE.GAME_OVER);
      return;
    }

    // Return to previous state
    const rs = this.combat.returnState;
    const rd = this.combat.returnData;
    this.combat = null;

    if (rs === STATE.LOCATION && rd?.loc) {
      this.currentLocation = rd.loc;
      this.currentLayout   = rd.layout;
      this.changeState(STATE.LOCATION, rd);
    } else {
      this.changeState(STATE.WORLD_MAP);
    }
  }

  // ─── Dialog ──────────────────────────────────────────────────────────────────

  startNPCDialog(npc) {
    this.dialogSession = startDialog(npc, this);
    const prevState    = this.currentState;
    this.changeState(STATE.DIALOG, { npc, session: this.dialogSession, prevState });
  }

  endDialog(action) {
    const session   = this.dialogSession;
    this.dialogSession = null;
    const prevState = action?.prevState || STATE.LOCATION;

    if (action?.type === 'inn') {
      this.changeState(STATE.INN, { npc: action.npc });
    } else if (action?.type === 'shop') {
      this.changeState(STATE.SHOP, { npc: action.npc });
    } else if (action?.type === 'quest_offer') {
      // Quest offering handled in dialog screen
      this.changeState(prevState);
    } else {
      this.changeState(prevState);
    }
  }

  // ─── Message Log ─────────────────────────────────────────────────────────────

  addMessage(text, cat = 'normal') {
    this.messages.push({ text, cat, turn: this.turn || 0 });
    if (this.messages.length > MAX_MESSAGES) {
      this.messages.shift();
    }
  }

  getRecentMessages(n = 5) {
    return this.messages.slice(-n);
  }

  // ─── Save / Load ─────────────────────────────────────────────────────────────

  saveGame() {
    try {
      const data = {
        player:   this.player,
        world:    {
          seed:       this.world.seed,
          tiles:      Array.from(this.world.tiles),
          fog:        Array.from(this.world.fog),
          locations:  this.world.locations,
          startTown:  this.world.startTown,
          goal:       this.world.goal,
          width:      this.world.width,
          height:     this.world.height,
        },
        quests:   this.quests,
        messages: this.messages.slice(-20),
        currentState:  this.currentState === STATE.WORLD_MAP ? STATE.WORLD_MAP : STATE.WORLD_MAP,
        monstersKilled: this.monstersKilled,
        questsCompleted: this.questsCompleted,
        savedAt:  Date.now(),
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Save failed:', e);
      return false;
    }
  }

  loadGame() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);

      this.player   = data.player;
      this.messages = data.messages || [];
      this.quests   = data.quests   || [];
      this.monstersKilled  = data.monstersKilled || {};
      this.questsCompleted = data.questsCompleted || 0;

      // Restore world with proper typed arrays
      this.world = {
        ...data.world,
        tiles: new Uint8Array(data.world.tiles),
        fog:   new Uint8Array(data.world.fog),
      };

      this.currentLocation = null;
      this.currentLayout   = null;

      // Force regen of location layouts (they're lazy anyway)
      // Also reset _placed flags so guild NPCs are re-placed correctly
      for (const loc of this.world.locations) {
        loc.layout = null;
        if (loc.questGivers) loc.questGivers.forEach(g => { g._placed = false; });
      }

      updateFog(this.world, this.player.worldX, this.player.worldY, 5);
      this.changeState(STATE.WORLD_MAP);
      this.addMessage('Game loaded.', 'system');
      return true;
    } catch (e) {
      console.error('Load failed:', e);
      return false;
    }
  }

  hasSave() {
    return !!localStorage.getItem(SAVE_KEY);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  renderMessageLog(renderer) {
    const msgs = this.getRecentMessages(MSG_ROWS);
    const catColors = {
      normal:  C.LIGHT_GRAY,
      combat:  C.RED,
      loot:    C.YELLOW,
      quest:   C.CYAN,
      system:  C.WHITE,
      dialog:  C.GREEN,
    };
    const logRow = VIEW_ROWS;

    renderer.hline(0, logRow, MAIN_COLS, '─', C.DARK_GRAY);

    for (let i = 0; i < MSG_ROWS - 1; i++) {
      const msg = msgs[i];
      if (!msg) break;
      const fg = catColors[msg.cat] || C.LIGHT_GRAY;
      const text = msg.text.length > MAIN_COLS - 1 ? msg.text.slice(0, MAIN_COLS - 4) + '...' : msg.text;
      renderer.write(0, logRow + 1 + i, text, fg, C.BLACK);
    }
  }

  renderSidePanel(renderer) {
    if (!this.player) return;
    const p   = this.player;
    const col = MAIN_COLS;
    const w   = 20;

    renderer.drawPanel(col, 0, w, VIEW_ROWS, 'STATUS', C.DARK_CYAN, C.BLACK);

    let row = 1;
    // Name
    const nameStr = p.name.length > 16 ? p.name.slice(0, 16) : p.name;
    renderer.writeCenter(row, nameStr, C.YELLOW, C.BLACK, col, col + w - 1);
    row++;

    // Race/Class
    const race = getRace(p.race);
    renderer.writeCenter(row, race ? race.name : '', C.LIGHT_GRAY, C.BLACK, col, col + w - 1);
    row++;

    // Level
    renderer.writeCenter(row, `Level ${p.level}`, C.WHITE, C.BLACK, col, col + w - 1);
    row++;

    renderer.hline(col + 1, row, w - 2, '─', C.DARK_GRAY);
    row++;

    // HP bar
    renderer.write(col + 1, row, 'HP', C.RED, C.BLACK);
    renderer.write(col + 4, row, `${p.hp}/${p.maxHp}`.padEnd(10), C.WHITE, C.BLACK);
    row++;
    renderer.progressBar(col + 1, row, w - 2, p.hp, p.maxHp, C.RED, C.DARK_RED, C.BLACK);
    row++;

    // MP bar
    renderer.write(col + 1, row, 'MP', C.BLUE, C.BLACK);
    renderer.write(col + 4, row, `${p.mp || 0}/${p.maxMp}`.padEnd(10), C.WHITE, C.BLACK);
    row++;
    renderer.progressBar(col + 1, row, w - 2, p.mp || 0, p.maxMp, C.BLUE, C.DARK_BLUE, C.BLACK);
    row++;

    renderer.hline(col + 1, row, w - 2, '─', C.DARK_GRAY);
    row++;

    // XP
    const xpNext = xpToLevel(p.level + 1);
    renderer.write(col + 1, row, `XP ${p.xp}/${xpNext}`, C.DARK_CYAN, C.BLACK);
    row++;

    // Gold
    renderer.write(col + 1, row, `Gold: ${p.gold}`, C.YELLOW, C.BLACK);
    row++;

    renderer.hline(col + 1, row, w - 2, '─', C.DARK_GRAY);
    row++;

    // Stats
    const stats = [
      ['STR', p.stats.str], ['DEX', p.stats.dex], ['CON', p.stats.con],
      ['INT', p.stats.int], ['WIS', p.stats.wis], ['CHA', p.stats.cha],
    ];
    for (const [name, val] of stats) {
      if (row >= VIEW_ROWS - 1) break;
      const mod = Math.floor((val - 10) / 2);
      const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
      renderer.write(col + 1, row, `${name}:${String(val).padStart(3)} (${modStr})`, C.LIGHT_GRAY, C.BLACK);
      row++;
    }

    renderer.hline(col + 1, row, w - 2, '─', C.DARK_GRAY);
    row++;

    // Status effects
    if (p.statusEffects && p.statusEffects.length > 0) {
      for (const se of p.statusEffects) {
        if (row >= VIEW_ROWS - 1) break;
        renderer.write(col + 1, row, se.type.toUpperCase(), C.MAGENTA, C.BLACK);
        row++;
      }
    }

    // Equipped weapon
    if (p.equipment.weapon) {
      const item = getItem(p.equipment.weapon);
      if (item && row < VIEW_ROWS - 1) {
        const wName = item.name.length > w - 2 ? item.name.slice(0, w - 5) + '...' : item.name;
        renderer.write(col + 1, row, `⚔ ${wName}`, C.WHITE, C.BLACK);
        row++;
      }
    }

    // Keys hint
    renderer.write(col + 1, VIEW_ROWS - 2, '[I]nv [Q]uests', C.DARK_GRAY, C.BLACK);
  }

  // Random encounter check
  checkEncounter(biome, dangerLevel) {
    if (!biome || biome.encounterRate === 0) return false;
    let rate = biome.encounterRate;
    if (this.player.skills.includes('stealth')) rate *= 0.7;
    if (this.player.skills.includes('tracking')) rate *= 0.7;
    if (this.player.background === 'ranger') rate *= 0.7;
    return this.rng.chance(rate);
  }

  triggerWorldMapEncounter(biome) {
    const monsters = spawnEncounter(biome, biome.dangerLevel || 1, this.rng);
    if (!monsters || monsters.length === 0) return;
    this.addMessage(`A ${monsters[0].name} attacks!`, 'combat');
    this.startCombat(monsters, STATE.WORLD_MAP, biome);
  }

  triggerDungeonEncounter(dangerLevel) {
    // Pick a monster appropriate for the dungeon
    const tierMonsters = ['giant_rat','slime','goblin','wolf','bandit','giant_spider'];
    const monsterId    = this.rng.pick(tierMonsters);
    const count        = this.rng.chance(30) ? 2 : 1;
    const monsters     = [];
    for (let i = 0; i < count; i++) {
      const m = spawnMonster(monsterId, this.rng);
      if (m) monsters.push(m);
    }
    this.addMessage(`A ${monsters[0].name} emerges from the shadows!`, 'combat');
    this.startCombat(monsters, STATE.LOCATION);
  }
}
