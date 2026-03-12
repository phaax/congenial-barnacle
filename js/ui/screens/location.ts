// @ts-nocheck
import { C, COLS, ROWS, MAIN_COLS, VIEW_ROWS, STATE, LOC_TYPE, LOC_TILE } from '../../data/constants';
import { TOWN_TILES } from '../../world/towngen';
import { DUNGEON_TILES, isEncounterZone, getEncounterRate } from '../../world/dungeogen';
import { Menu } from '../menu';
import { getItem } from '../../data/items';
import { spawnMonster } from '../../systems/combat';

const VIEW_W = MAIN_COLS;   // 60
const VIEW_H = VIEW_ROWS;   // 25

export class LocationScreen {
  constructor(game) {
    this.game = game;
    this._stepsSinceEncounter = 0;
    this._pauseMenu = null;
    this._paused = false;
  }

  enter(data) {
    this._paused = false;
    this._pauseMenu = null;
    this._stepsSinceEncounter = 0;
    if (data?.loc) {
      this.game.currentLocation = data.loc;
      this.game.currentLayout   = data.layout || this.game.currentLayout;
    }
  }

  exit() {
    this._paused = false;
  }

  update(dt) {}

  handleKey(e) {
    if (this._paused && this._pauseMenu) {
      this._pauseMenu.handleKey(e);
      return;
    }

    const moves = {
      'ArrowUp': [0,-1], 'ArrowDown': [0,1], 'ArrowLeft': [-1,0], 'ArrowRight': [1,0],
      'w': [0,-1], 's': [0,1], 'a': [-1,0], 'd': [1,0],
    };

    if (e.key in moves) {
      e.preventDefault();
      const [dx, dy] = moves[e.key];
      this._tryMove(dx, dy);
      return;
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this._interact();
      return;
    }

    if (e.key === 'i' || e.key === 'I') {
      this.game.changeState(STATE.INVENTORY, { prevState: STATE.LOCATION });
      return;
    }
    if (e.key === 'q' || e.key === 'Q') {
      this.game.changeState(STATE.QUEST_LOG, { prevState: STATE.LOCATION });
      return;
    }
    if (e.key === 'Escape') {
      this._openPauseMenu();
      return;
    }
  }

  handleClick(col, row, button) {
    if (this._paused) {
      if (this._pauseMenu) this._pauseMenu.handleClick(col, row, 22, 8);
      return;
    }
    if (col >= MAIN_COLS) return;

    const layout = this.game.currentLayout;
    const p = this.game.player;
    if (!layout || !p) return;

    const vx = Math.floor(VIEW_W / 2);
    const vy = Math.floor(VIEW_H / 2);
    const tx = p.locX + (col - vx);
    const ty = p.locY + (row - vy);

    // Single step toward clicked tile
    const dx = Math.sign(tx - p.locX);
    const dy = Math.sign(ty - p.locY);
    if (dx !== 0 || dy !== 0) this._tryMove(dx, dy);
    else this._interact();
  }

  handleScroll(dir) {}

  _openPauseMenu() {
    this._paused = true;
    this._pauseMenu = new Menu([
      { label: 'Continue',       key: 'c' },
      { label: 'Return to World Map', key: 'r' },
      { label: 'Save Game',      key: 's' },
    ]);
    this._pauseMenu.onSelect = (idx, opt) => {
      if (opt.key === 'c') { this._paused = false; this._pauseMenu = null; }
      if (opt.key === 'r') { this.game.exitLocation(); }
      if (opt.key === 's') { this.game.saveGame(); this.game.addMessage('Game saved.', 'system'); this._paused = false; this._pauseMenu = null; }
    };
  }

