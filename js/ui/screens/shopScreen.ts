// @ts-nocheck
import { C, COLS, ROWS, STATE } from '../../data/constants';
import { getItem, getShopInventoryByRole, addToInventory } from '../../data/items';
import { clearFogAroundLocation } from '../../world/worldgen';
import { ScrollList, Confirm } from '../menu';

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
    this._confirm  = null; // Confirm dialog instance when pending
  }

  enter(data) {
    this.npc  = data?.npc || null;
    this.mode = 'buy';
    this.message = '';
    this._confirm = null;

    const tier     = this.npc?.shopTier || 1;
    const role     = this.npc?.shopRole || 'general';
    this.shopItems = getShopInventoryByRole(role, tier);

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

  _isEquipped(invItem) {
    const eq = this.game.player?.equipment || {};
    return Object.values(eq).includes(invItem.id);
  }

  _requestBuy() {
    const player = this.game.player;
    if (!player) return;

    const item = this.shopItems[this.buyList.selected];
    if (!item) return;

    if (player.gold < item.value) {
      this.message = `Not enough gold! Need ${item.value}g.`;
      this.messageColor = C.RED;
      return;
    }

    const isInstantUse = item.id === 'local_map';
    if (isInstantUse) {
      const loc = this.game.currentLocation;
      if (loc?.mapPurchased) {
        this.message = 'You already have a map of this area.';
        this.messageColor = C.DARK_GRAY;
        return;
      }
    }
    if (!isInstantUse && player.inventory.length >= 20) {
      this.message = 'Your inventory is full!';
      this.messageColor = C.RED;
      return;
    }

    this._confirm = new Confirm(
      `Buy ${item.name} for ${item.value}g?`,
      () => { this._executeBuy(item); this._confirm = null; },
      () => { this._confirm = null; }
    );
  }

  _executeBuy(item) {
    const player = this.game.player;
    if (!player) return;
    player.gold -= item.value;

    if (item.id === 'local_map') {
      const loc = this.game.currentLocation;
      if (loc) {
        const tier = loc.tier || 1;
        const radius = 15 + tier * 5; // tier 1→20, tier 2→25, tier 3→30
        clearFogAroundLocation(this.game.world, loc.x, loc.y, radius);
        loc.mapPurchased = true;
      }
      this.message = 'The merchant marks the local area on your behalf.';
      this.messageColor = C.GREEN;
      this.game.addMessage('Map purchased. Local area revealed!', 'normal');
      return;
    }

    addToInventory(player, item.id, 1);
    this._refreshSellList();
    this.message = `Bought ${item.name} for ${item.value}g.`;
    this.messageColor = C.GREEN;
    this.game.addMessage(`Bought ${item.name}.`, 'normal');
  }

  _requestSell() {
    const player = this.game.player;
    if (!player) return;

    const inv     = player.inventory.filter(i => { const it = getItem(i.id); return it && it.type !== 'quest'; });
    const invItem = inv[this.sellList.selected];
    if (!invItem) return;

    const item = getItem(invItem.id);
    if (!item) return;

    const equipped = this._isEquipped(invItem);
    const sellableQty = invItem.qty - (equipped ? 1 : 0);

    if (sellableQty <= 0) {
      this.message = `Unequip ${item.name} before selling it.`;
      this.messageColor = C.RED;
      return;
    }

    const price = Math.max(1, Math.floor(item.value * 0.5));
    const label = sellableQty > 1 ? `Sell 1x ${item.name} for ${price}g?` : `Sell ${item.name} for ${price}g?`;
    this._confirm = new Confirm(
      label,
      () => { this._executeSell(invItem, item, price); this._confirm = null; },
      () => { this._confirm = null; }
    );
  }

  _executeSell(invItem, item, price) {
    const player = this.game.player;
    if (!player) return;

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
    if (this._confirm) {
      this._confirm.handleKey(e);
      return;
    }

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
      if (e.key === 'Enter' || e.key === ' ') { this._requestBuy(); return; }
      if (this.buyList.handleKey(e)) return;
    } else {
      if (e.key === 'Enter' || e.key === ' ') { this._requestSell(); return; }
      if (this.sellList.handleKey(e)) return;
    }
  }

  handleClick(col, row, button) {
    if (this._confirm) {
      const cx = Math.floor(COLS / 2) - 12;
      const cy = Math.floor(ROWS / 2) - 3;
      this._confirm.handleKey({ key: row === cy + 3 && col >= cx + 4 && col <= cx + 8 ? 'n' :
                                      row === cy + 3 && col >= cx + 11 && col <= cx + 15 ? 'y' : '' });
      // Simpler: just delegate click as key press with Enter on the confirm option
      return;
    }

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
        if (this.mode === 'buy') this._requestBuy(); else this._requestSell();
      }
    }
  }

  handleMove(col, row) {
    if (this._confirm) return;
    if (row >= 5 && row < 20) {
      if (this.mode === 'buy') this.buyList.handleHover(col, row, 1, 5, 38);
      else                     this.sellList.handleHover(col, row, 1, 5, 38);
    }
  }

  handleScroll(dir) {
    if (this._confirm) return;
    if (this.mode === 'buy') {
      this.buyList.handleScroll(dir);
    } else {
      this.sellList.handleScroll(dir);
    }
  }

  render(renderer) {
    renderer.clear(C.BLACK);

    const shopTitle = this.npc?.shopName || this._shopTitle();
    renderer.drawPanel(0, 0, COLS, ROWS, shopTitle, C.BROWN, C.BLACK, 'double');

    const shopName = this.npc?.shopLabel || 'General Store';
    renderer.writeCenter(1, shopName, C.YELLOW, C.BLACK, 0, COLS - 1);

    // Tabs
    const buyFg = this.mode === 'buy' ? C.BLACK : C.WHITE;
    const buyBg = this.mode === 'buy' ? C.CYAN  : C.BLACK;
    renderer.write(2,  2, '[B]uy',  buyFg, buyBg);
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
        const equipped     = this.mode === 'sell' && this._isEquipped(entry);
        const sellableQty  = this.mode === 'sell' ? (entry.qty - (equipped ? 1 : 0)) : null;
        const unavailable  = this.mode === 'sell' && equipped && sellableQty <= 0;
        const price        = this.mode === 'buy' ? item.value : Math.max(1, Math.floor(item.value * 0.5));
        const priceStr     = unavailable ? ' (eq)' : `${price}g`.padStart(6);
        const qtyStr       = this.mode === 'sell' && entry.qty > 1 ? ` x${sellableQty}` : '';
        const nameWidth    = width - 11 - qtyStr.length;
        const name         = item.name.slice(0, nameWidth).padEnd(nameWidth);
        const itemFg       = unavailable ? C.DARK_GRAY : fg;
        r.write(col, row, `   ${name}${qtyStr}${priceStr}`, itemFg, bg);
      }
    });

    // Details pane — skip when confirm dialog is active to avoid ghost text
    const selIdx   = activeList.selected;
    const selEntry = !this._confirm ? items[selIdx] : null;
    if (selEntry) {
      const item     = this.mode === 'buy' ? selEntry : getItem(selEntry.id);
      const equipped = this.mode === 'sell' && this._isEquipped(selEntry);
      if (item) {
        let dr = 5;
        renderer.write(42, dr++, item.name.slice(0, COLS - 44), C.YELLOW, C.BLACK);
        dr++;
        renderer.write(42, dr++, `Type: ${item.type}`, C.LIGHT_GRAY, C.BLACK);
        if (item.dmg)  renderer.write(42, dr++, `Dmg:   ${item.dmg[0]}-${item.dmg[1]}`, C.RED,   C.BLACK);
        if (item.def)  renderer.write(42, dr++, `Def:   +${item.def}`,                   C.BLUE,  C.BLACK);
        if (item.heal) renderer.write(42, dr++, `Heals: ${item.heal} HP`,               C.GREEN, C.BLACK);
        if (item.mp)   renderer.write(42, dr++, `MP:    +${item.mp}`,                   C.CYAN,  C.BLACK);
        dr++;

        const buyPrice  = item.value;
        const sellPrice = Math.max(1, Math.floor(item.value * 0.5));
        renderer.write(42, dr++, `Buy:  ${buyPrice}g`,  C.WHITE,  C.BLACK);
        renderer.write(42, dr++, `Sell: ${sellPrice}g`, C.YELLOW, C.BLACK);
        dr++;

        if (equipped) {
          renderer.write(42, dr++, '[Currently Equipped]', C.DARK_GRAY, C.BLACK);
          dr++;
        }

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

    // Action button
    const actionLabel = this.mode === 'buy' ? '[ Buy ]' : '[ Sell ]';
    renderer.write(2, 22, actionLabel, C.BLACK, C.GREEN);

    if (this.message) {
      renderer.write(12, 22, this.message.slice(0, COLS - 14), this.messageColor, C.BLACK);
    }

    renderer.write(2, ROWS - 2, '[↑↓] Select  [Enter] Confirm  [B/S] Toggle  [Esc] Leave', C.DARK_GRAY, C.BLACK);

    // Confirmation dialog overlay
    if (this._confirm) {
      const cx = Math.floor(COLS / 2) - 12;
      const cy = Math.floor(ROWS / 2) - 3;
      this._confirm.render(renderer, cx, cy);
    }
  }

  _shopTitle() {
    const role = this.npc?.shopRole || 'general';
    const titles = {
      blacksmith: 'BLACKSMITH',
      healer:     'HEALER\'S SUPPLY',
      tavern:     'THE TAVERN',
      general:    'SHOP',
    };
    return titles[role] || 'SHOP';
  }
}
