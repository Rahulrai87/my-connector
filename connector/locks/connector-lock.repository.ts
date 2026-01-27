import { Model } from 'mongoose';

export class ConnectorLockRepository {
  constructor(private readonly model: Model<any>) {}

  async tryLock(
    connectorId: string,
    runId: string,
    ttlMs = 1000 * 60 * 60, // 1 hour
  ): Promise<boolean> {
    try {
      await this.model.create({
        connectorId,
        runId,
        expiresAt: new Date(Date.now() + ttlMs),
      });
      return true;
    } catch (e: any) {
      // duplicate key = already locked
      return false;
    }
  }

  async unlock(connectorId: string, runId: string) {
    await this.model.deleteOne({ connectorId, runId });
  }
}