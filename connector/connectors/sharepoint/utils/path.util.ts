export function extractFolderPath(
  siteUrl: string,
): string | undefined {
  const url = new URL(siteUrl);
  const parts = url.pathname.split('/').filter(Boolean);

  const idx = parts.indexOf('sites');
  if (idx === -1) return undefined;

  return parts.length > idx + 2
    ? '/' + parts.slice(idx + 2).join('/')
    : undefined;
}