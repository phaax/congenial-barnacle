import { COLS, ROWS, CELL_W, CELL_H, PALETTE, C } from '../data/constants';

export { C, COLS, ROWS, CELL_W, CELL_H };

// Box drawing character sets
export const BOX = {
  single: { tl:'┌', tr:'┐', bl:'└', br:'┘', h:'─', v:'│', tee_r:'├', tee_l:'┤', tee_d:'┬', tee_u:'┴', cross:'┼' },
  double: { tl:'╔', tr:'╗', bl:'╚', br:'╝', h:'═', v:'║', tee_r:'╠', tee_l:'╣', tee_d:'╦', tee_u:'╩', cross:'╬' },
  heavy:  { tl:'┏', tr:'┓', bl:'┗', br:'┛', h:'━', v:'┃', tee_r:'┣', tee_l:'┫', tee_d:'┳', tee_u:'┻', cross:'╋' },
};

type Cell = [string, number, number];

export class Renderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  cells: Cell[];
  prev: Cell[];
  dirty: Set<number>;
  fontSize: number;
  font: string;
  mouseCol: number;
  mouseRow: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;

    canvas.width  = COLS * CELL_W;
    canvas.height = ROWS * CELL_H;

    this.cells = new Array(COLS * ROWS).fill(null).map(() => [' ', C.WHITE, C.BLACK] as Cell);
    this.prev  = new Array(COLS * ROWS).fill(null).map(() => [null, -1, -1] as unknown as Cell);
    this.dirty = new Set();

    this.fontSize = CELL_H - 2;
    this.font = `${this.fontSize}px 'Courier New', Courier, monospace`;

    this.ctx.fillStyle = PALETTE[C.BLACK];
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);

    this.mouseCol = 0;
    this.mouseRow = 0;
  }

  idx(col: number, row: number): number {
    return row * COLS + col;
  }

  inBounds(col: number, row: number): boolean {
    return col >= 0 && col < COLS && row >= 0 && row < ROWS;
  }

  set(col: number, row: number, char: string, fg = C.WHITE, bg = C.BLACK): void {
    if (!this.inBounds(col, row)) return;
    const i = this.idx(col, row);
    const c = this.cells[i];
    const ch = typeof char === 'string' ? (char[0] || ' ') : ' ';
    if (c[0] !== ch || c[1] !== fg || c[2] !== bg) {
      c[0] = ch; c[1] = fg; c[2] = bg;
      this.dirty.add(i);
    }
  }

  write(col: number, row: number, str: string, fg = C.WHITE, bg = C.BLACK): void {
    for (let i = 0; i < str.length; i++) {
      this.set(col + i, row, str[i], fg, bg);
    }
  }

  writeClipped(col: number, row: number, str: string, fg = C.WHITE, bg = C.BLACK, colStart = 0, colEnd = COLS - 1): void {
    for (let i = 0; i < str.length; i++) {
      const c = col + i;
      if (c < colStart || c > colEnd) continue;
      this.set(c, row, str[i], fg, bg);
    }
  }

  writeCenter(row: number, str: string, fg = C.WHITE, bg = C.BLACK, colStart = 0, colEnd = COLS - 1): void {
    const width = colEnd - colStart + 1;
    const start = colStart + Math.floor((width - str.length) / 2);
    this.write(start, row, str, fg, bg);
  }

  writeRight(row: number, str: string, fg = C.WHITE, bg = C.BLACK, colEnd = COLS - 1): void {
    this.write(colEnd - str.length + 1, row, str, fg, bg);
  }

  fill(col: number, row: number, w: number, h: number, char = ' ', fg = C.WHITE, bg = C.BLACK): void {
    for (let r = row; r < row + h; r++) {
      for (let c = col; c < col + w; c++) {
        this.set(c, r, char, fg, bg);
      }
    }
  }

  drawBox(col: number, row: number, w: number, h: number, fg = C.WHITE, bg = C.BLACK, style = 'single', fillBg = false): void {
    const b = BOX[style as keyof typeof BOX] || BOX.single;
    this.set(col,         row,         b.tl, fg, bg);
    this.set(col + w - 1, row,         b.tr, fg, bg);
    this.set(col,         row + h - 1, b.bl, fg, bg);
    this.set(col + w - 1, row + h - 1, b.br, fg, bg);
    for (let c = col + 1; c < col + w - 1; c++) {
      this.set(c, row,         b.h, fg, bg);
      this.set(c, row + h - 1, b.h, fg, bg);
    }
    for (let r = row + 1; r < row + h - 1; r++) {
      this.set(col,         r, b.v, fg, bg);
      this.set(col + w - 1, r, b.v, fg, bg);
    }
    if (fillBg) {
      this.fill(col + 1, row + 1, w - 2, h - 2, ' ', fg, bg);
    }
  }

  drawPanel(col: number, row: number, w: number, h: number, title: string, fg = C.WHITE, bg = C.BLACK, style = 'single'): void {
    this.drawBox(col, row, w, h, fg, bg, style, true);
    if (title) {
      const t = ` ${title} `;
      const tc = col + Math.floor((w - t.length) / 2);
      this.write(tc, row, t, C.YELLOW, bg);
    }
  }

  clear(bg = C.BLACK): void {
    for (let i = 0; i < COLS * ROWS; i++) {
      const c = this.cells[i];
      if (c[0] !== ' ' || c[2] !== bg) {
        c[0] = ' '; c[1] = C.WHITE; c[2] = bg;
        this.dirty.add(i);
      }
    }
  }

  hline(col: number, row: number, len: number, char = '─', fg = C.WHITE, bg = C.BLACK): void {
    for (let i = 0; i < len; i++) this.set(col + i, row, char, fg, bg);
  }

  vline(col: number, row: number, len: number, char = '│', fg = C.WHITE, bg = C.BLACK): void {
    for (let i = 0; i < len; i++) this.set(col, row + i, char, fg, bg);
  }

  render(): void {
    if (this.dirty.size === 0) return;
    const ctx = this.ctx;
    ctx.font = this.font;
    ctx.textBaseline = 'top';

    for (const i of this.dirty) {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const [char, fg, bg] = this.cells[i];
      const x = col * CELL_W;
      const y = row * CELL_H;

      // Draw background — extend 1px left to cover any glyph bleed from left neighbor
      ctx.fillStyle = PALETTE[bg];
      ctx.fillRect(x, y, CELL_W, CELL_H);

      if (char !== ' ') {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, CELL_W, CELL_H);
        ctx.clip();
        ctx.fillStyle = PALETTE[fg];
        ctx.fillText(char, x + 1, y + 1);
        ctx.restore();
      }
    }
    this.dirty.clear();
  }

  forceRender(): void {
    for (let i = 0; i < COLS * ROWS; i++) this.dirty.add(i);
    this.render();
  }

  pixelToCell(px: number, py: number): { col: number; row: number } {
    return {
      col: Math.max(0, Math.min(COLS - 1, Math.floor(px / CELL_W))),
      row: Math.max(0, Math.min(ROWS - 1, Math.floor(py / CELL_H))),
    };
  }

  getRelativePos(event: MouseEvent): { px: number; py: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width  / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      px: (event.clientX - rect.left) * scaleX,
      py: (event.clientY - rect.top)  * scaleY,
    };
  }

  progressBar(col: number, row: number, len: number, value: number, max: number, fgFull = C.GREEN, fgEmpty = C.DARK_GRAY, bg = C.BLACK): void {
    const filled = max > 0 ? Math.round((value / max) * len) : 0;
    for (let i = 0; i < len; i++) {
      this.set(col + i, row, '█', i < filled ? fgFull : fgEmpty, bg);
    }
  }

  highlight(col: number, row: number, fg = C.BLACK, bg = C.YELLOW): void {
    const i = this.idx(col, row);
    if (!this.inBounds(col, row)) return;
    const c = this.cells[i];
    this.set(col, row, c[0], fg, bg);
  }
}
