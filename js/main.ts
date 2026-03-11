import { Game } from './engine/game';

const SCALE_FACTORS = [1, 1.5, 2, 2.5];
const SCALE_LABELS  = ['1×', '1.5×', '2×', '2.5×'];
const SCALE_KEY     = 'chronicles_scale';

// Resize the canvas CSS display size directly.
// This avoids the transform:scale cropping issue — layout box matches visual size.
// renderer.getRelativePos() already divides by rect.width/height, so mouse coords stay correct.
function applyScale(canvas: HTMLCanvasElement, hint: HTMLElement | null, idx: number): void {
  const scale = SCALE_FACTORS[idx];
  canvas.style.width  = `${canvas.width  * scale}px`;
  canvas.style.height = `${canvas.height * scale}px`;
  if (hint) hint.textContent = `[ + / - ] resize  (${SCALE_LABELS[idx]})`;
  localStorage.setItem(SCALE_KEY, String(idx));
}

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement | null;
  const hint   = document.getElementById('scale-hint');

  if (!canvas) {
    console.error('Canvas element not found!');
    return;
  }

  // Game constructor sets canvas.width/height synchronously, so scale after creation
  window.game = new Game(canvas);

  let scaleIdx = parseInt(localStorage.getItem(SCALE_KEY) ?? '0', 10);
  if (isNaN(scaleIdx) || scaleIdx < 0 || scaleIdx >= SCALE_FACTORS.length) scaleIdx = 0;
  applyScale(canvas, hint, scaleIdx);

  // +/- keys to resize (captured before game input)
  document.addEventListener('keydown', (e) => {
    if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      scaleIdx = Math.min(scaleIdx + 1, SCALE_FACTORS.length - 1);
      applyScale(canvas, hint, scaleIdx);
    } else if (e.key === '-' || e.key === '_') {
      e.preventDefault();
      scaleIdx = Math.max(scaleIdx - 1, 0);
      applyScale(canvas, hint, scaleIdx);
    }
  }, { capture: true });
});
