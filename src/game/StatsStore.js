const STORAGE_KEY = 'shield-orb-trainer-stats-v1';

export class StatsStore {
  constructor(storage = window.localStorage) {
    this.storage = storage;
    this.data = this.load();
  }

  load() {
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      if (!raw) {
        return { attempts: 0, successes: 0 };
      }

      const parsed = JSON.parse(raw);
      return {
        attempts: Number.isFinite(parsed.attempts) ? parsed.attempts : 0,
        successes: Number.isFinite(parsed.successes) ? parsed.successes : 0,
      };
    } catch {
      return { attempts: 0, successes: 0 };
    }
  }

  save() {
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // localStorage가 막힌 환경이어도 게임 진행은 계속한다.
    }
  }

  recordSuccess() {
    this.data.attempts += 1;
    this.data.successes += 1;
    this.save();
  }

  recordFailure() {
    this.data.attempts += 1;
    this.save();
  }

  getSnapshot() {
    const attempts = this.data.attempts;
    const successes = this.data.successes;
    const successRate = attempts > 0 ? successes / attempts : 0;

    return { attempts, successes, successRate };
  }
}
