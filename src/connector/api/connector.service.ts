import { Injectable } from '@nestjs/common';
import { ConnectorRepository } from '../persistence/repositories/connector.repository';
import { DynamicSchedulerService } from '../scheduler/dynamic-scheduler.service';
import { RegisterConnectorDto } from './dto/register-connector.dto';

@Injectable()
export class ConnectorService {
  constructor(
    private readonly repo: ConnectorRepository,
    private readonly scheduler: DynamicSchedulerService,
  ) {}

  async register(dto: RegisterConnectorDto) {
    const connector = await this.repo.create({
      ...dto,
      status: 'ACTIVE',
    });

    this.scheduler.register(
      connector._id.toString(),
      connector.cronJobExpression,
    );

    return connector;
  }

  async pause(id: string) {
    await this.repo.updateStatus(id, 'PAUSED');
    this.scheduler.unregister(id);
  }

  async resume(id: string) {
    await this.repo.updateStatus(id, 'ACTIVE');
    const connector = await this.repo.findById(id);
    this.scheduler.register(
      id,
      connector.cronJobExpression,
    );
  }
}