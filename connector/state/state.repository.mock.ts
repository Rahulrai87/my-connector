import { StateRepository } from './state.repository';

export class InMemoryStateRepository
  implements StateRepository
{
  private store = new Map<string, Map<string, string>>();

  async loadAll(connectorId: string) {
    return this.store.get(connectorId) ?? new Map();
  }

  async save(connectorId: string, state: Map<string, string>) {
    this.store.set(connectorId, new Map(state));
  }
}