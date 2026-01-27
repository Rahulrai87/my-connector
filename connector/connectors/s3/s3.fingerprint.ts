import * as crypto from 'crypto';

export function s3Fingerprint(obj: {
  ETag?: string;
  Size?: number;
  LastModified?: Date;
}): string {
  return crypto
    .createHash('sha1')
    .update(
      `${obj.ETag ?? ''}|${obj.Size ?? ''}|${
        obj.LastModified?.toISOString() ?? ''
      }`,
    )
    .digest('hex');
}