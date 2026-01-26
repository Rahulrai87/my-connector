import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Connector extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  connectorType: string;

  @Prop({ required: true })
  cronJobExpression: string;

  @Prop({ default: true })
  recursive: boolean;

  @Prop({ default: 'ACTIVE' })
  status: 'ACTIVE' | 'PAUSED';

  @Prop({ type: Object, default: {} })
  config: {
    useDelta?: boolean;
  };
}

export const ConnectorSchema =
  SchemaFactory.createForClass(Connector);

ConnectorSchema.index({ status: 1 });