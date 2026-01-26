export class HealthGuard {
  static shouldPause(consecutiveFailures: number) {
    return consecutiveFailures >= 3;
  }
}