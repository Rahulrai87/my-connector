export type ChangeAction = 'CREATE' | 'UPDATE' | 'DELETE';

export interface ChangeEvent {
  action: ChangeAction;
  file: any;
  hash: string;
}

export class PersistentDetector {
  detect(
    current: any[],
    previous: Map<string, any>,
  ): ChangeEvent[] {
    const changes: ChangeEvent[] = [];
    const seen = new Set<string>();

    for (const file of current) {
      seen.add(file.itemId);
      const prev = previous.get(file.itemId);

      const hash = `${file.filePath}|${file.eTag}|${file.lastModified}`;

      if (!prev) {
        changes.push({ action: 'CREATE', file, hash });
      } else if (prev.hash !== hash) {
        changes.push({ action: 'UPDATE', file, hash });
      }
    }

    for (const [itemId, prev] of previous.entries()) {
      if (!seen.has(itemId)) {
        changes.push({
          action: 'DELETE',
          file: prev,
          hash: prev.hash,
        });
      }
    }

    return changes;
  }
}