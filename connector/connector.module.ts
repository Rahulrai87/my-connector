import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { QueueFactory } from './infra/queue/queue.factory';
import { RetryEngine } from './infra/retry/retry.engine';

import { ConnectorScheduler } from './connector.scheduler';
import { ConnectorController } from './connector.controller';

import { FileJobWorker } from './worker/file-job.worker';
import { FileJobProcessor } from './worker/file-job.processor';
import { DLQHandler } from './worker/dlq.handler';

import { SharePointRunner } from './connectors/sharepoint/sharepoint.runner';
import { RunnerFactory } from './lifecycle/runner.factory';
import { ConnectorLockSchema } from './locks/connector-lock.schema';
import { ConnectorJobStateSchema } from './state/connector-job-state.schema';
import { ConnectorJobStateRepository } from './state/connector-job-state.repository';
import { DLQReplayWorker } from './worker/dlq.replay.worker';

import { ConsoleLogger } from './infra/logger/console.logger';
import { ConsoleMetrics } from './infra/metrics/console.metrics';
import { Tracer } from './infra/tracing/tracer';
// import { S3Runner } from './connectors/s3/s3.runner';
import { Config } from './config/config';
import { STATE_REPO, LOCK_REPO } from './constants';


import { InMemoryStateRepository } from './state/state.repository.mock';
import { InMemoryLockRepository } from './locks/lock.repository.mock';
import { ConnectorLockRepository } from './locks/connector-lock.repository';
import { ConnectorLockService } from './locks/connector-lock.service';

@Module({
  imports: [
    ...(Config.mongo.enabled ? [
      MongooseModule.forFeature([
        { name: 'ConnectorLock', schema: ConnectorLockSchema },
        { name: 'ConnectorLock', schema: ConnectorLockSchema },
        { name: 'ConnectorJobState', schema: ConnectorJobStateSchema },
      ]),
    ] : []),

  ],
  controllers: [ConnectorController],
  providers: [
    // ---------- STATE ----------
    {
      provide: STATE_REPO,
      useClass: Config.mongo.enabled
        ? ConnectorJobStateRepository
        : InMemoryStateRepository,
    },


    // ---------- LOCK ----------
    {
      provide: LOCK_REPO,
      useClass: Config.mongo.enabled
        ? ConnectorLockRepository
        : InMemoryLockRepository,
    },
    ConnectorLockService,
    QueueFactory,
    RetryEngine,
    DLQReplayWorker,

    ConnectorScheduler,

    FileJobWorker,
    FileJobProcessor,
    DLQHandler,

    SharePointRunner,
    RunnerFactory,
    ConsoleLogger,
    ConsoleMetrics,
    Tracer,
  ],
})
export class ConnectorModule { }