  _tryMove(dx, dy) {
    const layout = this.game.currentLayout;
    const p = this.game.player;
    if (!layout || !p) return;

    const nx = p.locX + dx;
    const ny = p.locY + dy;
    const w  = layout.width;
    const h  = layout.height;

    if (nx < 0 || nx >= w || ny < 0 || ny >= h) return;

    const tile = layout.tiles[ny * w + nx];

    // Can't walk through walls
    if (tile === LOC_TILE.WALL) return;
    if (tile === LOC_TILE.TREE) return;
    if (tile === LOC_TILE.VOID) return;

    // Door: open it
    if (tile === LOC_TILE.DOOR) {
      layout.tiles[ny * w + nx] = LOC_TILE.DOOR_OPEN;
      this.game.addMessage('You open the door.', 'normal');
      return;
    }

    // Stairs up: exit location
    if (tile === LOC_TILE.STAIRS_UP) {
      this.game.exitLocation();
      return;
    }

    // Stairs down: hidden exit to the surface
    if (tile === LOC_TILE.STAIRS_DOWN) {
      this.game.addMessage('You find a hidden exit to the surface.', 'normal');
      this.game.exitLocation();
      return;
    }

    // Check for NPC at destination
    const npc = layout.npcs.find(n => n.x === nx && n.y === ny);
    if (npc) {
      this._talkToNPC(npc);
      return;
    }

    // Check for chest
    if (tile === LOC_TILE.CHEST) {
      this._openChest(nx, ny);
      return;
    }

    // Move player
    p.locX = nx;
    p.locY = ny;
    this._stepsSinceEncounter++;

    // Random encounter check in dungeons
    const loc = this.game.currentLocation;
    if (loc && loc.type !== LOC_TYPE.TOWN && loc.type !== 'SHRINE') {
      if (isEncounterZone(layout, nx, ny)) {
        const rate = getEncounterRate(layout, nx, ny);
        if (this._stepsSinceEncounter >= 3 && this.game.rng.chance(rate * 0.3)) {
          this._stepsSinceEncounter = 0;
          this.game.triggerDungeonEncounter(loc.dangerLevel || 1);
          return;
        }
      }
    }

    // Check for boss NPC
    const bossNpc = layout.npcs.find(n => n.x === nx && n.y === ny && n.isBoss);
    if (bossNpc && !bossNpc.defeated) {
      this._startBossFight(bossNpc);
      return;
    }
  }

  _interact() {
    const layout = this.game.currentLayout;
    const p = this.game.player;
    if (!layout || !p) return;

    // Check adjacent tiles for interactable objects
    const adj = [[0,-1],[0,1],[-1,0],[1,0]];
    for (const [dx, dy] of adj) {
      const nx = p.locX + dx;
      const ny = p.locY + dy;
      if (nx < 0 || nx >= layout.width || ny < 0 || ny >= layout.height) continue;

      const tile = layout.tiles[ny * layout.width + nx];
      const npc  = layout.npcs.find(n => n.x === nx && n.y === ny);

      if (npc) { this._talkToNPC(npc); return; }
      if (tile === LOC_TILE.CHEST)     { this._openChest(nx, ny); return; }
      if (tile === LOC_TILE.DOOR)      {
        layout.tiles[ny * layout.width + nx] = LOC_TILE.DOOR_OPEN;
        this.game.addMessage('You open the door.', 'normal');
        return;
      }
      if (tile === LOC_TILE.STAIRS_UP) { this.game.exitLocation(); return; }
      if (tile === LOC_TILE.STAIRS_DOWN) { this.game.addMessage('You find a hidden exit to the surface.', 'normal'); this.game.exitLocation(); return; }
      if (tile === LOC_TILE.ALTAR)     { this.game.addMessage('The altar hums with power.', 'normal'); return; }
    }

    this.game.addMessage('There is nothing nearby to interact with.', 'normal');
  }

  _talkToNPC(npc) {
    if (npc.isBoss && !npc.defeated) {
      this._startBossFight(npc);
      return;
    }
    if (npc.isInnkeeper) {
      this.game.changeState(STATE.INN, { npc });
      return;
    }
    if (npc.isShopkeeper) {
      this.game.changeState(STATE.SHOP, { npc });
      return;
    }
    this.game.startNPCDialog(npc);
  }

  _startBossFight(bossNpc) {
    const m = spawnMonster(bossNpc.monsterId || 'lich', this.game.rng);
    if (!m) return;
    m.isBoss = true;
    this.game.addMessage(`${m.name} rises to face you!`, 'combat');
    this.game.startCombat([m], STATE.LOCATION);
    bossNpc.defeated = true;
  }

