import { Kafka, Producer } from 'kafkajs';
import { QueueProducer } from '../queue.interface';

export class KafkaProducer implements QueueProducer {
  private producer: Producer;

  constructor() {
    const kafka = new Kafka({
      brokers: (process.env.KAFKA_BROKERS || '').split(','),
    });

    this.producer = kafka.producer();
  }

  async connect() {
    await this.producer.connect();
  }

  async send(topic: string, message: any) {
    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
  }

  async disconnect() {
    await this.producer.disconnect();
  }
}