export function mapGraphFile(item: any) {
  return {
    itemId: item.id,
    fileName: item.name,
    filePath: item.parentReference?.path || '',
    lastModified: item.lastModifiedDateTime,
    eTag: item.eTag,
    size: item.size,
  };
}