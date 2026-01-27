import { Inject } from '@nestjs/common';
import { ConnectorLockRepository } from './connector-lock.repository';
import { LOCK_REPO } from '../constants';

export class ConnectorLockService {
  constructor(
    @Inject(LOCK_REPO)
    private readonly repo: ConnectorLockRepository
) {}

  async acquire(connectorId: string, runId: string) {
    return this.repo.tryLock(connectorId, runId);
  }

  async release(connectorId: string, runId: string) {
    await this.repo.unlock(connectorId, runId);
  }
}