import { C, COLS, ROWS, STATE, SLOT } from '../../data/constants.js';
import { getItem, ITEMS } from '../../data/items.js';
import { ScrollList } from '../menu.js';

export class InventoryScreen {
  constructor(game) {
    this.game     = game;
    this.prevState = STATE.WORLD_MAP;
    this.list     = new ScrollList();
    this.selected = null;
    this.mode     = 'list'; // list, action
  }

  enter(data) {
    this.prevState = data?.prevState || STATE.WORLD_MAP;
    this._refreshList();
    this.mode = 'list';
  }

  exit() {}

  _refreshList() {
    const inv = this.game.player?.inventory || [];
    this.list.setItems(inv, 18);
    this.list.onSelect = (i, inv_item) => {
      this.selected = inv_item;
    };
    if (inv.length > 0) this.selected = inv[0];
  }

  update(dt) {}

  handleKey(e) {
    if (e.key === 'Escape' || e.key === 'i' || e.key === 'I') {
      this.game.changeState(this.prevState);
      return;
    }

    const player = this.game.player;
    if (!player) return;

    if (this.list.handleKey(e)) {
      this.selected = player.inventory[this.list.selected] || null;
      return;
    }

    if (e.key === 'e' || e.key === 'E') this._equip();
    if (e.key === 'u' || e.key === 'U') this._use();
    if (e.key === 'd' || e.key === 'D') this._drop();
  }

  handleClick(col, row, button) {
    // Inventory list renders at col 1, row 9, visibleH 18
    if (col < 40 && row >= 9 && row < 27) {
      this.list.handleClick(col, row, 1, 9, 37);
      this.selected = this.game.player?.inventory[this.list.selected] || null;
    }
    // Action buttons at row 26
    if (row === 26) {
      if (col >= 1  && col <= 10) this._equip();
      if (col >= 13 && col <= 20) this._use();
      if (col >= 23 && col <= 30) this._drop();
    }
  }

  handleMove(col, row) {
    if (col < 40 && row >= 9 && row < 27) {
      this.list.handleHover(col, row, 1, 9, 37);
      this.selected = this.game.player?.inventory[this.list.selected] || null;
    }
  }

  handleScroll(dir) {
    this.list.handleScroll(dir);
    this.selected = this.game.player.inventory[this.list.selected] || null;
  }

  _equip() {
    const player = this.game.player;
    if (!this.selected || !player) return;
    const item = getItem(this.selected.id);
    if (!item || !item.slot) { this.game.addMessage('Cannot equip this item.', 'system'); return; }

    const slot = item.slot;
    if (player.equipment[slot] === this.selected.id) {
      player.equipment[slot] = null;
      this.game.addMessage(`Unequipped ${item.name}.`, 'normal');
    } else {
      player.equipment[slot] = this.selected.id;
      this.game.addMessage(`Equipped ${item.name}.`, 'normal');
    }
    this._refreshList();
  }

  _use() {
    const player = this.game.player;
    if (!this.selected || !player) return;
    const item = getItem(this.selected.id);
    if (!item || item.type !== 'consumable') { this.game.addMessage('Cannot use this item here.', 'system'); return; }

    // Apply effect
    if (item.heal) {
      const healAmt = item.heal;
      player.hp = Math.min(player.maxHp, player.hp + healAmt);
      this.game.addMessage(`You use ${item.name} and restore ${healAmt} HP.`, 'normal');
    }
    if (item.mp) {
      player.mp = Math.min(player.maxMp, (player.mp || 0) + item.mp);
      this.game.addMessage(`You use ${item.name} and restore ${item.mp} MP.`, 'normal');
    }
    if (item.fullHeal) {
      player.hp = player.maxHp;
      player.mp = player.maxMp;
      this.game.addMessage(`Full HP and MP restored!`, 'normal');
    }

    // Remove from inventory
    const idx = player.inventory.findIndex(i => i.id === this.selected.id);
    if (idx !== -1) {
      if (player.inventory[idx].qty > 1) {
        player.inventory[idx].qty--;
      } else {
        player.inventory.splice(idx, 1);
      }
    }
    this._refreshList();
  }

  _drop() {
    const player = this.game.player;
    if (!this.selected || !player) return;
    const item = getItem(this.selected.id);
    if (item?.type === 'quest') { this.game.addMessage('Cannot drop quest items.', 'system'); return; }

    const idx = player.inventory.findIndex(i => i.id === this.selected.id);
    if (idx !== -1) player.inventory.splice(idx, 1);
    this.game.addMessage(`Dropped ${item?.name || this.selected.id}.`, 'normal');
    this._refreshList();
  }

