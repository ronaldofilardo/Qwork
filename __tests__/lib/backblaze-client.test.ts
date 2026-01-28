import {
  uploadToBackblaze,
  downloadFromBackblaze,
  checkBackblazeFileExists,
} from '@/lib/storage/backblaze-client';

jest.mock('@aws-sdk/client-s3', () => {
  // Implement a simple mock where tests can override S3Client.prototype.send
  class S3Client {
    // send will be defined on the prototype by tests via S3Client.prototype.send = jest.fn()
  }

  const PutObjectCommand = jest.fn((opts) => opts);
  const GetObjectCommand = jest.fn((opts) => opts);
  const HeadObjectCommand = jest.fn((opts) => opts);
  const DeleteObjectCommand = jest.fn((opts) => opts);
  const ListObjectsV2Command = jest.fn((opts) => opts);

  return {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    HeadObjectCommand,
    DeleteObjectCommand,
    ListObjectsV2Command,
    __esModule: true,
  };
});

describe('Backblaze client', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV } as any;
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('uploadToBackblaze should call S3 client and return metadata', async () => {
    process.env.BACKBLAZE_PROVIDER = 's2';
    process.env.BACKBLAZE_S2_ENDPOINT = 'https://s3.test';
    process.env.BACKBLAZE_KEY_ID = 'KEY';
    process.env.BACKBLAZE_APPLICATION_KEY = 'SECRET';
    process.env.BACKBLAZE_BUCKET = 'my-bucket';

    const { S3Client } = await import('@aws-sdk/client-s3');
    // @ts-ignore
    S3Client.prototype.send = jest
      .fn()
      .mockResolvedValue({ ETag: '"etag-value"' });

    const buf = Buffer.from('pdfcontent');
    const res = await uploadToBackblaze(buf, 'path/to/file.pdf');

    expect(res).toHaveProperty('provider', 'backblaze');
    expect(res).toHaveProperty('bucket', 'my-bucket');
    expect(res.key).toContain('path/to/file.pdf');
    expect(res.url).toBe('https://s3.test/my-bucket/path/to/file.pdf');
    expect(res.etag).toBe('"etag-value"');
  });

  it('supports legacy env var names (BACKBLAZE_ACCESS_KEY_ID/BACKBLAZE_SECRET_ACCESS_KEY)', async () => {
    process.env.BACKBLAZE_PROVIDER = 's2';
    process.env.BACKBLAZE_S2_ENDPOINT = 'https://s3.test';
    process.env.BACKBLAZE_ACCESS_KEY_ID = '2a8144c04121';
    process.env.BACKBLAZE_SECRET_ACCESS_KEY =
      '0054395081c91b2750422e6bdad80497a90bbd20fe';
    process.env.BACKBLAZE_BUCKET = 'laudos-qwork';

    const { S3Client } = await import('@aws-sdk/client-s3');
    // @ts-ignore
    S3Client.prototype.send = jest
      .fn()
      .mockResolvedValue({ ETag: '"etag-value"' });

    const buf = Buffer.from('pdfcontent');
    const res = await uploadToBackblaze(buf, 'path/to/file.pdf');

    expect(res).toHaveProperty('provider', 'backblaze');
    expect(res).toHaveProperty('bucket', 'laudos-qwork');
    expect(res.key).toContain('path/to/file.pdf');
    expect(res.url).toBe('https://s3.test/laudos-qwork/path/to/file.pdf');
    expect(res.etag).toBe('"etag-value"');
  });

  it('downloadFromBackblaze should stream and return buffer', async () => {
    process.env.BACKBLAZE_PROVIDER = 's2';
    process.env.BACKBLAZE_S2_ENDPOINT = 'https://s3.test';
    process.env.BACKBLAZE_KEY_ID = 'KEY';
    process.env.BACKBLAZE_APPLICATION_KEY = 'SECRET';
    process.env.BACKBLAZE_BUCKET = 'my-bucket';

    const { S3Client } = await import('@aws-sdk/client-s3');

    const stream = (async function* () {
      yield Buffer.from('hello');
      yield Buffer.from('world');
    })();

    // @ts-ignore
    S3Client.prototype.send = jest.fn().mockResolvedValue({ Body: stream });

    const buf = await downloadFromBackblaze('path/to/remote.pdf');
    expect(buf.toString()).toBe('helloworld');
  });

  it('checkBackblazeFileExists should return false on 404', async () => {
    process.env.BACKBLAZE_PROVIDER = 's2';
    process.env.BACKBLAZE_S2_ENDPOINT = 'https://s3.test';
    process.env.BACKBLAZE_KEY_ID = 'KEY';
    process.env.BACKBLAZE_APPLICATION_KEY = 'SECRET';
    process.env.BACKBLAZE_BUCKET = 'my-bucket';

    const { S3Client } = await import('@aws-sdk/client-s3');

    const error: any = new Error('Not found');
    error.name = 'NotFound';
    // @ts-ignore
    S3Client.prototype.send = jest.fn().mockRejectedValue(error);

    const exists = await checkBackblazeFileExists('missing.pdf');
    expect(exists).toBe(false);
  });
});
