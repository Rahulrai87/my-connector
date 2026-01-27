import { S3Client } from '@aws-sdk/client-s3';

export function createS3Client() {
  return new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
  });
}