  _openChest(x, y) {
    const layout = this.game.currentLayout;
    const chest  = layout.chests?.find(c => c.x === x && c.y === y && !c.opened);
    if (!chest) { this.game.addMessage('The chest is empty.', 'normal'); return; }

    chest.opened = true;
    layout.tiles[y * layout.width + x] = LOC_TILE.CHEST_OPEN;

    // Generate loot based on tier
    const lootTable = [
      { id: 'healing_potion', chance: 50 },
      { id: 'mana_potion',    chance: 30 },
      { id: 'gold',           chance: 70 },
      { id: 'healing_herb',   chance: 40 },
    ];

    let found = false;
    const rng = this.game.rng;
    if (rng.chance(70)) {
      const gold = rng.int(5, 20) * chest.tier;
      this.game.player.gold += gold;
      this.game.addMessage(`You find ${gold} gold in the chest!`, 'loot');
      found = true;
    }
    for (const loot of lootTable) {
      if (loot.id === 'gold') continue;
      if (rng.chance(loot.chance / (chest.tier + 1))) {
        const item = getItem(loot.id);
        if (item && this.game.player.inventory.length < 20) {
          this.game.player.inventory.push({ id: loot.id, qty: 1 });
          this.game.addMessage(`You find a ${item.name}!`, 'loot');
          found = true;
        }
      }
    }
    if (!found) this.game.addMessage('The chest is empty.', 'normal');
  }

  render(renderer) {
    const layout = this.game.currentLayout;
    const p = this.game.player;
    const loc = this.game.currentLocation;

    if (!layout || !p) {
      renderer.write(0, 0, 'Loading location...', C.WHITE, C.BLACK);
      return;
    }

    const tileSet = (loc?.type === LOC_TYPE.TOWN) ? TOWN_TILES : DUNGEON_TILES;
    const vx = Math.floor(VIEW_W / 2);
    const vy = Math.floor(VIEW_H / 2);

    // Draw tiles
    for (let row = 0; row < VIEW_H; row++) {
      for (let col = 0; col < VIEW_W; col++) {
        const lx = p.locX + (col - vx);
        const ly = p.locY + (row - vy);

        if (lx < 0 || lx >= layout.width || ly < 0 || ly >= layout.height) {
          renderer.set(col, row, ' ', C.BLACK, C.BLACK);
          continue;
        }

        const tile = layout.tiles[ly * layout.width + lx];
        const td   = tileSet[tile] || { char: '?', fg: C.RED, bg: C.BLACK };
        renderer.set(col, row, td.char, td.fg, td.bg ?? C.BLACK);
      }
    }

    // Draw NPCs
    for (const npc of (layout.npcs || [])) {
      const sc = npc.x - p.locX + vx;
      const sr = npc.y - p.locY + vy;
      if (sc < 0 || sc >= VIEW_W || sr < 0 || sr >= VIEW_H) continue;
      if (npc.defeated) continue;

      let sym = npc.isBoss ? npc.symbol || 'B' : '☺';
      let fg  = npc.isBoss ? C.RED : (npc.isStory ? C.CYAN : C.YELLOW);
      renderer.set(sc, sr, sym, fg, C.BLACK);
    }

    // Draw player
    renderer.set(vx, vy, '@', C.WHITE, C.BLACK);

    // Location name at top — clear full row first so no map tiles bleed through
    renderer.fill(0, 0, VIEW_W, 1, ' ', C.BLACK, C.BLACK);
    renderer.write(0, 0, `[ ${loc?.name || 'Unknown'} ]`, C.YELLOW, C.BLACK);

    // Controls — clear full row first so no map tiles bleed through
    renderer.fill(0, VIEW_H - 1, VIEW_W, 1, ' ', C.BLACK, C.BLACK);
    renderer.write(0, VIEW_H - 1, 'Arrows:Move  Space:Interact  I:Inv  Q:Quests  Esc:Menu', C.DARK_GRAY, C.BLACK);

    // Pause menu overlay
    if (this._paused && this._pauseMenu) {
      renderer.drawPanel(20, 7, 24, 8, 'PAUSED', C.WHITE, C.BLACK, 'double');
      this._pauseMenu.render(renderer, 22, 9, { width: 20 });
    }

    // Side panel and messages
    this.game.renderSidePanel(renderer);
    this.game.renderMessageLog(renderer);
  }
}
