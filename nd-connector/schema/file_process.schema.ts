@Schema({ timestamps: true })
export class FileProcess {
  @Prop() folderId: string;
  @Prop() fileId: string;
  @Prop() name: string;
  @Prop() extension: string;
  @Prop() size: number;
  @Prop() eTag: string;
  @Prop() webUrl: string;
  @Prop() lastModifiedDateTime: Date;
  @Prop({ enum: FileStatus }) status: FileStatus;
  @Prop({ type: Object }) metadata: any;
}
export const FileProcessSchema = SchemaFactory.createForClass(FileProcess);

FileProcessSchema.index(
  { folderId: 1, fileId: 1 },
  { unique: true },
);
