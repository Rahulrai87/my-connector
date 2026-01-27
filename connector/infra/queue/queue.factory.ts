import { QueueClient } from './queue.interface';
import { MockQueue } from './providers/mock.queue';
import { KafkaQueue } from './providers/kafka.queue';

export class QueueFactory {
  create(): QueueClient {
    const provider = process.env.QUEUE_PROVIDER || 'mock';

    if (provider === 'kafka') {
      return new KafkaQueue(
        (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      );
    }

    return new MockQueue();
  }
}