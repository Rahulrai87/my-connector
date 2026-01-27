export interface QueueClient {
  publish(topic: string, payload: any): Promise<void>;
  consume(
    topic: string,
    handler: (msg: any) => Promise<void>,
  ): Promise<void>;
}