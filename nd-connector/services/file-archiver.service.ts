import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class FileArchiverService {
  private readonly logger = new Logger(FileArchiverService.name);

  constructor(
    @InjectModel('FileProcess') private active: Model<any>,
    @InjectModel('FileProcessArchive') private archive: Model<any>,
    @InjectModel('FileProcessDeleted') private deleted: Model<any>,
  ) {}

  async run() {
    const now = new Date();
    const archiveBefore = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const deleteBefore = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    await this.moveToArchive(archiveBefore);
    await this.moveToDeleted(deleteBefore);
  }

  private async moveToArchive(before: Date) {
    const docs = await this.active.find({
      lastModifiedDateTime: { $lte: before },
    });

    for (const doc of docs) {
      await this.archive.create({
        ...doc.toObject(),
        archivedAt: new Date(),
      });
      await this.active.deleteOne({ _id: doc._id });
    }

    if (docs.length) {
      this.logger.log(`Archived ${docs.length} files`);
    }
  }

  private async moveToDeleted(before: Date) {
    const docs = await this.archive.find({
      lastModifiedDateTime: { $lte: before },
    });

    for (const doc of docs) {
      await this.deleted.create({
        folderId: doc.folderId,
        fileId: doc.fileId,
        deletedAt: new Date(),
        metadata: doc.metadata,
      });
      await this.archive.deleteOne({ _id: doc._id });
    }

    if (docs.length) {
      this.logger.log(`Deleted ${docs.length} archived files`);
    }
  }
}
