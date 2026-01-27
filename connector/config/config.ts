import 'dotenv/config';

export const Config = {
  app: {
    env: process.env.NODE_ENV || 'local',
    port: Number(process.env.PORT || 3000),
  },

  queue: {
    provider: process.env.QUEUE_PROVIDER || 'mock',
    kafkaBrokers: (
      process.env.KAFKA_BROKERS || ''
    ).split(','),
  },

  mongo: {
    enabled: process.env.MONGO_ENABLED === 'true',
    uri: process.env.MONGO_URI!,
  },

  sharepoint: {
    enabled: process.env.SP_ENABLED === 'true',
    tenantId: process.env.SP_TENANT_ID!,
    clientId: process.env.SP_CLIENT_ID!,
    clientSecret: process.env.SP_CLIENT_SECRET!,
  },

  observability: {
    logger: process.env.LOG_PROVIDER || 'console',
    metrics: process.env.METRICS_PROVIDER || 'console',
    tracing:
      process.env.TRACING_ENABLED === 'true',
  },
};