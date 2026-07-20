import { S3Client } from '@aws-sdk/client-s3';

export type R2ClientOptions = {
  onMissingConfig?: () => void;
};

export function createR2Client(options: R2ClientOptions = {}) {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucketName) {
    options.onMissingConfig?.();
  }

  const s3Client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId: accessKeyId || '',
      secretAccessKey: secretAccessKey || '',
    },
  });

  return { s3Client, bucketName };
}
