export interface Metrics {
  increment(
    name: string,
    tags?: Record<string, string>,
  ): void;

  timing(
    name: string,
    ms: number,
    tags?: Record<string, string>,
  ): void;
}