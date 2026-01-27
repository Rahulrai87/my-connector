import { Model } from 'mongoose';
import { bucketFor } from './bucket.util';

export class ConnectorJobStateRepository {
  constructor(private readonly model: Model<any>) {}

  /**
   * Load all fingerprints for a connector
   * Used only at scan start
   */
  async loadAll(
    connectorId: string,
  ): Promise<Map<string, string>> {
    const docs = await this.model.find({ connectorId });
    const map = new Map<string, string>();

    for (const doc of docs) {
      for (const [fileId, fp] of doc.files.entries()) {
        map.set(fileId, fp);
      }
    }
    return map;
  }

  /**
   * Persist next state in bucketed form
   * Only touched buckets are updated
   */
  async save(
    connectorId: string,
    next: Map<string, string>,
  ) {
    const buckets = new Map<number, Map<string, string>>();

    for (const [fileId, fp] of next.entries()) {
      const bucketId = bucketFor(fileId);
      if (!buckets.has(bucketId)) {
        buckets.set(bucketId, new Map());
      }
      buckets.get(bucketId)!.set(fileId, fp);
    }

    for (const [bucketId, files] of buckets.entries()) {
      await this.model.updateOne(
        { connectorId, bucketId },
        {
          $set: {
            files: Object.fromEntries(files),
            updatedAt: new Date(),
          },
        },
        { upsert: true },
      );
    }
  }
}