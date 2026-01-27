import { QueueClient } from '../infra/queue/queue.interface';
import { RetryEngine } from '../infra/retry/retry.engine';
import { FileJobProcessor } from './file-job.processor';
import { DLQHandler } from './dlq.handler';
import { Logger } from '../infra/logger/logger.interface';
import { Metrics } from '../infra/metrics/metrics.interface';

export class FileJobWorker {
  constructor(
private readonly queue: QueueClient,
private readonly retry: RetryEngine,
private readonly processor: FileJobProcessor,
private readonly dlq: DLQHandler,
private readonly logger: Logger,
private readonly metrics: Metrics,
  ) {}

  async start() {
    await this.queue.consume('connector.files', async job => {
      try {
        await this.retry.run(() => this.processor.process(job));
      } catch (e) {
        await this.dlq.handle(job, e);
      }
    });
  }
}

// this.logger.info('Job received', {
//   connectorId: job.connectorId,
//   eventType: job.eventType,
// });

// this.metrics.increment('worker.job.received');

// this.metrics.increment('worker.job.failed');
// this.logger.error('Job failed', job);