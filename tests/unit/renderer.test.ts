import { describe, it, expect, beforeEach } from 'vitest';
import { Renderer } from '../../js/engine/renderer';
import { COLS, ROWS, C } from '../../js/data/constants';

// ---------------------------------------------------------------------------
// Minimal canvas/context stub — we only care about renderer.cells, not pixels
// ---------------------------------------------------------------------------
function makeCanvas(): HTMLCanvasElement {
  const ctx = {
    fillStyle: '',
    font: '',
    textBaseline: '',
    fillRect: () => {},
    fillText: () => {},
    save: () => {},
    restore: () => {},
    beginPath: () => {},
    rect: () => {},
    clip: () => {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: COLS * 12, height: ROWS * 20 }),
  };
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ctx,
  };
  return canvas as unknown as HTMLCanvasElement;
}

// Helper: read a cell from the renderer
function cell(r: Renderer, col: number, row: number): [string, number, number] {
  return r.cells[row * COLS + col] as [string, number, number];
}

// Helper: extract a row of chars as a string (trimming trailing spaces)
function rowChars(r: Renderer, row: number, from = 0, to = COLS - 1): string {
  let s = '';
  for (let c = from; c <= to; c++) {
    s += cell(r, c, row)[0];
  }
  return s;
}

// ---------------------------------------------------------------------------
// Suite: write
// ---------------------------------------------------------------------------
describe('Renderer.write', () => {
  let r: Renderer;
  beforeEach(() => { r = new Renderer(makeCanvas()); });

  it('writes characters starting at the given column', () => {
    r.write(5, 3, 'HELLO', C.WHITE, C.BLACK);
    expect(cell(r, 5, 3)[0]).toBe('H');
    expect(cell(r, 6, 3)[0]).toBe('E');
    expect(cell(r, 9, 3)[0]).toBe('O');
  });

  it('applies fg and bg colors', () => {
    r.write(0, 0, 'X', C.YELLOW, C.DARK_BLUE);
    expect(cell(r, 0, 0)[1]).toBe(C.YELLOW);
    expect(cell(r, 0, 0)[2]).toBe(C.DARK_BLUE);
  });

  it('silently ignores characters written outside canvas bounds', () => {
    // Should not throw when writing past right edge
    expect(() => r.write(COLS - 2, 0, 'OVERFLOW', C.WHITE, C.BLACK)).not.toThrow();
    expect(cell(r, COLS - 2, 0)[0]).toBe('O');
    expect(cell(r, COLS - 1, 0)[0]).toBe('V');
    // Characters beyond COLS are clipped by inBounds
  });
});

// ---------------------------------------------------------------------------
// Suite: writeClipped
// ---------------------------------------------------------------------------
describe('Renderer.writeClipped', () => {
  let r: Renderer;
  beforeEach(() => { r = new Renderer(makeCanvas()); });

  it('writes only characters within [colStart, colEnd]', () => {
    r.writeClipped(8, 0, 'ABCDEFGH', C.WHITE, C.BLACK, 10, 13);
    // A=8 B=9 — clipped; C=10 D=11 E=12 F=13 — written; G=14 H=15 — clipped
    expect(cell(r, 8, 0)[0]).toBe(' ');  // unchanged
    expect(cell(r, 9, 0)[0]).toBe(' ');  // unchanged
    expect(cell(r, 10, 0)[0]).toBe('C');
    expect(cell(r, 11, 0)[0]).toBe('D');
    expect(cell(r, 12, 0)[0]).toBe('E');
    expect(cell(r, 13, 0)[0]).toBe('F');
    expect(cell(r, 14, 0)[0]).toBe(' ');  // unchanged
  });
});

// ---------------------------------------------------------------------------
// Suite: writeCenter
// ---------------------------------------------------------------------------
describe('Renderer.writeCenter', () => {
  let r: Renderer;
  beforeEach(() => { r = new Renderer(makeCanvas()); });

  it('centers a string within the full terminal width', () => {
    const str = 'HI';
    r.writeCenter(0, str, C.WHITE, C.BLACK);
    // Expected start: floor((80 - 2) / 2) = 39
    expect(cell(r, 39, 0)[0]).toBe('H');
    expect(cell(r, 40, 0)[0]).toBe('I');
  });

  it('centers a string within a sub-region', () => {
    // colStart=10, colEnd=19 → width=10, string='AB' (2 chars), start=10+floor((10-2)/2)=14
    r.writeCenter(1, 'AB', C.WHITE, C.BLACK, 10, 19);
    expect(cell(r, 14, 1)[0]).toBe('A');
    expect(cell(r, 15, 1)[0]).toBe('B');
  });

  it('does not write outside colStart/colEnd when string equals region width', () => {
    const str = '1234567890'; // 10 chars
    r.writeCenter(2, str, C.WHITE, C.BLACK, 5, 14); // width=10, exactly fits
    expect(cell(r, 5, 2)[0]).toBe('1');
    expect(cell(r, 14, 2)[0]).toBe('0');
    expect(cell(r, 4, 2)[0]).toBe(' ');   // must not bleed left
    expect(cell(r, 15, 2)[0]).toBe(' ');  // must not bleed right
  });

  it('does not write outside colStart/colEnd when string is wider than region', () => {
    // String wider than region — should be clipped, not bleed outside
    const str = 'THIS IS A VERY LONG STRING THAT EXCEEDS THE REGION';
    r.writeCenter(3, str, C.WHITE, C.BLACK, 20, 29); // region width=10
    // Nothing should be written before col 20 or after col 29
    for (let c = 0; c < 20; c++) {
      expect(cell(r, c, 3)[0]).toBe(' ');
    }
    for (let c = 30; c < COLS; c++) {
      expect(cell(r, c, 3)[0]).toBe(' ');
    }
  });
});

