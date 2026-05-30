import { ARENA, COLORS, COLOR_ORDER, MECHANIC } from '../core/constants.js';
import { angleToPoint, normalize } from '../core/math.js';
import { drawCircle, drawText } from '../render/draw.js';

export class Orb {
  constructor({ laneIndex, laneAngleDegrees, colorId, distanceOffset = 0 }) {
    this.laneIndex = laneIndex;
    this.laneAngleDegrees = laneAngleDegrees;
    this.colorId = colorId;
    this.radius = MECHANIC.ORB_RADIUS;
    this.hasReachedBoss = false;
    this.wasBeamHit = false;
    this.beamHitFlashTime = 0;

  const start = angleToPoint(
    ARENA.CENTER_X,
    ARENA.CENTER_Y,
    laneAngleDegrees,
    MECHANIC.ORB_START_DISTANCE + distanceOffset,
  );
    
    this.x = start.x;
    this.y = start.y;

    const toBoss = normalize(ARENA.CENTER_X - this.x, ARENA.CENTER_Y - this.y);
    this.vx = toBoss.x * MECHANIC.ORB_SPEED;
    this.vy = toBoss.y * MECHANIC.ORB_SPEED;
  }

  update(deltaSeconds) {
    this.x += this.vx * deltaSeconds;
    this.y += this.vy * deltaSeconds;

    if (this.beamHitFlashTime > 0) {
      this.beamHitFlashTime = Math.max(0, this.beamHitFlashTime - deltaSeconds);
    }

    const bossDistance = Math.hypot(this.x - ARENA.CENTER_X, this.y - ARENA.CENTER_Y);
    this.hasReachedBoss = bossDistance <= ARENA.BOSS_RADIUS + this.radius;
  }

  cycleColor() {
    const currentIndex = COLOR_ORDER.indexOf(this.colorId);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % COLOR_ORDER.length : 0;
    this.colorId = COLOR_ORDER[nextIndex];
    this.wasBeamHit = true;
    this.beamHitFlashTime = 0.28;
  }

  render(ctx) {
    const color = COLORS[this.colorId] ?? COLORS.red;
    const flash = this.beamHitFlashTime > 0;

    drawCircle(ctx, this.x, this.y, this.radius + (flash ? 8 : 4), {
      fill: color.soft,
      stroke: flash ? '#ffffff' : color.stroke,
      lineWidth: flash ? 3 : 1,
    });
    drawCircle(ctx, this.x, this.y, this.radius, {
      fill: color.fill,
      stroke: color.stroke,
      lineWidth: 2,
    });
    drawText(ctx, color.name[0], this.x, this.y, {
      font: '800 11px system-ui, sans-serif',
      fill: '#ffffff',
      shadow: true,
    });
  }

  getPosition() {
    return { x: this.x, y: this.y };
  }
}
