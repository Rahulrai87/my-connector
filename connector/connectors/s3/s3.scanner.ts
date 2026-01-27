import {
  ListObjectsV2Command,
  _Object,
} from '@aws-sdk/client-s3';
import { createS3Client } from './s3.client';

export class S3Scanner {
  private client = createS3Client();

  async scan(
    bucket: string,
    prefix?: string,
  ): Promise<_Object[]> {
    let token: string | undefined;
    const results: _Object[] = [];

    do {
      const res = await this.client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          ContinuationToken: token,
        }),
      );

      if (res.Contents) {
        results.push(...res.Contents);
      }

      token = res.NextContinuationToken;
    } while (token);

    return results;
  }
}