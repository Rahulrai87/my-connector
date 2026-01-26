import {
  S3Client,
  ListObjectsV2Command,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';

export class S3StorageClient {
  private client: S3Client;

  constructor(region: string) {
    this.client = new S3Client({ region });
  }

  async validateBucket(bucket: string) {
    await this.client.send(
      new HeadBucketCommand({ Bucket: bucket }),
    );
  }

  async listAllObjects(
    bucket: string,
    prefix?: string,
  ): Promise<any[]> {
    const objects: any[] = [];
    let token: string | undefined;

    do {
      const res = await this.client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          ContinuationToken: token,
        }),
      );

      objects.push(...(res.Contents || []));
      token = res.NextContinuationToken;
    } while (token);

    return objects;
  }
}