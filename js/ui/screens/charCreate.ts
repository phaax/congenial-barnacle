// @ts-nocheck
import { C, COLS, ROWS, STATE } from '../../data/constants';
import { RACES } from '../../data/races';
import { SKILLS } from '../../data/skills';
import { BACKGROUNDS } from '../../data/backgrounds';
import { ScrollList } from '../../ui/menu';

// Character creation wizard steps
const STEP = {
  NAME:       'NAME',
  RACE:       'RACE',
  GENDER:     'GENDER',
  BACKGROUND: 'BACKGROUND',
  SKILLS:     'SKILLS',
  CONFIRM:    'CONFIRM',
};

const STEP_ORDER = [STEP.NAME, STEP.RACE, STEP.GENDER, STEP.BACKGROUND, STEP.SKILLS, STEP.CONFIRM];

const GENDERS = [
  { id: 'Male',   label: 'Male',   desc: 'The classic male hero. No stat differences.' },
  { id: 'Female', label: 'Female', desc: 'The classic female hero. No stat differences.' },
  { id: 'Other',  label: 'Other',  desc: 'Your own identity. No stat differences.' },
];

const STAT_NAMES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
const STAT_KEYS  = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

// Base stats before any modifiers
const BASE_STATS = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };

// Min/max skill picks (base)
const MIN_SKILLS = 2;
const BASE_SKILLS = 2; // humans get +1 bonus slot

export class CharCreateScreen {
  constructor(game) {
    this.game = game;

    this.step        = STEP.NAME;
    this.nameInput   = '';
    this.nameCursor  = true;
    this.nameTimer   = 0;

    this.raceList    = new ScrollList();
    this.raceList.setItems(RACES, 5);

    this.genderList  = new ScrollList();
    this.genderList.setItems(GENDERS, 3);

    this.bgList      = new ScrollList();
    this.bgList.setItems(BACKGROUNDS, 6);

    this.skillList   = new ScrollList();
    this.skillList.setItems(SKILLS, 8);
    this.selectedSkills = [];

    this.errorMsg    = '';
    this.errorTimer  = 0;

    this._bindCallbacks();
  }

  _bindCallbacks() {
    // Nothing to bind; we handle selection manually per step
  }

  enter(data) {
    this.step           = STEP.NAME;
    this.nameInput      = '';
    this.selectedSkills = [];
    this.errorMsg       = '';
    this.raceList.selected   = 0;
    this.genderList.selected = 0;
    this.bgList.selected     = 0;
    this.skillList.selected  = 0;
    this.raceList.scroll     = 0;
    this.bgList.scroll       = 0;
    this.skillList.scroll    = 0;
  }

  exit() {}

  // ─── Computed Helpers ────────────────────────────────────────────────────────

  _currentRace() {
    return RACES[this.raceList.selected] || RACES[0];
  }

  _currentBackground() {
    return BACKGROUNDS[this.bgList.selected] || BACKGROUNDS[0];
  }

  _currentGender() {
    return GENDERS[this.genderList.selected] || GENDERS[0];
  }

  _maxSkills() {
    const race = this._currentRace();
    return BASE_SKILLS + (race.bonusSkillSlots || 0);
  }

  _computeStats() {
    const stats  = { ...BASE_STATS };
    const race   = this._currentRace();
    const bg     = this._currentBackground();

    for (const k of STAT_KEYS) {
      stats[k] += (race.statMods?.[k]  || 0);
      stats[k] += (bg.statMods?.[k]    || 0);
    }
    return stats;
  }

  _stepIndex() {
    return STEP_ORDER.indexOf(this.step);
  }

  _setError(msg) {
    this.errorMsg   = msg;
    this.errorTimer = 3;
  }

  // ─── Input ───────────────────────────────────────────────────────────────────

  handleKey(event) {
    const key = event.key;

    // Clear error on any input
    if (this.errorMsg) this.errorMsg = '';

    if (this.step === STEP.NAME) {
      this._handleNameInput(event);
      return;
    }

    // Global navigation
    if (key === 'Escape') {
      event.preventDefault();
      this._prevStep();
      return;
    }

    if (this.step === STEP.RACE)       { this._handleListKey(event, this.raceList);   return; }
    if (this.step === STEP.GENDER)     { this._handleListKey(event, this.genderList); return; }
    if (this.step === STEP.BACKGROUND) { this._handleListKey(event, this.bgList);     return; }
    if (this.step === STEP.SKILLS)     { this._handleSkillsKey(event);                return; }
    if (this.step === STEP.CONFIRM)    { this._handleConfirmKey(event);               return; }
  }

