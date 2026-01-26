import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';

@Injectable()
export class ConnectorRunRepository {
  constructor(
    @InjectModel('ConnectorRun')
    private readonly model: Model<any>,
  ) {}

  start(connectorId: any) {
    return this.model.create({
      connectorId,
      status: 'RUNNING',
    });
  }

  success(id: any) {
    return this.model.updateOne(
      { _id: id },
      { status: 'SUCCESS' },
    );
  }

  fail(id: any, error: string) {
    return this.model.updateOne(
      { _id: id },
      { status: 'FAILED', error },
    );
  }
  
  async recentFailures(connectorId: any, limit: number) {
  const runs = await this.model
    .find({ connectorId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return runs.filter(r => r.status === 'FAILED').length;
}
}