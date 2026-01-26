import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class ConnectorJob extends Document {
  @Prop({ type: Types.ObjectId, index: true })
  connectorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, index: true })
  runId: Types.ObjectId;

  @Prop()
  attempt: number;

  @Prop({ default: 'RUNNING' })
  status: 'RUNNING' | 'SUCCESS' | 'FAILED';

  @Prop()
  error?: string;
}

export const ConnectorJobSchema =
  SchemaFactory.createForClass(ConnectorJob);

ConnectorJobSchema.index({ connectorId: 1, runId: 1 });