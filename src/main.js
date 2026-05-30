import { Game } from './game/Game.js';

function bootstrap() {
  const canvas = document.getElementById('gameCanvas');
  const game = new Game(canvas);
  game.startLoop();
}

window.addEventListener('DOMContentLoaded', bootstrap, { once: true });
