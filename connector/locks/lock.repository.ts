export interface LockRepository {
  acquire(connectorId: string, runId: string): Promise<boolean>;
  release(connectorId: string, runId: string): Promise<void>;
}