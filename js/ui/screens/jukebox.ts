// @ts-nocheck
/**
 * JukeboxScreen — an overlay accessible from anywhere via [J].
 *
 * Displays all music tracks with metadata, allows the user to listen
 * to any track and see OPL song info loaded by AdPlug.
 * Pressing [J] or [Escape] dismisses the overlay and resumes the
 * previously active game track.
 */

import { C, COLS, ROWS } from '../../data/constants';
import { TRACKS, TRACK_ORDER } from '../../audio/musicManager';
import { ScrollList } from '../../ui/menu';

// Panel geometry
const PW = 62;  // panel width
const PH = 26;  // panel height
const PC = Math.floor((COLS - PW) / 2);  // panel left col
const PR = 2;   // panel top row

export class JukeboxScreen {
  constructor(game) {
    this.game = game;

    this.list = new ScrollList();
    this.list.setItems(TRACK_ORDER, PH - 8);
    this.list.onSelect = (idx) => this._playTrack(idx);

    // Track which game state/track we interrupted so we can restore on exit
    this._resumeTrack = null;
  }

  enter(data) {
    // Remember what was playing before so we can restore on exit
    this._resumeTrack = this.game.music.currentTrack;

    // Restore selection to currently-playing track if possible
    if (this._resumeTrack) {
      const idx = TRACK_ORDER.indexOf(this._resumeTrack);
      if (idx >= 0) this.list.selected = idx;
    }

    // Subscribe to song info updates to redraw
    this.game.music._onInfoUpdate = () => { /* renderer will pick it up next frame */ };
  }

  exit() {
    this.game.music._onInfoUpdate = null;
  }

  // ── Input ─────────────────────────────────────────────────────────────────

  handleKey(event) {
    const k = event.key;

    if (k === 'Escape' || k === 'j' || k === 'J') {
      event.preventDefault();
      this._close();
      return;
    }

    if (k === 's' || k === 'S') {
      event.preventDefault();
      this.game.music.stop();
      return;
    }

    if (k === 'm' || k === 'M') {
      event.preventDefault();
      this.game.music.toggleMute();
      return;
    }

    if (k === 'Enter' || k === ' ') {
      event.preventDefault();
      this._playTrack(this.list.selected);
      return;
    }

    // Arrow keys and Page Up/Down handled by ScrollList
    if (k === 'ArrowUp' || k === 'w' || k === 'W') {
      event.preventDefault();
      this.list.moveUp();
      return;
    }
    if (k === 'ArrowDown') {
      event.preventDefault();
      this.list.moveDown();
      return;
    }

    this.list.handleKey(event);
  }

  handleClick(col, row, button) {
    // Close button (top-right corner of panel)
    if (row === PR && col >= PC + PW - 3 && col <= PC + PW - 1) {
      this._close();
      return;
    }

    const listRow = PR + 6;
    const listHeight = this.list.visibleH;
    if (row >= listRow && row < listRow + listHeight) {
      const handled = this.list.handleClick(col, row, PC + 1, listRow, PW - 2);
      if (handled) this._playTrack(this.list.selected);
    }
  }

  handleMove(col, row) {
    const listRow = PR + 6;
    this.list.handleHover(col, row, PC + 1, listRow, PW - 2);
  }

  handleScroll(dir) {
    if (dir > 0) this.list.moveDown();
    else this.list.moveUp();
  }

  update(_dt) {}

  // ── Rendering ─────────────────────────────────────────────────────────────

  render(renderer) {
    // Dim the background by drawing a semi-transparent overlay pattern
    this._renderBackground(renderer);
    this._renderPanel(renderer);
    this._renderHeader(renderer);
    this._renderTrackList(renderer);
    this._renderInfoBox(renderer);
    this._renderFooter(renderer);
  }

