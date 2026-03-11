import type { Renderer } from './renderer';

type KeyHandler = (e: KeyboardEvent) => void;
type ClickHandler = (col: number, row: number, btn: number) => void;
type ScrollHandler = (dir: number) => void;
type MoveHandler = (col: number, row: number) => void;

interface Handlers {
  key?: KeyHandler;
  click?: ClickHandler;
  scroll?: ScrollHandler;
  move?: MoveHandler;
}

export class InputManager {
  canvas: HTMLCanvasElement;
  renderer: Renderer;
  mouseCol: number;
  mouseRow: number;

  private _keyStack: KeyHandler[];
  private _clickStack: ClickHandler[];
  private _scrollStack: ScrollHandler[];
  private _moveStack: MoveHandler[];
  private _boundKey: (e: KeyboardEvent) => void;
  private _boundClick: (e: MouseEvent) => void;
  private _boundMove: (e: MouseEvent) => void;
  private _boundScroll: (e: WheelEvent) => void;

  constructor(canvas: HTMLCanvasElement, renderer: Renderer) {
    this.canvas   = canvas;
    this.renderer = renderer;

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

    canvas.addEventListener('contextmenu', (e: Event) => e.preventDefault());
  }

  pushKey(fn: KeyHandler): void    { this._keyStack.push(fn); }
  popKey(): void                   { this._keyStack.pop(); }

  pushClick(fn: ClickHandler): void  { this._clickStack.push(fn); }
  popClick(): void                   { this._clickStack.pop(); }

  pushScroll(fn: ScrollHandler): void { this._scrollStack.push(fn); }
  popScroll(): void                   { this._scrollStack.pop(); }

  pushMove(fn: MoveHandler): void   { this._moveStack.push(fn); }
  popMove(): void                   { this._moveStack.pop(); }

  setHandlers({ key, click, scroll, move }: Handlers = {}): void {
    this._keyStack    = key    ? [key]    : [];
    this._clickStack  = click  ? [click]  : [];
    this._scrollStack = scroll ? [scroll] : [];
    this._moveStack   = move   ? [move]   : [];
  }

  private _onKey(e: KeyboardEvent): void {
    if (this._keyStack.length > 0) {
      const result: unknown = this._keyStack[this._keyStack.length - 1](e);
      if (result !== false) {
        const gameKeys = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',
                          ' ','Tab','F1','F2','F3','F4','F5','F6','F7','F8','F9','F10'];
        if (gameKeys.includes(e.key)) e.preventDefault();
      }
    }
  }

  private _onClick(e: MouseEvent): void {
    if (this._clickStack.length === 0) return;
    const { px, py } = this.renderer.getRelativePos(e);
    const { col, row } = this.renderer.pixelToCell(px, py);
    this._clickStack[this._clickStack.length - 1](col, row, e.button);
  }

  private _onMove(e: MouseEvent): void {
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

  private _onScroll(e: WheelEvent): void {
    e.preventDefault();
    if (this._scrollStack.length > 0) {
      this._scrollStack[this._scrollStack.length - 1](e.deltaY > 0 ? 1 : -1);
    }
  }

  destroy(): void {
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
} as const;
