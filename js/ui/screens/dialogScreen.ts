// @ts-nocheck
import { C, COLS, ROWS, STATE } from '../../data/constants';
import { getLine } from '../../data/dialog';
import { acceptQuest, getAvailableQuestsAt, turnInQuest } from '../../systems/quest';
import { Menu } from '../menu';

const NPC_ROLE_LABELS: Record<string, string> = {
  quest_giver: 'Quest Giver',
  story:       'Story Character',
  innkeeper:   'Innkeeper',
  barkeep:     'Bartender',
  shopkeeper:  'Shopkeeper',
  healer:      'Healer',
  guard:       'Guard',
  villager:    'Villager',
  boss:        'Boss',
};

const NPC_PORTRAITS = {
  innkeeper:   ['  .---.  ', ' (  ͜  ) ', '  `---\'  ', ' [_|_|_] '],
  barkeep:     ['  .---. ', ' ( ͜ ͜ ) ', '  `---\' ', '  /|\\  '],
  shopkeeper:  ['  .---.  ', ' ( $ $)  ', '  `---\'  ', '  /|\\  '],
  guard:       ['  [===]  ', ' (  ͜  )  ', '  |   |  ', ' /|   |\\ '],
  villager:    ['  .---.  ', ' (  .  )  ', '  `---\'  ', '  /|\\  '],
  quest_giver: ['  .---.  ', ' ( ! !)  ', '  `---\'  ', '  /|\\  '],
  healer:      ['  .---.  ', ' ( + +)  ', '  `---\'  ', '  /|\\  '],
  story:       ['  .---.  ', ' ( * *)  ', '  `---\'  ', '  /|\\  '],
  boss:        ['  ~~~~  ', ' [X X]  ', '  ~--~  ', '  /|\\  '],
};

export class DialogScreen {
  constructor(game) {
    this.game       = game;
    this.session    = null;
    this.prevState  = STATE.LOCATION;
    this.npc        = null;
    this._lineIdx   = 0;
    this._charIdx   = 0;
    this._typeTimer = 0;
    this._typeDone  = false;
    this._questMenu = null;
    this._questMode = false;
    this._availableQuests = [];
  }

  enter(data) {
    this.session    = data?.session || null;
    this.npc        = data?.npc || null;
    this.prevState  = data?.prevState || STATE.LOCATION;
    this._lineIdx   = 0;
    this._charIdx   = 0;
    this._typeTimer = 0;
    this._typeDone  = false;
    this._questMode = false;
    this._questMenu = null;

    // Check for available quests for this specific NPC
    this._availableQuests = [];
    if (this.npc?.isQuestGiver) {
      if (this.npc.questIds?.length > 0) {
        // Filter to only this NPC's assigned quests
        this._availableQuests = (this.game.quests || []).filter(q =>
          q.status === 'available' && this.npc.questIds.includes(q.id)
        );
      } else if (this.game.currentLocation) {
        this._availableQuests = getAvailableQuestsAt(
          this.game.quests, this.game.currentLocation.id
        );
      }
    }
  }

  exit() {}

  update(dt) {
    if (!this._typeDone) {
      this._typeTimer += dt;
      const charsPerSecond = 40;
      const newIdx = Math.floor(this._typeTimer * charsPerSecond);
      const line   = this._getCurrentText();
      if (newIdx >= line.length) {
        this._charIdx = line.length;
        this._typeDone = true;
      } else {
        this._charIdx = newIdx;
      }
    }
  }

  _getCurrentText() {
    if (!this.session) return '';
    const line = this.session.lines[this._lineIdx];
    return line ? line.text : '';
  }

  _isLastLine() {
    if (!this.session) return true;
    return this._lineIdx >= this.session.lines.length - 1;
  }

  _advance() {
    if (!this._typeDone) {
      // Skip typewriter animation
      this._charIdx = this._getCurrentText().length;
      this._typeDone = true;
      return;
    }

    const line = this.session?.lines[this._lineIdx];

    // Handle action at end of line
    if (line?.action === 'inn') {
      this.game.changeState(STATE.INN, { npc: this.npc });
      return;
    }
    if (line?.action === 'shop') {
      this.game.changeState(STATE.SHOP, { npc: this.npc });
      return;
    }
    if (line?.action === 'quest_offer') {
      this._openQuestMenu();
      return;
    }
    if (line?.action === 'turn_in') {
      const completedQuest = (this.game.quests || []).find(q =>
        this.npc.questIds?.includes(q.id) && q.status === 'completed'
      );
      if (completedQuest) {
        const reward = turnInQuest(this.game.quests, completedQuest.id, this.game.player);
        if (reward) {
          this.game.addMessage(`Quest complete! Received ${reward.gold} gold and ${reward.xp} XP.`, 'quest');
        }
      }
      this.game.changeState(this.prevState);
      return;
    }
    if (line?.isFarewell || this._isLastLine()) {
      this.game.changeState(this.prevState);
      return;
    }

    // Show quest menu if NPC has quests after greeting
    if (this._lineIdx === 0 && this._availableQuests.length > 0 && !this._questMode) {
      this._lineIdx++;
      this._openQuestMenu();
      return;
    }

    // Advance to next line
    this._lineIdx++;
    this._charIdx  = 0;
    this._typeTimer = 0;
    this._typeDone  = false;
  }