  handleClick(col, row, button) {
    // Left panel list area: rows 4-20
    if (this.step === STEP.NAME) return;

    const listX = 2;
    const listW = 38;
    const listY = 5;
    const listH = 15;

    if (col >= listX && col < listX + listW && row >= listY && row < listY + listH) {
      if (this.step === STEP.RACE)       this.raceList.handleClick(col, row, listX, listY, listW);
      if (this.step === STEP.GENDER)     this._handleGenderClick(row);
      if (this.step === STEP.BACKGROUND) this.bgList.handleClick(col, row, listX, listY, listW);
      if (this.step === STEP.SKILLS)     this._handleSkillsClick(col, row, listX, listY, listW);
    }

    // Next / Back buttons (rendered at row ROWS-4)
    if (row === ROWS - 4) {
      if (col >= 55 && col < 65) this._nextStep();
      if (col >= 67 && col < 77) this._prevStep();
    }
  }

  handleScroll(dir) {
    if (this.step === STEP.RACE)       { if (dir > 0) this.raceList.moveDown();  else this.raceList.moveUp();  }
    if (this.step === STEP.GENDER)     { if (dir > 0) this.genderList.moveDown();else this.genderList.moveUp();}
    if (this.step === STEP.BACKGROUND) { if (dir > 0) this.bgList.moveDown();    else this.bgList.moveUp();    }
    if (this.step === STEP.SKILLS)     { if (dir > 0) this.skillList.moveDown(); else this.skillList.moveUp(); }
  }

  handleMove(col, row) {
    if (this.step === STEP.NAME || this.step === STEP.CONFIRM) return;
    const listX = 4; // render col = listX+2=4
    const listY = 5;
    const listW = 36;
    if (col < listX || col >= listX + listW) return;

    if (this.step === STEP.GENDER) {
      // Gender items at rows 6, 8, 10 (listY=6, spacing=2)
      for (let i = 0; i < GENDERS.length; i++) {
        if (row === 6 + i * 2) { this.genderList.selected = i; return; }
      }
      return;
    }
    if (this.step === STEP.RACE)       { this.raceList.handleHover(col, row, listX, listY, listW);   return; }
    if (this.step === STEP.BACKGROUND) { this.bgList.handleHover(col, row, listX, listY, listW);     return; }
    if (this.step === STEP.SKILLS)     { this.skillList.handleHover(col, row, listX, listY, listW);  return; }
  }

  update(dt) {
    // Cursor blink
    this.nameTimer += dt;
    if (this.nameTimer >= 0.5) {
      this.nameTimer  = 0;
      this.nameCursor = !this.nameCursor;
    }

    // Error message timeout
    if (this.errorTimer > 0) {
      this.errorTimer -= dt;
      if (this.errorTimer <= 0) this.errorMsg = '';
    }
  }

  // ─── Step Transitions ────────────────────────────────────────────────────────

  _nextStep() {
    if (!this._validateCurrentStep()) return;

    const idx = this._stepIndex();
    if (idx < STEP_ORDER.length - 1) {
      this.step = STEP_ORDER[idx + 1];
    } else {
      this._finish();
    }
  }

  _prevStep() {
    const idx = this._stepIndex();
    if (idx > 0) {
      this.step = STEP_ORDER[idx - 1];
    } else {
      this.game.changeState(STATE.MAIN_MENU);
    }
  }

  _validateCurrentStep() {
    if (this.step === STEP.NAME) {
      const trimmed = this.nameInput.trim();
      if (trimmed.length < 2) {
        this._setError('Name must be at least 2 characters.');
        return false;
      }
      if (trimmed.length > 16) {
        this._setError('Name cannot exceed 16 characters.');
        return false;
      }
    }
    if (this.step === STEP.SKILLS) {
      if (this.selectedSkills.length < MIN_SKILLS) {
        this._setError(`Choose at least ${MIN_SKILLS} skills.`);
        return false;
      }
    }
    return true;
  }

