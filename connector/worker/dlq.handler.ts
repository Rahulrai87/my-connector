import { QueueClient } from '../infra/queue/queue.interface';

export class DLQHandler {
  constructor(private readonly queue: QueueClient) {}

  async handle(job: any, error: any) {
    await this.queue.publish('connector.files.dlq', {
      ...job,
      error: {
        message: error.message,
        stack: error.stack,
        at: new Date().toISOString(),
      },
    });
  }
}