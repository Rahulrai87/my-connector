import { QueueClient } from '../../infra/queue/queue.interface';
import { ConnectorJobStateRepository } from '../../state/connector-job-state.repository';
import { buildFingerprint } from './utils/fingerprint.util';
import { randomUUID } from 'crypto';
import { Logger } from '../../infra/logger/logger.interface';
import { Metrics } from '../../infra/metrics/metrics.interface';
import { Tracer } from '../../infra/tracing/tracer';
import { Inject } from '@nestjs/common';
import { STATE_REPO } from 'src/connector/constants';

export class SharePointRunner {
  constructor(
  private readonly queue: QueueClient,
@Inject(STATE_REPO)
private readonly stateRepo: ConnectorJobStateRepository,
private readonly logger: Logger,
private readonly metrics: Metrics,
private readonly tracer: Tracer,
  ) {}

  async execute(ctx: any) {
    const files = await ctx.scan();

    const previous = await this.stateRepo.loadAll(
      ctx.connectorId,
    );
    const next = new Map<string, string>();

    for (const file of files) {
      const fp = buildFingerprint(file);
      next.set(file.id, fp);

      if (!previous.has(file.id)) {
        await this.emit('CREATED', file, ctx);
      } else if (previous.get(file.id) !== fp) {
        await this.emit('UPDATED', file, ctx);
      }
    }

    for (const id of previous.keys()) {
      if (!next.has(id)) {
        await this.emit('DELETED', { id }, ctx);
      }
    }

    await this.stateRepo.save(ctx.connectorId, next);
  }

  private async emit(type: string, file: any, ctx: any) {
    await this.queue.publish('connector.files', {
      jobId: randomUUID(),
      connectorId: ctx.connectorId,
      runId: ctx.runId,
      eventType: type,
      file,
    });
  }


//   const files = await this.tracer.trace(
//   'sharepoint.scan',
//   async () => ctx.scan(),
// );

// this.logger.info('Files scanned', {
//   count: files.length,
//   connectorId: ctx.connectorId,
// });

// this.metrics.increment('connector.file.event', {
// type,
// });
}