export const CANVAS = Object.freeze({
  WIDTH: 960,
  HEIGHT: 640,
});

export const ARENA = Object.freeze({
  CENTER_X: CANVAS.WIDTH / 2,
  CENTER_Y: CANVAS.HEIGHT / 2,
  RADIUS: 250,
  BOSS_RADIUS: 20,
  PLAYER_RADIUS: 8,
});

export const COLORS = Object.freeze({
  red: {
    id: 'red',
    name: ' ',
    fill: '#ef4444',
    stroke: '#fecaca',
    soft: 'rgba(239, 68, 68, 0.18)',
  },
  green: {
    id: 'green',
    name: ' ',
    fill: '#22c55e',
    stroke: '#bbf7d0',
    soft: 'rgba(34, 197, 94, 0.18)',
  },
  blue: {
    id: 'blue',
    name: ' ',
    fill: '#3b82f6',
    stroke: '#bfdbfe',
    soft: 'rgba(59, 130, 246, 0.18)',
  },
});

export const COLOR_ORDER = Object.freeze(['red', 'green', 'blue']);

export const GAME_STATE = Object.freeze({
  READY: 'ready',
  RUNNING: 'running',
  SUCCESS: 'success',
  FAILED: 'failed',
});

export const GAME_STATE_LABEL = Object.freeze({
  [GAME_STATE.READY]: '대기 중',
  [GAME_STATE.RUNNING]: '진행 중',
  [GAME_STATE.SUCCESS]: '성공',
  [GAME_STATE.FAILED]: '실패',
});

export const MECHANIC = Object.freeze({
  SHIELD_COUNT: 3,
  LANE_COUNT: 12,
  LANE_STEP_DEGREES: 30,
  ACTIVE_LANE_COUNT: 2,
  ORB_RADIUS: 3,
  ORB_SPEED: 6,
  ORB_START_DISTANCE: ARENA.RADIUS - 138,
  ORB_SPACING: 32,
  ORBS_PER_ACTIVE_LANE: 3,
  ORBS_PER_OUTSIDE_LANE: 3,
  SHOW_OUTSIDE_ORBS: true,
  OUTSIDE_ORB_ALPHA: 0.28,
  ORB_SPAWN_INTERVAL: 2.3,
  SHIELD_BASE_RADIUS: ARENA.BOSS_RADIUS + 14,
  SHIELD_GAP: 4,
  SHIELD_LINE_WIDTH: 4,
  SHIELD_GLOW_OFFSET: 4,
  BEAM_INTERVAL: 3,
  BEAM_TELEGRAPH_TIME: 0.9,
  BEAM_LOCK_BEFORE_FIRE: 0.4,
  BEAM_ACTIVE_TIME: 0.32,
  MAX_BEAMS: 7,
  BEAM_WIDTH: 12,
  CIRCLE_AOE_FIRST_DELAY: 1.2,
  CIRCLE_AOE_INTERVAL: 5.0,
  CIRCLE_AOE_RADIUS: 14,
  CIRCLE_AOE_TELEGRAPH_TIME: 0.75,
  CIRCLE_AOE_ACTIVE_TIME: 0.22,
});

export const PLAYER = Object.freeze({
  SPEED: 120,
});
