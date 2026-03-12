// @ts-nocheck
import { C, COLS, ROWS, MAIN_COLS, SIDE_COLS, MSG_ROWS, VIEW_ROWS, STATE, LOC_TYPE, WORLD_TILE } from '../../data/constants';
import { getBiome, BIOMES } from '../../data/biomes';
import { updateFog, getBiomeAt, getLocationAt, LOC_DISPLAY } from '../../world/worldgen';

const VIEW_W = MAIN_COLS; // 60 cols for map view
const VIEW_H = VIEW_ROWS; // 25 rows

export class WorldMapScreen {
  constructor(game) {
    this.game = game;
    this._dirty = true;
    this._hoverLoc = null;
  }

  enter(data) {
    this._dirty = true;
    if (this.game.world) {
      updateFog(this.game.world, this.game.player.worldX, this.game.player.worldY, 5);
    }
    this.game.addMessage('Use arrow keys to move. Press Enter to enter a location.', 'system');
  }

  exit() {}

  update(dt) {}

  handleKey(e) {
    const p = this.game.player;
    const w = this.game.world;
    if (!p || !w) return;

    const moves = {
      'ArrowUp': [0,-1], 'ArrowDown': [0,1], 'ArrowLeft': [-1,0], 'ArrowRight': [1,0],
      'w': [0,-1], 's': [0,1], 'a': [-1,0], 'd': [1,0],
      'k': [0,-1], 'j': [0,1], 'h': [-1,0], 'l': [1,0],
    };

    if (e.key in moves) {
      e.preventDefault();
      const [dx, dy] = moves[e.key];
      this._tryMove(dx, dy);
      return;
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this._enterCurrentLocation();
      return;
    }

    if (e.key === 'i' || e.key === 'I') {
      this.game.changeState(STATE.INVENTORY, { prevState: STATE.WORLD_MAP });
      return;
    }
    if (e.key === 'q' || e.key === 'Q') {
      this.game.changeState(STATE.QUEST_LOG, { prevState: STATE.WORLD_MAP });
      return;
    }
    if (e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      this.game.changeState(STATE.MAP_SCREEN, { prevState: STATE.WORLD_MAP });
      return;
    }
    if (e.key === 'Escape') {
      this._confirmQuit();
      return;
    }
  }

  handleClick(col, row, button) {
    const p = this.game.player;
    const w = this.game.world;
    if (!p || !w) return;

    if (col >= MAIN_COLS) return; // side panel

    // Calculate world position clicked
    const vx = Math.floor(VIEW_W / 2);
    const vy = Math.floor(VIEW_H / 2);
    const wx = p.worldX + (col - vx);
    const wy = p.worldY + (row - vy);

    // Click to move toward that tile
    if (wx !== p.worldX || wy !== p.worldY) {
      const dx = Math.sign(wx - p.worldX);
      const dy = Math.sign(wy - p.worldY);
      this._tryMove(dx, dy);
    } else {
      this._enterCurrentLocation();
    }
  }

  handleScroll(dir) {}

  _tryMove(dx, dy) {
    const p = this.game.player;
    const w = this.game.world;
    const nx = p.worldX + dx;
    const ny = p.worldY + dy;

    if (nx < 0 || nx >= w.width || ny < 0 || ny >= w.height) return;

    const tile = w.tiles[ny * w.width + nx];
    const biome = getBiome(tile);
    if (!biome.passable) {
      this.game.addMessage("You can't travel over water.", 'normal');
      return;
    }

    p.worldX = nx;
    p.worldY = ny;
    updateFog(w, nx, ny, 5);

    // Check for encounter
    const loc = getLocationAt(w, nx, ny);
    if (!loc && this.game.checkEncounter(biome, biome.dangerLevel)) {
      this.game.triggerWorldMapEncounter(biome);
      return;
    }

    // Announce location nearby
    if (loc) {
      this.game.addMessage(`You arrive at ${loc.name}.`, 'normal');
    }

    this._dirty = true;
  }

  _enterCurrentLocation() {
    const p = this.game.player;
    const w = this.game.world;
    const loc = getLocationAt(w, p.worldX, p.worldY);
    if (loc) {
      this.game.enterLocation(loc);
    } else {
      this.game.addMessage('There is nothing here to enter.', 'normal');
    }
  }

  _confirmQuit() {
    if (this.game.hasSave()) {
      this.game.saveGame();
      this.game.addMessage('Game saved.', 'system');
    }
  }

