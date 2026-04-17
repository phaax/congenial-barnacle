// @ts-nocheck
import { C } from '../data/constants';

// Reusable vertical menu component
export class Menu {
  constructor(options) {
    // options: array of { label, key, disabled }
    this.options    = options || [];
    this.selected   = 0;
    this.onSelect   = null; // callback(index, option)
    this.wrapAround = true;
  }

  setOptions(options) {
    this.options = options;
    this.selected = Math.min(this.selected, options.length - 1);
    if (this.selected < 0) this.selected = 0;
  }

  moveUp() {
    const active = this.options.filter((o, i) => !o.disabled);
    if (active.length === 0) return;
    do {
      this.selected--;
      if (this.selected < 0) this.selected = this.wrapAround ? this.options.length - 1 : 0;
    } while (this.options[this.selected]?.disabled);
  }

  moveDown() {
    do {
      this.selected++;
      if (this.selected >= this.options.length) this.selected = this.wrapAround ? 0 : this.options.length - 1;
    } while (this.options[this.selected]?.disabled);
  }

  handleKey(e) {
    // Explicit option shortcuts take priority so they aren't shadowed by navigation keys
    for (let i = 0; i < this.options.length; i++) {
      const opt = this.options[i];
      if (opt.disabled) continue;
      if (opt.key && e.key.toLowerCase() === opt.key.toLowerCase()) {
        e.preventDefault();
        this.selected = i;
        this.activate();
        return true;
      }
    }
    if (e.key === 'ArrowUp'   || e.key === 'w') { e.preventDefault(); this.moveUp();   return true; }
    if (e.key === 'ArrowDown' || e.key === 's') { e.preventDefault(); this.moveDown(); return true; }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.activate();
      return true;
    }
    // Auto-shortcut: first letter of option label (for options without an explicit key)
    for (let i = 0; i < this.options.length; i++) {
      const opt = this.options[i];
      if (opt.disabled || opt.key) continue;
      if (opt.label && e.key.toLowerCase() === opt.label[0]?.toLowerCase()) {
        this.selected = i;
        this.activate();
        return true;
      }
    }
    return false;
  }

  activate() {
    const opt = this.options[this.selected];
    if (opt && !opt.disabled && this.onSelect) {
      this.onSelect(this.selected, opt);
    }
  }

  handleClick(col, row, menuCol, menuRow) {
    for (let i = 0; i < this.options.length; i++) {
      if (row === menuRow + i && col >= menuCol) {
        if (!this.options[i].disabled) {
          this.selected = i;
          this.activate();
          return true;
        }
      }
    }
    return false;
  }

  // Update selected item based on hover position (no activation)
  handleHover(col, row, menuCol, menuRow) {
    for (let i = 0; i < this.options.length; i++) {
      if (row === menuRow + i && col >= menuCol) {
        if (!this.options[i].disabled) {
          this.selected = i;
          return true;
        }
      }
    }
    return false;
  }

  // Render the menu at position, returns height drawn
  render(renderer, col, row, opts = {}) {
    const {
      fg        = C.WHITE,
      bg        = C.BLACK,
      selFg     = C.BLACK,
      selBg     = C.YELLOW,
      disabledFg= C.DARK_GRAY,
      width     = 0,
    } = opts;

    for (let i = 0; i < this.options.length; i++) {
      const opt = this.options[i];
      const isSelected = i === this.selected;

      let lineFg = opt.disabled ? disabledFg : (isSelected ? selFg : fg);
      let lineBg = isSelected ? selBg : bg;

      // Build label with optional shortcut key
      let label = opt.label || '';
      if (opt.key) label = `[${opt.key.toUpperCase()}] ${label}`;

      // Pad to width if given
      if (width > 0) {
        label = label.padEnd(width);
      }

      if (isSelected) {
        renderer.write(col - 2, row + i, '►', C.YELLOW, bg);
      }

      renderer.write(col, row + i, label, lineFg, lineBg);

      // Right-aligned extra text (e.g., price)
      if (opt.extra && width > 0) {
        renderer.writeRight(row + i, opt.extra, opt.extraFg || fg, col + width - 1);
      }
    }
    return this.options.length;
  }
}

// A scrollable list component
export class ScrollList {
  constructor() {
    this.items    = [];
    this.selected = 0;
    this.scroll   = 0;
    this.visibleH = 10;
    this.onSelect = null;
  }

  setItems(items, visibleH) {
    this.items    = items;
    this.visibleH = visibleH || this.visibleH;
    this.selected = 0;
    this.scroll   = 0;
  }

