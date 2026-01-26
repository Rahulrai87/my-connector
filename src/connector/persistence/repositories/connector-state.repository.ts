import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';

@Injectable()
export class ConnectorStateRepository {
  constructor(
    @InjectModel('ConnectorState')
    private readonly model: Model<any>,
  ) {}

  async loadMap(connectorId: any) {
    const docs = await this.model
      .find({ connectorId, isDeleted: false })
      .lean();

    return new Map(docs.map(d => [d.itemId, d]));
  }

  async upsert(
    connectorId: any,
    file: any,
    hash: string,
  ) {
    await this.model.updateOne(
      { connectorId, itemId: file.itemId },
      {
        $setOnInsert: { version: 1 },
        $set: {
          filePath: file.filePath,
          fileName: file.fileName,
          lastModified: file.lastModified,
          eTag: file.eTag,
          hash,
        },
        $inc: { version: 1 },
      },
      { upsert: true },
    );
  }

  async markDeleted(connectorId: any, itemId: string) {
    await this.model.updateOne(
      { connectorId, itemId },
      { $set: { isDeleted: true } },
    );
  }
}