export interface QueueProducer {
  connect(): Promise<void>;
  send(topic: string, message: any): Promise<void>;
  disconnect(): Promise<void>;
}