import { CANVAS, GAME_STATE } from '../core/constants.js';
import { ArenaRenderer } from './ArenaRenderer.js';
import { Input } from './Input.js';
import { Player } from './Player.js';
import { StatsStore } from './StatsStore.js';
import { ShieldOrbMechanic } from '../mechanics/ShieldOrbMechanic.js';
import { GameUI } from '../ui/GameUI.js';
import { GameOptions } from './GameOptions.js';
import { drawText, roundedRect } from '../render/draw.js';

export class Game {
  constructor(canvas) {
    if (!canvas) {
      throw new Error('Game canvas was not found.');
    }

    this.canvas = canvas;
    this.canvas.width = CANVAS.WIDTH;
    this.canvas.height = CANVAS.HEIGHT;
    this.ctx = canvas.getContext('2d');

    if (!this.ctx) {
      throw new Error('Canvas 2D context is not available.');
    }

    this.state = GAME_STATE.READY;
    this.logs = [];
    this.hasRecordedCurrentAttempt = false;

    this.stats = new StatsStore();
    this.player = new Player();
    this.arenaRenderer = new ArenaRenderer();
    this.options = new GameOptions();
    this.mechanic = new ShieldOrbMechanic();
    this.mechanic.setDifficultyOptions(this.options.getSnapshot());
    this.mechanic.reset();
    this.ui = new GameUI();

    this.input = new Input({
      onStartOrNext: () => this.handleStartOrNext(),
      onReset: () => this.resetAttempt(),
    });

    this.lastTimestamp = 0;
    this.animationFrameId = 0;
    this.isLoopStarted = false;

    this.pushLog('준비 완료: Space로 시작하세요.');
    this.setDifficultyOptionsEnabled(true);
    this.updateUi();
    this.render();
  }

  startLoop() {
    if (this.isLoopStarted) {
      return;
    }

    this.isLoopStarted = true;
    this.lastTimestamp = performance.now();
    this.animationFrameId = requestAnimationFrame((timestamp) => this.loop(timestamp));
  }

  loop(timestamp) {
    const deltaSeconds = Math.min(0.05, Math.max(0, (timestamp - this.lastTimestamp) / 1000));
    this.lastTimestamp = timestamp;

    this.update(deltaSeconds);
    this.render();
    this.updateUi();

    this.animationFrameId = requestAnimationFrame((nextTimestamp) => this.loop(nextTimestamp));
  }

  update(deltaSeconds) {
    if (this.state !== GAME_STATE.RUNNING) {
      return;
    }

    this.player.update(deltaSeconds, this.input);

    const result = this.mechanic.update(deltaSeconds, this.player.getPosition());
    if (result?.state) {
      this.finishAttempt(result.state, result.message);
    }
  }

  render() {
    const mechanicSnapshot = this.mechanic.getSnapshot();
    this.arenaRenderer.render(this.ctx, mechanicSnapshot);
    this.mechanic.render(this.ctx);
    this.player.render(this.ctx);
    this.renderOverlay();
  }

  renderOverlay() {
    if (this.state === GAME_STATE.RUNNING) {
      return;
    }

    const message = this.getOverlayMessage();
    roundedRect(this.ctx, CANVAS.WIDTH / 2 - 220, 28, 440, 58, 16, {
      fill: 'rgba(2, 6, 23, 0.72)',
      stroke: 'rgba(226, 232, 240, 0.22)',
      lineWidth: 1,
    });
    drawText(this.ctx, message, CANVAS.WIDTH / 2, 57, {
      font: '800 18px system-ui, sans-serif',
      fill: '#f8fafc',
      shadow: true,
    });
  }

  getOverlayMessage() {
    switch (this.state) {
      case GAME_STATE.SUCCESS:
        return '성공! Space로 다음 시도';
      case GAME_STATE.FAILED:
        return '실패. Space로 다음 시도 / R로 리셋';
      case GAME_STATE.READY:
      default:
        return 'Space를 눌러 시작';
    }
  }

  handleStartOrNext() {
    if (this.state === GAME_STATE.RUNNING) {
      return;
    }

    const difficultyOptions = this.options.getSnapshot();

    this.mechanic.setDifficultyOptions(difficultyOptions);
    this.resetAttempt();
    this.state = GAME_STATE.RUNNING;
    this.hasRecordedCurrentAttempt = false;
    this.setDifficultyOptionsEnabled(false);
    this.pushLog('시작: 보스 장판 방향을 유도해 구슬 색을 맞추세요.');
    this.updateUi();
  }

  resetAttempt() {
    this.state = GAME_STATE.READY;
    this.hasRecordedCurrentAttempt = false;
    this.player.reset();
    this.mechanic.reset();
    this.input?.clear();
    this.setDifficultyOptionsEnabled(true);
    this.pushLog('현재 시도를 초기화했습니다.');
    this.updateUi();
  }

  finishAttempt(nextState, message) {
    if (nextState !== GAME_STATE.SUCCESS && nextState !== GAME_STATE.FAILED) {
      return;
    }

    this.state = nextState;

    if (!this.hasRecordedCurrentAttempt) {
      if (nextState === GAME_STATE.SUCCESS) {
        this.stats.recordSuccess();
      } else {
        this.stats.recordFailure();
      }
      this.hasRecordedCurrentAttempt = true;
    }

    this.setDifficultyOptionsEnabled(true);
    this.pushLog(message ?? (nextState === GAME_STATE.SUCCESS ? '성공' : '실패'));
    this.updateUi();
  }

  pushLog(message) {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    this.logs.unshift(`[${hh}:${mm}:${ss}] ${message}`);
    this.logs = this.logs.slice(0, 12);
  }

  setDifficultyOptionsEnabled(enabled) {
    this.options?.setEnabled(enabled);
  }

  getSnapshot() {
    return {
      state: this.state,
      mechanic: this.mechanic.getSnapshot(),
      stats: this.stats.getSnapshot(),
      logs: [...this.logs],
    };
  }

  updateUi() {
    this.ui.update(this.getSnapshot());
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.input?.destroy();
  }
}