  _finish() {
    const stats = this._computeStats();
    const race  = this._currentRace();

    const playerConfig = {
      name:       this.nameInput.trim(),
      race:       race.id,
      gender:     this._currentGender().id,
      background: this._currentBackground().id,
      skills:     [...this.selectedSkills],
      stats,
      hp:    race.startHp,
      maxHp: race.startHp,
      mp:    race.startMp,
      maxMp: race.startMp,
    };

    this.game.startNewGame(playerConfig);
  }

  // ─── Key Handlers ────────────────────────────────────────────────────────────

  _handleNameInput(event) {
    const key = event.key;

    if (key === 'Enter') {
      event.preventDefault();
      this._nextStep();
      return;
    }
    if (key === 'Escape') {
      event.preventDefault();
      this.game.changeState(STATE.MAIN_MENU);
      return;
    }
    if (key === 'Backspace') {
      event.preventDefault();
      this.nameInput = this.nameInput.slice(0, -1);
      return;
    }
    // Printable character
    if (key.length === 1 && this.nameInput.length < 16) {
      event.preventDefault();
      this.nameInput += key;
    }
  }

  _handleListKey(event, list) {
    const key = event.key;
    if (key === 'ArrowUp'   || key === 'k' || key === 'w') { event.preventDefault(); list.moveUp();   return; }
    if (key === 'ArrowDown' || key === 'j' || key === 's') { event.preventDefault(); list.moveDown(); return; }
    if (key === 'Enter' || key === 'Tab')                  { event.preventDefault(); this._nextStep(); return; }
  }

  _handleSkillsKey(event) {
    const key = event.key;
    if (key === 'ArrowUp'   || key === 'k') { event.preventDefault(); this.skillList.moveUp();   return; }
    if (key === 'ArrowDown' || key === 'j') { event.preventDefault(); this.skillList.moveDown(); return; }
    if (key === ' ') {
      event.preventDefault();
      this._toggleSkill(this.skillList.selected);
      return;
    }
    if (key === 'Enter' || key === 'Tab') {
      event.preventDefault();
      // If max skills selected, Enter advances; otherwise toggle
      if (this.selectedSkills.length >= this._maxSkills()) {
        this._nextStep();
      } else {
        this._toggleSkill(this.skillList.selected);
      }
      return;
    }
  }

  _handleGenderClick(row) {
    // Genders render at rows 6, 8, 10 (listY=6, spacing=2)
    for (let i = 0; i < GENDERS.length; i++) {
      if (row === 6 + i * 2) { this.genderList.selected = i; return; }
    }
  }

  _handleSkillsClick(col, row, listX, listY, listW) {
    const idx = this.skillList.scroll + (row - listY);
    if (idx >= 0 && idx < SKILLS.length) {
      this.skillList.selected = idx;
      this._toggleSkill(idx);
    }
  }

  _handleConfirmKey(event) {
    const key = event.key;
    if (key === 'Enter' || key === 'y' || key === 'Y') {
      event.preventDefault();
      this._finish();
    }
    if (key === 'Escape' || key === 'n' || key === 'N') {
      event.preventDefault();
      this._prevStep();
    }
  }

