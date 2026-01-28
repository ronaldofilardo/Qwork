import { GET } from '@/app/api/public-config/route';

describe('GET /api/public-config', () => {
  const prevNext = process.env.NEXT_PUBLIC_DISABLE_ANEXOS;
  const prev = process.env.DISABLE_ANEXOS;

  afterEach(() => {
    process.env.NEXT_PUBLIC_DISABLE_ANEXOS = prevNext;
    process.env.DISABLE_ANEXOS = prev;
  });

  test('returns disableAnexos true when NEXT_PUBLIC_DISABLE_ANEXOS=true', async () => {
    process.env.NEXT_PUBLIC_DISABLE_ANEXOS = 'true';
    const res = GET();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/await-thenable,@typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-call
    const json = await (res as any).json();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(json.disableAnexos).toBe(true);
  });

  test('returns disableAnexos true when DISABLE_ANEXOS=true', async () => {
    process.env.NEXT_PUBLIC_DISABLE_ANEXOS = '';
    process.env.DISABLE_ANEXOS = 'true';
    const res = GET();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/await-thenable,@typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-call
    const json = await (res as any).json();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(json.disableAnexos).toBe(true);
  });

  test('returns false by default', async () => {
    process.env.NEXT_PUBLIC_DISABLE_ANEXOS = '';
    process.env.DISABLE_ANEXOS = '';
    const res = GET();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/await-thenable,@typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-call
    const json = await (res as any).json();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(json.disableAnexos).toBe(false);
  });
});
