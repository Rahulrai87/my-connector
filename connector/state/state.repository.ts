export interface StateRepository {
  loadAll(connectorId: string): Promise<Map<string, string>>;
  save(connectorId: string, state: Map<string, string>): Promise<void>;
}