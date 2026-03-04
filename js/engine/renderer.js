import { COLS, ROWS, CELL_W, CELL_H, PALETTE, C } from '../data/constants.js';

export { C, COLS, ROWS, CELL_W, CELL_H };

// Box drawing character sets
export const BOX = {
  single: { tl:'┌', tr:'┐', bl:'└', br:'┘', h:'─', v:'│', tee_r:'├', tee_l:'┤', tee_d:'┬', tee_u:'┴', cross:'┼' },
  double: { tl:'╔', tr:'╗', bl:'╚', br:'╝', h:'═', v:'║', tee_r:'╠', tee_l:'╣', tee_d:'╦', tee_u:'╩', cross:'╬' },
  heavy:  { tl:'┏', tr:'┓', bl:'┗', br:'┛', h:'━', v:'┃', tee_r:'┣', tee_l:'┫', tee_d:'┳', tee_u:'┻', cross:'╋' },
};

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    canvas.width  = COLS * CELL_W;
    canvas.height = ROWS * CELL_H;

    // Each cell: [char, fg, bg]
    this.cells = new Array(COLS * ROWS).fill(null).map(() => [' ', C.WHITE, C.BLACK]);
    this.prev  = new Array(COLS * ROWS).fill(null).map(() => [null, -1, -1]);
    this.dirty = new Set();

    // Font: slightly smaller than cell height so characters fit
    this.fontSize = CELL_H - 2;
    this.font = `${this.fontSize}px 'Courier New', Courier, monospace`;

    // Initial full clear
    this.ctx.fillStyle = PALETTE[C.BLACK];
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);

    this.mouseCol = 0;
    this.mouseRow = 0;
  }

  idx(col, row) {
    return row * COLS + col;
  }

  inBounds(col, row) {
    return col >= 0 && col < COLS && row >= 0 && row < ROWS;
  }

  set(col, row, char, fg = C.WHITE, bg = C.BLACK) {
    if (!this.inBounds(col, row)) return;
    const i = this.idx(col, row);
    const c = this.cells[i];
    const ch = typeof char === 'string' ? (char[0] || ' ') : ' ';
    if (c[0] !== ch || c[1] !== fg || c[2] !== bg) {
      c[0] = ch; c[1] = fg; c[2] = bg;
      this.dirty.add(i);
    }
  }

  write(col, row, str, fg = C.WHITE, bg = C.BLACK) {
    for (let i = 0; i < str.length; i++) {
      this.set(col + i, row, str[i], fg, bg);
    }
  }

  // Write string, clipping to [colStart, colEnd]
  writeClipped(col, row, str, fg = C.WHITE, bg = C.BLACK, colStart = 0, colEnd = COLS - 1) {
    for (let i = 0; i < str.length; i++) {
      const c = col + i;
      if (c < colStart || c > colEnd) continue;
      this.set(c, row, str[i], fg, bg);
    }
  }

  // Center text within a column range
  writeCenter(row, str, fg = C.WHITE, bg = C.BLACK, colStart = 0, colEnd = COLS - 1) {
    const width = colEnd - colStart + 1;
    const start = colStart + Math.floor((width - str.length) / 2);
    this.write(start, row, str, fg, bg);
  }

  // Right-align text within a column range
  writeRight(row, str, fg = C.WHITE, bg = C.BLACK, colEnd = COLS - 1) {
    this.write(colEnd - str.length + 1, row, str, fg, bg);
  }

  // Fill rectangle with a character
  fill(col, row, w, h, char = ' ', fg = C.WHITE, bg = C.BLACK) {
    for (let r = row; r < row + h; r++) {
      for (let c = col; c < col + w; c++) {
        this.set(c, r, char, fg, bg);
      }
    }
  }

  // Draw a box outline
  drawBox(col, row, w, h, fg = C.WHITE, bg = C.BLACK, style = 'single', fillBg = false) {
    const b = BOX[style] || BOX.single;
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

  // Draw a titled box
  drawPanel(col, row, w, h, title, fg = C.WHITE, bg = C.BLACK, style = 'single') {
    this.drawBox(col, row, w, h, fg, bg, style, true);
    if (title) {
      const t = ` ${title} `;
      const tc = col + Math.floor((w - t.length) / 2);
      this.write(tc, row, t, C.YELLOW, bg);
    }
  }

  // Clear to a background color
  clear(bg = C.BLACK) {
    for (let i = 0; i < COLS * ROWS; i++) {
      const c = this.cells[i];
      if (c[0] !== ' ' || c[2] !== bg) {
        c[0] = ' '; c[1] = C.WHITE; c[2] = bg;
        this.dirty.add(i);
      }
    }
  }

  // Draw a horizontal line
  hline(col, row, len, char = '─', fg = C.WHITE, bg = C.BLACK) {
    for (let i = 0; i < len; i++) this.set(col + i, row, char, fg, bg);
  }

  // Draw a vertical line
  vline(col, row, len, char = '│', fg = C.WHITE, bg = C.BLACK) {
    for (let i = 0; i < len; i++) this.set(col, row + i, char, fg, bg);
  }

  // Render all dirty cells to canvas
  render() {
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

      ctx.fillStyle = PALETTE[bg];
      ctx.fillRect(x, y, CELL_W, CELL_H);

      if (char !== ' ') {
        ctx.fillStyle = PALETTE[fg];
        ctx.fillText(char, x + 1, y + 1);
      }
    }
    this.dirty.clear();
  }

  // Force full re-render
  forceRender() {
    for (let i = 0; i < COLS * ROWS; i++) this.dirty.add(i);
    this.render();
  }

  // Convert pixel coords to cell
  pixelToCell(px, py) {
    return {
      col: Math.max(0, Math.min(COLS - 1, Math.floor(px / CELL_W))),
      row: Math.max(0, Math.min(ROWS - 1, Math.floor(py / CELL_H))),
    };
  }

  // Get canvas-relative mouse position from event
  getRelativePos(event) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width  / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      px: (event.clientX - rect.left) * scaleX,
      py: (event.clientY - rect.top)  * scaleY,
    };
  }

  // Draw a progress bar
  progressBar(col, row, len, value, max, fgFull = C.GREEN, fgEmpty = C.DARK_GRAY, bg = C.BLACK) {
    const filled = Math.round((value / max) * len);
    for (let i = 0; i < len; i++) {
      this.set(col + i, row, '█', i < filled ? fgFull : fgEmpty, bg);
    }
  }

  // Highlight a cell (for hover effects)
  highlight(col, row, fg = C.BLACK, bg = C.YELLOW) {
    const i = this.idx(col, row);
    if (!this.inBounds(col, row)) return;
    const c = this.cells[i];
    this.set(col, row, c[0], fg, bg);
  }
}
