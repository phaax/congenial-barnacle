# Music Implementation Plan — Chronicles of the Realm
## Adding .RAD file playback via webAdPlug

---

## 1. Overview

Chronicles of the Realm is a retro DOS-style turn-based RPG running in the browser
(pure vanilla JavaScript, HTML5 Canvas). The game has 12 distinct screens/states.
We will add OPL2/OPL3 music playback using **webAdPlug** — Juergen Wothke's
WebAudio/ScriptProcessorNode port of AdPlug — which supports the `.RAD` (Reality
AdLib Tracker) file format natively.

---

## 2. Technology: webAdPlug

**What it is:** A JavaScript/WebAudio port of the AdPlug library, compiled from C++
to JavaScript via Emscripten. It emulates the Yamaha OPL2/OPL3 FM synthesis chip
in real time within the browser, with no pre-rendered audio files required.

**Key files needed (3 JS files):**

| File | Purpose | Source |
|------|---------|--------|
| `scriptprocessor_player.js` | Generic ScriptProcessorNode player shell | wothke/webaudio-player (GitHub / Bitbucket) |
| `adplug_backend.js` | Emscripten-compiled AdPlug engine (~1.3 MB) | wothke/adplug-2.2.1 emscripten build |
| `adplug_adapter.js` | Adapter bridging AdPlug backend to player shell | wothke/adplug-2.2.1 emscripten folder |

**Source repositories:**
- https://github.com/wothke/adplug-2.2.1 (GitHub mirror, emscripten/ folder)
- https://github.com/wothke/webaudio-player (scriptprocessor_player.js)
- https://github.com/PalMusicFan/adplug-2.2.1 (fork with htdocs example)
- Live demo reference: https://www.wothke.ch/webAdPlug/

**Integration pattern:**
```html
<!-- Load non-module scripts before the game module -->
<script src="lib/scriptprocessor_player.js"></script>
<script src="lib/adplug_backend.js"></script>
<script src="lib/adplug_adapter.js"></script>
```

**Core API:**
```javascript
// Obtain the singleton player instance
const player = window.ScriptNodePlayer.getInstance();

// Initialize (must be called once, ideally on first user interaction)
player.init('lib/', null, null, true, {
  onPlayerReady:   () => { /* player ready */ },
  onTrackReadyToPlay: () => player.play(),
  onTrackEnd:      () => { /* loop or next track */ },
});

// Load and play a .RAD file
player.loadMusicFromURL('assets/music/town.rad', false, successCb, errorCb, () => {});

// Playback control
player.play();
player.pause();
player.setVolume(0.8);  // 0.0 – 1.0
```

**Browser autoplay:** Due to browser autoplay policies, the AudioContext must be
created or resumed on a user gesture. The player must be initialized after the
first keypress or click.

---

## 3. Music Track Selection

### 3.1 Track-to-Screen Mapping

| Track Slot | Filename | Game States | Mood / Style |
|-----------|----------|-------------|-------------|
| **menu** | `menu.rad` | MAIN_MENU | Epic, majestic, classic fantasy intro |
| **charcreate** | `charcreate.rad` | CHAR_CREATE | Contemplative, light fantasy, hopeful |
| **worldmap** | `worldmap.rad` | WORLD_MAP | Adventurous, outdoor exploration, upbeat |
| **town** | `town.rad` | LOCATION (type=TOWN), DIALOG (in town), INN, SHOP | Cheerful, bustling marketplace, warm |
| **tavern** | `tavern.rad` | INN screen specifically | Cozy, warm, folk-like, slower tempo |
| **dungeon** | `dungeon.rad` | LOCATION (type=DUNGEON/CAVE/RUINS/SHRINE/CAMP), DIALOG (in dungeon) | Dark, tense, eerie, slow |
| **combat** | `combat.rad` | COMBAT | Urgent, fast-paced, driving FM battle |
| **gameover** | `gameover.rad` | GAME_OVER | Somber, melancholic, short |
| **victory** | `victory.rad` | VICTORY | Triumphant, celebratory, fanfare |

