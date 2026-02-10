import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FileArchiverService } from './file-archiver.service';

@Injectable()
export class FileArchiverScheduler {
  constructor(private readonly archiver: FileArchiverService) {}

  // Runs every hour
  @Cron('0 * * * *')
  async handle() {
    if (process.env.ENABLE_MONGO_TRIGGER === 'true') return;
    await this.archiver.run();
  }
}
