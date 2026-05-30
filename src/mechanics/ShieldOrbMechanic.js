import { ARENA, COLORS, COLOR_ORDER, GAME_STATE, MECHANIC } from '../core/constants.js';
import {
  angleBetweenPoints,
  angleToPoint,
  laneAngle,
  lineHitCircle,
  randomInt,
  randomItem,
  shuffle,
} from '../core/math.js';
import { drawCircle, drawRing, drawText } from '../render/draw.js';
import { Orb } from './Orb.js';

export class ShieldOrbMechanic {
  constructor() {
    this.shields = [];
    this.orbs = [];
    this.activeLaneIndices = [];
    this.activeLaneAngles = [];
    this.beam = null;
    this.beamTelegraph = null;
    this.beamCooldown = MECHANIC.BEAM_INTERVAL;
    this.beamsFired = 0;
    this.spawnCooldown = 0;
    this.spawnedOrbWaves = 0;
    this.resultMessage = '';
    this.finished = false;
  }

  reset() {
    this.shields = shuffle(COLOR_ORDER).slice(0, MECHANIC.SHIELD_COUNT);
    this.orbs = [];
    this.activeLaneIndices = this.pickAdjacentLanes();
    this.activeLaneAngles = this.activeLaneIndices.map((index) => laneAngle(index, MECHANIC.LANE_COUNT));
    this.beam = null;
    this.beamTelegraph = null;
    this.beamCooldown = MECHANIC.BEAM_INTERVAL;
    this.beamsFired = 0;
    this.spawnCooldown = 0;
    this.spawnedOrbWaves = 0;
    this.resultMessage = 'Space를 눌러 시작하세요.';
    this.finished = false;

    this.spawnInitialOrbs();
  }

  pickAdjacentLanes() {
    const first = randomInt(0, MECHANIC.LANE_COUNT);
    const second = (first + 1) % MECHANIC.LANE_COUNT;
    return [first, second];
  }

  spawnInitialOrbs() {
    if (this.spawnedOrbWaves >= MECHANIC.MAX_ORB_WAVES) {
      return;
    }

    for (const laneIndex of this.activeLaneIndices) {
      this.spawnOrb(laneIndex);
    }

    this.spawnedOrbWaves += 1;
    this.spawnCooldown = MECHANIC.ORB_SPAWN_INTERVAL;
  }

  spawnOrb(laneIndex = randomItem(this.activeLaneIndices)) {
    if (laneIndex === undefined) {
      return;
    }

    const angle = laneAngle(laneIndex, MECHANIC.LANE_COUNT);
    const colorId = randomItem(COLOR_ORDER) ?? 'red';
    this.orbs.push(new Orb({ laneIndex, laneAngleDegrees: angle, colorId }));
  }

  update(deltaSeconds, playerPosition) {
    if (this.finished) {
      this.updateBeam(deltaSeconds);
      return { state: null, message: null };
    }

    this.updateOrbSpawn(deltaSeconds);
    this.updateBeamTimer(deltaSeconds, playerPosition);
    this.updateBeam(deltaSeconds);
    this.updateOrbs(deltaSeconds);

    return this.resolveBossHits();
  }

  updateOrbSpawn(deltaSeconds) {
    if (this.spawnedOrbWaves >= MECHANIC.MAX_ORB_WAVES) {
      return;
    }

    this.spawnCooldown -= deltaSeconds;

    if (this.spawnCooldown <= 0) {
      for (const laneIndex of this.activeLaneIndices) {
        this.spawnOrb(laneIndex);
      }

      this.spawnedOrbWaves += 1;
      this.spawnCooldown += MECHANIC.ORB_SPAWN_INTERVAL;
    }
  }

  updateBeamTimer(deltaSeconds, playerPosition) {
    if (this.beamsFired >= MECHANIC.MAX_BEAMS) {
      this.beamTelegraph = null;
      return;
    }

    this.beamCooldown -= deltaSeconds;

    if (this.beamCooldown > 0 && this.beamCooldown <= MECHANIC.BEAM_TELEGRAPH_TIME) {
      this.updateBeamTelegraph(playerPosition);
    } else {
      this.beamTelegraph = null;
    }

    if (this.beamCooldown <= 0) {
      this.fireBeam(playerPosition);
      this.beamsFired += 1;
      this.beamCooldown += MECHANIC.BEAM_INTERVAL;
      this.beamTelegraph = null;
    }
  }

