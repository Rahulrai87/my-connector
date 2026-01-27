import { Controller, Post, Body } from '@nestjs/common';
import { ConnectorScheduler } from './connector.scheduler';
import { RunnerFactory } from './lifecycle/runner.factory';
import { randomUUID } from 'crypto';

@Controller('connectors')
export class ConnectorController {
  constructor(
    private readonly scheduler: ConnectorScheduler,
    private readonly runnerFactory: RunnerFactory,
  ) {}

  @Post()
  register(@Body() body: any) {
    const id = randomUUID();

    this.scheduler.register({
      id,
      cron: body.cron,
      runner: this.runnerFactory.get(body.type),
      context: body,
    });

    return { connectorId: id };
  }
}
