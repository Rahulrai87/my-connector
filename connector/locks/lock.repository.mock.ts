import { LockRepository } from './lock.repository';

export class InMemoryLockRepository
  implements LockRepository
{
  private locks = new Set<string>();

  async acquire(connectorId: string, runId: string) {
    if (this.locks.has(connectorId)) return false;
    this.locks.add(connectorId);
    return true;
  }

  async release(connectorId: string) {
    this.locks.delete(connectorId);
  }
}