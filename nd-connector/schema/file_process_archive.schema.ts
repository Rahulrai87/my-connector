@Schema({ timestamps: true })
export class FileProcessArchive extends FileProcess {
  @Prop() archivedAt: Date;
}
export const FileProcessArchiveSchema =
  SchemaFactory.createForClass(FileProcessArchive);
