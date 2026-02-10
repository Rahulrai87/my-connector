@Schema({ timestamps: true })
export class Job {
  @Prop() configId: string;
  @Prop({ enum: JobStatus }) status: JobStatus;

  @Prop({ type: [Object], default: [] })
  fileList: {
    fileId: string;
    webUrl: string;
    name: string;
    size: number;
  }[];

  @Prop({ default: 0 }) totalFiles: number;
  @Prop({ default: 0 }) successFiles: number;
  @Prop({ default: 0 }) failedFiles: number;

  @Prop() error: string;
}
export const JobSchema = SchemaFactory.createForClass(Job);
