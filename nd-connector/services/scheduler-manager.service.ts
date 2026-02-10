import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConnectorService } from './connector.service';
import { ConfigStatus } from '../enums/config-status.enum';

@Injectable()
export class SchedulerManagerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerManagerService.name);

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly connectorService: ConnectorService,
    @InjectModel('Config') private readonly configModel: Model<any>,
  ) {}

  /** 🔁 Rehydrate all active configs on app startup */
  async onModuleInit() {
    const configs = await this.configModel.find({
      status: ConfigStatus.ACTIVE,
      isDeleted: false,
    });

    for (const config of configs) {
      this.register(config);
    }

    this.logger.log(`Rehydrated ${configs.length} cron jobs`);
  }

  exists(configId: string): boolean {
    return this.schedulerRegistry.doesExist('cron', configId);
  }

  register(config: any) {
    const id = config._id.toString();

    if (this.exists(id)) {
      this.logger.warn(`Cron already exists for ${id}`);
      return;
    }

    const job = new CronJob(config.cronExpression, async () => {
      await this.connectorService.safeRun(id);
    });

    this.schedulerRegistry.addCronJob(id, job);
    job.start();

    this.logger.log(`Cron registered for config ${id}`);
  }

  update(config: any) {
    const id = config._id.toString();
    this.remove(id);
    this.register(config);
    this.logger.log(`Cron updated for config ${id}`);
  }

  pause(configId: string) {
    if (!this.exists(configId)) return;
    const job = this.schedulerRegistry.getCronJob(configId);
    job.stop();
    this.logger.log(`Cron paused for ${configId}`);
  }

  remove(configId: string) {
    if (!this.exists(configId)) return;
    this.schedulerRegistry.deleteCronJob(configId);
    this.logger.log(`Cron removed for ${configId}`);
  }
}
