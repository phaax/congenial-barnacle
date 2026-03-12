// @ts-nocheck
import { C, COLS, ROWS, STATE, MAIN_COLS } from '../../data/constants';
import { QUEST_STATUS } from '../../data/quests';
import { getItem } from '../../data/items';
import { ScrollList } from '../menu';

export class QuestLogScreen {
  constructor(game) {
    this.game      = game;
    this.prevState = STATE.WORLD_MAP;
    this.list      = new ScrollList();
    this.selected  = null;
    this.tab       = 'active'; // active, available, completed
  }

  enter(data) {
    this.prevState = data?.prevState || STATE.WORLD_MAP;
    this._refreshList();
  }

  exit() {}

  _getMainQuestEntry() {
    const goal = this.game.world?.goal;
    if (!goal) return null;
    return {
      _isMainQuest: true,
      title: `\u2605 ${goal.name}`,
      status: goal.completed ? QUEST_STATUS.TURNED_IN : QUEST_STATUS.ACTIVE,
      giverLocName: 'Main Objective',
      description: Array.isArray(goal.description) ? goal.description.join(' ') : goal.description,
      steps: goal.steps,
      reward: null,
    };
  }

  _getQuests() {
    const quests = this.game.quests || [];
    if (this.tab === 'active') {
      const main = this._getMainQuestEntry();
      const active = quests.filter(q => q.status === QUEST_STATUS.ACTIVE);
      return main ? [main, ...active] : active;
    }
    if (this.tab === 'available') return quests.filter(q => q.status === QUEST_STATUS.AVAILABLE);
    if (this.tab === 'completed') return quests.filter(q => q.status === QUEST_STATUS.COMPLETED || q.status === QUEST_STATUS.TURNED_IN);
    return [];
  }

  _refreshList() {
    const quests = this._getQuests();
    this.list.setItems(quests, 16);
    this.list.onSelect = (i, q) => { this.selected = q; };
    this.selected = quests.length > 0 ? quests[0] : null;
    if (quests.length > 0) this.list.selected = 0;
  }

  update(dt) {}

  handleKey(e) {
    if (e.key === 'Escape' || e.key === 'q' || e.key === 'Q') {
      this.game.changeState(this.prevState);
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const tabs = ['active', 'available', 'completed'];
      const idx  = tabs.indexOf(this.tab);
      this.tab   = tabs[(idx + 1) % tabs.length];
      this._refreshList();
      return;
    }
    if (e.key === '1') { this.tab = 'active';    this._refreshList(); return; }
    if (e.key === '2') { this.tab = 'available'; this._refreshList(); return; }
    if (e.key === '3') { this.tab = 'completed'; this._refreshList(); return; }

    if (this.list.handleKey(e)) {
      const quests = this._getQuests();
      this.selected = quests[this.list.selected] || null;
    }
  }

  handleClick(col, row, button) {
    if (row === 2) {
      if (col >= 2  && col <= 14) { this.tab = 'active';    this._refreshList(); return; }
      if (col >= 16 && col <= 30) { this.tab = 'available'; this._refreshList(); return; }
      if (col >= 32 && col <= 46) { this.tab = 'completed'; this._refreshList(); return; }
    }
    if (row >= 5 && row < 22) {
      this.list.handleClick(col, row, 1, 5, 38);
      const quests = this._getQuests();
      this.selected = quests[this.list.selected] || null;
    }
  }

  handleMove(col, row) {
    if (row >= 5 && row < 22) {
      this.list.handleHover(col, row, 1, 5, 38);
      const quests = this._getQuests();
      this.selected = quests[this.list.selected] || null;
    }
  }

  handleScroll(dir) {
    this.list.handleScroll(dir);
    const quests = this._getQuests();
    this.selected = quests[this.list.selected] || null;
  }

