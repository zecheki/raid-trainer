import { ARENA, MECHANIC } from '../core/constants.js';
import { angleToPoint, laneAngle } from '../core/math.js';
import { drawCircle, drawRing, drawText } from '../render/draw.js';

export class ArenaRenderer {
  render(ctx, mechanicSnapshot) {
    this.drawBackground(ctx);
    this.drawArena(ctx);
    this.drawLanes(ctx, mechanicSnapshot);
  }

  drawBackground(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const gradient = ctx.createRadialGradient(
      ARENA.CENTER_X,
      ARENA.CENTER_Y,
      40,
      ARENA.CENTER_X,
      ARENA.CENTER_Y,
      520,
    );
    gradient.addColorStop(0, '#172554');
    gradient.addColorStop(1, '#020617');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= ctx.canvas.width; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, ctx.canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= ctx.canvas.height; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(ctx.canvas.width, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawArena(ctx) {
    drawCircle(ctx, ARENA.CENTER_X, ARENA.CENTER_Y, ARENA.RADIUS, {
      fill: 'rgba(15, 23, 42, 0.42)',
      stroke: 'rgba(226, 232, 240, 0.28)',
      lineWidth: 3,
    });

    drawRing(ctx, ARENA.CENTER_X, ARENA.CENTER_Y, ARENA.RADIUS - 42, {
      stroke: 'rgba(148, 163, 184, 0.18)',
      lineWidth: 1,
    });
    drawRing(ctx, ARENA.CENTER_X, ARENA.CENTER_Y, ARENA.RADIUS - 86, {
      stroke: 'rgba(148, 163, 184, 0.14)',
      lineWidth: 1,
    });
  }

  drawLanes(ctx, snapshot) {
    const activeAngles = snapshot?.activeLaneAngles ?? [];
    const activeSet = new Set(activeAngles.map((angle) => Math.round(angle)));

    ctx.save();
    for (let i = 0; i < MECHANIC.LANE_COUNT; i += 1) {
      const angle = laneAngle(i, MECHANIC.LANE_COUNT);
      const start = angleToPoint(ARENA.CENTER_X, ARENA.CENTER_Y, angle, ARENA.BOSS_RADIUS + 18);
      const end = angleToPoint(ARENA.CENTER_X, ARENA.CENTER_Y, angle, ARENA.RADIUS + 44);
      const isActive = activeSet.has(Math.round(angle));

      ctx.strokeStyle = isActive ? 'rgba(250, 204, 21, 0.88)' : 'rgba(148, 163, 184, 0.16)';
      ctx.lineWidth = isActive ? 3 : 1;
      ctx.setLineDash(isActive ? [] : [5, 8]);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      const labelPoint = angleToPoint(ARENA.CENTER_X, ARENA.CENTER_Y, angle, ARENA.RADIUS + 30);
      drawText(ctx, `${angle}°`, labelPoint.x, labelPoint.y, {
        font: isActive ? '700 12px system-ui, sans-serif' : '11px system-ui, sans-serif',
        fill: isActive ? '#fde68a' : 'rgba(203, 213, 225, 0.45)',
      });
    }
    ctx.restore();

    if (activeAngles.length >= 2) {
      const first = activeAngles[0];
      const second = activeAngles[1];
      const mid = this.getMidAngle(first, second);
      const label = angleToPoint(ARENA.CENTER_X, ARENA.CENTER_Y, mid, ARENA.RADIUS + 76);
      drawText(ctx, '너의 위치', label.x, label.y, {
        font: '800 16px system-ui, sans-serif',
        fill: '#fef3c7',
        shadow: true,
      });
    }
  }

  getMidAngle(a, b) {
    let diff = b - a;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    return a + diff / 2;
  }
}
