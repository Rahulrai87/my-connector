import {
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Kafka } from 'kafkajs';

@Injectable()
export class PreloaderService implements OnModuleInit {
  private readonly logger = new Logger(PreloaderService.name);

  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
  ) {}

  async onModuleInit() {
    this.logger.log('🔍 Preloader started');

    await this.checkMongo();
    await this.checkKafka();

    this.logger.log('✅ Preloader completed – system is healthy');
  }

  // -------------------------
  // MongoDB Health Check
  // -------------------------
  private async checkMongo() {
    try {
      await this.mongoConnection.db.admin().ping();
      this.logger.log('🟢 MongoDB connection OK');
    } catch (error) {
      this.logger.error('🔴 MongoDB connection FAILED', error);
      this.failFast();
    }
  }

  // -------------------------
  // Kafka Health Check
  // -------------------------
  private async checkKafka() {
    const brokers = process.env.KAFKA_BROKERS?.split(',');
    if (!brokers?.length) {
      this.logger.warn('⚠️ Kafka brokers not configured – skipping check');
      return;
    }

    const kafka = new Kafka({
      clientId: 'nd-connector-preloader',
      brokers,
      connectionTimeout: 5000,
    });

    const producer = kafka.producer();

    try {
      await producer.connect();
      await producer.disconnect();
      this.logger.log('🟢 Kafka broker reachable');
    } catch (error) {
      this.logger.error('🔴 Kafka broker NOT reachable', error);
      this.failFast();
    }
  }

  // -------------------------
  // Fail-fast strategy
  // -------------------------
  private failFast() {
    if (process.env.FAIL_FAST_ON_STARTUP === 'true') {
      this.logger.error('❌ Startup checks failed – exiting application');
      process.exit(1);
    } else {
      this.logger.warn(
        '⚠️ Startup checks failed but app continues (FAIL_FAST_ON_STARTUP=false)',
      );
    }
  }
}
