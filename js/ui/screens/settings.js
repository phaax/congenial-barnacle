import { C, COLS, ROWS } from '../../data/constants.js';
import { Menu } from '../../ui/menu.js';

const PW = 40;
const PH = 16;
const PC = Math.floor((COLS - PW) / 2);
const PR = Math.floor((ROWS - PH) / 2);

export class SettingsScreen {
  constructor(game) {
    this.game = game;
    this._buildMenu();
  }

  _buildMenu() {
    const music = this.game.music;
    this.menu = new Menu([
      { label: `In-Game Music: ${music.enabled ? 'ON' : 'OFF'}`, key: '1' },
      { label: `Music Volume:  ${this._volLabel()}`,             key: '2' },
      { label: `Muted:         ${music.muted ? 'YES' : 'NO'}`,  key: '3' },
      { label: 'Back',                                          key: 'b' },
    ]);
    this.menu.onSelect = (idx) => this._onSelect(idx);
  }

  _volLabel() {
    return `${'█'.repeat(Math.round(this.game.music.volume * 10))}${'░'.repeat(10 - Math.round(this.game.music.volume * 10))}`;
  }

  _refreshLabels() {
    const music = this.game.music;
    this.menu.options[0].label = `In-Game Music: ${music.enabled ? 'ON' : 'OFF'}`;
    this.menu.options[1].label = `Music Volume:  ${this._volLabel()}`;
    this.menu.options[2].label = `Muted:         ${music.muted ? 'YES' : 'NO'}`;
  }

  enter() {
    this._refreshLabels();
    this.menu.selected = 0;
  }

  exit() {}

  _onSelect(idx) {
    const music = this.game.music;
    switch (idx) {
      case 0: // Toggle in-game music
        music.setEnabled(!music.enabled);
        break;
      case 1: // Cycle volume
        music.setVolume(music.volume >= 0.9 ? 0.1 : Math.round((music.volume + 0.1) * 10) / 10);
        break;
      case 2: // Toggle mute
        music.toggleMute();
        break;
      case 3: // Back
        this.game.closeSettings();
        return;
    }
    this._refreshLabels();
  }

  handleKey(event) {
    const k = event.key;

    if (k === 'Escape') {
      event.preventDefault();
      this.game.closeSettings();
      return;
    }

    // Volume adjust with left/right when volume row is selected
    if (this.menu.selected === 1) {
      if (k === 'ArrowLeft' || k === '-') {
        event.preventDefault();
        this.game.music.setVolume(Math.max(0, this.game.music.volume - 0.1));
        this._refreshLabels();
        return;
      }
      if (k === 'ArrowRight' || k === '+' || k === '=') {
        event.preventDefault();
        this.game.music.setVolume(Math.min(1, this.game.music.volume + 0.1));
        this._refreshLabels();
        return;
      }
    }

    this.menu.handleKey(event);
  }

  handleClick(col, row) {
    const menuCol = PC + 4;
    const menuRow = PR + 5;
    this.menu.handleClick(col, row, menuCol, menuRow);
  }

  handleMove(col, row) {
    const menuCol = PC + 4;
    const menuRow = PR + 5;
    this.menu.handleHover(col, row, menuCol, menuRow);
  }

  handleScroll(dir) {
    if (dir > 0) this.menu.moveDown();
    else this.menu.moveUp();
  }

  update() {}

  render(renderer) {
    // Dim background
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        renderer.set(c, r, '░', C.DARK_GRAY, C.BLACK);
      }
    }

    // Panel
    renderer.fill(PC, PR, PW, PH, ' ', C.WHITE, C.BLACK);
    renderer.drawBox(PC, PR, PW, PH, C.CYAN, C.BLACK, 'double', false);

    // Title
    renderer.writeCenter(PR, '  SETTINGS  ', C.YELLOW, C.BLACK, PC, PC + PW);

    // Separator
    renderer.hline(PC + 1, PR + 1, PW - 2, '═', C.CYAN);
    renderer.set(PC, PR + 1, '╠', C.CYAN, C.BLACK);
    renderer.set(PC + PW - 1, PR + 1, '╣', C.CYAN, C.BLACK);

    // Description
    renderer.writeCenter(PR + 3, 'Audio Settings', C.WHITE, C.BLACK, PC, PC + PW);
    renderer.hline(PC + 1, PR + 4, PW - 2, '─', C.DARK_GRAY);

    // Menu items
    const menuCol = PC + 4;
    const menuRow = PR + 5;
    this.menu.render(renderer, menuCol, menuRow, { width: PW - 8 });

    // Help text
    const helpRow = PR + PH - 3;
    renderer.hline(PC + 1, helpRow - 1, PW - 2, '─', C.DARK_GRAY);

    const sel = this.menu.selected;
    let helpText = '';
    if (sel === 0) helpText = 'Toggle background music during gameplay';
    else if (sel === 1) helpText = '[←/→] or [Enter] to adjust volume';
    else if (sel === 2) helpText = 'Mute/unmute all music output';
    else helpText = 'Return to previous screen';

    renderer.writeCenter(helpRow, helpText, C.DARK_GRAY, C.BLACK, PC, PC + PW);

    // Footer
    renderer.writeCenter(helpRow + 1, '[Esc] Back', C.DARK_GRAY, C.BLACK, PC, PC + PW);
  }
}