  updateBeamTelegraph(playerPosition) {
    const start = { x: ARENA.CENTER_X, y: ARENA.CENTER_Y };
    const angle = angleBetweenPoints(start, playerPosition);
    const end = angleToPoint(ARENA.CENTER_X, ARENA.CENTER_Y, angle, ARENA.RADIUS + 92);
    const progress = 1 - this.beamCooldown / MECHANIC.BEAM_TELEGRAPH_TIME;

    this.beamTelegraph = {
      start,
      end,
      angle,
      alpha: Math.min(0.78, Math.max(0.12, progress * 0.78)),
      progress: Math.min(1, Math.max(0, progress)),
    };
  }

  updateBeam(deltaSeconds) {
    if (!this.beam) {
      return;
    }

    this.beam.remainingTime -= deltaSeconds;
    if (this.beam.remainingTime <= 0) {
      this.beam = null;
    }
  }

  updateOrbs(deltaSeconds) {
    for (const orb of this.orbs) {
      orb.update(deltaSeconds);
    }
  }

  fireBeam(playerPosition) {
    const start = { x: ARENA.CENTER_X, y: ARENA.CENTER_Y };
    const angle = angleBetweenPoints(start, playerPosition);
    const end = angleToPoint(ARENA.CENTER_X, ARENA.CENTER_Y, angle, ARENA.RADIUS + 92);

    this.beam = {
      start,
      end,
      angle,
      remainingTime: MECHANIC.BEAM_ACTIVE_TIME,
    };

    for (const orb of this.orbs) {
      const hit = lineHitCircle(start, end, orb.getPosition(), orb.radius + MECHANIC.BEAM_WIDTH / 2);
      if (hit) {
        orb.cycleColor();
      }
    }
  }

  resolveBossHits() {
    const currentShield = this.getCurrentShield();

    if (!currentShield) {
      this.orbs = [];
      return { state: null, message: null };
    }

    const untouchedOrbs = [];
    const touchedOrbs = [];

    for (const orb of this.orbs) {
      if (this.hasOrbTouchedCurrentShield(orb)) {
        touchedOrbs.push(orb);
      } else {
        untouchedOrbs.push(orb);
      }
    }

    // 이번 프레임에 쉴드에 닿은 구슬이 없으면 아무 일도 없음
    if (touchedOrbs.length === 0) {
      this.orbs = untouchedOrbs;
      return { state: null, message: null };
    }

    // 닿은 구슬 중 하나라도 현재 쉴드 색과 다르면 실패
    const wrongOrb = touchedOrbs.find((orb) => orb.colorId !== currentShield);

    if (wrongOrb) {
      const expected = COLORS[currentShield]?.name ?? currentShield;
      const actual = COLORS[wrongOrb.colorId]?.name ?? wrongOrb.colorId;

      this.finished = true;

      return {
        state: GAME_STATE.FAILED,
        message: `실패: 현재 쉴드는 ${expected}, 닿은 구슬은 ${actual}`,
      };
    }

    // 닿은 구슬들이 모두 현재 쉴드 색과 같으면:
    // 1. 닿은 구슬들은 전부 제거
    // 2. 현재 바깥쪽 쉴드 1겹 제거
    this.orbs = untouchedOrbs;

    const colorName = COLORS[currentShield]?.name ?? currentShield;
    const removedCount = touchedOrbs.length;

    this.shields.shift();
    this.resultMessage = `${colorName} 구슬 ${removedCount}개 통과: 쉴드 1겹 제거`;

    if (this.shields.length === 0) {
      this.finished = true;

      return {
        state: GAME_STATE.SUCCESS,
        message: '세 겹의 쉴드를 모두 제거했습니다.',
      };
    }

    return { state: null, message: null };
  }

  getCurrentShield() {
    return Array.isArray(this.shields) && this.shields.length > 0 ? this.shields[0] : null;
  }

  getCurrentShieldRadius() {
    const shieldCount = Array.isArray(this.shields) ? this.shields.length : 0;
    if (shieldCount <= 0) {
      return 0;
    }

    return MECHANIC.SHIELD_BASE_RADIUS + (shieldCount - 1) * MECHANIC.SHIELD_GAP;
  }

  getCurrentShieldHitDistance(orb) {
    return this.getCurrentShieldRadius() + MECHANIC.SHIELD_LINE_WIDTH / 2 + orb.radius;
  }

  hasOrbTouchedCurrentShield(orb) {
    const distanceFromBoss = Math.hypot(orb.x - ARENA.CENTER_X, orb.y - ARENA.CENTER_Y);
    return distanceFromBoss <= this.getCurrentShieldHitDistance(orb);
  }

