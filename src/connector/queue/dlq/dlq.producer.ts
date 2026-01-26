import { QueueProducer } from '../queue.interface';

export class DLQProducer {
  constructor(
    private readonly producer: QueueProducer,
  ) {}

  async send(original: any, error: string) {
    await this.producer.send(
      process.env.KAFKA_TOPIC_DLQ || 'connector-dlq',
      {
        original,
        error,
        failedAt: new Date().toISOString(),
      },
    );
  }
}