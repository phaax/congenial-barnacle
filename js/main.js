import { Game } from './engine/game.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) {
    console.error('Canvas element not found!');
    return;
  }
  window.game = new Game(canvas);
});
