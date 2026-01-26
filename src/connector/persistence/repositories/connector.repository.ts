import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { Connector } from '../schemas/connector.schema';

@Injectable()
export class ConnectorRepository {
  constructor(
    @InjectModel(Connector.name)
    private readonly model: Model<Connector>,
  ) {}

  create(data: Partial<Connector>) {
    return this.model.create(data);
  }

  findById(id: string) {
    return this.model.findById(id).lean();
  }

  findActive() {
    return this.model.find({ status: 'ACTIVE' }).lean();
  }

  updateStatus(id: string, status: 'ACTIVE' | 'PAUSED') {
    return this.model.updateOne(
      { _id: id },
      { status },
    );
  }
}