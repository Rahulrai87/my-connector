import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ConnectorRunnerService } from './runner/connector-runner.service';
import { ConnectorFactory } from './factory/connector.factory';
import { ConnectorRepository } from './persistence/repositories/connector.repository';
import {
  Connector,
  ConnectorSchema,
} from './persistence/schemas/connector.schema';
import { ConnectorStateSchema } from './persistence/schemas/connector-state.schema';
import { ConnectorStateRepository } from './persistence/repositories/connector-state.repository';
import { SchedulerModule } from './scheduler/scheduler.module';
import { ConnectorService } from './api/connector.service';
import { ConnectorController } from './api/connector.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Connector.name, schema: ConnectorSchema },
      { name: 'ConnectorState', schema: ConnectorStateSchema },
    ]),
    SchedulerModule,
  ],
  providers: [
    ConnectorRunnerService,
    ConnectorFactory,
    ConnectorRepository,
    ConnectorStateRepository,
    ConnectorService,
  ],
  controllers: [ConnectorController],
})
export class ConnectorModule {}