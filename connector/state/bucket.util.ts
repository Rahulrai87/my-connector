import * as crypto from 'crypto';

/**
 * Deterministically assigns a fileId to a bucket.
 * Same fileId → same bucket forever.
 */
export function bucketFor(
  fileId: string,
  bucketCount = 256,
): number {
  const hash = crypto
    .createHash('md5')
    .update(fileId)
    .digest();

  return hash[0] % bucketCount;
}