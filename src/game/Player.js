import { ARENA, CANVAS, PLAYER } from '../core/constants.js';
import { clamp } from '../core/math.js';
import { drawCircle, drawText } from '../render/draw.js';

export class Player {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = ARENA.CENTER_X;
    this.y = ARENA.CENTER_Y + ARENA.RADIUS * 0.52;
    this.radius = ARENA.PLAYER_RADIUS;
  }

  update(deltaSeconds, input) {
    const move = input.getMoveVector();
    this.x += move.x * PLAYER.SPEED * deltaSeconds;
    this.y += move.y * PLAYER.SPEED * deltaSeconds;

    const dx = this.x - ARENA.CENTER_X;
    const dy = this.y - ARENA.CENTER_Y;
    const distance = Math.hypot(dx, dy);
    const maxDistance = ARENA.RADIUS - this.radius - 6;

    if (distance > maxDistance) {
      const nx = dx / distance;
      const ny = dy / distance;
      this.x = ARENA.CENTER_X + nx * maxDistance;
      this.y = ARENA.CENTER_Y + ny * maxDistance;
    }

    this.x = clamp(this.x, this.radius, CANVAS.WIDTH - this.radius);
    this.y = clamp(this.y, this.radius, CANVAS.HEIGHT - this.radius);
  }

  render(ctx) {
    drawCircle(ctx, this.x, this.y, this.radius + 5, {
      fill: 'rgba(250, 204, 21, 0.16)',
      stroke: 'rgba(250, 204, 21, 0.55)',
      lineWidth: 2,
    });
    drawCircle(ctx, this.x, this.y, this.radius, {
      fill: '#facc15',
      stroke: '#fef9c3',
      lineWidth: 2,
    });
    drawText(ctx, 'YOU', this.x, this.y - 25, {
      font: '700 12px system-ui, sans-serif',
      fill: '#fef9c3',
      shadow: true,
    });
  }

  getPosition() {
    return { x: this.x, y: this.y };
  }
}
