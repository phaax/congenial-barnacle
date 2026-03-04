import { C, COLS, ROWS, STATE } from '../../data/constants.js';
import { getItem, getShopInventory } from '../../data/items.js';
import { ScrollList } from '../menu.js';

export class ShopScreen {
  constructor(game) {
    this.game      = game;
    this.npc       = null;
    this.shopItems = [];
    this.buyList   = new ScrollList();
    this.sellList  = new ScrollList();
    this.mode      = 'buy'; // 'buy' or 'sell'
    this.message   = '';
    this.messageColor = C.WHITE;
  }

  enter(data) {
    this.npc  = data?.npc || null;
    this.mode = 'buy';
    this.message = '';

    const tier = this.npc?.shopTier || 1;
    this.shopItems = getShopInventory(tier);

    this.buyList.setItems(this.shopItems, 14);
    this.buyList.onSelect = () => {};

    this._refreshSellList();
  }

  exit() {}

  _refreshSellList() {
    const inv = this.game.player?.inventory || [];
    const sellable = inv.filter(i => {
      const item = getItem(i.id);
      return item && item.type !== 'quest';
    });
    this.sellList.setItems(sellable, 14);
    this.sellList.onSelect = () => {};
  }

  _buy() {
    const player = this.game.player;
    if (!player) return;

    const list = this.buyList;
    const item = this.shopItems[list.selected];
    if (!item) return;

    if (player.gold < item.value) {
      this.message = `Not enough gold! Need ${item.value}g.`;
      this.messageColor = C.RED;
      return;
    }
    if (player.inventory.length >= 20) {
      this.message = 'Your inventory is full!';
      this.messageColor = C.RED;
      return;
    }

    player.gold -= item.value;
    player.inventory.push({ id: item.id, qty: 1 });
    this._refreshSellList();
    this.message = `Bought ${item.name} for ${item.value}g.`;
    this.messageColor = C.GREEN;
    this.game.addMessage(`Bought ${item.name}.`, 'normal');
  }

  _sell() {
    const player = this.game.player;
    if (!player) return;

    const inv      = player.inventory.filter(i => { const it = getItem(i.id); return it && it.type !== 'quest'; });
    const invItem  = inv[this.sellList.selected];
    if (!invItem) return;

    const item  = getItem(invItem.id);
    if (!item) return;

    const price = Math.max(1, Math.floor(item.value * 0.5));
    player.gold += price;

    const idx = player.inventory.findIndex(i => i === invItem);
    if (idx !== -1) {
      if (player.inventory[idx].qty > 1) {
        player.inventory[idx].qty--;
      } else {
        player.inventory.splice(idx, 1);
      }
    }

    this._refreshSellList();
    this.message = `Sold ${item.name} for ${price}g.`;
    this.messageColor = C.YELLOW;
    this.game.addMessage(`Sold ${item.name}.`, 'normal');
  }

  _leave() {
    this.game.changeState(STATE.LOCATION, {
      loc:    this.game.currentLocation,
      layout: this.game.currentLayout,
    });
  }

  update(dt) {}

  handleKey(e) {
    if (e.key === 'Escape') { this._leave(); return; }

    if (e.key === 'Tab') {
      e.preventDefault();
      this.mode    = this.mode === 'buy' ? 'sell' : 'buy';
      this.message = '';
      return;
    }
    if (e.key === 'b' || e.key === 'B') { this.mode = 'buy';  this.message = ''; return; }
    if (e.key === 's' || e.key === 'S') { this.mode = 'sell'; this.message = ''; return; }

    if (this.mode === 'buy') {
      if (this.buyList.handleKey(e)) return;
      if (e.key === 'Enter' || e.key === ' ') { this._buy(); return; }
    } else {
      if (this.sellList.handleKey(e)) return;
      if (e.key === 'Enter' || e.key === ' ') { this._sell(); return; }
    }
  }

  handleClick(col, row, button) {
    if (row === 2) {
      if (col >= 2  && col <= 12) { this.mode = 'buy';  this.message = ''; return; }
      if (col >= 14 && col <= 25) { this.mode = 'sell'; this.message = ''; return; }
    }
    if (row >= 5 && row < 20) {
      if (this.mode === 'buy') {
        this.buyList.handleClick(col, row, 1, 5, 38);
      } else {
        this.sellList.handleClick(col, row, 1, 5, 38);
      }
    }
    if (row === 22) {
      if (col >= 2 && col <= 14) {
        if (this.mode === 'buy') this._buy(); else this._sell();
      }
    }
  }

  handleScroll(dir) {
    if (this.mode === 'buy') {
      this.buyList.handleScroll(dir);
    } else {
      this.sellList.handleScroll(dir);
    }
  }

