import { BaseConnector } from '../../base/base.connector';
import { ConnectorStateRepository } from '../../persistence/repositories/connector-state.repository';
import { PersistentDetector } from '../../change-detection/persistent.detector';
import { QueueFactory } from '../../queue/queue.factory';
import { S3StorageClient } from './s3.client';
import { mapS3Object } from './s3.mapper';

export class S3Connector extends BaseConnector {
  public preBuilder;

  private detector = new PersistentDetector();
  private queue = QueueFactory.create();

  constructor(
    private readonly stateRepo: ConnectorStateRepository,
    private readonly connector: any,
    private readonly s3: S3StorageClient,
  ) {
    super();
  }

  protected async run(): Promise<void> {
    const objects = await this.s3.listAllObjects(
      this.connector.bucket,
      this.connector.prefix,
    );

    const current = objects.map(mapS3Object);
    const previous = await this.stateRepo.loadMap(
      this.connector._id,
    );

    const changes = this.detector.detect(
      current,
      previous,
    );

    await this.queue.connect();

    for (const change of changes) {
      await this.queue.send(
        process.env.KAFKA_TOPIC_DOCUMENTS ||
          'documents',
        {
          connectorId: this.connector._id,
          action: change.action,
          file: change.file,
          hash: change.hash,
        },
      );
    }

    await this.queue.disconnect();

    for (const file of current) {
      const hash = `${file.filePath}|${file.eTag}|${file.lastModified}`;
      await this.stateRepo.upsert(
        this.connector._id,
        file,
        hash,
      );
    }

    for (const change of changes) {
      if (change.action === 'DELETE') {
        await this.stateRepo.markDeleted(
          this.connector._id,
          change.file.itemId,
        );
      }
    }
  }
}