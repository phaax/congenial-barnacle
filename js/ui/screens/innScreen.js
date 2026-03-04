import { C, COLS, ROWS, STATE } from '../../data/constants.js';
import { Menu } from '../menu.js';

const REST_COST_PER_HP = 1;
const REST_MIN_COST    = 5;

export class InnScreen {
  constructor(game) {
    this.game = game;
    this.npc  = null;
    this.menu = null;
    this.message = '';
    this.messageColor = C.WHITE;
  }

  enter(data) {
    this.npc     = data?.npc || null;
    this.message = '';
    this._buildMenu();
  }

  exit() {}

  _buildMenu() {
    const player = this.game.player;
    const hpMissing = player ? player.maxHp - player.hp : 0;
    const cost = Math.max(REST_MIN_COST, hpMissing * REST_COST_PER_HP);

    this.menu = new Menu([
      { label: `Rest & Heal  (${cost}g)`, key: 'r' },
      { label: 'Leave',                   key: 'l' },
    ]);
    this.menu.onSelect = (idx, opt) => {
      if (opt.key === 'r') this._rest(cost);
      if (opt.key === 'l') this._leave();
    };
  }

  _rest(cost) {
    const player = this.game.player;
    if (!player) return;

    if (player.gold < cost) {
      this.message = `You need ${cost}g to rest. You only have ${player.gold}g.`;
      this.messageColor = C.RED;
      return;
    }

    player.gold -= cost;
    player.hp    = player.maxHp;
    player.mp    = player.maxMp;

    // Clear status effects
    player.statusEffects = [];

    this.message = `You sleep through the night and wake fully restored!`;
    this.messageColor = C.GREEN;
    this.game.addMessage('You rest at the inn. HP and MP fully restored.', 'normal');
    this._buildMenu();
  }

  _leave() {
    this.game.changeState(STATE.LOCATION, {
      loc:    this.game.currentLocation,
      layout: this.game.currentLayout,
    });
  }

  update(dt) {}

  handleKey(e) {
    if (e.key === 'Escape') { this._leave(); return; }
    if (this.menu) this.menu.handleKey(e);
  }

  handleClick(col, row, button) {
    const W = 44, H = 20;
    const ox = Math.floor((COLS - W) / 2);
    const oy = Math.floor((ROWS - H) / 2);
    if (this.menu) this.menu.handleClick(col, row, ox + 2, oy + 13);
  }

  handleMove(col, row) {
    const W = 44, H = 20;
    const ox = Math.floor((COLS - W) / 2);
    const oy = Math.floor((ROWS - H) / 2);
    if (this.menu) this.menu.handleHover(col, row, ox + 2, oy + 13);
  }

  handleScroll(dir) {}

  render(renderer) {
    renderer.clear(C.BLACK);

    const W = 44, H = 20;
    const ox = Math.floor((COLS - W) / 2);
    const oy = Math.floor((ROWS - H) / 2);

    renderer.drawPanel(ox, oy, W, H, 'INN', C.BROWN, C.BLACK, 'double');

    const innName = this.npc?.innName || 'The Wanderer\'s Rest';
    renderer.writeCenter(oy + 2, innName, C.YELLOW, C.BLACK, ox, ox + W - 1);

    renderer.hline(ox + 1, oy + 3, W - 2, '─', C.DARK_GRAY);

    const greeting = this.npc?.dialog || 'Welcome, traveler! Need a room for the night?';
    renderer.writeCenter(oy + 5, greeting, C.LIGHT_GRAY, C.BLACK, ox + 1, ox + W - 2);

    const player = this.game.player;
    if (player) {
      renderer.write(ox + 2, oy + 7,  `HP: ${player.hp}/${player.maxHp}`, C.RED,    C.BLACK);
      renderer.write(ox + 2, oy + 8,  `MP: ${player.mp}/${player.maxMp}`, C.BLUE,   C.BLACK);
      renderer.write(ox + 2, oy + 9,  `Gold: ${player.gold}g`,            C.YELLOW, C.BLACK);
    }

    renderer.hline(ox + 1, oy + 11, W - 2, '─', C.DARK_GRAY);

    if (this.menu) {
      this.menu.render(renderer, ox + 2, oy + 13, { width: W - 4 });
    }

    if (this.message) {
      const words  = this.message.split(' ');
      let   line   = '';
      let   msgRow = oy + H - 4;
      for (const word of words) {
        if ((line + word).length > W - 4) {
          renderer.writeCenter(msgRow++, line.trim(), this.messageColor, C.BLACK, ox, ox + W - 1);
          line = word + ' ';
        } else {
          line += word + ' ';
        }
      }
      if (line.trim()) renderer.writeCenter(msgRow, line.trim(), this.messageColor, C.BLACK, ox, ox + W - 1);
    }

    renderer.writeCenter(oy + H - 2, '[Esc] Leave', C.DARK_GRAY, C.BLACK, ox, ox + W - 1);
  }
}
