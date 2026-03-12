// @ts-nocheck
import { C, COLS, ROWS, MAIN_COLS, VIEW_ROWS, STATE } from '../../data/constants';
import { getBiome } from '../../data/biomes';
import { getLocationAt, LOC_DISPLAY } from '../../world/worldgen';

// Scale factor: each screen cell represents SCALE x SCALE world tiles
const SCALE = 2;

// Map display area
const MAP_W = MAIN_COLS; // 60 columns
const MAP_H = VIEW_ROWS; // 25 rows

// Info panel (right side)
const PANEL_COL = MAIN_COLS; // col 60
const PANEL_W   = COLS - MAIN_COLS; // 20 cols

export class MapScreen {
  constructor(game) {
    this.game = game;
    this.camX = 0;
    this.camY = 0;
  }

  enter(data) {
    const p = this.game.player;
    if (p) this._centerOnPlayer();
  }

  exit() {}

  update(dt) {}

  _centerOnPlayer() {
    const p = this.game.player;
    const w = this.game.world;
    if (!p || !w) return;
    this.camX = p.worldX - Math.floor(MAP_W / 2) * SCALE;
    this.camY = p.worldY - Math.floor(MAP_H / 2) * SCALE;
    this._clampCamera();
  }

  _clampCamera() {
    const w = this.game.world;
    if (!w) return;
    const maxCamX = Math.max(0, w.width  - MAP_W * SCALE);
    const maxCamY = Math.max(0, w.height - MAP_H * SCALE);
    this.camX = Math.max(0, Math.min(this.camX, maxCamX));
    this.camY = Math.max(0, Math.min(this.camY, maxCamY));
  }

  handleKey(e) {
    if (e.key === 'm' || e.key === 'M' || e.key === 'Escape') {
      e.preventDefault();
      this.game.changeState(STATE.WORLD_MAP);
      return;
    }

    const scrollMap = {
      'ArrowUp':   [0, -SCALE], 'ArrowDown':  [0,  SCALE],
      'ArrowLeft': [-SCALE, 0], 'ArrowRight': [ SCALE, 0],
      'w': [0, -SCALE], 's': [0,  SCALE],
      'a': [-SCALE, 0], 'd': [ SCALE, 0],
    };
    if (e.key in scrollMap) {
      e.preventDefault();
      const [dx, dy] = scrollMap[e.key];
      this.camX += dx;
      this.camY += dy;
      this._clampCamera();
    }
  }

  handleClick(col, row, button) {}

  handleScroll(dir) {
    this.camY += dir * SCALE;
    this._clampCamera();
  }

  render(renderer) {
    const p = this.game.player;
    const w = this.game.world;
    if (!p || !w) {
      renderer.write(0, 0, 'No world loaded.', C.WHITE, C.BLACK);
      return;
    }

    renderer.fill(0, 0, MAP_W, MAP_H, ' ', C.BLACK, C.BLACK);
    this._renderMap(renderer, p, w);
    this._renderInfoPanel(renderer, p, w);
    this.game.renderMessageLog(renderer);
  }

  _renderMap(renderer, p, w) {
    for (let screenRow = 0; screenRow < MAP_H; screenRow++) {
      for (let screenCol = 0; screenCol < MAP_W; screenCol++) {
        const wx = this.camX + screenCol * SCALE;
        const wy = this.camY + screenRow * SCALE;

        if (wx < 0 || wx >= w.width || wy < 0 || wy >= w.height) {
          renderer.set(screenCol, screenRow, '·', C.DARK_GRAY, C.BLACK);
          continue;
        }

        const fogVal = w.fog[wy * w.width + wx];
        if (fogVal === 0) {
          renderer.set(screenCol, screenRow, ' ', C.BLACK, C.BLACK);
          continue;
        }

        const tile  = w.tiles[wy * w.width + wx];
        const biome = getBiome(tile);
        const loc   = getLocationAt(w, wx, wy);

        let char = biome.symbol;
        let fg   = fogVal === 1 ? darken(biome.fg) : biome.fg;

        if (loc) {
          const ld = LOC_DISPLAY[loc.type];
          if (ld) {
            char = ld.symbol;
            fg   = fogVal === 1 ? darken(ld.fg) : ld.fg;
          }
        }

        renderer.set(screenCol, screenRow, char, fg, C.BLACK);
      }
    }

    // Second pass: draw location names below icons
    this._renderLocationNames(renderer, w);

    // Draw player '@'
    const pScreenCol = Math.floor((p.worldX - this.camX) / SCALE);
    const pScreenRow = Math.floor((p.worldY - this.camY) / SCALE);
    if (pScreenCol >= 0 && pScreenCol < MAP_W && pScreenRow >= 0 && pScreenRow < MAP_H) {
      renderer.set(pScreenCol, pScreenRow, '@', C.WHITE, C.BLACK);
    }
  }