  render(renderer) {
    renderer.clear(C.BLACK);
    renderer.drawPanel(0, 0, COLS, ROWS, 'INVENTORY', C.WHITE, C.BLACK, 'double');

    const player = this.game.player;
    if (!player) return;

    // Equipment
    renderer.write(2, 1, 'EQUIPPED', C.CYAN, C.BLACK);
    const slots = [
      ['weapon',    'Weapon:   '],
      ['armor',     'Armor:    '],
      ['helmet',    'Helmet:   '],
      ['accessory', 'Access:   '],
      ['offhand',   'Offhand:  '],
    ];
    for (let i = 0; i < slots.length; i++) {
      const [slot, label] = slots[i];
      const equippedId = player.equipment[slot];
      const equippedItem = equippedId ? getItem(equippedId) : null;
      renderer.write(2, 2 + i, label, C.DARK_GRAY, C.BLACK);
      renderer.write(12, 2 + i, equippedItem ? equippedItem.name : '(none)', equippedItem ? C.WHITE : C.DARK_GRAY, C.BLACK);
    }

    renderer.hline(1, 7, COLS - 2, '─', C.DARK_GRAY);

    // Inventory list (left panel)
    renderer.write(2, 8, `ITEMS (${player.inventory.length}/20)`, C.YELLOW, C.BLACK);
    const inv = player.inventory;

    this.list.render(renderer, 1, 9, 37, {
      fg: C.WHITE, bg: C.BLACK, selFg: C.BLACK, selBg: C.YELLOW,
      renderItem: (r, col, row, invItem, isSelected, width, fg, bg) => {
        const item = getItem(invItem.id);
        const name = item ? item.name : invItem.id;
        const qty  = invItem.qty > 1 ? `x${invItem.qty}` : ' ';
        const equippedMark = Object.values(player.equipment).includes(invItem.id) ? '►' : ' ';
        const label = `${equippedMark}${name.padEnd(24)} ${qty.padStart(4)}`;
        r.write(col, row, label.slice(0, width).padEnd(width), fg, bg);
      }
    });

    // Item details (right panel)
    renderer.vline(40, 8, 18, '│', C.DARK_GRAY);
    renderer.write(42, 8, 'ITEM DETAILS', C.CYAN, C.BLACK);

    if (this.selected) {
      const item = getItem(this.selected.id);
      if (item) {
        renderer.write(42, 10, item.name, C.YELLOW, C.BLACK);
        renderer.write(42, 11, `Type: ${item.type}`, C.LIGHT_GRAY, C.BLACK);

        if (item.dmg) renderer.write(42, 12, `Damage: ${item.dmg[0]}-${item.dmg[1]}`, C.RED, C.BLACK);
        if (item.def) renderer.write(42, 13, `Defense: ${item.def}`, C.BLUE, C.BLACK);
        if (item.heal) renderer.write(42, 14, `Heals: ${item.heal} HP`, C.GREEN, C.BLACK);
        if (item.mp)   renderer.write(42, 15, `Restores: ${item.mp} MP`, C.CYAN, C.BLACK);

        renderer.write(42, 16, `Value: ${item.value}g`, C.YELLOW, C.BLACK);

        // Description wrapped
        const descLines = wrapText(item.desc || '', COLS - 44);
        for (let i = 0; i < descLines.length && i < 4; i++) {
          renderer.write(42, 18 + i, descLines[i], C.DARK_GRAY, C.BLACK);
        }

        // Equipped indicator
        const isEquipped = Object.values(player.equipment).includes(this.selected.id);
        if (isEquipped) renderer.write(42, 23, '[ EQUIPPED ]', C.GREEN, C.BLACK);
      }
    }

    // Actions
    renderer.hline(1, 25, COLS - 2, '─', C.DARK_GRAY);
    renderer.write(2, 26, '[E]quip/Unequip', C.WHITE, C.BLACK);
    renderer.write(20, 26, '[U]se', C.WHITE, C.BLACK);
    renderer.write(28, 26, '[D]rop', C.WHITE, C.BLACK);
    renderer.write(36, 26, '[Esc] Close', C.DARK_GRAY, C.BLACK);

    // Gold
    renderer.writeRight(26, `Gold: ${player.gold}g`, C.YELLOW, C.BLACK, COLS - 2);
  }
}

function wrapText(text, maxW) {
  const words = text.split(' ');
  const lines = [];
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
