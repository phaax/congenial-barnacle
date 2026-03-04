import { C, COLS, ROWS, STATE } from '../../data/constants.js';
import { Menu } from '../menu.js';

export class VictoryScreen {
  constructor(game) {
    this.game = game;
    this.menu = null;
  }

  enter(data) {
    this.menu = new Menu([
      { label: 'Return to Main Menu', key: 'm' },
    ]);
    this.menu.onSelect = (idx, opt) => {
      if (opt.key === 'm') {
        this.game.changeState(STATE.MAIN_MENU);
      }
    };

    this.game.addMessage('Victory! The realm is saved!', 'quest');
  }

  exit() {}

  update(dt) {}

  handleKey(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      this.game.changeState(STATE.MAIN_MENU);
      return;
    }
    if (this.menu) this.menu.handleKey(e);
  }

  handleClick(col, row, button) {
    if (this.menu) this.menu.handleClick(col, row, Math.floor(COLS / 2) - 12, 22);
  }

  handleMove(col, row) {
    if (this.menu) this.menu.handleHover(col, row, Math.floor(COLS / 2) - 12, 22);
  }

  handleScroll(dir) {}

  render(renderer) {
    renderer.clear(C.BLACK);

    const cx = Math.floor(COLS / 2);

    // Victory title
    renderer.writeCenter(4,  '██╗   ██╗██╗ ██████╗████████╗ ██████╗ ██████╗██╗   ██╗', C.YELLOW, C.BLACK, 0, COLS - 1);
    renderer.writeCenter(5,  '██║   ██║██║██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗╚██╗ ██╔╝', C.YELLOW, C.BLACK, 0, COLS - 1);
    renderer.writeCenter(6,  '██║   ██║██║██║        ██║   ██║   ██║██████╔╝ ╚████╔╝ ', C.BROWN,  C.BLACK, 0, COLS - 1);
    renderer.writeCenter(7,  '╚██╗ ██╔╝██║██║        ██║   ██║   ██║██╔══██╗  ╚██╔╝  ', C.BROWN,  C.BLACK, 0, COLS - 1);
    renderer.writeCenter(8,  ' ╚████╔╝ ██║╚██████╗   ██║   ╚██████╔╝██║  ██║   ██║   ', C.YELLOW, C.BLACK, 0, COLS - 1);
    renderer.writeCenter(9,  '  ╚═══╝  ╚═╝ ╚═════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ', C.YELLOW, C.BLACK, 0, COLS - 1);

    renderer.hline(cx - 24, 11, 48, '═', C.BROWN);

    const player = this.game.player;
    const world  = this.game.world;

    renderer.writeCenter(13, 'The realm has been saved!', C.WHITE, C.BLACK, 0, COLS - 1);

    if (player && world) {
      renderer.writeCenter(15, `${player.name} - Level ${player.level} Hero`, C.YELLOW, C.BLACK, 0, COLS - 1);
      renderer.writeCenter(16, `Quest: ${world.goal?.shortName || 'Unknown'}`, C.CYAN, C.BLACK, 0, COLS - 1);
    }

    renderer.hline(cx - 24, 18, 48, '─', C.DARK_GRAY);

    // Stats
    if (player) {
      const completedQuests = (this.game.quests || []).filter(q => q.status === 'TURNED_IN' || q.status === 'COMPLETED').length;
      renderer.writeCenter(19, `Quests Completed: ${completedQuests}`, C.LIGHT_GRAY, C.BLACK, 0, COLS - 1);
      renderer.writeCenter(20, `Gold: ${player.gold}g`, C.YELLOW, C.BLACK, 0, COLS - 1);
    }

    renderer.hline(cx - 24, 21, 48, '─', C.DARK_GRAY);

    if (this.menu) {
      this.menu.render(renderer, cx - 12, 22, { width: 24 });
    }

    renderer.writeCenter(ROWS - 2, '[Enter] Continue', C.DARK_GRAY, C.BLACK, 0, COLS - 1);
  }
}
