import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';

@Injectable()
export class ConnectorJobRepository {
  constructor(
    @InjectModel('ConnectorJob')
    private readonly model: Model<any>,
  ) {}

  start(connectorId: any, runId: any, attempt: number) {
    return this.model.create({
      connectorId,
      runId,
      attempt,
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
}