import { C, COLS, ROWS } from '../../data/constants.js';
import { Menu } from '../../ui/menu.js';

// ASCII art title lines for "CHRONICLES OF THE REALM"
const TITLE_ART = [
  '  ██████╗██╗  ██╗██████╗  ██████╗ ███╗   ██╗██╗ ██████╗██╗     ███████╗███████╗',
  ' ██╔════╝██║  ██║██╔══██╗██╔═══██╗████╗  ██║██║██╔════╝██║     ██╔════╝██╔════╝',
  ' ██║     ███████║██████╔╝██║   ██║██╔██╗ ██║██║██║     ██║     █████╗  ███████╗',
  ' ██║     ██╔══██║██╔══██╗██║   ██║██║╚██╗██║██║██║     ██║     ██╔══╝  ╚════██║',
  ' ╚██████╗██║  ██║██║  ██║╚██████╔╝██║ ╚████║██║╚██████╗███████╗███████╗███████║',
  '  ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝ ╚═════╝╚══════╝╚══════╝╚══════╝',
];

const SUBTITLE = 'OF  THE  REALM';

const TAGLINES = [
  'Danger lurks in every shadow.',
  'Fortune favors the bold.',
  'The realm needs a hero.',
  'Will you answer the call?',
  'Glory awaits the worthy.',
];

// Decorative border characters
const BORDER_CHAR = '═';
const CORNER_TL = '╔';
const CORNER_TR = '╗';
const CORNER_BL = '╚';
const CORNER_BR = '╝';
const SIDE_CHAR = '║';

export class MainMenuScreen {
  constructor(game) {
    this.game = game;
    this.menu = new Menu([
      { label: 'New Game',  key: 'n' },
      { label: 'Continue',  key: 'c' },
      { label: 'Quit',      key: 'q' },
    ]);

    this.taglineIndex = 0;
    this.taglineTimer = 0;
    this.taglineInterval = 3.5; // seconds between tagline changes
    this.blinkTimer = 0;
    this.showBlink = true;
    this.animFrame = 0;
    this.animTimer = 0;

    this.menu.onSelect = (idx, opt) => this._onSelect(idx, opt);
  }

  enter(data) {
    // Check if a save exists to enable Continue
    const hasSave = this._hasSave();
    this.menu.options[1].disabled = !hasSave;
    if (!hasSave && this.menu.selected === 1) {
      this.menu.selected = 0;
    }

    this.taglineIndex = Math.floor(Math.random() * TAGLINES.length);
    this.taglineTimer = 0;
    this.blinkTimer = 0;
    this.showBlink = true;
  }

  exit() {}

  _hasSave() {
    try {
      return !!localStorage.getItem('chronicles_save');
    } catch (e) {
      return false;
    }
  }

  _onSelect(idx, opt) {
    switch (opt.key) {
      case 'n':
        this.game.changeState('CHAR_CREATE');
        break;
      case 'c':
        this.game.loadGame();
        break;
      case 'q':
        // Attempt to close the window / notify user
        if (typeof window !== 'undefined') {
          window.close();
        }
        break;
    }
  }

  handleKey(event) {
    // Pass to menu
    if (this.menu.handleKey(event)) return;

    // Direct key shortcuts not caught by menu
    if (event.key === 'Escape') {
      event.preventDefault();
    }
  }

  handleClick(col, row, button) {
    // Menu is centered around col 38, rows 18-20
    const menuCol = 38;
    const menuRow = 18;
    this.menu.handleClick(col, row, menuCol, menuRow);
  }

  handleScroll(dir) {
    if (dir > 0) this.menu.moveDown();
    else this.menu.moveUp();
  }

