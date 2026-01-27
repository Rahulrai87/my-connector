import { QueueClient } from '../../infra/queue/queue.interface';
import { ConnectorJobStateRepository } from '../../state/connector-job-state.repository';
import { randomUUID } from 'crypto';
import { s3Fingerprint } from './s3.fingerprint';
import { S3Scanner } from './s3.scanner';
import { Logger } from '../../infra/logger/logger.interface';
import { Metrics } from '../../infra/metrics/metrics.interface';
import { Tracer } from '../../infra/tracing/tracer';

export class S3Runner {
  private scanner = new S3Scanner();

  constructor(
    private readonly queue: QueueClient,
    private readonly stateRepo: ConnectorJobStateRepository,
    private readonly logger: Logger,
    private readonly metrics: Metrics,
    private readonly tracer: Tracer,
  ) {}

  async execute(ctx: {
    connectorId: string;
    runId: string;
    bucket: string;
    prefix?: string;
  }) {
    const objects = await this.tracer.trace(
      's3.scan',
      async () =>
        this.scanner.scan(ctx.bucket, ctx.prefix),
    );

    this.logger.info('S3 objects scanned', {
      count: objects.length,
      bucket: ctx.bucket,
    });

    const prev = await this.stateRepo.loadAll(
      ctx.connectorId,
    );
    const next = new Map<string, string>();

    for (const obj of objects) {
      if (!obj.Key) continue;

      const fp = s3Fingerprint(obj);
      next.set(obj.Key, fp);

      if (!prev.has(obj.Key)) {
        await this.emit('CREATED', obj, ctx);
      } else if (prev.get(obj.Key) !== fp) {
        await this.emit('UPDATED', obj, ctx);
      }
    }

    for (const key of prev.keys()) {
      if (!next.has(key)) {
        await this.emit('DELETED', { Key: key }, ctx);
      }
    }

    await this.stateRepo.save(ctx.connectorId, next);
  }

  private async emit(
    type: 'CREATED' | 'UPDATED' | 'DELETED',
    obj: any,
    ctx: any,
  ) {
    this.metrics.increment('connector.file.event', {
      type,
      source: 's3',
    });

    await this.queue.publish('connector.files', {
      jobId: randomUUID(),
      connectorId: ctx.connectorId,
      runId: ctx.runId,
      eventType: type,
      file: {
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified,
      },
    });
  }
}