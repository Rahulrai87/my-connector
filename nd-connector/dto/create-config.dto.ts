export class CreateConfigDto {
  appName: string;
  cronExpression: string;
  folderId: string;
  acceptedExtensions?: string[];
  maxSizeInMB?: number;
  moduleId: string;
  regionId: string;
  typeId: { siteId: string; driveId: string };
}
