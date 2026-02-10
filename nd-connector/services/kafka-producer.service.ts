@Injectable()
export class KafkaProducerService implements OnModuleInit {
  private producer: Producer;

  async onModuleInit() {
    const kafka = new Kafka({
      clientId: 'nd-connector',
      brokers: process.env.KAFKA_BROKERS.split(','),
    });
    this.producer = kafka.producer({ idempotent: true });
    await this.producer.connect();
  }

  send(topic: string, key: string, value: any) {
    return this.producer.send({
      topic,
      messages: [{ key, value: JSON.stringify(value) }],
    });
  }
}
