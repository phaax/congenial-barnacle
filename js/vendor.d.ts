// Type declarations for the webAdPlug third-party library loaded via <script> tags.
// These are global constructors/objects exposed by lib/scriptprocessor_player.js
// and lib/backend_adplug.js.
// This file is an ambient declaration (no import/export) so declarations are global.

interface SongInfo {
  title?: string;
  author?: string;
  [key: string]: unknown;
}

interface ScriptNodePlayerInstance {
  setVolume(v: number): void;
  setPanning?(pan: number): void;
  loadMusicFromURL(
    url: string,
    options: { timeout: number },
    onComplete: () => void,
    onError: (e: unknown) => void,
    onProgress: () => void,
  ): void;
  pause(): void;
  getSongInfo?(): SongInfo | null;
}

declare class ScriptNodePlayer {
  static createInstance(
    backend: AdPlugBackendAdapter,
    basePath: string,
    requiredFiles: string[],
    spectrum: boolean,
    onPlayerReady: () => void,
    onTrackReadyToPlay: () => void,
    onTrackEnd: () => void,
    doOnUpdate: (info: SongInfo) => void,
  ): void;
  static getInstance(): ScriptNodePlayerInstance;
}

declare class AdPlugBackendAdapter {
  constructor();
}

interface Window {
  game?: import('./engine/game').Game;
}

/** Injected at build time by vite.config.ts via define. */
declare const __APP_VERSION__: string;
