import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class ConnectorState extends Document {
  @Prop({ type: Types.ObjectId, index: true })
  connectorId: Types.ObjectId;

  @Prop({ required: true })
  itemId: string;

  @Prop({ required: true })
  filePath: string;

  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  lastModified: string;

  @Prop({ required: true })
  eTag: string;

  @Prop({ required: true })
  hash: string;

  @Prop({ default: 1 })
  version: number;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const ConnectorStateSchema =
  SchemaFactory.createForClass(ConnectorState);

ConnectorStateSchema.index(
  { connectorId: 1, itemId: 1 },
  { unique: true },
);

ConnectorStateSchema.index({ connectorId: 1, isDeleted: 1 });