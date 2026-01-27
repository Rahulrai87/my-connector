export class RetryEngine {
  constructor(
    private attempts = 3,
    private backoffMs = [1000, 3000, 10000],
  ) {}

  async run(fn: () => Promise<void>, i = 0): Promise<void> {
    try {
      await fn();
    } catch (e) {
      if (i >= this.attempts) throw e;
      await new Promise(r => setTimeout(r, this.backoffMs[i]));
      return this.run(fn, i + 1);
    }
  }
}