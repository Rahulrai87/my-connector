import { KafkaProducer } from './kafka/kafka.producer';
import { QueueProducer } from './queue.interface';

export class QueueFactory {
  static create(): QueueProducer {
    // future: SQS, RabbitMQ, Azure Service Bus
    return new KafkaProducer();
  }
}