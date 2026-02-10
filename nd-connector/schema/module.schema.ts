import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Module {
  @Prop({ required: true, unique: true })
  name: string; // e.g. "HR", "Finance", "Legal"

  @Prop()
  description: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const ModuleSchema = SchemaFactory.createForClass(Module);

// Helpful indexes
ModuleSchema.index({ name: 1 }, { unique: true });
