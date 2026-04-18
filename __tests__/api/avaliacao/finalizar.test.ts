/**
 * @file __tests__/api/avaliacao/finalizar.test.ts
 * Testes: API /api/avaliacao/finalizar
 *
 * NOTA: Este endpoint foi marcado como obsoleto (410 Gone).
 * As avaliações são concluídas automaticamente via /api/avaliacao/respostas.
 */

import { POST as finalizarAvaliacao } from '@/app/api/avaliacao/finalizar/route';

describe('API /api/avaliacao/finalizar', () => {
  it('retorna 410 Gone pois o endpoint está obsoleto', async () => {
    const req = { method: 'POST', json: async () => ({}) } as any;
    const res = await finalizarAvaliacao(req);
    const json = await res.json();
    expect(res.status).toBe(410);
    expect(json.deprecated).toBe(true);
    expect(json.error).toBeDefined();
  });

  it('retorna 410 independente do payload enviado', async () => {
    const req = {
      method: 'POST',
      json: async () => ({ avaliacaoId: 1, forcar: true }),
    } as any;
    const res = await finalizarAvaliacao(req);
    const json = await res.json();
    expect(res.status).toBe(410);
    expect(json.alternativas).toEqual(
      expect.arrayContaining(['/api/avaliacao/respostas'])
    );
  });
});
