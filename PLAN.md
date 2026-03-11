# Plan: Fix Music Playback Once and For All

## Issues Identified

### Issue 1 — IMF files don't play (wrong format)
The 8 `.imf` files generated in the last iteration aren't working. The user
explicitly asked for **RAD v1.0 format only**. IMF support in this specific
AdPlug build cannot be confirmed, and RAD v1.0 is the only proven format.

### Issue 2 — All 8 non-worldmap tracks are still identical
The old placeholder `.rad` files (menu.rad, charcreate.rad, etc.) were all
byte-for-byte copies of worldmap.rad ("Alloyrun"). The `.imf` files replaced
them in musicManager.js but don't play. The result is no music on 8 of 9 screens.

### Issue 3 — ScriptProcessorNode deprecation warning
`lib/scriptprocessor_player.js` uses the deprecated `audioCtx.createScriptProcessor()`
API at lines 1252 and 1268. Modern browsers log:
> [Deprecation] The ScriptProcessorNode is deprecated. Use AudioWorkletNode instead.

### Issue 4 — Leftover files
- 8 `.imf` files in `assets/music/` (unused, wrong format)
- 8 old `.rad` placeholder files (copies of worldmap.rad, superseded by .imf entries
  that don't work anyway)

---

## Root Cause Analysis: Why IMF Failed

The `backend_adplug.js` is a compiled Emscripten bundle. While AdPlug's format list
strings include "Apogee IMF / .imf", the specific IMF player (CImfPlayer) may not be
compiled into this particular build, or the OPL initialization sequence expected by
the IMF player differs from what was generated.

RAD v1.0 is confirmed working — `worldmap.rad` plays correctly. All new tracks
must be valid RAD v1.0 binary files.

---

## Solution Plan

### Step 1 — Delete all leftover files
Remove:
- `assets/music/*.imf` (8 files — all generated IMF tracks)
- `assets/music/menu.rad`, `charcreate.rad`, `combat.rad`, `dungeon.rad`,
  `gameover.rad`, `tavern.rad`, `town.rad`, `victory.rad`
  (8 files — all were identical copies of worldmap.rad)

Keep: `assets/music/worldmap.rad` (the real Alloyrun track, confirmed working)

### Step 2 — Reverse-engineer RAD v1.0 format definitively
Fetch AdPlug's `rad.cpp` source from GitHub to confirm the exact binary structure,
particularly the order list terminator (appears to be first value > 35, since valid
pattern indices are 0–35 and worldmap.rad has no 0xFF byte) and the pattern row
encoding (2-bit flags + 6-bit line number, channel entries with variable note/
instrument/effect fields).

Key known facts from worldmap.rad:
- Magic: `"RAD by REALiTY!!"` (16 bytes)
- Version: `0x10`
- Flags byte: bit 7 = has description, bit 0 = has custom speed
- Instruments: `[inst_num (1 byte, 0 = end)] [11 OPL2 bytes]`
- Order list: pattern numbers (0–35), terminated by first value > 35
- Pattern data immediately follows the order list
- Row format: `[flags|line (1 byte)] [channel entries...]`
  where bit 7 = last row in pattern, bits 0–5 = row number (0–63)
- Channel entry: `[ch byte] [note] [inst] [effect]` (variable)

### Step 3 — Write a Python RAD v1.0 generator
Build a generator (`tools/gen_rad.py`) that produces syntactically correct
RAD v1.0 binary files from a simple note/instrument description. It will:

1. Emit the standard 16-byte magic + version byte
2. Write flags (description + speed), null-terminated description, speed byte
3. Write OPL2 instrument definitions (11 bytes each, specific timbres per context)
4. Write the order list (N repetitions of pattern 0, terminated by value 36)
5. Write one 64-row pattern encoding a unique melody for each context

Eight melodies, each in a different key/tempo/instrumentation:

| File | Key | BPM | Theme |
|------|-----|-----|-------|
| `menu.rad` | G major | 88 | Regal organ fanfare |
| `charcreate.rad` | A minor | 70 | Mysterious flute |
| `town.rad` | C major | 110 | Cheerful trumpet |
| `tavern.rad` | G major | 152 | Lively harpsichord jig |
| `dungeon.rad` | D minor | 56 | Dark, sparse strings |
| `combat.rad` | E minor | 140 | Aggressive, driving |
| `gameover.rad` | C minor | 58 | Somber brass |
| `victory.rad` | C major | 130 | Triumphant fanfare |

### Step 4 — Fix the ScriptProcessorNode deprecation
Replace the two `createScriptProcessor` calls in `lib/scriptprocessor_player.js`
with an `AudioWorkletNode`-based implementation.

**Approach — minimal-diff AudioWorklet shim:**

1. Create `lib/adplug_worklet.js` — an `AudioWorkletProcessor` that:
   - Receives audio frames from the main thread via a `SharedArrayBuffer`
     ring buffer (or `Float32Array` posted through `MessagePort`)
   - Writes them into the Web Audio graph's output buffer in `process()`

2. Patch `scriptprocessor_player.js` (the two relevant functions only):
   - `createScriptProcessor()` → register + instantiate `AudioWorkletNode`,
     wire up the ring-buffer producer on the main thread
   - `createTickerScriptProcessor()` → use a small `AudioWorkletNode` (or
     a `setInterval`-based ticker if worklet tick sync isn't required)

3. Add a feature-detect fallback: if `AudioWorklet` is not available (Safari
   < 14.1, older mobile browsers), keep the existing `createScriptProcessor`
   path so music still works on legacy browsers.

4. Add `<link rel="preload">` for the worklet module in `index.html`.

### Step 5 — Update musicManager.js
Restore `.rad` file references for all 8 new tracks and update title/composer/mood
metadata to reflect the new compositions.

### Step 6 — Test, commit, push
Generate the RAD files, verify sizes/magic bytes, update JS, commit all changes
to `claude/add-game-music-playback-wG0hm`, and push.

---

## File Change Summary

| File | Action |
|------|--------|
| `assets/music/*.imf` (×8) | DELETE |
| `assets/music/{menu,charcreate,town,tavern,dungeon,combat,gameover,victory}.rad` | REGENERATE (unique content) |
| `assets/music/worldmap.rad` | KEEP unchanged |
| `lib/scriptprocessor_player.js` | PATCH createScriptProcessor + createTickerScriptProcessor |
| `lib/adplug_worklet.js` | CREATE (new AudioWorkletProcessor) |
| `js/audio/musicManager.js` | UPDATE file paths + metadata |
| `index.html` | UPDATE to preload worklet module |