// ---------------------------------------------------------------------------
// Suite: writeRight
// ---------------------------------------------------------------------------
describe('Renderer.writeRight', () => {
  let r: Renderer;
  beforeEach(() => { r = new Renderer(makeCanvas()); });

  it('right-aligns text so the last character is at colEnd', () => {
    r.writeRight(0, 'ABC', C.WHITE, C.BLACK, 20);
    expect(cell(r, 18, 0)[0]).toBe('A');
    expect(cell(r, 19, 0)[0]).toBe('B');
    expect(cell(r, 20, 0)[0]).toBe('C');
    expect(cell(r, 21, 0)[0]).toBe(' ');
  });

  it('defaults colEnd to COLS-1', () => {
    r.writeRight(0, 'Z', C.WHITE, C.BLACK);
    expect(cell(r, COLS - 1, 0)[0]).toBe('Z');
  });
});

// ---------------------------------------------------------------------------
// Suite: fill
// ---------------------------------------------------------------------------
describe('Renderer.fill', () => {
  let r: Renderer;
  beforeEach(() => { r = new Renderer(makeCanvas()); });

  it('fills the specified rectangle', () => {
    r.fill(2, 1, 3, 2, '#', C.GREEN, C.BLACK);
    for (let row = 1; row <= 2; row++) {
      for (let col = 2; col <= 4; col++) {
        expect(cell(r, col, row)[0]).toBe('#');
      }
    }
  });

  it('does not modify cells outside the rectangle', () => {
    r.fill(5, 5, 2, 2, 'X', C.WHITE, C.BLACK);
    expect(cell(r, 4, 5)[0]).toBe(' ');
    expect(cell(r, 7, 5)[0]).toBe(' ');
    expect(cell(r, 5, 4)[0]).toBe(' ');
    expect(cell(r, 5, 7)[0]).toBe(' ');
  });
});

// ---------------------------------------------------------------------------
// Suite: drawBox
// ---------------------------------------------------------------------------
describe('Renderer.drawBox', () => {
  let r: Renderer;
  beforeEach(() => { r = new Renderer(makeCanvas()); });

  it('places corner characters correctly (single style)', () => {
    r.drawBox(2, 3, 5, 4, C.WHITE, C.BLACK, 'single');
    expect(cell(r, 2, 3)[0]).toBe('┌');   // top-left
    expect(cell(r, 6, 3)[0]).toBe('┐');   // top-right (col 2+5-1=6)
    expect(cell(r, 2, 6)[0]).toBe('└');   // bottom-left (row 3+4-1=6)
    expect(cell(r, 6, 6)[0]).toBe('┘');   // bottom-right
  });

  it('places horizontal border characters along the top and bottom', () => {
    r.drawBox(0, 0, 5, 3, C.WHITE, C.BLACK, 'single');
    // Top edge: cols 1..3
    expect(cell(r, 1, 0)[0]).toBe('─');
    expect(cell(r, 3, 0)[0]).toBe('─');
    // Bottom edge
    expect(cell(r, 1, 2)[0]).toBe('─');
    expect(cell(r, 3, 2)[0]).toBe('─');
  });

  it('places vertical border characters along the sides', () => {
    r.drawBox(0, 0, 3, 5, C.WHITE, C.BLACK, 'single');
    expect(cell(r, 0, 1)[0]).toBe('│');
    expect(cell(r, 0, 3)[0]).toBe('│');
    expect(cell(r, 2, 1)[0]).toBe('│');
    expect(cell(r, 2, 3)[0]).toBe('│');
  });

  it('does not fill interior when fillBg is false', () => {
    r.write(1, 1, 'X', C.WHITE, C.BLACK);
    r.drawBox(0, 0, 5, 5, C.WHITE, C.BLACK, 'single', false);
    expect(cell(r, 1, 1)[0]).toBe('X');  // interior unchanged
  });

  it('fills interior with spaces when fillBg is true', () => {
    r.write(1, 1, 'X', C.WHITE, C.BLACK);
    r.drawBox(0, 0, 5, 5, C.WHITE, C.BLACK, 'single', true);
    expect(cell(r, 1, 1)[0]).toBe(' ');  // interior cleared
  });

  it('uses double-line characters for double style', () => {
    r.drawBox(0, 0, 4, 3, C.WHITE, C.BLACK, 'double');
    expect(cell(r, 0, 0)[0]).toBe('╔');
    expect(cell(r, 3, 0)[0]).toBe('╗');
    expect(cell(r, 0, 2)[0]).toBe('╚');
    expect(cell(r, 3, 2)[0]).toBe('╝');
    expect(cell(r, 1, 0)[0]).toBe('═');
  });
});