  _renderBackground(renderer) {
    // Draw a ░ fill over the entire screen to create a darkened backdrop
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        renderer.set(c, r, '░', C.DARK_GRAY, C.BLACK);
      }
    }
  }

  _renderPanel(renderer) {
    renderer.fill(PC, PR, PW, PH, ' ', C.WHITE, C.BLACK);
    renderer.drawBox(PC, PR, PW, PH, C.CYAN, C.BLACK, 'double', false);

    // Title bar background
    renderer.fill(PC + 1, PR, PW - 2, 1, '═', C.CYAN, C.BLACK);
    renderer.set(PC,       PR, '╔', C.CYAN, C.BLACK);
    renderer.set(PC+PW-1,  PR, '╗', C.CYAN, C.BLACK);

    // Close hint [X]
    renderer.write(PC + PW - 4, PR, '[X]', C.RED, C.BLACK);
  }

  _renderHeader(renderer) {
    // Title
    renderer.writeCenter(PR, '  ♫  JUKEBOX  ♫  ', C.YELLOW, C.BLACK, PC, PC + PW - 1);

    // Separator
    renderer.write(PC, PR + 1, '╠', C.CYAN, C.BLACK);
    renderer.write(PC + PW - 1, PR + 1, '╣', C.CYAN, C.BLACK);
    for (let c = PC + 1; c < PC + PW - 1; c++) renderer.set(c, PR + 1, '═', C.CYAN, C.BLACK);

    // Column headers
    const r = PR + 2;
    renderer.write(PC + 2,  r, '#',        C.DARK_GRAY, C.BLACK);
    renderer.write(PC + 4,  r, 'TRACK',    C.DARK_CYAN, C.BLACK);
    renderer.write(PC + 26, r, 'COMPOSER', C.DARK_CYAN, C.BLACK);
    renderer.write(PC + 42, r, 'CONTEXT',  C.DARK_CYAN, C.BLACK);

    // Under-header rule
    renderer.hline(PC + 1, PR + 3, PW - 2, '─', C.DARK_GRAY);

    // Now-playing label
    const cur = this.game.music.currentTrack;
    const curDef = cur ? TRACKS[cur] : null;
    const playStr = curDef
      ? `NOW: ${curDef.title}${this.game.music.muted ? ' [MUTED]' : ''}`
      : '(nothing playing)';
    renderer.write(PC + 2, PR + 4, playStr.padEnd(PW - 4).slice(0, PW - 4),
      cur ? C.GREEN : C.DARK_GRAY, C.BLACK);

    // Separator before list
    renderer.hline(PC + 1, PR + 5, PW - 2, '─', C.DARK_GRAY);
  }

  _renderTrackList(renderer) {
    const listTop = PR + 6;
    const cur = this.game.music.currentTrack;

    this.list.render(renderer, PC + 1, listTop, PW - 2, {
      renderItem: (r, col, row, key, isSelected, width) => {
        const t    = TRACKS[key];
        const idx  = TRACK_ORDER.indexOf(key) + 1;
        const isNP = (key === cur);

        const fg = isSelected ? C.BLACK  : (isNP ? C.GREEN : C.WHITE);
        const bg = isSelected ? C.YELLOW : C.BLACK;
        const noteFg = isNP ? C.GREEN : (isSelected ? C.BLACK : C.DARK_GRAY);

        // Background fill
        r.fill(col, row, width, 1, ' ', fg, bg);

        // Track number
        r.write(col,     row, `${String(idx).padStart(2)}.`, isSelected ? C.DARK_GRAY : C.DARK_GRAY, bg);

        // Now-playing marker
        r.write(col + 4, row, isNP ? '♫' : ' ', noteFg, bg);

        // Track title
        const titleStr = (t.title || key).slice(0, 19).padEnd(19);
        r.write(col + 6, row, titleStr, fg, bg);

        // Composer
        const cmpStr = (t.composer || '').slice(0, 15).padEnd(15);
        r.write(col + 26, row, cmpStr, isSelected ? C.DARK_GRAY : C.LIGHT_GRAY, bg);

        // Context
        const ctxStr = (t.context || '').slice(0, 17);
        r.write(col + 42, row, ctxStr, isSelected ? C.DARK_GRAY : C.DARK_CYAN, bg);
      },
    });
  }

  _renderInfoBox(renderer) {
    const infoTop = PR + 6 + this.list.visibleH + 1;

    // Separator
    renderer.hline(PC + 1, infoTop - 1, PW - 2, '─', C.DARK_GRAY);

    // OPL song info from AdPlug metadata
    const info    = this.game.music.songInfo || {};
    const selKey  = TRACK_ORDER[this.list.selected];
    const selDef  = selKey ? TRACKS[selKey] : null;

    const adTitle  = info.title  || (selDef ? selDef.title   : '');
    const adAuthor = info.author || '';
    const adPlayer = info.player || 'Reality AdLib Tracker';
    const adTracks = info.tracks != null ? `Subsongs: ${info.tracks}` : '';
    const adSpeed  = info.speed  != null ? `BPM: ${info.speed}` : '';

    renderer.write(PC + 2, infoTop,     'Title : ', C.DARK_GRAY, C.BLACK);
    renderer.write(PC + 10, infoTop,    (adTitle || '—').slice(0, PW - 13), C.WHITE, C.BLACK);

    renderer.write(PC + 2, infoTop + 1, 'Artist: ', C.DARK_GRAY, C.BLACK);
    renderer.write(PC + 10, infoTop + 1, (adAuthor || '—').slice(0, PW - 13), C.LIGHT_GRAY, C.BLACK);

    renderer.write(PC + 2, infoTop + 2, 'Format: ', C.DARK_GRAY, C.BLACK);
    renderer.write(PC + 10, infoTop + 2, adPlayer.slice(0, 20), C.DARK_CYAN, C.BLACK);
    if (adTracks || adSpeed) {
      const extra = [adTracks, adSpeed].filter(Boolean).join('  ').slice(0, 18);
      renderer.write(PC + 32, infoTop + 2, extra, C.DARK_GRAY, C.BLACK);
    }
  }

  _renderFooter(renderer) {
    const footerRow = PR + PH - 2;
    renderer.hline(PC + 1, footerRow - 1, PW - 2, '─', C.DARK_GRAY);
    const hint = '[↑↓] Select  [Enter] Play  [S] Stop  [M] Mute  [J/Esc] Close';
    renderer.writeCenter(footerRow, hint, C.DARK_GRAY, C.BLACK, PC, PC + PW - 1);
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  _playTrack(idx) {
    const key = TRACK_ORDER[idx];
    if (key) this.game.music.play(key);
  }

  _close() {
    // Restore the music that was playing before the jukebox was opened
    if (this._resumeTrack && this.game.music.currentTrack !== this._resumeTrack) {
      this.game.music.play(this._resumeTrack);
    }
    this.game.closeJukebox();
  }
}