  render(renderer) {
    renderer.clear(C.BLACK);
    renderer.drawPanel(0, 0, COLS, ROWS, 'QUEST LOG', C.YELLOW, C.BLACK, 'double');

    // Tabs
    const tabDefs = [
      { key: 'active',    label: '[1] Active'    },
      { key: 'available', label: '[2] Available' },
      { key: 'completed', label: '[3] Completed' },
    ];
    let tc = 2;
    for (const t of tabDefs) {
      const fg = this.tab === t.key ? C.BLACK : C.WHITE;
      const bg = this.tab === t.key ? C.CYAN  : C.BLACK;
      renderer.write(tc, 2, t.label, fg, bg);
      tc += t.label.length + 2;
    }

    renderer.hline(1, 3, COLS - 2, '─', C.DARK_GRAY);

    // Quest list
    const quests = this._getQuests();
    if (quests.length === 0) {
      renderer.write(2, 5, '(No quests)', C.DARK_GRAY, C.BLACK);
    } else {
      this.list.render(renderer, 1, 5, 38, {
        fg: C.WHITE, bg: C.BLACK, selFg: C.BLACK, selBg: C.YELLOW,
        renderItem: (r, col, row, q, isSel, width, fg, bg) => {
          const label = q.title.slice(0, width).padEnd(width);
          r.write(col, row, label, fg, bg);
        }
      });
    }

    // Divider between list and details
    renderer.vline(40, 4, 20, '│', C.DARK_GRAY);
    renderer.write(42, 4, 'DETAILS', C.CYAN, C.BLACK);

    // Quest details
    if (this.selected) {
      const q = this.selected;
      let row = 6;

      renderer.write(42, row++, q.title.slice(0, COLS - 44), C.YELLOW, C.BLACK);
      row++;

      const statusColors = {
        [QUEST_STATUS.AVAILABLE]: C.LIGHT_GRAY,
        [QUEST_STATUS.ACTIVE]:    C.GREEN,
        [QUEST_STATUS.COMPLETED]: C.CYAN,
        [QUEST_STATUS.TURNED_IN]: C.DARK_GRAY,
      };
      const statusLabel = q.status.charAt(0) + q.status.slice(1).toLowerCase();
      renderer.write(42, row++, `Status: ${statusLabel}`, statusColors[q.status] || C.WHITE, C.BLACK);
      renderer.write(42, row++, `Location: ${q.giverLocName}`, C.LIGHT_GRAY, C.BLACK);
      row++;

      // Description
      if (q.description) {
        const words = q.description.split(' ');
        let line = '';
        for (const word of words) {
          if ((line + word).length > COLS - 44) {
            renderer.write(42, row++, line.trim(), C.DARK_GRAY, C.BLACK);
            line = word + ' ';
          } else {
            line += word + ' ';
          }
          if (row > 22) break;
        }
        if (line.trim() && row <= 22) renderer.write(42, row++, line.trim(), C.DARK_GRAY, C.BLACK);
        row++;
      }

      // Main quest: show objectives/steps
      if (q._isMainQuest && q.steps) {
        renderer.write(42, row++, 'Objectives:', C.WHITE, C.BLACK);
        for (const step of q.steps) {
          if (row > 26) break;
          const check = step.done ? '\u2713' : '\u25cb';
          const color = step.done ? C.DARK_GRAY : C.GREEN;
          renderer.write(44, row++, `${check} ${step.text}`.slice(0, COLS - 46), color, C.BLACK);
        }
      } else {
        // Progress
        if (q.status === QUEST_STATUS.ACTIVE && q.progressMax > 0) {
          renderer.write(42, row++, `Progress: ${q.progress}/${q.progressMax}`, C.GREEN, C.BLACK);
          row++;
        }

        // Reward
        renderer.write(42, row++, 'Reward:', C.WHITE, C.BLACK);
        if (q.reward) {
          if (q.reward.gold) renderer.write(44, row++, `${q.reward.gold} gold`, C.YELLOW, C.BLACK);
          if (q.reward.xp)   renderer.write(44, row++, `${q.reward.xp} XP`,   C.CYAN,   C.BLACK);
          for (const item of (q.reward.items || [])) {
            if (row > 26) break;
            const itemDef = getItem(item.id);
            const itemLabel = (itemDef?.name || item.id) + (item.qty > 1 ? ` x${item.qty}` : '');
            renderer.write(44, row++, itemLabel, C.WHITE, C.BLACK);
          }
        }
      }
    }

    renderer.hline(1, ROWS - 3, COLS - 2, '─', C.DARK_GRAY);
    renderer.write(2, ROWS - 2, '[1/2/3] Tab  [↑↓] Select  [Esc/Q] Close', C.DARK_GRAY, C.BLACK);
  }
}
