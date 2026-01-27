import { QueueClient } from '../queue.interface';

export class MockQueue implements QueueClient {
  private messages: any[] = [];

  async publish(topic: string, payload: any) {
    this.messages.push({ topic, payload });
  }

  async consume(topic: string, handler: any) {
    for (const m of this.messages.filter(x => x.topic === topic)) {
      await handler(m.payload);
    }
  }
}