  render(renderer) {
    renderer.clear(C.BLACK);
    renderer.drawPanel(0, 0, COLS, ROWS, 'SHOP', C.BROWN, C.BLACK, 'double');

    const shopName = this.npc?.shopName || 'General Store';
    renderer.writeCenter(1, shopName, C.YELLOW, C.BLACK, 0, COLS - 1);

    // Tabs
    const buyFg = this.mode === 'buy' ? C.BLACK : C.WHITE;
    const buyBg = this.mode === 'buy' ? C.CYAN  : C.BLACK;
    renderer.write(2,  2, '[B]uy',  buyFg,                               buyBg);
    const selFg = this.mode === 'sell' ? C.BLACK : C.WHITE;
    const selBg = this.mode === 'sell' ? C.CYAN  : C.BLACK;
    renderer.write(9,  2, '[S]ell', selFg, selBg);

    const player = this.game.player;
    if (player) {
      renderer.writeRight(2, `Gold: ${player.gold}g`, C.YELLOW, C.BLACK, COLS - 2);
    }

    renderer.hline(1, 3, COLS - 2, '─', C.DARK_GRAY);

    // Column headers
    renderer.write(2,  4, this.mode === 'buy' ? 'Shop Items' : 'Your Items', C.CYAN, C.BLACK);
    renderer.write(42, 4, 'Details', C.CYAN, C.BLACK);
    renderer.vline(40, 3, 18, '│', C.DARK_GRAY);

    const activeList = this.mode === 'buy' ? this.buyList : this.sellList;
    const items      = this.mode === 'buy' ? this.shopItems
      : (player?.inventory || []).filter(i => { const it = getItem(i.id); return it && it.type !== 'quest'; });

    activeList.render(renderer, 1, 5, 38, {
      fg: C.WHITE, bg: C.BLACK, selFg: C.BLACK, selBg: C.YELLOW,
      renderItem: (r, col, row, entry, isSel, width, fg, bg) => {
        const item = this.mode === 'buy' ? entry : getItem(entry.id);
        if (!item) return;
        const price  = this.mode === 'buy' ? item.value : Math.max(1, Math.floor(item.value * 0.5));
        const priceStr = `${price}g`.padStart(6);
        const name   = item.name.slice(0, width - 8).padEnd(width - 8);
        r.write(col, row, `${name}${priceStr}`, fg, bg);
      }
    });

    // Details pane
    const selIdx = activeList.selected;
    const selEntry = items[selIdx];
    if (selEntry) {
      const item = this.mode === 'buy' ? selEntry : getItem(selEntry.id);
      if (item) {
        let dr = 5;
        renderer.write(42, dr++, item.name, C.YELLOW, C.BLACK);
        dr++;
        renderer.write(42, dr++, `Type: ${item.type}`, C.LIGHT_GRAY, C.BLACK);
        if (item.dmg) renderer.write(42, dr++, `Dmg: ${item.dmg[0]}-${item.dmg[1]}`,  C.RED,   C.BLACK);
        if (item.def) renderer.write(42, dr++, `Def: +${item.def}`,                    C.BLUE,  C.BLACK);
        if (item.heal)renderer.write(42, dr++, `Heals: ${item.heal} HP`,              C.GREEN, C.BLACK);
        if (item.mp)  renderer.write(42, dr++, `Restores: ${item.mp} MP`,             C.CYAN,  C.BLACK);
        dr++;

        const buyPrice  = item.value;
        const sellPrice = Math.max(1, Math.floor(item.value * 0.5));
        renderer.write(42, dr++, `Buy:  ${buyPrice}g`,  C.WHITE,  C.BLACK);
        renderer.write(42, dr++, `Sell: ${sellPrice}g`, C.YELLOW, C.BLACK);
        dr++;

        // Desc wrapped
        if (item.desc) {
          const words = item.desc.split(' ');
          let line = '';
          for (const word of words) {
            if ((line + word).length > COLS - 44) {
              renderer.write(42, dr++, line.trim(), C.DARK_GRAY, C.BLACK);
              line = word + ' ';
            } else {
              line += word + ' ';
            }
            if (dr > 22) break;
          }
          if (line.trim() && dr <= 22) renderer.write(42, dr++, line.trim(), C.DARK_GRAY, C.BLACK);
        }
      }
    }

    renderer.hline(1, 21, COLS - 2, '─', C.DARK_GRAY);

    if (this.message) {
      renderer.write(2, 22, this.message.slice(0, COLS - 4), this.messageColor, C.BLACK);
    }

    renderer.write(2, ROWS - 2, '[↑↓] Select  [Enter] Confirm  [Tab] Toggle  [Esc] Leave', C.DARK_GRAY, C.BLACK);
  }
}
