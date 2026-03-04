import { Game } from './engine/game.js';

const SCALE_LEVELS = ['scale-1x', 'scale-15x', 'scale-2x', 'scale-25x'];
const SCALE_LABELS = ['1×', '1.5×', '2×', '2.5×'];
const SCALE_KEY    = 'chronicles_scale';

function applyScale(container, hint, idx) {
  SCALE_LEVELS.forEach(c => container.classList.remove(c));
  container.classList.add(SCALE_LEVELS[idx]);
  if (hint) hint.textContent = `[ + / - ] resize  (${SCALE_LABELS[idx]})`;
  localStorage.setItem(SCALE_KEY, String(idx));
}

window.addEventListener('DOMContentLoaded', () => {
  const canvas    = document.getElementById('game-canvas');
  const container = document.getElementById('game-container');
  const hint      = document.getElementById('scale-hint');

  if (!canvas) {
    console.error('Canvas element not found!');
    return;
  }

  // Restore saved scale
  let scaleIdx = parseInt(localStorage.getItem(SCALE_KEY) ?? '0', 10);
  if (isNaN(scaleIdx) || scaleIdx < 0 || scaleIdx >= SCALE_LEVELS.length) scaleIdx = 0;
  applyScale(container, hint, scaleIdx);

  // +/- keys to resize (captured before game input)
  document.addEventListener('keydown', (e) => {
    if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      scaleIdx = Math.min(scaleIdx + 1, SCALE_LEVELS.length - 1);
      applyScale(container, hint, scaleIdx);
    } else if (e.key === '-' || e.key === '_') {
      e.preventDefault();
      scaleIdx = Math.max(scaleIdx - 1, 0);
      applyScale(container, hint, scaleIdx);
    }
  }, { capture: true });

  window.game = new Game(canvas);
});
