import { Kafka, Producer, Consumer } from 'kafkajs';
import { QueueClient } from '../queue.interface';

export class KafkaQueue implements QueueClient {
  private producer: Producer;
  private consumer: Consumer;

  constructor(
    brokers: string[],
    clientId = 'connector-service',
    groupId = 'connector-workers',
  ) {
    const kafka = new Kafka({ clientId, brokers });
    this.producer = kafka.producer();
    this.consumer = kafka.consumer({ groupId });
  }

  async publish(topic: string, payload: any): Promise<void> {
    await this.producer.connect();
    await this.producer.send({
      topic,
      messages: [
        {
          value: JSON.stringify(payload),
        },
      ],
    });
  }

  async consume(
    topic: string,
    handler: (msg: any) => Promise<void>,
  ): Promise<void> {
    await this.consumer.connect();
    await this.consumer.subscribe({
      topic,
      fromBeginning: false,
    });

    await this.consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) return;
        const parsed = JSON.parse(message.value.toString());
        await handler(parsed);
      },
    });
  }
}