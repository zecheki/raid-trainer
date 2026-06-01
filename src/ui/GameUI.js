import { GAME_STATE_LABEL } from '../core/constants.js';

export class GameUI {
  constructor(root = document.getElementById('gameUi')) {
    this.root = root;
    this.elements = {
      state: this.find('state'),
      targetShield: this.find('targetShield'),
      shieldCount: this.find('shieldCount'),
      nextBeam: this.find('nextBeam'),
      nextCircleAoe: this.find('nextCircleAoe'),
      beamCount: this.find('beamCount'),
      orbCount: this.find('orbCount'),
      successRate: this.find('successRate'),
      laneAngles: this.find('laneAngles'),
      logs: this.find('logs'),
    };
  }

  find(name) {
    return this.root?.querySelector(`[data-ui="${name}"]`) ?? null;
  }

  update(snapshot) {
    const safe = snapshot ?? {};
    const mechanic = safe.mechanic ?? {};
    const stats = safe.stats ?? {};
    const logs = Array.isArray(safe.logs) ? safe.logs : [];
    const activeLaneAngles = Array.isArray(mechanic.activeLaneAngles) ? mechanic.activeLaneAngles : [];

    this.setText('state', GAME_STATE_LABEL[safe.state] ?? '알 수 없음');
    this.setText('targetShield', mechanic.currentShieldName ?? '-');
    this.setText('shieldCount', `${mechanic.shieldCount ?? 0} / 3`);
    this.setText('nextBeam', this.formatSeconds(mechanic.nextBeamSeconds));
    this.setText('nextCircleAoe', this.formatSeconds(mechanic.nextCircleAoeSeconds));
    this.setText('beamCount', `${mechanic.beamCount ?? 0} / ${mechanic.maxBeams ?? 7}`);
    this.setText('orbCount', `${mechanic.orbCount ?? 0} / 밖 ${mechanic.outsideOrbCount ?? 0}`);
    this.setText('successRate', this.formatSuccessRate(stats));
    this.setText('laneAngles', activeLaneAngles.length > 0 ? activeLaneAngles.map((angle) => `${angle}°`).join(' / ') : '-');
    this.renderLogs(logs);
  }

  setText(name, value) {
    const element = this.elements[name];
    if (element) {
      element.textContent = value;
    }
  }

  formatSeconds(value) {
    if (!Number.isFinite(value)) {
      return '-';
    }
    if (value <= 0) {
      return '장판 없음';
    }
    return `${value.toFixed(1)}초`;
  }

  formatSuccessRate(stats) {
    const attempts = stats.attempts ?? 0;
    const successes = stats.successes ?? 0;
    const rate = stats.successRate ?? 0;
    if (attempts <= 0) {
      return '0.0% (0 / 0)';
    }
    return `${(rate * 100).toFixed(1)}% (${successes} / ${attempts})`;
  }

  renderLogs(logs) {
    const list = this.elements.logs;
    if (!list) {
      return;
    }

    list.replaceChildren();
    for (const entry of logs.slice(0, 8)) {
      const item = document.createElement('li');
      item.textContent = entry;
      list.appendChild(item);
    }
  }
}