  render(renderer) {
    const p = this.game.player;
    const w = this.game.world;
    if (!p || !w) {
      renderer.write(0, 0, 'Loading world...', C.WHITE, C.BLACK);
      return;
    }

    // Clear map area
    renderer.fill(0, 0, MAIN_COLS, VIEW_H, ' ', C.BLACK, C.BLACK);

    const vx = Math.floor(VIEW_W / 2);
    const vy = Math.floor(VIEW_H / 2);

    // Draw terrain
    for (let row = 0; row < VIEW_H; row++) {
      for (let col = 0; col < VIEW_W; col++) {
        const wx = p.worldX + (col - vx);
        const wy = p.worldY + (row - vy);

        if (wx < 0 || wx >= w.width || wy < 0 || wy >= w.height) {
          renderer.set(col, row, '·', C.DARK_GRAY, C.BLACK);
          continue;
        }

        const fogVal = w.fog[wy * w.width + wx];
        if (fogVal === 0) {
          renderer.set(col, row, ' ', C.BLACK, C.BLACK);
          continue;
        }

        const tile = w.tiles[wy * w.width + wx];
        const biome = getBiome(tile);
        const loc = getLocationAt(w, wx, wy);

        let char = biome.symbol;
        let fg   = fogVal === 1 ? darken(biome.fg) : biome.fg;

        if (loc) {
          const ld = LOC_DISPLAY[loc.type];
          if (ld) { char = ld.symbol; fg = fogVal === 1 ? darken(ld.fg) : ld.fg; }
        }

        renderer.set(col, row, char, fg, C.BLACK);
      }
    }

    // Draw player at center
    renderer.set(vx, vy, '@', C.WHITE, C.BLACK);

    // Draw hover location name
    const mouseCol = this.game.input.mouseCol;
    const mouseRow = this.game.input.mouseRow;
    if (mouseCol < MAIN_COLS && mouseRow < VIEW_H) {
      const hwx = p.worldX + (mouseCol - vx);
      const hwy = p.worldY + (mouseRow - vy);
      if (hwx >= 0 && hwx < w.width && hwy >= 0 && hwy < w.height) {
        const hoverLoc = getLocationAt(w, hwx, hwy);
        const maxW = MAIN_COLS - 2;
        if (hoverLoc && w.fog[hwy * w.width + hwx] > 0) {
          const info = `${hoverLoc.name} (${hoverLoc.type.toLowerCase()})`;
          renderer.write(1, VIEW_H - 1, info.slice(0, maxW).padEnd(maxW), C.CYAN, C.BLACK);
        } else {
          const hovBiome = getBiome(w.tiles[hwy * w.width + hwx] || 0);
          if (w.fog[hwy * w.width + hwx] > 0) {
            renderer.write(1, VIEW_H - 1, hovBiome.name.slice(0, maxW).padEnd(maxW), C.DARK_GRAY, C.BLACK);
          }
        }
      }
    }

    // Current location info
    const curLoc = getLocationAt(w, p.worldX, p.worldY);
    if (curLoc) {
      renderer.write(1, 0, `[ ${curLoc.name} ]`, C.YELLOW, C.BLACK);
    } else {
      const curBiome = getBiome(w.tiles[p.worldY * w.width + p.worldX] || 0);
      renderer.write(1, 0, `[ ${curBiome.name} ]`, C.DARK_GRAY, C.BLACK);
    }

    // Coordinates
    renderer.writeRight(0, `(${p.worldX},${p.worldY})`, C.DARK_GRAY, C.BLACK, MAIN_COLS - 1);

    // Controls hint
    renderer.write(0, VIEW_H - 2, 'Arrows:Move  Enter:Enter  I:Inv  Q:Quests  M:Map', C.DARK_GRAY, C.BLACK);

    // Goal progress in top area
    this._renderGoalHint(renderer);

    // Side panel and message log
    this.game.renderSidePanel(renderer);
    this.game.renderMessageLog(renderer);
  }

  _renderGoalHint(renderer) {
    const goal = this.game.world?.goal;
    if (!goal) return;
    // Show current step at top right of map
    const step = goal.steps[goal.currentStep];
    if (step && !step.done) {
      const hint = `► ${step.text}`;
      const clipped = hint.length > MAIN_COLS - 4 ? hint.slice(0, MAIN_COLS - 7) + '...' : hint;
      renderer.write(1, 1, clipped, C.CYAN, C.BLACK);
    }
  }
}

function darken(colorIdx) {
  // Map bright colors to their dark counterparts for fog
  const map = {
    [C.WHITE]:      C.DARK_GRAY,
    [C.YELLOW]:     C.BROWN,
    [C.GREEN]:      C.DARK_GREEN,
    [C.CYAN]:       C.DARK_CYAN,
    [C.RED]:        C.DARK_RED,
    [C.BLUE]:       C.DARK_BLUE,
    [C.MAGENTA]:    C.DARK_MAGENTA,
    [C.LIGHT_GRAY]: C.DARK_GRAY,
  };
  return map[colorIdx] ?? C.DARK_GRAY;
}