Notes:
- INVENTORY and QUEST_LOG overlay their source screen's music (no track change)
- DIALOG inherits music from the screen it was opened from (town or dungeon)
- INN gets the dedicated tavern track (warmer subset of town music)
- SHOP reuses the town track (same location context)

### 3.2 Music Sources

**Primary source: void (Robert Muller) / Reality Productions**
Robert Muller is a member of Reality (the group that created RAD), making his
work a natural fit. His complete RAD music archive is at:
- https://archive.org/details/void-music-robert-muller

His tracks span multiple moods and are released under demoscene conventions
(freely redistributable for non-commercial/fan projects with attribution).

**Secondary source: RAD Tracker demo songs**
The Reality AdLib Tracker download includes bundled example .RAD songs:
- https://realityproductions.itch.io/rad
- https://www.3eality.com/productions/reality-adlib-tracker

**Tertiary source: AdPlug test suite / demoscene archives**
- AdPlug's test files include various .RAD format examples
- Pouet.net production database links to demoscene tracks

### 3.3 Recommended Specific Tracks

The following are representative RAD/OPL2 compositions that fit each slot.
Actual filenames within the void archive should be verified at download time:

| Slot | Look for / Description | Expected mood match |
|------|----------------------|-------------------|
| menu.rad | Upbeat heroic intro, ~2-3 min loop | Fantasy epic entrance |
| charcreate.rad | Gentle, slower, reflective FM piece | Thoughtful selection |
| worldmap.rad | Mid-tempo adventure theme, outdoor feel | Exploration/travel |
| town.rad | Lively, staccato melody, major key | Town/village bustle |
| tavern.rad | Slower folk-like melody, triple time | Warm inn ambiance |
| dungeon.rad | Minor key, sparse, tense atmosphere | Underground dread |
| combat.rad | Fast tempo, driving bassline, urgent | Battle intensity |
| gameover.rad | Slow, minor key, short (< 30s) | Defeat/death |
| victory.rad | Fast fanfare, major key, short (< 60s) | Triumph/win |

All chosen tracks must:
1. Be in `.RAD` format (Reality AdLib Tracker v1.x or v2.x)
2. Loop well (seamlessly or nearly so)
3. Be from the public domain or demoscene tradition (freely usable)
4. Fit the DOS/retro aesthetic of the game

---

## 4. File Structure Changes

```
congenial-barnacle/
├── index.html                     [MODIFIED] — add 3 <script> tags for webAdPlug
├── lib/                           [NEW DIR]
│   ├── scriptprocessor_player.js  [NEW] — wothke generic player shell
│   ├── adplug_backend.js          [NEW] — Emscripten AdPlug engine
│   └── adplug_adapter.js          [NEW] — AdPlug adapter
├── assets/                        [NEW DIR]
│   └── music/                     [NEW DIR]
│       ├── menu.rad               [NEW] — main menu music
│       ├── charcreate.rad         [NEW] — character creation music
│       ├── worldmap.rad           [NEW] — world map music
│       ├── town.rad               [NEW] — town/location music
│       ├── tavern.rad             [NEW] — inn screen music
│       ├── dungeon.rad            [NEW] — dungeon/cave music
│       ├── combat.rad             [NEW] — battle music
│       ├── gameover.rad           [NEW] — game over music
│       └── victory.rad            [NEW] — victory music
└── js/
    ├── audio/                     [NEW DIR]
    │   └── musicManager.js        [NEW] — music system
    └── engine/
        └── game.js                [MODIFIED] — import MusicManager, hook transitions
```

---

## 5. Implementation Steps

### Step 1 — Fetch webAdPlug library files

Download the three JS files from the GitHub mirror of wothke's adplug project:

1. `scriptprocessor_player.js` from:
   https://raw.githubusercontent.com/wothke/webaudio-player/master/scriptprocessor_player.js

2. `adplug_backend.js` from the emscripten build outputs in:
   https://github.com/wothke/adplug-2.2.1/tree/master/emscripten