  _toggleSkill(idx) {
    const skill = SKILLS[idx];
    if (!skill) return;
    const alreadySelected = this.selectedSkills.includes(skill.id);
    if (alreadySelected) {
      this.selectedSkills = this.selectedSkills.filter(s => s !== skill.id);
    } else {
      const max = this._maxSkills();
      if (this.selectedSkills.length >= max) {
        this._setError(`You can only choose ${max} skills.`);
        return;
      }
      this.selectedSkills.push(skill.id);
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  render(renderer) {
    renderer.clear(C.BLACK);
    this._renderFrame(renderer);
    this._renderProgress(renderer);

    if (this.step === STEP.NAME)       this._renderNameStep(renderer);
    else if (this.step === STEP.RACE)       this._renderRaceStep(renderer);
    else if (this.step === STEP.GENDER)     this._renderGenderStep(renderer);
    else if (this.step === STEP.BACKGROUND) this._renderBackgroundStep(renderer);
    else if (this.step === STEP.SKILLS)     this._renderSkillsStep(renderer);
    else if (this.step === STEP.CONFIRM)    this._renderConfirmStep(renderer);

    this._renderStatPreview(renderer);
    this._renderNavHints(renderer);
    this._renderError(renderer);
  }

  _renderFrame(renderer) {
    renderer.drawBox(0, 0, COLS, ROWS, C.DARK_BLUE, C.BLACK, 'double', false);
    renderer.writeCenter(0, ' CHARACTER CREATION ', C.YELLOW, C.BLACK);

    // Divider between main and stats panel
    for (let r = 1; r < ROWS - 1; r++) {
      renderer.set(42, r, '│', C.DARK_BLUE, C.BLACK);
    }
    renderer.set(42, 0,       '╦', C.DARK_BLUE, C.BLACK);
    renderer.set(42, ROWS - 1,'╩', C.DARK_BLUE, C.BLACK);
  }

  _renderProgress(renderer) {
    const stepLabels = ['Name', 'Race', 'Gender', 'Background', 'Skills', 'Confirm'];
    const current    = this._stepIndex();
    const total      = STEP_ORDER.length;

    // "Step 2/6: Race" — compact single-line header that fits left panel
    renderer.write(2, 2, `Step ${current + 1}/${total}: `, C.DARK_GRAY, C.BLACK);
    renderer.write(14, 2, stepLabels[current], C.YELLOW, C.BLACK);

    // Progress dots: ■ done, ▶ current, · pending
    for (let i = 0; i < total; i++) {
      const ch = i < current ? '■' : (i === current ? '▶' : '·');
      const fg = i < current ? C.GREEN : (i === current ? C.YELLOW : C.DARK_GRAY);
      renderer.set(28 + i * 2, 2, ch, fg, C.BLACK);
    }

    // Divider line
    for (let c = 1; c < 42; c++) renderer.set(c, 3, '─', C.DARK_BLUE, C.BLACK);
    renderer.set(0,  3, '╠', C.DARK_BLUE, C.BLACK);
    renderer.set(42, 3, '╬', C.DARK_BLUE, C.BLACK);
  }

  _renderNameStep(renderer) {
    renderer.writeCenter(5, 'ENTER YOUR CHARACTER\'S NAME', C.WHITE, C.BLACK, 1, 41);

    const boxX = 4, boxY = 8, boxW = 34, boxH = 3;
    renderer.drawBox(boxX, boxY, boxW, boxH, C.LIGHT_GRAY, C.BLACK, 'single', true);

    const display = this.nameInput + (this.nameCursor ? '_' : ' ');
    renderer.write(boxX + 1, boxY + 1, display.padEnd(boxW - 2), C.YELLOW, C.BLACK);

    renderer.write(2, 12, 'Your name will define how NPCs address you', C.DARK_GRAY, C.BLACK);
    renderer.write(2, 13, 'throughout the adventure.', C.DARK_GRAY, C.BLACK);
    renderer.write(2, 15, 'Use letters, spaces, hyphens (max 16 chars).', C.DARK_GRAY, C.BLACK);

    renderer.writeCenter(18, 'Press ENTER to continue', C.DARK_CYAN, C.BLACK, 1, 41);
  }

  _renderRaceStep(renderer) {
    renderer.write(2, 4, 'CHOOSE YOUR RACE', C.WHITE, C.BLACK);

    // List
    const listX = 2, listY = 5, listW = 38;
    this.raceList.visibleH = 5;
    this.raceList.render(renderer, listX + 2, listY, listW - 2, {
      fg: C.WHITE, bg: C.BLACK, selFg: C.BLACK, selBg: C.YELLOW,
      renderItem: (r, col, row, item, isSel, w, fg, bg) => {
        const label = (item.name).padEnd(w);
        r.write(col, row, label, fg, bg);
      },
    });

    // Selected race description
    const race = this._currentRace();
    renderer.write(2, 11, '─'.repeat(38), C.DARK_BLUE, C.BLACK);
    this._wrapWrite(renderer, 2, 12, race.description, 38, C.LIGHT_GRAY, C.BLACK, 2);

    renderer.write(2, 15, 'Traits:', C.YELLOW, C.BLACK);
    let ty = 16;
    for (const trait of (race.traits || []).slice(0, 3)) {
      renderer.write(2, ty, `• ${trait.name}: `, C.CYAN, C.BLACK);
      this._wrapWrite(renderer, 4, ty + 1, trait.desc, 36, C.DARK_GRAY, C.BLACK);
      ty += 2;
    }
  }

  _renderGenderStep(renderer) {
    renderer.write(2, 4, 'CHOOSE YOUR GENDER', C.WHITE, C.BLACK);

    const listX = 4, listY = 6;
    for (let i = 0; i < GENDERS.length; i++) {
      const g = GENDERS[i];
      const isSelected = i === this.genderList.selected;
      const fg = isSelected ? C.BLACK : C.WHITE;
      const bg = isSelected ? C.YELLOW : C.BLACK;
      if (isSelected) renderer.write(listX - 2, listY + i * 2, '►', C.YELLOW, C.BLACK);
      renderer.write(listX, listY + i * 2, g.label.padEnd(20), fg, bg);
    }

    const g = this._currentGender();
    renderer.write(2, 14, '─'.repeat(38), C.DARK_BLUE, C.BLACK);
    this._wrapWrite(renderer, 2, 15, g.desc, 38, C.LIGHT_GRAY, C.BLACK);
  }

  _renderBackgroundStep(renderer) {
    renderer.write(2, 4, 'CHOOSE YOUR BACKGROUND', C.WHITE, C.BLACK);

    const listX = 2, listY = 5, listW = 38;
    this.bgList.visibleH = 6;
    this.bgList.render(renderer, listX + 2, listY, listW - 2, {
      fg: C.WHITE, bg: C.BLACK, selFg: C.BLACK, selBg: C.YELLOW,
      renderItem: (r, col, row, item, isSel, w, fg, bg) => {
        const label = item.name.padEnd(w);
        r.write(col, row, label, fg, bg);
      },
    });

    const bg = this._currentBackground();
    renderer.write(2, 12, '─'.repeat(38), C.DARK_BLUE, C.BLACK);
    this._wrapWrite(renderer, 2, 13, bg.description, 38, C.LIGHT_GRAY, C.BLACK, 2);

    renderer.write(2, 16, 'Starting gold: ', C.DARK_GRAY, C.BLACK);
    renderer.write(17, 16, String(bg.startingGold) + 'g', C.YELLOW, C.BLACK);

    renderer.write(2, 17, 'Trait: ', C.DARK_GRAY, C.BLACK);
    renderer.write(9, 17, bg.trait?.name || '-', C.CYAN, C.BLACK);

    renderer.write(2, 18, 'Recommends: ', C.DARK_GRAY, C.BLACK);
    const rec = (bg.startingSkillRecommend || []).join(', ');
    renderer.write(14, 18, rec.slice(0, 26), C.GREEN, C.BLACK);
  }

  _renderSkillsStep(renderer) {
    const max = this._maxSkills();
    renderer.write(2, 4, `CHOOSE ${max} SKILL${max > 1 ? 'S' : ''}  (${this.selectedSkills.length}/${max} selected)`, C.WHITE, C.BLACK);

    const listX = 2, listY = 5, listW = 38;
    this.skillList.visibleH = 8;
    this.skillList.render(renderer, listX + 2, listY, listW - 2, {
      fg: C.WHITE, bg: C.BLACK, selFg: C.BLACK, selBg: C.YELLOW,
      renderItem: (r, col, row, item, isSel, w, fg, bg) => {
        const picked = this.selectedSkills.includes(item.id);
        const check  = picked ? '[X]' : '[ ]';
        const label  = `${check} ${item.icon} ${item.name}`.padEnd(w);
        const itemFg = picked ? C.GREEN : fg;
        r.write(col, row, label, itemFg, bg);
      },
    });

    const skill = SKILLS[this.skillList.selected];
    if (skill) {
      renderer.write(2, 14, '─'.repeat(38), C.DARK_BLUE, C.BLACK);
      renderer.write(2, 15, skill.name, C.YELLOW, C.BLACK);
      this._wrapWrite(renderer, 2, 16, skill.description, 38, C.LIGHT_GRAY, C.BLACK);

      renderer.write(2, 19, 'Abilities:', C.CYAN, C.BLACK);
      let ay = 20;
      for (const ab of (skill.abilities || []).slice(0, 2)) {
        renderer.write(2, ay, `• ${ab.name} (${ab.mpCost}MP): `, C.DARK_CYAN, C.BLACK);
        ay++;
        this._wrapWrite(renderer, 4, ay, ab.desc, 36, C.DARK_GRAY, C.BLACK);
        ay++;
      }
    }

    renderer.write(2, ROWS - 5, 'SPACE to select/deselect', C.DARK_GRAY, C.BLACK);
  }

  _renderConfirmStep(renderer) {
    renderer.writeCenter(5, 'CONFIRM YOUR CHARACTER', C.WHITE, C.BLACK, 1, 41);

    const stats  = this._computeStats();
    const race   = this._currentRace();
    const bg     = this._currentBackground();
    const gender = this._currentGender();

    let r = 7;
    renderer.write(2, r,   'Name:       ', C.DARK_GRAY, C.BLACK);
    renderer.write(14, r,  this.nameInput, C.YELLOW, C.BLACK);
    r++;
    renderer.write(2, r,   'Race:       ', C.DARK_GRAY, C.BLACK);
    renderer.write(14, r,  race.name, C.WHITE, C.BLACK);
    r++;
    renderer.write(2, r,   'Gender:     ', C.DARK_GRAY, C.BLACK);
    renderer.write(14, r,  gender.id, C.WHITE, C.BLACK);
    r++;
    renderer.write(2, r,   'Background: ', C.DARK_GRAY, C.BLACK);
    renderer.write(14, r,  bg.name, C.WHITE, C.BLACK);
    r++;
    renderer.write(2, r,   'Skills:     ', C.DARK_GRAY, C.BLACK);
    const skillsStr = this.selectedSkills.join(', ') || '(none)';
    renderer.write(14, r, skillsStr.slice(0, 27), C.GREEN, C.BLACK);
    r += 2;

    renderer.write(2, r, 'Stats:', C.YELLOW, C.BLACK);
    r++;
    for (const k of STAT_KEYS) {
      renderer.write(4, r,  STAT_NAMES[STAT_KEYS.indexOf(k)] + ':', C.DARK_GRAY, C.BLACK);
      renderer.write(8, r,  String(stats[k]).padStart(2), C.WHITE, C.BLACK);

      const baseMod = (race.statMods?.[k] || 0) + (bg.statMods?.[k] || 0);
      if (baseMod !== 0) {
        const modStr = (baseMod > 0 ? '+' : '') + baseMod;
        renderer.write(11, r, modStr, baseMod > 0 ? C.GREEN : C.RED, C.BLACK);
      }
      r++;
    }

    r++;
    renderer.write(2, r, 'HP: ', C.DARK_GRAY, C.BLACK);
    renderer.write(6, r, String(race.startHp), C.RED, C.BLACK);
    renderer.write(12, r, 'MP: ', C.DARK_GRAY, C.BLACK);
    renderer.write(16, r, String(race.startMp), C.BLUE, C.BLACK);
    r++;
    renderer.write(2, r, 'Gold: ', C.DARK_GRAY, C.BLACK);
    renderer.write(8, r, String(bg.startingGold) + 'g', C.YELLOW, C.BLACK);

    renderer.writeCenter(ROWS - 5, 'Press ENTER to begin your adventure!', C.GREEN, C.BLACK, 1, 41);
    renderer.writeCenter(ROWS - 4, 'Press ESCAPE to go back.', C.DARK_GRAY, C.BLACK, 1, 41);
  }

  _renderStatPreview(renderer) {
    if (this.step === STEP.NAME) return;

    // Right stats panel (cols 43..79)
    const px = 44;
    let r = 4;
    renderer.write(px, r, 'STAT PREVIEW', C.YELLOW, C.BLACK);
    r++;
    renderer.write(px, r, '─'.repeat(34), C.DARK_BLUE, C.BLACK);
    r++;

    const stats = this._computeStats();
    for (const k of STAT_KEYS) {
      const label = STAT_NAMES[STAT_KEYS.indexOf(k)];
      const val   = stats[k];
      renderer.write(px, r, label + ':', C.DARK_GRAY, C.BLACK);
      renderer.write(px + 5, r, String(val).padStart(2), C.WHITE, C.BLACK);

      // Bar
      const barLen = 15;
      const filled = Math.max(0, Math.min(barLen, Math.round((val / 20) * barLen)));
      for (let i = 0; i < barLen; i++) {
        renderer.set(px + 8 + i, r, '█', i < filled ? C.BLUE : C.DARK_GRAY, C.BLACK);
      }
      r++;
    }

    r++;
    const race = this._currentRace();
    renderer.write(px, r, 'HP:', C.DARK_GRAY, C.BLACK);
    renderer.write(px + 4, r, String(race.startHp), C.RED, C.BLACK);
    r++;
    renderer.write(px, r, 'MP:', C.DARK_GRAY, C.BLACK);
    renderer.write(px + 4, r, String(race.startMp), C.BLUE, C.BLACK);
    r += 2;

    // Race traits summary
    renderer.write(px, r, 'RACE TRAITS', C.CYAN, C.BLACK);
    r++;
    renderer.write(px, r, '─'.repeat(34), C.DARK_BLUE, C.BLACK);
    r++;
    for (const trait of (race.traits || []).slice(0, 3)) {
      renderer.write(px, r, '• ' + trait.name, C.LIGHT_GRAY, C.BLACK);
      r++;
    }

    // Skills summary
    if (this.selectedSkills.length > 0) {
      r++;
      renderer.write(px, r, 'SELECTED SKILLS', C.GREEN, C.BLACK);
      r++;
      renderer.write(px, r, '─'.repeat(34), C.DARK_BLUE, C.BLACK);
      r++;
      for (const sid of this.selectedSkills) {
        const sk = SKILLS.find(s => s.id === sid);
        if (sk) {
          renderer.write(px, r, `${sk.icon} ${sk.name}`, C.YELLOW, C.BLACK);
          r++;
        }
      }
    }

    // Background lore (bottom of panel)
    if (this.step === STEP.BACKGROUND || this.step === STEP.CONFIRM) {
      const bg = this._currentBackground();
      r = ROWS - 9;
      renderer.write(px, r, '─'.repeat(34), C.DARK_BLUE, C.BLACK);
      r++;
      renderer.write(px, r, 'LORE:', C.DARK_GRAY, C.BLACK);
      r++;
      this._wrapWrite(renderer, px, r, bg.lore, 34, C.DARK_GRAY, C.BLACK);
    }
  }

  _renderNavHints(renderer) {
    const bottomRow = ROWS - 2;
    if (this.step === 'NAME') {
      renderer.write(2, bottomRow, 'Type name   ENTER Continue   ESC Back', C.DARK_GRAY, C.BLACK);
    } else if (this.step === 'SKILLS') {
      renderer.write(2, bottomRow, '↑↓ Navigate   SPACE Toggle skill   ESC Back', C.DARK_GRAY, C.BLACK);
    } else if (this.step === 'CONFIRM') {
      renderer.write(2, bottomRow, 'ENTER Begin Adventure   ESC Back', C.DARK_GRAY, C.BLACK);
    } else {
      renderer.write(2, bottomRow, '↑↓ Navigate   ENTER Select   ESC Back', C.DARK_GRAY, C.BLACK);
    }
    this._renderNavButtons(renderer);
  }

  _renderNavButtons(renderer) {
    if (this.step === 'NAME') return; // NAME step uses its own ENTER hint
    const btnRow = ROWS - 4;
    // Next button
    const isConfirm = this.step === 'CONFIRM';
    const nextLabel = isConfirm ? '[ BEGIN  ]' : '[ NEXT → ]';
    renderer.write(55, btnRow, nextLabel, C.BLACK, C.GREEN);
    // Back button
    renderer.write(67, btnRow, '[ ← BACK ]', C.BLACK, C.YELLOW);
  }

  _renderError(renderer) {
    if (!this.errorMsg) return;
    const row = ROWS - 3;
    renderer.fill(2, row, COLS - 4, 1, ' ', C.RED, C.DARK_RED);
    renderer.writeCenter(row, this.errorMsg, C.WHITE, C.DARK_RED, 2, COLS - 3);
  }

  // ─── Utility ─────────────────────────────────────────────────────────────────

  _wrapWrite(renderer, col, row, text, width, fg, bg, maxRows = 99) {
    if (!text) return 0;
    const words = text.split(' ');
    let line = '';
    let r = row;
    for (const word of words) {
      if (r - row >= maxRows) break;
      if ((line + word).length > width) {
        renderer.write(col, r, line.trimEnd(), fg, bg);
        r++;
        line = word + ' ';
      } else {
        line += word + ' ';
      }
    }
    if (line.trim() && r - row < maxRows) {
      renderer.write(col, r, line.trimEnd(), fg, bg);
      r++;
    }
    return r - row;
  }
}
