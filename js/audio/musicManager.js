/**
 * MusicManager — wraps the webAdPlug ScriptNodePlayer to provide
 * context-aware .RAD music playback for Chronicles of the Realm.
 *
 * Depends on (loaded as classic <script> tags before this module):
 *   lib/scriptprocessor_player.js  — ScriptNodePlayer
 *   lib/backend_adplug.js          — AdPlugBackendAdapter + compiled OPL engine
 */

import { STATE } from '../data/constants.js';

// Track definitions: logical name → file path + metadata shown in the Jukebox
// Track sources:
//   "Alloyrun" — by VOID/REALITY (OPL2 C64 cover, freely redistributable with credit)
// Credit: VOID (Robert Muller) / Reality Productions
//
// Note: The original Dystopia and Pachelbel's Canon tracks were RAD v2.1 format,
// which is not supported by this build of the AdPlug library (RAD v1.0 only).
// All tracks currently use the Alloyrun RAD v1.0 file.

export const TRACKS = {
  menu: {
    file: 'assets/music/menu.rad',
    title: 'Alloyrun',
    composer: 'VOID / Reality',
    context: 'Main Menu',
    mood: 'Energetic, adventurous',
  },
  charcreate: {
    file: 'assets/music/charcreate.rad',
    title: 'Alloyrun',
    composer: 'VOID / Reality',
    context: 'Character Creation',
    mood: 'Energetic, adventurous',
  },
  worldmap: {
    file: 'assets/music/worldmap.rad',
    title: 'Alloyrun',
    composer: 'VOID / Reality',
    context: 'World Map',
    mood: 'Energetic, adventurous',
  },
  town: {
    file: 'assets/music/town.rad',
    title: 'Alloyrun',
    composer: 'VOID / Reality',
    context: 'Town / Shop',
    mood: 'Energetic, adventurous',
  },
  tavern: {
    file: 'assets/music/tavern.rad',
    title: 'Alloyrun',
    composer: 'VOID / Reality',
    context: 'Inn / Tavern',
    mood: 'Energetic, adventurous',
  },
  dungeon: {
    file: 'assets/music/dungeon.rad',
    title: 'Alloyrun',
    composer: 'VOID / Reality',
    context: 'Dungeon / Cave / Ruins',
    mood: 'Energetic, adventurous',
  },
  combat: {
    file: 'assets/music/combat.rad',
    title: 'Alloyrun',
    composer: 'VOID / Reality',
    context: 'Combat',
    mood: 'Energetic, adventurous',
  },
  gameover: {
    file: 'assets/music/gameover.rad',
    title: 'Alloyrun',
    composer: 'VOID / Reality',
    context: 'Game Over',
    mood: 'Energetic, adventurous',
  },
  victory: {
    file: 'assets/music/victory.rad',
    title: 'Alloyrun',
    composer: 'VOID / Reality',
    context: 'Victory',
    mood: 'Energetic, adventurous',
  },
};

// Ordered list for Jukebox display
export const TRACK_ORDER = [
  'menu', 'charcreate', 'worldmap', 'town', 'tavern',
  'dungeon', 'combat', 'gameover', 'victory',
];

// States that keep the current track playing (overlays)
const OVERLAY_STATES = new Set([
  STATE.INVENTORY,
  STATE.QUEST_LOG,
]);

// Map each state to a track key (null = inherit / no change)
function resolveTrack(state, data) {
  switch (state) {
    case STATE.MAIN_MENU:   return 'menu';
    case STATE.CHAR_CREATE: return 'charcreate';
    case STATE.WORLD_MAP:   return 'worldmap';
    case STATE.COMBAT:      return 'combat';
    case STATE.GAME_OVER:   return 'gameover';
    case STATE.VICTORY:     return 'victory';
    case STATE.INN:         return 'tavern';
    case STATE.SHOP:        return 'town';
    case STATE.LOCATION: {
      const locType = data?.loc?.type;
      return (locType === 'TOWN') ? 'town' : 'dungeon';
    }
    case STATE.DIALOG:
      // Inherit from underlying location — caller should pass prevTrack via data
      return data?._inheritTrack ?? null;
    default:
      return null; // overlay: keep current track
  }
}

const LS_MUTED   = 'chronicles_music_muted';
const LS_VOLUME  = 'chronicles_music_volume';
const LS_ENABLED = 'chronicles_music_enabled';

export class MusicManager {
  constructor() {
    this._ready       = false;   // ScriptNodePlayer initialized
    this._pending     = null;    // track key queued before init
    this._current     = null;    // currently playing track key
    this._loading     = null;    // track key being loaded
    this._muted       = false;
    this._volume      = 0.7;
    this._enabled     = true;    // in-game music enabled (jukebox ignores this)
    this._songInfo    = {};      // metadata from AdPlug for current track
    this._onInfoUpdate = null;   // optional callback when song info updates

    // Load persisted preferences
    try {
      const m = localStorage.getItem(LS_MUTED);
      if (m !== null) this._muted = (m === 'true');
      const v = parseFloat(localStorage.getItem(LS_VOLUME));
      if (!isNaN(v)) this._volume = Math.max(0, Math.min(1, v));
      const e = localStorage.getItem(LS_ENABLED);
      if (e !== null) this._enabled = (e !== 'false');
    } catch (_) {}
  }

