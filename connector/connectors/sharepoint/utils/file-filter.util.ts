export function shouldIncludeFile(
  file: any,
  maxSizeMB = 100,
  excludeExt = ['.zip'],
): boolean {
  if (!file.file) return false;

  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > maxSizeMB) return false;

  const ext = file.name
    ?.toLowerCase()
    .split('.')
    .pop();

  if (ext && excludeExt.includes(`.${ext}`))
    return false;

  return true;
}