// ---------------------------------------------------------------------------
// Suite: drawPanel
// ---------------------------------------------------------------------------
describe('Renderer.drawPanel', () => {
  let r: Renderer;
  beforeEach(() => { r = new Renderer(makeCanvas()); });

  it('draws a box and centers the title on the top border', () => {
    // Panel at col=10, row=5, w=20, h=5, title='INFO'
    r.drawPanel(10, 5, 20, 5, 'INFO', C.WHITE, C.BLACK);
    // Title is ' INFO ' (6 chars), centered in width 20:
    // start = 10 + floor((20 - 6) / 2) = 10 + 7 = 17
    expect(cell(r, 17, 5)[0]).toBe(' ');
    expect(cell(r, 18, 5)[0]).toBe('I');
    expect(cell(r, 19, 5)[0]).toBe('N');
    expect(cell(r, 20, 5)[0]).toBe('F');
    expect(cell(r, 21, 5)[0]).toBe('O');
    expect(cell(r, 22, 5)[0]).toBe(' ');
  });

  it('title does not write outside the panel left edge', () => {
    // Use a title shorter than the panel — left edge must stay intact
    // drawPanel defaults to 'single' style → corner chars are '┌' / '┐'
    r.drawPanel(5, 0, 10, 3, 'HI', C.WHITE, C.BLACK);
    // col 5 should be the '┌' corner, not overwritten by the title
    expect(cell(r, 5, 0)[0]).toBe('┌');
  });

  it('title does not write outside the panel right edge', () => {
    r.drawPanel(5, 0, 10, 3, 'HI', C.WHITE, C.BLACK);
    // col 14 (5+10-1) should be the '┐' corner
    expect(cell(r, 14, 0)[0]).toBe('┐');
  });
});

// ---------------------------------------------------------------------------
// Suite: progressBar
// ---------------------------------------------------------------------------
describe('Renderer.progressBar', () => {
  let r: Renderer;
  beforeEach(() => { r = new Renderer(makeCanvas()); });

  it('fills the correct number of cells for 50% value', () => {
    r.progressBar(0, 0, 10, 5, 10, C.GREEN, C.DARK_GRAY, C.BLACK);
    // 50% of 10 = 5 filled
    for (let i = 0; i < 5; i++)  expect(cell(r, i, 0)[1]).toBe(C.GREEN);
    for (let i = 5; i < 10; i++) expect(cell(r, i, 0)[1]).toBe(C.DARK_GRAY);
  });

  it('all cells filled for max value', () => {
    r.progressBar(0, 0, 8, 8, 8, C.GREEN, C.DARK_GRAY, C.BLACK);
    for (let i = 0; i < 8; i++) expect(cell(r, i, 0)[1]).toBe(C.GREEN);
  });

  it('no cells filled for zero value', () => {
    r.progressBar(0, 0, 8, 0, 8, C.GREEN, C.DARK_GRAY, C.BLACK);
    for (let i = 0; i < 8; i++) expect(cell(r, i, 0)[1]).toBe(C.DARK_GRAY);
  });

  it('handles zero max without crashing', () => {
    expect(() => r.progressBar(0, 0, 8, 0, 0, C.GREEN, C.DARK_GRAY, C.BLACK)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Suite: wrapText (regression — duplicated in inventory and dialog screens)
// ---------------------------------------------------------------------------

function wrapText(text: string, maxW: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if ((current + word).length > maxW) {
      if (current) lines.push(current.trim());
      current = word + ' ';
    } else {
      current += word + ' ';
    }
  }
  if (current.trim()) lines.push(current.trim());
  return lines;
}

describe('wrapText utility', () => {
  it('returns a single line when text fits within maxW', () => {
    const lines = wrapText('hello world', 20);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe('hello world');
  });

  it('wraps at word boundaries', () => {
    const lines = wrapText('one two three four', 9);
    // 'one two' = 7, 'three' = 5, 'four' = 4
    expect(lines[0]).toBe('one two');
    expect(lines[1]).toBe('three');
    expect(lines[2]).toBe('four');
  });

  it('no line exceeds maxW characters', () => {
    const text = 'The quick brown fox jumps over the lazy dog and keeps on going forever';
    const lines = wrapText(text, 20);
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(20);
    }
  });

  it('handles empty string', () => {
    expect(wrapText('', 20)).toHaveLength(0);
  });

  it('handles a single word longer than maxW without crashing', () => {
    const lines = wrapText('superlongwordthatexceedsmaxwidth', 10);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe('superlongwordthatexceedsmaxwidth');
  });
});
