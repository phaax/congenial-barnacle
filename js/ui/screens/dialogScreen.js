import { C, COLS, ROWS, STATE } from '../../data/constants.js';
import { getLine } from '../../data/dialog.js';
import { acceptQuest, getAvailableQuestsAt, turnInQuest } from '../../systems/quest.js';
import { Menu } from '../menu.js';

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

    // Check for available quests at this location
    this._availableQuests = [];
    if (this.npc?.isQuestGiver && this.game.currentLocation) {
      this._availableQuests = getAvailableQuestsAt(
        this.game.quests, this.game.currentLocation.id
      );
    }
  }

  exit() {}

  update(dt) {
    if (!this._typeDone) {
      this._typeTimer += dt;
      const charsPerSecond = 40;
      const newIdx = Math.floor(this._typeTimer / (1000 / charsPerSecond));
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
    const opts = this._availableQuests.map((q, i) => ({
      label: q.title,
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
      if (opt.quest) {
        this._offerQuest(opt.quest);
      }
    };
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

  handleScroll(dir) {}

  render(renderer) {
    renderer.clear(C.BLACK);
    if (!this.npc || !this.session) return;

    const npc = this.npc;

    // Background - darken
    renderer.fill(0, 0, COLS, ROWS, ' ', C.BLACK, C.BLACK);

    // Dialog box
    renderer.drawPanel(0, 14, COLS, 12, npc.name, C.WHITE, C.BLACK, 'double');

    // NPC portrait
    const portraitLines = NPC_PORTRAITS[npc.type || 'villager'] || NPC_PORTRAITS.villager;
    for (let i = 0; i < portraitLines.length; i++) {
      renderer.write(2, 15 + i, portraitLines[i], C.CYAN, C.BLACK);
    }

    // NPC name
    renderer.write(12, 15, npc.name, C.YELLOW, C.BLACK);
    renderer.write(12, 16, `(${npc.type || 'villager'})`, C.DARK_GRAY, C.BLACK);

    // Dialog text (typewriter effect)
    const text = this._getCurrentText();
    const visible = text.slice(0, this._charIdx);
    const maxW = COLS - 14;
    const lines = wrapText(visible, maxW);
    for (let i = 0; i < lines.length && i < 4; i++) {
      renderer.write(12, 18 + i, lines[i], C.WHITE, C.BLACK);
    }

    // Blink cursor when done typing
    if (this._typeDone && this.game.blinkOn) {
      renderer.write(12, 18 + Math.min(lines.length, 3), '▶', C.YELLOW, C.BLACK);
    }

    // Quest menu
    if (this._questMode && this._questMenu) {
      renderer.drawPanel(8, 12, COLS - 16, 12, 'QUESTS AVAILABLE', C.CYAN, C.BLACK);
      this._questMenu.render(renderer, 10, 14, { width: COLS - 20 });
    }

    // Hint
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
    renderer.writeCenter(9, npc.type === 'story' ? '[ STORY CHARACTER ]' : `[ ${(npc.type || 'villager').toUpperCase()} ]`, C.DARK_CYAN, C.BLACK);
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