  _openQuestMenu() {
    this._questMode = true;

    if (this._availableQuests.length === 1) {
      // Single quest: auto-offer with accept/decline
      const quest = this._availableQuests[0];
      const opts = [
        { label: `Accept: ${quest.title.slice(0, 40)}`, key: 'y', quest },
        { label: 'Decline',                              key: 'n' },
      ];
      this._questMenu = new Menu(opts);
      this._questMenu.onSelect = (i, opt) => {
        if (opt.quest) { this._offerQuest(opt.quest); return; }
        this._questMode = false;
        this.game.changeState(this.prevState);
      };
    } else {
      // Multiple quests: list to choose from
      const opts = this._availableQuests.map((q, i) => ({
        label: q.title.slice(0, 48),
        key:   String(i + 1),
        quest: q,
      }));
      opts.push({ label: 'Goodbye', key: 'x' });
      this._questMenu = new Menu(opts);
      this._questMenu.onSelect = (i, opt) => {
        if (opt.key === 'x') {
          this._questMode = false;
          this.game.changeState(this.prevState);
          return;
        }
        if (opt.quest) this._offerQuest(opt.quest);
      };
    }
  }

  _offerQuest(quest) {
    const accepted = acceptQuest(this.game.quests, quest.id, this.game.player);
    if (accepted) {
      this.game.addMessage(`Quest accepted: "${quest.title}"`, 'quest');
      this.game.addMessage(quest.hint || '', 'quest');
    }
    this._questMode = false;
    this.game.changeState(this.prevState);
  }

  handleKey(e) {
    if (this._questMode && this._questMenu) {
      if (e.key === 'Escape') {
        this._questMode = false;
        this.game.changeState(this.prevState);
        return;
      }
      this._questMenu.handleKey(e);
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this._advance();
    }
    if (e.key === 'Escape') {
      this.game.changeState(this.prevState);
    }
  }

  handleClick(col, row, button) {
    if (this._questMode && this._questMenu) {
      this._questMenu.handleClick(col, row, 10, 16);
      return;
    }
    // Click anywhere to advance
    this._advance();
  }

  handleMove(col, row) {
    if (this._questMode && this._questMenu) {
      this._questMenu.handleHover(col, row, 10, 14);
    }
  }

  handleScroll(dir) {}

  render(renderer) {
    renderer.clear(C.BLACK);
    if (!this.npc || !this.session) return;

    const npc = this.npc;

    // Background - darken
    renderer.fill(0, 0, COLS, ROWS, ' ', C.BLACK, C.BLACK);

    // Dialog box
    renderer.drawPanel(0, 14, COLS, 12, npc.name, C.WHITE, C.BLACK, 'double');

    // NPC portrait and dialog text — only when not showing quest menu
    if (!this._questMode) {
      const portraitLines = NPC_PORTRAITS[npc.type || 'villager'] || NPC_PORTRAITS.villager;
      for (let i = 0; i < portraitLines.length; i++) {
        renderer.write(2, 15 + i, portraitLines[i], C.CYAN, C.BLACK);
      }

      renderer.write(12, 15, npc.name, C.YELLOW, C.BLACK);
      renderer.write(12, 16, `(${NPC_ROLE_LABELS[npc.type] || npc.type || 'Villager'})`, C.DARK_GRAY, C.BLACK);

      const text = this._getCurrentText();
      const visible = text.slice(0, this._charIdx);
      const maxW = COLS - 14;
      const lines = wrapText(visible, maxW);
      for (let i = 0; i < lines.length && i < 4; i++) {
        renderer.write(12, 18 + i, lines[i], C.WHITE, C.BLACK);
      }

      if (this._typeDone && this.game.blinkOn) {
        renderer.write(12, 18 + Math.min(lines.length, 3), '▶', C.YELLOW, C.BLACK);
      }
    }

    // Quest menu
    if (this._questMode && this._questMenu) {
      renderer.drawPanel(8, 12, COLS - 16, 12, 'QUESTS AVAILABLE', C.CYAN, C.BLACK);
      this._questMenu.render(renderer, 10, 14, { width: COLS - 20 });
    }

    // Hint — fill only the interior columns so the dialog panel border is preserved
    renderer.fill(1, 25, COLS - 2, 1, ' ', C.BLACK, C.BLACK);
    if (!this._questMode) {
      renderer.write(1, 25, 'Space/Enter: Continue  Escape: Close', C.DARK_GRAY, C.BLACK);
    }

    // Show scene background (top portion with NPC description)
    renderer.drawPanel(0, 0, COLS, 14, npc.name.toUpperCase(), C.DARK_CYAN, C.BLACK);
    // Big NPC symbol
    const sym = npc.isBoss ? npc.symbol || 'X' : '☺';
    renderer.write(COLS / 2 - 2, 4, sym, npc.isBoss ? C.RED : C.YELLOW, C.BLACK);
    renderer.write(COLS / 2 - 1, 5, sym, npc.isBoss ? C.RED : C.YELLOW, C.BLACK);
    renderer.writeCenter(7, `"${npc.name}"`, C.LIGHT_GRAY, C.BLACK);
    renderer.writeCenter(9, `[ ${(NPC_ROLE_LABELS[npc.type] || npc.type || 'Villager').toUpperCase()} ]`, C.DARK_CYAN, C.BLACK);
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
