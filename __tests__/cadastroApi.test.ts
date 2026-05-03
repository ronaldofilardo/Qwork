import { createCadastroApi } from '@/lib/cadastroApi';

describe('cadastroApi', () => {
  test('enviarCadastro retorna dados quando OK', async () => {
    const body = { id: 123 };
    const fakeRes = { ok: true, json: async () => body } as any;
    const fetcher = jest.fn().mockResolvedValue(fakeRes);
    const api = createCadastroApi(fetcher as any);
    const fd = new FormData();
    const resp = await api.enviarCadastro(fd);
    expect(fetcher).toHaveBeenCalled();
    expect(resp).toEqual(body);
  });

  test('enviarCadastro lança erro quando não OK', async () => {
    const fakeRes = { ok: false, json: async () => ({ error: 'bad' }) } as any;
    const fetcher = jest.fn().mockResolvedValue(fakeRes);
    const api = createCadastroApi(fetcher as any);
    await expect(api.enviarCadastro(new FormData())).rejects.toThrow('bad');
  });
});