  update(dt) {
    // Tagline cycling
    this.taglineTimer += dt;
    if (this.taglineTimer >= this.taglineInterval) {
      this.taglineTimer = 0;
      this.taglineIndex = (this.taglineIndex + 1) % TAGLINES.length;
    }

    // Press-any-key blink
    this.blinkTimer += dt;
    if (this.blinkTimer >= 0.5) {
      this.blinkTimer = 0;
      this.showBlink = !this.showBlink;
    }

    // Subtle animation frame for border decorations
    this.animTimer += dt;
    if (this.animTimer >= 0.15) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }
  }

  render(renderer) {
    renderer.clear(C.BLACK);

    this._renderBorder(renderer);
    this._renderTitle(renderer);
    this._renderMenu(renderer);
    this._renderFooter(renderer);
    this._renderDecorations(renderer);
  }

  _renderBorder(renderer) {
    const fg = C.DARK_BLUE;
    const bg = C.BLACK;

    // Top and bottom edges
    renderer.set(0, 0, CORNER_TL, fg, bg);
    renderer.set(COLS - 1, 0, CORNER_TR, fg, bg);
    renderer.set(0, ROWS - 1, CORNER_BL, fg, bg);
    renderer.set(COLS - 1, ROWS - 1, CORNER_BR, fg, bg);

    for (let c = 1; c < COLS - 1; c++) {
      renderer.set(c, 0, BORDER_CHAR, fg, bg);
      renderer.set(c, ROWS - 1, BORDER_CHAR, fg, bg);
    }

    // Side edges
    for (let r = 1; r < ROWS - 1; r++) {
      renderer.set(0, r, SIDE_CHAR, fg, bg);
      renderer.set(COLS - 1, r, SIDE_CHAR, fg, bg);
    }

    // Inner decorative line below title area
    const innerY = 9;
    renderer.set(0, innerY, '╠', fg, bg);
    renderer.set(COLS - 1, innerY, '╣', fg, bg);
    for (let c = 1; c < COLS - 1; c++) {
      renderer.set(c, innerY, BORDER_CHAR, fg, bg);
    }

    // Inner decorative line above footer
    const footerY = ROWS - 4;
    renderer.set(0, footerY, '╠', fg, bg);
    renderer.set(COLS - 1, footerY, '╣', fg, bg);
    for (let c = 1; c < COLS - 1; c++) {
      renderer.set(c, footerY, BORDER_CHAR, fg, bg);
    }
  }

  _renderTitle(renderer) {
    // "CHRONICLES" - large block letters approximation using the art lines
    // We use a compact 2-line version that fits in 80 cols
    const titleRow = 2;

    // Draw "CHRONICLES OF THE REALM" as a styled banner
    renderer.writeCenter(titleRow, '* * * * * * * * * * * * * * * * * * * * *', C.DARK_BLUE, C.BLACK);

    // Main title text - large and centered
    const title1 = '  C H R O N I C L E S  ';
    const title2 = '    O F   T H E   R E A L M    ';

    renderer.writeCenter(titleRow + 1, title1, C.YELLOW, C.BLACK);
    renderer.writeCenter(titleRow + 2, '─────────────────────────────────────', C.BROWN, C.BLACK);
    renderer.writeCenter(titleRow + 3, title2, C.WHITE, C.BLACK);
    renderer.writeCenter(titleRow + 4, '─────────────────────────────────────', C.BROWN, C.BLACK);
    renderer.writeCenter(titleRow + 5, '* * * * * * * * * * * * * * * * * * * * *', C.DARK_BLUE, C.BLACK);

    // Subtitle flourish
    renderer.writeCenter(titleRow + 7, '~ A Text Adventure of Heroes and Legends ~', C.DARK_CYAN, C.BLACK);
  }

  _renderMenu(renderer) {
    const menuStartRow = 13;

    // Menu header
    renderer.writeCenter(menuStartRow, '┌─────────────────────┐', C.DARK_GRAY, C.BLACK);
    renderer.writeCenter(menuStartRow + 1, '│   MAIN  MENU        │', C.LIGHT_GRAY, C.BLACK);
    renderer.writeCenter(menuStartRow + 2, '└─────────────────────┘', C.DARK_GRAY, C.BLACK);

    // Render each menu option centered
    const options = this.menu.options;
    const menuCol = 34; // left edge of menu options
    const optionWidth = 18;

    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      const row = menuStartRow + 4 + i * 2;
      const isSelected = i === this.menu.selected;
      const isDisabled = opt.disabled;

      let label = `[${opt.key.toUpperCase()}] ${opt.label}`;
      label = label.padEnd(optionWidth);

      let fg, bg;
      if (isDisabled) {
        fg = C.DARK_GRAY;
        bg = C.BLACK;
      } else if (isSelected) {
        fg = C.BLACK;
        bg = C.YELLOW;
      } else {
        fg = C.WHITE;
        bg = C.BLACK;
      }

      // Selection arrow
      if (isSelected && !isDisabled) {
        renderer.write(menuCol - 3, row, '►', C.YELLOW, C.BLACK);
        renderer.write(menuCol + optionWidth, row, '◄', C.YELLOW, C.BLACK);
      }

      renderer.write(menuCol, row, label, fg, bg);
    }
  }

  _renderFooter(renderer) {
    const footerRow = ROWS - 3;

    // Rotating tagline
    const tagline = TAGLINES[this.taglineIndex];
    renderer.writeCenter(footerRow, tagline, C.DARK_CYAN, C.BLACK);

    // Version / credits
    renderer.writeCenter(footerRow + 1, 'Chronicles of the Realm  v1.0', C.DARK_GRAY, C.BLACK);
  }

  _renderDecorations(renderer) {
    // Corner ornaments inside the border
    const ornaments = ['◆', '◇', '◈', '◆'];
    const orn = ornaments[this.animFrame % ornaments.length];

    renderer.set(2,          1,          orn, C.BROWN, C.BLACK);
    renderer.set(COLS - 3,   1,          orn, C.BROWN, C.BLACK);
    renderer.set(2,          ROWS - 2,   orn, C.BROWN, C.BLACK);
    renderer.set(COLS - 3,   ROWS - 2,   orn, C.BROWN, C.BLACK);

    // Side decorations at mid height
    const midRow = Math.floor(ROWS / 2);
    renderer.set(1,        midRow, '◄', C.DARK_BLUE, C.BLACK);
    renderer.set(COLS - 2, midRow, '►', C.DARK_BLUE, C.BLACK);

    // Sword/shield symbols flanking title
    renderer.set(3,        3, '†', C.BROWN, C.BLACK);
    renderer.set(COLS - 4, 3, '†', C.BROWN, C.BLACK);
    renderer.set(3,        5, '◙', C.DARK_BLUE, C.BLACK);
    renderer.set(COLS - 4, 5, '◙', C.DARK_BLUE, C.BLACK);
  }
}
