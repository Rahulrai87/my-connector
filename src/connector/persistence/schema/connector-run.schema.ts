import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class ConnectorRun extends Document {
  @Prop({ type: Types.ObjectId, index: true })
  connectorId: Types.ObjectId;

  @Prop({ default: 'RUNNING' })
  status: 'RUNNING' | 'SUCCESS' | 'FAILED';

  @Prop()
  error?: string;
}

export const ConnectorRunSchema =
  SchemaFactory.createForClass(ConnectorRun);

ConnectorRunSchema.index({ connectorId: 1, createdAt: -1 });