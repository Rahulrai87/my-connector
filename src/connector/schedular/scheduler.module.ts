import { Module } from '@nestjs/common';
import { DynamicSchedulerService } from './dynamic-scheduler.service';
import { ConnectorRunnerService } from '../runner/connector-runner.service';
import { ConnectorRepository } from '../persistence/repositories/connector.repository';

@Module({
  providers: [
    DynamicSchedulerService,
    ConnectorRunnerService,
    ConnectorRepository,
  ],
  exports: [DynamicSchedulerService],
})
export class SchedulerModule {}