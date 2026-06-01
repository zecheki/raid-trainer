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
    this.circleAoEs = [];
    this.circleAoeTimer = MECHANIC.CIRCLE_AOE_FIRST_DELAY;
    this.circleAoEsDroppedTotal = 0;
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
    this.circleAoEs = [];
    this.resetCircleAoeSchedule();
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
    this.orbs = [];

    if (!Array.isArray(this.activeLaneIndices) || this.activeLaneIndices.length === 0) {
      return;
    }

    for (const laneIndex of this.activeLaneIndices) {
      this.spawnLaneOrbs(laneIndex, MECHANIC.ORBS_PER_ACTIVE_LANE, true);
    }

    if (MECHANIC.SHOW_OUTSIDE_ORBS) {
      for (let laneIndex = 0; laneIndex < MECHANIC.LANE_COUNT; laneIndex += 1) {
        if (this.activeLaneIndices.includes(laneIndex)) {
          continue;
        }

        this.spawnLaneOrbs(laneIndex, MECHANIC.ORBS_PER_OUTSIDE_LANE, false);
      }
    }

    this.spawnCooldown = MECHANIC.ORB_SPAWN_INTERVAL;
  }

  spawnLaneOrbs(laneIndex, orbCount, isAssigned) {
    const colorsForLane = shuffle([...COLOR_ORDER]);

    for (let i = 0; i < orbCount; i += 1) {
      const distanceOffset = i * MECHANIC.ORB_SPACING;
      const colorId = colorsForLane[i % colorsForLane.length];
      this.spawnOrb(laneIndex, distanceOffset, colorId, isAssigned);
    }
  }

  spawnOrb(
    laneIndex = randomItem(this.activeLaneIndices),
    distanceOffset = 0,
    forcedColorId = null,
    isAssigned = true,
  ) {
    if (laneIndex === undefined) {
      return;
    }

    const angle = laneAngle(laneIndex, MECHANIC.LANE_COUNT);
    const colorId = forcedColorId ?? randomItem(COLOR_ORDER) ?? 'red';

    this.orbs.push(
      new Orb({
        laneIndex,
        laneAngleDegrees: angle,
        colorId,
        distanceOffset,
        isAssigned,
      }),
    );
  }

  update(deltaSeconds, playerPosition) {
    if (this.finished) {
      this.updateBeam(deltaSeconds);
      this.updateExistingCircleAoEs(deltaSeconds);
      return { state: null, message: null };
    }

    this.updateOrbSpawn(deltaSeconds);
    const beamFireResult = this.updateBeamTimer(deltaSeconds, playerPosition);
    if (beamFireResult?.state) {
      return beamFireResult;
    }

    this.updateCircleAoEs(deltaSeconds, playerPosition);
    this.updateBeam(deltaSeconds);
    this.updateOrbs(deltaSeconds);

    const playerHazardResult = this.resolvePlayerHazards(playerPosition);
    if (playerHazardResult?.state) {
      return playerHazardResult;
    }

    return this.resolveBossHits();
  }

  updateOrbSpawn(deltaSeconds) {
    // 시작 시 활성 라인마다 3개씩 생성하고, 이후 추가 구슬은 생성하지 않는다.
    return;
  }

  updateBeamTimer(deltaSeconds, playerPosition) {
    if (this.beamsFired >= MECHANIC.MAX_BEAMS) {
      this.beamTelegraph = null;
      return { state: null, message: null };
    }

    this.beamCooldown -= deltaSeconds;

    // 발사 전 프레임에서만 전조를 갱신/삭제한다.
    // beamCooldown <= 0이 된 프레임에는 고정된 beamTelegraph를 보존해야 실제 판정도 고정 위치를 사용한다.
    if (this.beamCooldown > 0) {
      if (this.beamCooldown <= MECHANIC.BEAM_TELEGRAPH_TIME) {
        const shouldLock = this.beamCooldown <= MECHANIC.BEAM_LOCK_BEFORE_FIRE;
        this.updateBeamTelegraph(playerPosition, shouldLock);
      } else {
        this.beamTelegraph = null;
      }
    }

    if (this.beamCooldown <= 0) {
      const beamResult = this.fireBeam(playerPosition);
      this.beamsFired += 1;
      this.beamCooldown += MECHANIC.BEAM_INTERVAL;
      this.beamTelegraph = null;

      if (beamResult?.state) {
        return beamResult;
      }
    }

    return { state: null, message: null };
  }

  updateBeamTelegraph(playerPosition, shouldLock = false) {
    const progress = 1 - this.beamCooldown / MECHANIC.BEAM_TELEGRAPH_TIME;
    const alpha = Math.min(0.82, Math.max(0.12, progress * 0.82));

    if (shouldLock && this.beamTelegraph) {
      this.beamTelegraph.alpha = alpha;
      this.beamTelegraph.progress = Math.min(1, Math.max(0, progress));
      this.beamTelegraph.locked = true;
      return;
    }

    const start = { x: ARENA.CENTER_X, y: ARENA.CENTER_Y };
    const angle = angleBetweenPoints(start, playerPosition);
    const end = angleToPoint(ARENA.CENTER_X, ARENA.CENTER_Y, angle, ARENA.RADIUS + 92);

    this.beamTelegraph = {
      start,
      end,
      angle,
      alpha,
      progress: Math.min(1, Math.max(0, progress)),
      locked: shouldLock,
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
    const beamLine = this.beamTelegraph ?? this.createBeamLineFromPlayer(playerPosition);

    this.beam = {
      start: beamLine.start,
      end: beamLine.end,
      angle: beamLine.angle,
      remainingTime: MECHANIC.BEAM_ACTIVE_TIME,
    };

    const hitOrbs = this.orbs.filter((orb) =>
      lineHitCircle(this.beam.start, this.beam.end, orb.getPosition(), orb.radius + MECHANIC.BEAM_WIDTH / 2),
    );

    const outsideHit = hitOrbs.find((orb) => !orb.isAssigned);
    if (outsideHit) {
      this.finished = true;
      return {
        state: GAME_STATE.FAILED,
        message: '실패: 담당 밖 오브를 직선장판에 맞췄습니다.',
      };
    }

    for (const orb of hitOrbs) {
      orb.cycleColor();
    }

    return { state: null, message: null };
  }

  createBeamLineFromPlayer(playerPosition) {
    const start = { x: ARENA.CENTER_X, y: ARENA.CENTER_Y };
    const angle = angleBetweenPoints(start, playerPosition);
    const end = angleToPoint(ARENA.CENTER_X, ARENA.CENTER_Y, angle, ARENA.RADIUS + 92);
    return { start, end, angle };
  }

  resetCircleAoeSchedule() {
    this.circleAoEsDroppedTotal = 0;
    this.circleAoeTimer = MECHANIC.CIRCLE_AOE_FIRST_DELAY;
  }

  getCircleAoeSpacing() {
    if (!MECHANIC.CIRCLE_AOE_ENABLED) {
      return Number.POSITIVE_INFINITY;
    }

    const interval = Number(MECHANIC.CIRCLE_AOE_INTERVAL);
    if (!Number.isFinite(interval) || interval <= 0) {
      return Number.POSITIVE_INFINITY;
    }

    return interval;
  }

  updateCircleAoEs(deltaSeconds, playerPosition) {
    this.updateExistingCircleAoEs(deltaSeconds);
    this.updateCircleAoeSpawn(deltaSeconds, playerPosition);
  }

  updateExistingCircleAoEs(deltaSeconds) {
    const alive = [];

    for (const aoe of this.circleAoEs) {
      aoe.age += deltaSeconds;
      if (aoe.age <= aoe.telegraphTime + aoe.activeTime) {
        alive.push(aoe);
      }
    }

    this.circleAoEs = alive;
  }

  updateCircleAoeSpawn(deltaSeconds, playerPosition) {
    if (!MECHANIC.CIRCLE_AOE_ENABLED) {
      return;
    }

    const maxCount = Number(MECHANIC.CIRCLE_AOE_MAX_COUNT);
    if (Number.isFinite(maxCount) && this.circleAoEsDroppedTotal >= maxCount) {
      this.circleAoeTimer = Number.POSITIVE_INFINITY;
      return;
    }

    this.circleAoeTimer -= deltaSeconds;

    while (this.circleAoeTimer <= 0) {
      if (Number.isFinite(maxCount) && this.circleAoEsDroppedTotal >= maxCount) {
        this.circleAoeTimer = Number.POSITIVE_INFINITY;
        return;
      }

      this.createCircleAoe(playerPosition);
      this.circleAoEsDroppedTotal += 1;
      this.circleAoeTimer += this.getCircleAoeSpacing();

      if (!Number.isFinite(this.circleAoeTimer)) {
        return;
      }
    }
  }

  createCircleAoe(playerPosition) {
    this.circleAoEs.push({
      x: playerPosition.x,
      y: playerPosition.y,
      radius: MECHANIC.CIRCLE_AOE_RADIUS,
      age: 0,
      telegraphTime: MECHANIC.CIRCLE_AOE_TELEGRAPH_TIME,
      activeTime: MECHANIC.CIRCLE_AOE_ACTIVE_TIME,
    });
  }

  resolvePlayerHazards(playerPosition) {
    if (this.beam) {
      const playerHitByBeam = lineHitCircle(
        this.beam.start,
        this.beam.end,
        playerPosition,
        ARENA.PLAYER_RADIUS + MECHANIC.BEAM_WIDTH / 2,
      );

      if (playerHitByBeam) {
        this.finished = true;
        return {
          state: GAME_STATE.FAILED,
          message: '실패: 직선장판에 맞았습니다.',
        };
      }
    }

    const activeCircle = this.circleAoEs.find((aoe) => this.isCircleAoeActive(aoe));
    if (activeCircle) {
      const distanceFromCenter = Math.hypot(playerPosition.x - activeCircle.x, playerPosition.y - activeCircle.y);
      if (distanceFromCenter <= activeCircle.radius + ARENA.PLAYER_RADIUS) {
        this.finished = true;
        return {
          state: GAME_STATE.FAILED,
          message: '실패: 원형장판에 맞았습니다.',
        };
      }
    }

    return { state: null, message: null };
  }

  isCircleAoeActive(aoe) {
    return aoe.age >= aoe.telegraphTime && aoe.age <= aoe.telegraphTime + aoe.activeTime;
  }

  getCircleAoeProgress(aoe) {
    if (this.isCircleAoeActive(aoe)) {
      return 1;
    }
    return Math.min(1, Math.max(0, aoe.age / aoe.telegraphTime));
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
      const touchedShield = this.hasOrbTouchedCurrentShield(orb);

      if (!orb.isAssigned) {
        if (!touchedShield) {
          untouchedOrbs.push(orb);
        }
        continue;
      }

      if (touchedShield) {
        touchedOrbs.push(orb);
      } else {
        untouchedOrbs.push(orb);
      }
    }

    if (touchedOrbs.length === 0) {
      this.orbs = untouchedOrbs;
      return { state: null, message: null };
    }

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

  getNextCircleAoeSeconds() {
    if (!MECHANIC.CIRCLE_AOE_ENABLED) {
      return Number.POSITIVE_INFINITY;
    }

    const maxCount = Number(MECHANIC.CIRCLE_AOE_MAX_COUNT);
    if (Number.isFinite(maxCount) && this.circleAoEsDroppedTotal >= maxCount) {
      return Number.POSITIVE_INFINITY;
    }

    return Math.max(0, this.circleAoeTimer);
  }

  render(ctx) {
    this.renderCircleAoEs(ctx);
    this.renderBeam(ctx);
    this.renderBossAndShields(ctx);

    for (const orb of this.orbs) {
      orb.render(ctx);
    }
  }

  renderCircleAoEs(ctx) {
    for (const aoe of this.circleAoEs) {
      const active = this.isCircleAoeActive(aoe);
      const progress = this.getCircleAoeProgress(aoe);

      if (active) {
        drawCircle(ctx, aoe.x, aoe.y, aoe.radius, {
          fill: 'rgba(248, 113, 113, 0.34)',
          stroke: 'rgba(254, 202, 202, 0.95)',
          lineWidth: 3,
        });
        continue;
      }

      drawCircle(ctx, aoe.x, aoe.y, aoe.radius, {
        fill: `rgba(248, 113, 113, ${0.08 + progress * 0.12})`,
        stroke: `rgba(248, 113, 113, ${0.25 + progress * 0.6})`,
        lineWidth: 2,
      });
      drawRing(ctx, aoe.x, aoe.y, Math.max(4, aoe.radius * progress), {
        stroke: 'rgba(254, 202, 202, 0.82)',
        lineWidth: 2,
        alpha: 1,
      });
    }
  }

  renderBeam(ctx) {
    if (this.beamTelegraph) {
      const alpha = this.beamTelegraph.alpha;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.strokeStyle = this.beamTelegraph.locked
        ? `rgba(251, 191, 36, ${alpha * 0.42})`
        : `rgba(125, 211, 252, ${alpha * 0.45})`;
      ctx.lineWidth = MECHANIC.BEAM_WIDTH + 18;
      ctx.beginPath();
      ctx.moveTo(this.beamTelegraph.start.x, this.beamTelegraph.start.y);
      ctx.lineTo(this.beamTelegraph.end.x, this.beamTelegraph.end.y);
      ctx.stroke();

      ctx.strokeStyle = this.beamTelegraph.locked
        ? `rgba(251, 191, 36, ${alpha})`
        : `rgba(56, 189, 248, ${alpha})`;
      ctx.lineWidth = MECHANIC.BEAM_WIDTH;
      ctx.setLineDash(this.beamTelegraph.locked ? [] : [18, 10]);
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
      nextCircleAoeSeconds: this.getNextCircleAoeSeconds(),
      orbCount: Array.isArray(this.orbs) ? this.orbs.filter((orb) => orb.isAssigned).length : 0,
      outsideOrbCount: Array.isArray(this.orbs) ? this.orbs.filter((orb) => !orb.isAssigned).length : 0,
      circleAoeCount: Array.isArray(this.circleAoEs) ? this.circleAoEs.length : 0,
      circleAoEsDroppedTotal: this.circleAoEsDroppedTotal,
      resultMessage: this.resultMessage,
    };
  }
}
