@Schema({ timestamps: true })
export class Config {
  @Prop({ required: true }) appName: string;
  @Prop({ required: true }) cronExpression: string;
  @Prop({ required: true }) folderId: string;

  @Prop({ type: [String], default: [] })
  acceptedExtensions: string[];

  @Prop() maxSizeInMB: number;

  @Prop({ enum: ConfigStatus, default: ConfigStatus.ACTIVE })
  status: ConfigStatus;

  @Prop({ default: false }) isDeleted: boolean;
  @Prop() lastRunAt: Date;
  @Prop() lockUntil: Date;

  @Prop({ required: true }) moduleId: string;
  @Prop({ required: true }) regionId: string;

  @Prop({ required: true, type: Object })
  typeId: { siteId: string; driveId: string };
}
export const ConfigSchema = SchemaFactory.createForClass(Config);

ConfigSchema.index(
  { folderId: 1, moduleId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);
