export class InputManager {
  constructor(canvas, renderer) {
    this.canvas   = canvas;
    this.renderer = renderer;

    // Stacks allow context-sensitive input (push on enter, pop on exit)
    this._keyStack    = [];
    this._clickStack  = [];
    this._scrollStack = [];
    this._moveStack   = [];

    this.mouseCol = 0;
    this.mouseRow = 0;

    this._boundKey    = this._onKey.bind(this);
    this._boundClick  = this._onClick.bind(this);
    this._boundMove   = this._onMove.bind(this);
    this._boundScroll = this._onScroll.bind(this);

    document.addEventListener('keydown', this._boundKey);
    canvas.addEventListener('click',     this._boundClick);
    canvas.addEventListener('mousemove', this._boundMove);
    canvas.addEventListener('wheel',     this._boundScroll, { passive: false });

    // Prevent context menu on canvas
    canvas.addEventListener('contextmenu', e => e.preventDefault());
  }

  // Push a key handler function. Only the top handler receives events.
  pushKey(fn)    { this._keyStack.push(fn); }
  popKey()       { this._keyStack.pop(); }

  pushClick(fn)  { this._clickStack.push(fn); }
  popClick()     { this._clickStack.pop(); }

  pushScroll(fn) { this._scrollStack.push(fn); }
  popScroll()    { this._scrollStack.pop(); }

  pushMove(fn)   { this._moveStack.push(fn); }
  popMove()      { this._moveStack.pop(); }

  // Replace all handlers at once (for screen transitions)
  setHandlers({ key, click, scroll, move } = {}) {
    this._keyStack    = key    ? [key]    : [];
    this._clickStack  = click  ? [click]  : [];
    this._scrollStack = scroll ? [scroll] : [];
    this._moveStack   = move   ? [move]   : [];
  }

  _onKey(e) {
    if (this._keyStack.length > 0) {
      const result = this._keyStack[this._keyStack.length - 1](e);
      if (result !== false) {
        // Prevent default for game keys to avoid browser shortcuts
        const gameKeys = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',
                          ' ','Tab','F1','F2','F3','F4','F5','F6','F7','F8','F9','F10'];
        if (gameKeys.includes(e.key)) e.preventDefault();
      }
    }
  }

  _onClick(e) {
    if (this._clickStack.length === 0) return;
    const { px, py } = this.renderer.getRelativePos(e);
    const { col, row } = this.renderer.pixelToCell(px, py);
    this._clickStack[this._clickStack.length - 1](col, row, e.button);
  }

  _onMove(e) {
    const { px, py } = this.renderer.getRelativePos(e);
    const { col, row } = this.renderer.pixelToCell(px, py);
    this.mouseCol = col;
    this.mouseRow = row;
    this.renderer.mouseCol = col;
    this.renderer.mouseRow = row;
    if (this._moveStack.length > 0) {
      this._moveStack[this._moveStack.length - 1](col, row);
    }
  }

  _onScroll(e) {
    e.preventDefault();
    if (this._scrollStack.length > 0) {
      this._scrollStack[this._scrollStack.length - 1](e.deltaY > 0 ? 1 : -1);
    }
  }

  destroy() {
    document.removeEventListener('keydown',   this._boundKey);
    this.canvas.removeEventListener('click',     this._boundClick);
    this.canvas.removeEventListener('mousemove', this._boundMove);
    this.canvas.removeEventListener('wheel',     this._boundScroll);
  }
}

// Key name helpers
export const KEY = {
  UP:        'ArrowUp',
  DOWN:      'ArrowDown',
  LEFT:      'ArrowLeft',
  RIGHT:     'ArrowRight',
  ENTER:     'Enter',
  ESCAPE:    'Escape',
  SPACE:     ' ',
  BACKSPACE: 'Backspace',
  TAB:       'Tab',
  HOME:      'Home',
  END:       'End',
  PGUP:      'PageUp',
  PGDN:      'PageDown',
  F1:        'F1',
  F2:        'F2',
  F3:        'F3',
};
