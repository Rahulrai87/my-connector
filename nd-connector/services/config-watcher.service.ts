import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SchedulerManagerService } from './scheduler-manager.service';
import { ConfigStatus } from '../enums/config-status.enum';

@Injectable()
export class ConfigWatcherService implements OnModuleInit {
  private readonly logger = new Logger(ConfigWatcherService.name);

  constructor(
    @InjectModel('Config') private readonly configModel: Model<any>,
    private readonly scheduler: SchedulerManagerService,
  ) {}

  onModuleInit() {
    if (process.env.ENABLE_CHANGE_STREAM !== 'true') {
      this.logger.warn('Mongo Change Streams disabled (DEV mode)');
      return;
    }

    this.logger.log('Mongo Change Stream enabled');

    this.configModel
      .watch([], { fullDocument: 'updateLookup' })
      .on('change', (event) => this.handleEvent(event));
  }

  private handleEvent(event: any) {
    const config = event.fullDocument;
    if (!config) return;

    const id = config._id.toString();

    switch (event.operationType) {
      case 'insert':
        if (config.status === ConfigStatus.ACTIVE) {
          this.scheduler.register(config);
        }
        break;

      case 'update':
      case 'replace':
        if (config.isDeleted || config.status === ConfigStatus.INACTIVE) {
          this.scheduler.remove(id);
        } else if (config.status === ConfigStatus.PAUSED) {
          this.scheduler.pause(id);
        } else {
          this.scheduler.update(config);
        }
        break;

      case 'delete':
        this.scheduler.remove(id);
        break;
    }
  }
}
