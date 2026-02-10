@Schema({ timestamps: true })
export class FileProcessDeleted {
  @Prop() folderId: string;
  @Prop() fileId: string;
  @Prop() deletedAt: Date;
  @Prop({ type: Object }) metadata: any;
}
export const FileProcessDeletedSchema =
  SchemaFactory.createForClass(FileProcessDeleted);
