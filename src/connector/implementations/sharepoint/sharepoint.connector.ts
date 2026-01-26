import { BaseConnector } from '../../base/base.connector';
import { SharePointGraphClient } from './sharepoint.graph.client';
import { mapGraphFile } from './sharepoint.mapper';
import { ConnectorStateRepository } from '../../persistence/repositories/connector-state.repository';
import { PersistentDetector } from '../../change-detection/persistent.detector';
import { QueueFactory } from '../../queue/queue.factory';

export class SharePointConnector extends BaseConnector {
  public preBuilder;
  private detector = new PersistentDetector();
  private queue = QueueFactory.create();

  constructor(
    private readonly stateRepo: ConnectorStateRepository,
    private readonly connector: any,
    private readonly graph: SharePointGraphClient,
  ) {
    super();
  }

  protected async run(): Promise<void> {
    const siteId = await this.graph.getSiteId(
      this.connector.siteUrl,
    );
    const driveId =
      await this.graph.getDefaultDriveId(siteId);

    const files = await this.graph.listFilesRecursive(
      driveId,
      this.connector.recursive,
    );

    const current = files.map(mapGraphFile);
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

    // Persist latest state
    for (const file of current) {
      const hash = `${file.filePath}|${file.eTag}|${file.lastModified}`;
      await this.stateRepo.upsert(
        this.connector._id,
        file,
        hash,
      );
    }

    // Mark deletes
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