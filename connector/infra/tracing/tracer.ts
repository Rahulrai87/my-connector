export class Tracer {
  async trace<T>(
    spanName: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    const start = Date.now();
    try {
      return await fn();
    } finally {
      const duration = Date.now() - start;
      console.log('[TRACE]', spanName, duration + 'ms');
    }
  }
}