  _renderLocationNames(renderer, w) {
    for (const loc of w.locations) {
      const screenCol = Math.floor((loc.x - this.camX) / SCALE);
      const screenRow = Math.floor((loc.y - this.camY) / SCALE);

      if (screenCol < 0 || screenCol >= MAP_W || screenRow < 0 || screenRow >= MAP_H) continue;

      const fogVal = w.fog[loc.y * w.width + loc.x];
      if (fogVal === 0) continue;

      const nameRow = screenRow + 1 < MAP_H ? screenRow + 1 : screenRow - 1;
      if (nameRow < 0 || nameRow >= MAP_H) continue;

      const name = loc.name;
      const nameStart = Math.max(0, Math.min(screenCol - Math.floor(name.length / 2), MAP_W - name.length));
      const nameFg = fogVal === 1 ? C.DARK_GRAY : C.DARK_CYAN;
      const visibleLen = Math.min(name.length, MAP_W - nameStart);
      if (visibleLen > 0) {
        renderer.write(nameStart, nameRow, name.slice(0, visibleLen), nameFg, C.BLACK);
      }
    }
  }

  _renderInfoPanel(renderer, p, w) {
    renderer.drawPanel(PANEL_COL, 0, PANEL_W, VIEW_ROWS, 'MAP', C.DARK_CYAN, C.BLACK);

    let row = 1;

    renderer.write(PANEL_COL + 1, row++, 'LEGEND', C.YELLOW, C.BLACK);
    renderer.hline(PANEL_COL + 1, row++, PANEL_W - 2, '─', C.DARK_GRAY);

    for (const [, ld] of Object.entries(LOC_DISPLAY)) {
      if (row >= VIEW_ROWS - 6) break;
      renderer.set(PANEL_COL + 1, row, ld.symbol, ld.fg, C.BLACK);
      renderer.write(PANEL_COL + 3, row, (ld.name || '').slice(0, PANEL_W - 4), C.LIGHT_GRAY, C.BLACK);
      row++;
    }

    renderer.hline(PANEL_COL + 1, row++, PANEL_W - 2, '─', C.DARK_GRAY);
    renderer.write(PANEL_COL + 1, row++, 'POSITION', C.YELLOW, C.BLACK);
    renderer.write(PANEL_COL + 1, row++, `(${p.worldX},${p.worldY})`, C.WHITE, C.BLACK);

    const curLoc = getLocationAt(w, p.worldX, p.worldY);
    if (curLoc) {
      const name = curLoc.name.length > PANEL_W - 2
        ? curLoc.name.slice(0, PANEL_W - 5) + '...'
        : curLoc.name;
      renderer.write(PANEL_COL + 1, row++, name, C.YELLOW, C.BLACK);
    } else {
      const tile  = w.tiles[p.worldY * w.width + p.worldX];
      const biome = getBiome(tile);
      renderer.write(PANEL_COL + 1, row++, biome.name.slice(0, PANEL_W - 2), C.DARK_GRAY, C.BLACK);
    }

    renderer.hline(PANEL_COL + 1, VIEW_ROWS - 4, PANEL_W - 2, '─', C.DARK_GRAY);
    renderer.write(PANEL_COL + 1, VIEW_ROWS - 3, 'Arrows:Scroll', C.DARK_GRAY, C.BLACK);
    renderer.write(PANEL_COL + 1, VIEW_ROWS - 2, 'M/Esc:Close', C.DARK_GRAY, C.BLACK);
  }
}

function darken(colorIdx) {
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