  moveUp() {
    if (this.selected > 0) {
      this.selected--;
      if (this.selected < this.scroll) this.scroll = this.selected;
    }
  }

  moveDown() {
    if (this.selected < this.items.length - 1) {
      this.selected++;
      if (this.selected >= this.scroll + this.visibleH) {
        this.scroll = this.selected - this.visibleH + 1;
      }
    }
  }

  handleScroll(dir) {
    if (dir > 0) this.moveDown();
    else this.moveUp();
  }

  handleKey(e) {
    if (e.key === 'ArrowUp')   { this.moveUp();   return true; }
    if (e.key === 'ArrowDown') { this.moveDown();  return true; }
    if (e.key === 'PageUp')    { for (let i = 0; i < this.visibleH; i++) this.moveUp();   return true; }
    if (e.key === 'PageDown')  { for (let i = 0; i < this.visibleH; i++) this.moveDown(); return true; }
    if (e.key === 'Enter') {
      if (this.onSelect && this.items[this.selected]) {
        this.onSelect(this.selected, this.items[this.selected]);
      }
      return true;
    }
    return false;
  }

  handleHover(col, row, listCol, listRow, listWidth) {
    if (col < listCol || col >= listCol + listWidth) return false;
    const idx = this.scroll + (row - listRow);
    if (idx >= 0 && idx < this.items.length) {
      this.selected = idx;
      return true;
    }
    return false;
  }

  handleClick(col, row, listCol, listRow, listWidth) {
    const clickedIdx = this.scroll + (row - listRow);
    if (clickedIdx >= 0 && clickedIdx < this.items.length) {
      this.selected = clickedIdx;
      if (this.onSelect) this.onSelect(this.selected, this.items[this.selected]);
      return true;
    }
    return false;
  }

  render(renderer, col, row, width, opts = {}) {
    const { fg = C.WHITE, bg = C.BLACK, selFg = C.BLACK, selBg = C.YELLOW, renderItem } = opts;
    for (let i = 0; i < this.visibleH; i++) {
      const idx = this.scroll + i;
      if (idx >= this.items.length) break;
      const item = this.items[idx];
      const isSelected = idx === this.selected;
      const itemFg = isSelected ? selFg : fg;
      const itemBg = isSelected ? selBg : bg;

      if (renderItem) {
        renderItem(renderer, col, row + i, item, isSelected, width, itemFg, itemBg);
      } else {
        const label = String(item).padEnd(width);
        renderer.write(col, row + i, label, itemFg, itemBg);
      }
    }

    // Scroll indicators — placed one column past the item area to avoid overwriting item text
    if (this.scroll > 0) {
      renderer.write(col + width, row, '▲', C.YELLOW, bg);
    }
    if (this.scroll + this.visibleH < this.items.length) {
      renderer.write(col + width, row + this.visibleH - 1, '▼', C.YELLOW, bg);
    }
  }
}

// Simple confirm dialog
export class Confirm {
  constructor(message, onYes, onNo) {
    this.message = message;
    this.onYes   = onYes;
    this.onNo    = onNo || (() => {});
    this.selected = 0; // 0=No, 1=Yes
  }

  handleKey(e) {
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowRight') {
      this.selected = 1 - this.selected;
      return true;
    }
    if (e.key === 'y' || e.key === 'Y') { this.onYes(); return true; }
    if (e.key === 'n' || e.key === 'N' || e.key === 'Escape') { this.onNo(); return true; }
    if (e.key === 'Enter') {
      if (this.selected === 1) this.onYes();
      else this.onNo();
      return true;
    }
    return false;
  }

  render(renderer, col, row) {
    const w = Math.max(this.message.length + 4, 20);
    renderer.drawPanel(col, row, w, 5, 'Confirm', C.WHITE, C.BLACK);
    renderer.writeCenter(row + 2, this.message, C.WHITE, C.BLACK, col, col + w - 1);

    const noFg  = this.selected === 0 ? C.BLACK : C.WHITE;
    const noBg  = this.selected === 0 ? C.YELLOW : C.BLACK;
    const yesFg = this.selected === 1 ? C.BLACK : C.WHITE;
    const yesBg = this.selected === 1 ? C.YELLOW : C.BLACK;
    renderer.write(col + 4,  row + 3, ' No  ', noFg,  noBg);
    renderer.write(col + 11, row + 3, ' Yes ', yesFg, yesBg);
  }
}
