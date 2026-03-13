// processor.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { FileProcess, FileProcessDocument } from './schemas/file-process.schema';
import { workingDaysBetween } from './utils/working-days';
import { S3Service } from './s3.service';

@Injectable()
export class ProcessorService {

  private readonly logger = new Logger(ProcessorService.name);

  constructor(
    @InjectModel(FileProcess.name)
    private readonly fileProcessModel: Model<FileProcessDocument>,
    private readonly s3Service: S3Service,
  ) {}

  private getKeyFromUrl(url: string): string {

    const parts = url.split('.amazonaws.com/');
    return parts[1];
  }

  @Cron('0 1 * * *') // run daily at 1 AM
  async handleLifecycle() {

    this.logger.log('Starting lifecycle job');

    const now = new Date();

    const docs = await this.fileProcessModel
      .find({ state: { $lt: 2 } })
      .limit(500);

    for (const doc of docs) {

      const days = workingDaysBetween(
        doc.lastModifiedDateTime,
        now,
      );

      try {

        // state 2 logic
        if (days >= 3 && !doc.s3Deleted) {

          for (const fileUrl of doc.s3Files) {

            const key = this.getKeyFromUrl(fileUrl);

            await this.s3Service.deleteFile(
              process.env.AWS_BUCKET!,
              key,
            );
          }

          doc.state = 2;
          doc.s3Deleted = true;

          await doc.save();

          this.logger.log(`Deleted S3 files for ${doc._id}`);
        }

        // state 1 logic
        else if (days >= 2 && doc.state === 0) {

          doc.state = 1;

          await doc.save();

          this.logger.log(`Updated state=1 for ${doc._id}`);
        }

      } catch (error) {

        this.logger.error(
          `Lifecycle error for ${doc._id}`,
          error,
        );
      }

    }

    this.logger.log('Lifecycle job completed');
  }

}
