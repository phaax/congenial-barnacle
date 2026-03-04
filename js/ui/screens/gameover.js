import { C, COLS, ROWS, STATE } from '../../data/constants.js';
import { Menu } from '../menu.js';

export class GameOverScreen {
  constructor(game) {
    this.game = game;
    this.menu = null;
  }

  enter(data) {
    this.menu = new Menu([
      { label: 'Load Last Save', key: 'l' },
      { label: 'Return to Main Menu', key: 'm' },
    ]);
    this.menu.onSelect = (idx, opt) => {
      if (opt.key === 'l') {
        if (this.game.hasSave()) {
          this.game.loadGame();
        } else {
          this.game.changeState(STATE.MAIN_MENU);
        }
      }
      if (opt.key === 'm') {
        this.game.changeState(STATE.MAIN_MENU);
      }
    };
  }

  exit() {}

  update(dt) {}

  handleKey(e) {
    if (this.menu) this.menu.handleKey(e);
  }

  handleClick(col, row, button) {
    if (this.menu) this.menu.handleClick(col, row, Math.floor(COLS / 2) - 12, 18);
  }

  handleMove(col, row) {
    if (this.menu) this.menu.handleHover(col, row, Math.floor(COLS / 2) - 12, 18);
  }

  handleScroll(dir) {}

  render(renderer) {
    renderer.clear(C.BLACK);

    const cx = Math.floor(COLS / 2);

    // Title
    renderer.writeCenter(6,  '██████╗ ███████╗ █████╗ ██████╗ ', C.RED,       C.BLACK, 0, COLS - 1);
    renderer.writeCenter(7,  '██╔══██╗██╔════╝██╔══██╗██╔══██╗', C.RED,       C.BLACK, 0, COLS - 1);
    renderer.writeCenter(8,  '██║  ██║█████╗  ███████║██║  ██║', C.DARK_RED,  C.BLACK, 0, COLS - 1);
    renderer.writeCenter(9,  '██║  ██║██╔══╝  ██╔══██║██║  ██║', C.DARK_RED,  C.BLACK, 0, COLS - 1);
    renderer.writeCenter(10, '██████╔╝███████╗██║  ██║██████╔╝', C.RED,       C.BLACK, 0, COLS - 1);
    renderer.writeCenter(11, '╚═════╝ ╚══════╝╚═╝  ╚═╝╚═════╝ ', C.RED,       C.BLACK, 0, COLS - 1);

    renderer.writeCenter(13, 'You have fallen in battle.', C.LIGHT_GRAY, C.BLACK, 0, COLS - 1);

    const player = this.game.player;
    if (player) {
      renderer.writeCenter(15, `${player.name} - Level ${player.level}`, C.YELLOW, C.BLACK, 0, COLS - 1);
    }

    renderer.hline(cx - 18, 17, 36, '─', C.DARK_GRAY);

    if (this.menu) {
      this.menu.render(renderer, cx - 12, 18, { width: 24 });
    }
  }
}