3. `adplug_adapter.js` from:
   https://raw.githubusercontent.com/wothke/adplug-2.2.1/master/emscripten/adplug_adapter.js

Place all three in `/lib/`.

### Step 2 — Download and curate RAD music files

1. Visit https://archive.org/details/void-music-robert-muller and download the
   .RAD files from the archive.
2. Browse the files using a RAD player or the tracker itself to assess mood/fit.
3. Rename selected tracks to the slot filenames above.
4. Place all tracks in `/assets/music/`.

If void's archive doesn't have a good fit for every slot, supplement with:
- RAD demo songs from https://realityproductions.itch.io/rad
- General demoscene RAD files from https://archive.org (search: format:RAD)

### Step 3 — Update index.html

Add three `<script>` tags before the main module script to load webAdPlug:

```html
<!-- webAdPlug: OPL2/OPL3 music player -->
<script src="lib/scriptprocessor_player.js"></script>
<script src="lib/adplug_backend.js"></script>
<script src="lib/adplug_adapter.js"></script>
<!-- Game entry point -->
<script type="module" src="js/main.js"></script>
```

Note: These must be classic `<script>` tags (not modules) as wothke's player
registers `window.ScriptNodePlayer` as a global.

### Step 4 — Create js/audio/musicManager.js

This module manages all music state for the game. Key responsibilities:

```
MusicManager
├── init()                  — Set up ScriptNodePlayer, load on first user gesture
├── play(trackName)         — Load+play a track by logical name; no-op if same track
├── stop()                  — Stop current track
├── setMuted(bool)          — Mute/unmute (persists to localStorage)
├── toggleMute()            — Toggle mute
├── setVolume(0-1)          — Set volume (persists to localStorage)
├── onStateChange(state, context) — Called by game.js on every state transition;
│                                   resolves the correct track and calls play()
└── _resolveTrack(state, ctx)     — Maps state+context to a track filename
```

Track resolution logic:
```
STATE.MAIN_MENU   → 'menu'
STATE.CHAR_CREATE → 'charcreate'
STATE.WORLD_MAP   → 'worldmap'
STATE.LOCATION    → ctx.loc.type === 'TOWN' ? 'town' : 'dungeon'
STATE.COMBAT      → 'combat'
STATE.DIALOG      → (inherit from previous location context)
STATE.INN         → 'tavern'
STATE.SHOP        → 'town'
STATE.INVENTORY   → (no change — overlay, keep current)
STATE.QUEST_LOG   → (no change — overlay, keep current)
STATE.GAME_OVER   → 'gameover'
STATE.VICTORY     → 'victory'
```

Initialization flow (handles browser autoplay restriction):
- MusicManager is created at game start but deferred until first user interaction
- On first keydown/click, AudioContext is created/resumed and player.init() is called
- Until then, all play() calls are queued and executed once the player is ready

Settings persistence:
- `localStorage.getItem('chronicles_music_muted')` — boolean
- `localStorage.getItem('chronicles_music_volume')` — float 0–1 (default 0.7)

Track looping:
- The `onTrackEnd` callback from ScriptNodePlayer calls play() again with the
  same track name to implement looping

### Step 5 — Modify js/engine/game.js

Two targeted changes:

**Change A — Import and initialize MusicManager:**
```javascript
import { MusicManager } from '../audio/musicManager.js';
// In constructor, after renderer and input setup:
this.music = new MusicManager();
```

**Change B — Hook into _doChangeState() to trigger music:**
After `next.enter(data)` is called, add:
```javascript
// Music: resolve track for new state
this.music.onStateChange(stateName, data);
```

Also pass the current location type to the music context for LOCATION/DIALOG
states so the correct town vs dungeon track can be selected.

Additionally, the first user gesture handler in `InputManager` should call
`this.music.initOnUserGesture()` to satisfy browser autoplay requirements.

### Step 6 — Add music toggle keybinding