  getNextBeamSeconds() {
    if (this.beamsFired >= MECHANIC.MAX_BEAMS) {
      return 0;
    }
    return Math.max(0, this.beamCooldown);
  }

  render(ctx) {
    this.renderBeam(ctx);
    this.renderBossAndShields(ctx);

    for (const orb of this.orbs) {
      orb.render(ctx);
    }
  }

  renderBeam(ctx) {
    if (this.beamTelegraph) {
      const alpha = this.beamTelegraph.alpha;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.strokeStyle = `rgba(125, 211, 252, ${alpha * 0.45})`;
      ctx.lineWidth = MECHANIC.BEAM_WIDTH + 18;
      ctx.beginPath();
      ctx.moveTo(this.beamTelegraph.start.x, this.beamTelegraph.start.y);
      ctx.lineTo(this.beamTelegraph.end.x, this.beamTelegraph.end.y);
      ctx.stroke();

      ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
      ctx.lineWidth = MECHANIC.BEAM_WIDTH;
      ctx.setLineDash([18, 10]);
      ctx.beginPath();
      ctx.moveTo(this.beamTelegraph.start.x, this.beamTelegraph.start.y);
      ctx.lineTo(this.beamTelegraph.end.x, this.beamTelegraph.end.y);
      ctx.stroke();
      ctx.restore();
    }

    if (!this.beam) {
      return;
    }

    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(248, 250, 252, 0.28)';
    ctx.lineWidth = MECHANIC.BEAM_WIDTH + 14;
    ctx.beginPath();
    ctx.moveTo(this.beam.start.x, this.beam.start.y);
    ctx.lineTo(this.beam.end.x, this.beam.end.y);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
    ctx.lineWidth = MECHANIC.BEAM_WIDTH;
    ctx.beginPath();
    ctx.moveTo(this.beam.start.x, this.beam.start.y);
    ctx.lineTo(this.beam.end.x, this.beam.end.y);
    ctx.stroke();
    ctx.restore();
  }

  renderBossAndShields(ctx) {
    const ringBaseRadius = MECHANIC.SHIELD_BASE_RADIUS;

    for (let i = this.shields.length - 1; i >= 0; i -= 1) {
      const color = COLORS[this.shields[i]] ?? COLORS.red;
      const radius = ringBaseRadius + (this.shields.length - 1 - i) * MECHANIC.SHIELD_GAP;
      drawRing(ctx, ARENA.CENTER_X, ARENA.CENTER_Y, radius, {
        stroke: color.fill,
        lineWidth: MECHANIC.SHIELD_LINE_WIDTH,
        alpha: 0.94,
      });
      drawRing(ctx, ARENA.CENTER_X, ARENA.CENTER_Y, radius + MECHANIC.SHIELD_GLOW_OFFSET, {
        stroke: color.soft,
        lineWidth: 7,
        alpha: 1,
      });
    }

    drawCircle(ctx, ARENA.CENTER_X, ARENA.CENTER_Y, ARENA.BOSS_RADIUS, {
      fill: '#0f172a',
      stroke: '#e2e8f0',
      lineWidth: 3,
    });
    drawCircle(ctx, ARENA.CENTER_X, ARENA.CENTER_Y, ARENA.BOSS_RADIUS - 13, {
      fill: '#1e293b',
      stroke: 'rgba(125, 211, 252, 0.55)',
      lineWidth: 2,
    });
    drawText(ctx, 'BOSS', ARENA.CENTER_X, ARENA.CENTER_Y, {
      font: '800 15px system-ui, sans-serif',
      fill: '#e0f2fe',
      shadow: true,
    });
  }

  getSnapshot() {
    const currentShield = this.getCurrentShield();
    return {
      shields: Array.isArray(this.shields) ? [...this.shields] : [],
      shieldCount: Array.isArray(this.shields) ? this.shields.length : 0,
      currentShield,
      currentShieldName: currentShield ? COLORS[currentShield]?.name ?? currentShield : '-',
      activeLaneIndices: Array.isArray(this.activeLaneIndices) ? [...this.activeLaneIndices] : [],
      activeLaneAngles: Array.isArray(this.activeLaneAngles) ? [...this.activeLaneAngles] : [],
      beamCount: this.beamsFired,
      maxBeams: MECHANIC.MAX_BEAMS,
      nextBeamSeconds: this.getNextBeamSeconds(),
      orbCount: Array.isArray(this.orbs) ? this.orbs.length : 0,
      resultMessage: this.resultMessage,
    };
  }
}
