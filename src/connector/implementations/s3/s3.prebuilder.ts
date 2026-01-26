import { FatalError } from '../../errors/connector.error';
import { S3StorageClient } from './s3.client';

export class S3PreBuilder {
  constructor(
    private readonly client: S3StorageClient,
    private readonly connector: any,
  ) {}

  async validate() {
    try {
      await this.client.validateBucket(
        this.connector.bucket,
      );
    } catch (e: any) {
      throw new FatalError(
        `S3 precheck failed: ${e.message}`,
      );
    }
  }
}