import { QueueClient } from '../infra/queue/queue.interface';
import { FileJobProcessor } from './file-job.processor';

export class DLQReplayWorker {
  constructor(
    private readonly queue: QueueClient,
    private readonly processor: FileJobProcessor,
  ) {}

  async start() {
    await this.queue.consume(
      'connector.files.dlq',
      async (job) => {
        // Remove error metadata before retry
        delete job.error;
        await this.processor.process(job);
      },
    );
  }
}