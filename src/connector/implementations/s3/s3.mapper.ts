export function mapS3Object(obj: any) {
  return {
    itemId: obj.Key,
    fileName: obj.Key.split('/').pop(),
    filePath: obj.Key,
    lastModified: obj.LastModified?.toISOString(),
    eTag: obj.ETag,
    size: obj.Size,
  };
}