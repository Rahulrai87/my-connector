import { Metrics } from './metrics.interface';

export class ConsoleMetrics implements Metrics {
  increment(name: string, tags?: Record<string, string>) {
    console.log('[METRIC]', name, tags ?? {});
  }

  timing(name: string, ms: number, tags?: Record<string, string>) {
    console.log('[METRIC]', name, ms + 'ms', tags ?? {});
  }
}