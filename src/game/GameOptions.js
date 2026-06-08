import { DIFFICULTY_OPTION_DEFAULTS } from '../core/constants.js';

export class GameOptions {
  constructor(root = document.getElementById('difficultyOptions')) {
    this.root = root;
    this.inputs = Array.from(this.root?.querySelectorAll('[data-option]') ?? []);
    this.applyDefaults();
  }

  applyDefaults() {
    for (const input of this.inputs) {
      const name = input.dataset.option;
      if (Object.prototype.hasOwnProperty.call(DIFFICULTY_OPTION_DEFAULTS, name)) {
        input.checked = Boolean(DIFFICULTY_OPTION_DEFAULTS[name]);
      }
    }
  }

  getSnapshot() {
    const options = { ...DIFFICULTY_OPTION_DEFAULTS };

    for (const input of this.inputs) {
      const name = input.dataset.option;
      if (!name) {
        continue;
      }
      options[name] = Boolean(input.checked);
    }

    return options;
  }

  setEnabled(enabled) {
    for (const input of this.inputs) {
      input.disabled = !enabled;
    }

    this.root?.classList.toggle('is-locked', !enabled);
  }
}
