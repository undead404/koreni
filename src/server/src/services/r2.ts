import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

import environment from '../environment.js';

let s3Client: S3Client | null = null;

function getS3Client() {
  if (!s3Client) {
    const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } =
      environment;
    s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client;
}

export async function uploadImageToR2(
  projectId: string,
  fileName: string,
  fileBuffer: Buffer,
  contentType: string,
) {
  const { R2_BUCKET_NAME } = environment;
  if (!R2_BUCKET_NAME) {
    throw new Error('R2 bucket name is not configured');
  }

  const client = getS3Client();
  const key = `${projectId}/${fileName}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
  });
  await client.send(command);
  return {
    key,
    url: environment.R2_PUBLIC_URL
      ? `${environment.R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`
      : `https://${R2_BUCKET_NAME}.${environment.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`,
  };
}

export async function uploadProjectImageToR2(
  projectId: string,
  imageId: string,
  fileBuffer: Buffer,
  contentType: string,
) {
  const { R2_BUCKET_NAME } = environment;
  if (!R2_BUCKET_NAME) {
    throw new Error('R2 bucket name is not configured');
  }

  const client = getS3Client();
  const key = `projects/${projectId}/images/${imageId}.jpg`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
  });
  await client.send(command);
  return {
    key,
    url: environment.R2_PUBLIC_URL
      ? `${environment.R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`
      : `https://${R2_BUCKET_NAME}.${environment.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`,
  };
}

export async function deleteImageFromR2(key: string) {
  const { R2_BUCKET_NAME } = environment;
  if (!R2_BUCKET_NAME) {
    throw new Error('R2 bucket name is not configured');
  }

  const client = getS3Client();
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });
  await client.send(command);
}
