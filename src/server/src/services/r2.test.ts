import { describe, expect, it, vi } from 'vitest';

import { uploadImageToR2 } from './r2.js';

vi.mock('../environment.js', () => ({
  default: {
    R2_ACCOUNT_ID: 'test-account-id',
    R2_ACCESS_KEY_ID: 'test-access-key',
    R2_SECRET_ACCESS_KEY: 'test-secret-key',
    R2_BUCKET_NAME: 'test-bucket',
    R2_PUBLIC_URL: 'https://cdn.example.com',
  },
}));

const mockSend = vi.fn();

vi.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: class {
      send = mockSend;
    },
    PutObjectCommand: class {
      constructor(public input: any) {}
    },
  };
});

vi.mock('@bugsnag/js', () => ({
  default: {
    notify: vi.fn(),
  },
}));

describe('r2 service', () => {
  it('successfully uploads an image', async () => {
    mockSend.mockResolvedValueOnce({});
    const result = await uploadImageToR2(
      'project-123',
      'photo.jpg',
      Buffer.from('dummy data'),
      'image/jpeg',
    );

    expect(result.key).toBe('temp/project-123/photo.jpg');
    expect(result.url).toBe('https://cdn.example.com/temp/project-123/photo.jpg');
    expect(mockSend).toHaveBeenCalled();
  });

  it('reports to Bugsnag and throws on S3 client failure', async () => {
    mockSend.mockRejectedValueOnce(new Error('S3 error'));
    await expect(
      uploadImageToR2(
        'project-123',
        'photo.jpg',
        Buffer.from('dummy data'),
        'image/jpeg',
      )
    ).rejects.toThrow('S3 error');
  });
});
