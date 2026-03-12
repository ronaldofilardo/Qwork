/**
 * @file __tests__/api/emissor/progresso.test.ts
 * Testes: GET /api/emissor/laudos/[loteId]/progresso
 */

import { GET } from '@/app/api/emissor/laudos/[loteId]/progresso/route';
import { requireAuth } from '@/lib/session';
import { query } from '@/lib/db';

jest.mock('@/lib/session');
jest.mock('@/lib/db');

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockQuery = query as jest.MockedFunction<typeof query>;

function callGET(loteId: string) {
  return GET({} as Request, { params: { loteId } } as any);
}

describe('GET /api/emissor/laudos/[loteId]/progresso', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({ cpf: '999', perfil: 'emissor' } as any);
  });

  it('400 se loteId inválido', async () => {
    const res = await callGET('abc');
    expect(res.status).toBe(400);
  });

  it('404 se lote não encontrado', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    const res = await callGET('999');
    expect(res.status).toBe(404);
  });

  it('retorna status idle para lote concluído sem solicitação', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          status_lote: 'concluido',
          hash_pdf: null,
          laudo_id: null,
          status_laudo: null,
          emitido_em: null,
          enviado_em: null,
          solicitado_em: null,
          ultima_acao: null,
          ultima_acao_em: null,
        },
      ],
      rowCount: 1,
    } as any);

    const res = await callGET('1');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('idle');
    expect(json.porcentagem).toBe(0);
  });

  it('retorna status gerando_pdf para lote em andamento', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          status_lote: 'emissao_em_andamento',
          hash_pdf: null,
          laudo_id: 10,
          status_laudo: null,
          emitido_em: null,
          enviado_em: null,
          solicitado_em: '2025-01-01',
          ultima_acao: null,
          ultima_acao_em: null,
        },
      ],
      rowCount: 1,
    } as any);

    const res = await callGET('1');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('gerando_pdf');
    expect(json.porcentagem).toBe(40);
  });

  it('retorna status finalizando para laudo emitido', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          status_lote: 'concluido',
          hash_pdf: 'abc',
          laudo_id: 10,
          status_laudo: 'emitido',
          emitido_em: '2025-01-01',
          enviado_em: null,
          solicitado_em: '2025-01-01',
          ultima_acao: null,
          ultima_acao_em: null,
        },
      ],
      rowCount: 1,
    } as any);

    const res = await callGET('1');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('finalizando');
    expect(json.porcentagem).toBe(95);
  });

  it('retorna status erro quando última ação indica falha', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          status_lote: 'outro',
          hash_pdf: null,
          laudo_id: null,
          status_laudo: null,
          emitido_em: null,
          enviado_em: null,
          solicitado_em: null,
          ultima_acao: 'erro_emissao',
          ultima_acao_em: '2025-01-01',
        },
      ],
      rowCount: 1,
    } as any);

    const res = await callGET('1');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('erro');
    expect(json.erro).toBeDefined();
  });
});