In `game.js` input handlers (or in a shared location so all screens respond):
- `[M]` key toggles mute/unmute
- Display music status in side panel or brief on-screen message

The side panel in `renderSidePanel()` can show a `♪` or `♪ OFF` indicator near
the bottom of the status panel.

---

## 6. Edge Cases & Considerations

### Browser Autoplay Policy
Modern browsers block AudioContext creation until a user interaction. The music
system must:
1. Defer AudioContext creation until first keypress/click
2. Queue any play() calls that happen before initialization
3. Show a subtle visual cue that music will start on first input

### ScriptProcessorNode Deprecation
ScriptProcessorNode is deprecated in favour of AudioWorkletNode. However:
- It still works in all major browsers as of 2026
- webAdPlug specifically requires ScriptProcessorNode
- The game is single-threaded and simple; ScriptProcessorNode is acceptable here
- If stuttering is observed, the buffer size can be increased (4096 → 8192 samples)

### Track Loading Time
The adplug_backend.js is ~1.3 MB. It should load while the game's loading overlay
is shown. The game already has an async `_loadScreens()` pattern that hides the
loading overlay; music init should be tied to the same phase.

### Missing Track Files (Graceful Degradation)
If a .RAD file fails to load (404, network error), the music manager should:
- Log a console warning
- Continue without music for that state (don't crash the game)
- Try a fallback track if one is defined

### DIALOG State Music
Dialog overlays the current location screen. The music should NOT change when
entering dialog — the ambient (town/dungeon) track continues. The _resolveTrack()
function should return `null` for DIALOG state, which means "keep current track."

### INN vs SHOP distinction
Both INN and SHOP are entered via dialog. INN gets the warmer tavern track.
SHOP reuses the town track (it's inside a building in town).

### Combat Return
When combat ends (won, fled, game over), the correct music resumes:
- Won/fled from LOCATION → resume town or dungeon track
- Won/fled from WORLD_MAP → resume worldmap track
- GAME_OVER → play gameover track
- VICTORY → play victory track

---

## 7. Attribution & Licensing

All RAD music files used must be credited. The following note should be added
to the game's main menu or a credits screen (or at minimum in a CREDITS.md):

```
Music: .RAD format tracks by void (Robert Muller) / Reality Productions
OPL2/OPL3 emulation: webAdPlug by Juergen Wothke (LGPL)
  Based on AdPlug (https://adplug.github.io/) by Simon Peter et al.
```

The webAdPlug library (adplug_backend.js and adplug_adapter.js) is LGPL licensed.
The scriptprocessor_player.js is MIT licensed.

---

## 8. Implementation Order (with File List)

| Order | Action | Files Created/Modified |
|-------|--------|----------------------|
| 1 | Fetch webAdPlug JS library files | `lib/scriptprocessor_player.js`, `lib/adplug_backend.js`, `lib/adplug_adapter.js` |
| 2 | Download and place RAD music tracks | `assets/music/*.rad` (9 files) |
| 3 | Update HTML to load library | `index.html` |
| 4 | Create music manager module | `js/audio/musicManager.js` |
| 5 | Hook music manager into game engine | `js/engine/game.js` |
| 6 | Add mute toggle keybinding + UI hint | `js/engine/game.js` (renderSidePanel) |
| 7 | Test all 12 state transitions | manual testing |

---

## 9. Summary of External Dependencies Added

| Dependency | Version | License | Size | Purpose |
|-----------|---------|---------|------|---------|
| scriptprocessor_player.js | master | MIT | ~25 KB | WebAudio player shell |
| adplug_backend.js | 2.2.1 | LGPL | ~1.3 MB | OPL2/3 emulator + AdPlug |
| adplug_adapter.js | 2.2.1 | LGPL | ~8 KB | AdPlug format adapter |
| *.rad music files | — | Demoscene | ~2–20 KB each | Music content |

**Total new download weight:** ~1.5 MB (mostly adplug_backend.js, loaded once)

---

*Plan version: 1.0 | Date: 2026-03-10*
