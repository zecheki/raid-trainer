const MOVE_CODES = Object.freeze({
  KeyW: { x: 0, y: -1 },
  ArrowUp: { x: 0, y: -1 },
  KeyS: { x: 0, y: 1 },
  ArrowDown: { x: 0, y: 1 },
  KeyA: { x: -1, y: 0 },
  ArrowLeft: { x: -1, y: 0 },
  KeyD: { x: 1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
});

export class Input {
  constructor({ onStartOrNext = () => {}, onReset = () => {} } = {}) {
    this.pressedCodes = new Set();
    this.onStartOrNext = onStartOrNext;
    this.onReset = onReset;

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleBlur = this.handleBlur.bind(this);

    window.addEventListener('keydown', this.handleKeyDown, { passive: false });
    window.addEventListener('keyup', this.handleKeyUp, { passive: false });
    window.addEventListener('blur', this.handleBlur);
  }

  handleKeyDown(event) {
    const { code } = event;

    if (code === 'Space') {
      event.preventDefault();
      if (!event.repeat) {
        this.onStartOrNext();
      }
      return;
    }

    if (code === 'KeyR') {
      event.preventDefault();
      if (!event.repeat) {
        this.onReset();
      }
      return;
    }

    if (Object.prototype.hasOwnProperty.call(MOVE_CODES, code)) {
      event.preventDefault();
      this.pressedCodes.add(code);
    }
  }

  handleKeyUp(event) {
    const { code } = event;
    if (Object.prototype.hasOwnProperty.call(MOVE_CODES, code)) {
      event.preventDefault();
      this.pressedCodes.delete(code);
    }
  }

  getMoveVector() {
    let x = 0;
    let y = 0;

    for (const code of this.pressedCodes) {
      const move = MOVE_CODES[code];
      if (!move) {
        continue;
      }
      x += move.x;
      y += move.y;
    }

    const length = Math.hypot(x, y);
    if (length <= 0.00001) {
      return { x: 0, y: 0 };
    }

    return { x: x / length, y: y / length };
  }

  handleBlur() {
    this.clear();
  }

  clear() {
    this.pressedCodes.clear();
  }

  destroy() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    this.clear();
  }
}