  // ── Initialization ─────────────────────────────────────────────────────────

  /**
   * Must be called on or after the first user gesture so that the
   * browser's AudioContext policy is satisfied.
   */
  initOnUserGesture() {
    if (this._ready || this._initializing) return;
    this._initializing = true;

    if (typeof ScriptNodePlayer === 'undefined' ||
        typeof AdPlugBackendAdapter === 'undefined') {
      console.warn('[MusicManager] webAdPlug not loaded — music disabled.');
      return;
    }

    try {
      ScriptNodePlayer.createInstance(
        new AdPlugBackendAdapter(),
        '',    // basePath (files fetched relative to page)
        [],    // no additional required files
        false, // no spectrum
        /* onPlayerReady */       () => this._onPlayerReady(),
        /* onTrackReadyToPlay */  () => this._onTrackReady(),
        /* onTrackEnd */          () => this._onTrackEnd(),
        /* doOnUpdate */          (info) => this._onUpdate(info),
      );
    } catch (e) {
      console.warn('[MusicManager] createInstance failed:', e);
    }
  }

  _onPlayerReady() {
    this._ready = true;
    this._initializing = false;
    const p = ScriptNodePlayer.getInstance();
    p.setVolume(this._muted ? 0 : this._volume);
    // Center-pan the OPL output so it plays equally from both speakers
    if (typeof p.setPanning === 'function') p.setPanning(0);
    if (this._pending) {
      const key = this._pending;
      this._pending = null;
      this._loadTrack(key);
    }
  }

  _onTrackReady() {
    // Track loaded — play starts automatically via the player's internal logic.
    // Update song info display.
    this._refreshSongInfo();
  }

  _onTrackEnd() {
    // Loop the current track
    if (this._current) {
      this._loadTrack(this._current);
    }
  }

  _onUpdate(info) {
    // Called periodically with updated song metadata
    if (info && this._onInfoUpdate) {
      this._songInfo = info;
      this._onInfoUpdate(info);
    }
  }

  _refreshSongInfo() {
    // The player populates info asynchronously; we poll once per track load
    const p = ScriptNodePlayer.getInstance();
    if (p && typeof p.getSongInfo === 'function') {
      const info = p.getSongInfo();
      if (info) {
        this._songInfo = info;
        if (this._onInfoUpdate) this._onInfoUpdate(info);
      }
    }
  }

  // ── Playback control ───────────────────────────────────────────────────────

  /**
   * Play a track by its logical key (e.g. 'town', 'combat').
   * No-op if already playing that track.
   */
  play(key) {
    if (!key || !TRACKS[key]) return;
    if (this._current === key && this._loading === null) return; // already playing
    if (!this._ready) {
      this._pending = key;
      return;
    }
    this._loadTrack(key);
  }

  _loadTrack(key) {
    const track = TRACKS[key];
    if (!track) return;
    this._loading = key;
    this._current = key;
    this._songInfo = {};

    const p = ScriptNodePlayer.getInstance();
    p.loadMusicFromURL(
      track.file,
      { timeout: 0 },    // 0 = no timeout, rely on onTrackEnd for looping
      () => {
        // onCompletion — file loaded, will play via onTrackReadyToPlay
        this._loading = null;
      },
      (e) => {
        console.warn(`[MusicManager] Failed to load ${track.file}:`, e);
        this._loading = null;
        if (this._current === key) this._current = null;
      },
      () => {},           // onProgress
    );
  }

  stop() {
    if (!this._ready) { this._pending = null; return; }
    const p = ScriptNodePlayer.getInstance();
    p.pause();
    this._current = null;
    this._loading = null;
    this._songInfo = {};
  }

  // ── Volume & mute ──────────────────────────────────────────────────────────

  get muted()  { return this._muted; }
  get volume() { return this._volume; }
  get enabled() { return this._enabled; }
  get currentTrack() { return this._current; }
  get songInfo() { return this._songInfo; }

  setEnabled(val) {
    this._enabled = !!val;
    try { localStorage.setItem(LS_ENABLED, String(this._enabled)); } catch (_) {}
    if (!this._enabled) this.stop();
  }

  toggleMute() {
    this.setMuted(!this._muted);
  }

  setMuted(val) {
    this._muted = !!val;
    this._applyVolume();
    try { localStorage.setItem(LS_MUTED, String(this._muted)); } catch (_) {}
  }

  setVolume(v) {
    this._volume = Math.max(0, Math.min(1, v));
    this._applyVolume();
    try { localStorage.setItem(LS_VOLUME, String(this._volume)); } catch (_) {}
  }

  _applyVolume() {
    if (!this._ready) return;
    ScriptNodePlayer.getInstance().setVolume(this._muted ? 0 : this._volume);
  }

  // ── Game state integration ─────────────────────────────────────────────────

  /**
   * Called by game.js on every state transition.
   * Resolves the correct track for the new state and starts playback.
   */
  onStateChange(newState, data) {
    if (!this._enabled) return; // in-game music disabled
    if (OVERLAY_STATES.has(newState)) return; // keep current track

    // For dialog, pass the current track as the inherit hint
    const contextData = (newState === STATE.DIALOG)
      ? { ...(data || {}), _inheritTrack: this._current }
      : data;

    const key = resolveTrack(newState, contextData);
    if (key === null) return; // no change
    this.play(key);
  }
}
