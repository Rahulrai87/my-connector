import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Region {
  @Prop({ required: true, unique: true })
  code: string; 
  // e.g. "us-east-1", "eu-west-1", "ap-south-1"

  @Prop({ required: true })
  name: string; 
  // e.g. "US East", "Europe West", "India"

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const RegionSchema = SchemaFactory.createForClass(Region);

// Indexes
RegionSchema.index({ code: 1 }, { unique: true });
