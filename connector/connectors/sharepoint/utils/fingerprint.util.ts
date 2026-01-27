import * as crypto from 'crypto';

export function buildFingerprint(file: {
  eTag?: string;
  size?: number;
  lastModifiedDateTime?: string;
}): string {
  return crypto
    .createHash('sha1')
    .update(
      `${file.eTag ?? ''}|${file.size ?? ''}|${
        file.lastModifiedDateTime ?? ''
      }`,
    )
    .digest('hex');
}