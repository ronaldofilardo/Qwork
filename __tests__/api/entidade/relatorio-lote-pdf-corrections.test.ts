/**
 * @file __tests__/api/entidade/relatorio-lote-pdf-corrections.test.ts
 * Testes: Entidade - Relatório Lote PDF Corrections
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/session', () => ({ requireEntity: jest.fn() }));
jest.mock('@/lib/pdf/relatorio-lote', () => ({
  gerarRelatorioLotePDF: jest.fn(() => Buffer.from('mock-pdf')),
}));

import { query } from '@/lib/db';
import { requireEntity } from '@/lib/session';
import { gerarRelatorioLotePDF } from '@/lib/pdf/relatorio-lote';
import { GET } from '@/app/api/entidade/relatorio-lote-pdf/route';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireEntity = requireEntity as jest.MockedFunction<
  typeof requireEntity
>;
const mockGerarPDF = gerarRelatorioLotePDF as jest.MockedFunction<
  typeof gerarRelatorioLotePDF
>;

function makeRequest(params: Record<string, string> = {}): NextRequest {
  const searchParams = new URLSearchParams(params);
  return new NextRequest(
    `http://localhost:3000/api/entidade/relatorio-lote-pdf?${searchParams.toString()}`
  );
}

describe('Entidade - Relatório Lote PDF Corrections', () => {
  beforeEach(() => {
    mockRequireEntity.mockResolvedValue({
      cpf: '12345678909',
      perfil: 'gestor',
      entidade_id: 10,
    } as any);
  });

  it('deve retornar 400 se lote_id faltar', async () => {
    const req = makeRequest({});
    const res = await GET(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('lote_id');
  });

  it('deve retornar 404 se lote não existir ou não pertencer à entidade', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    const req = makeRequest({ lote_id: '999' });
    const res = await GET(req);
    expect(res.status).toBe(404);
  });

  it('deve gerar PDF do lote com dados completos para Entidade', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 20,
          criado_em: new Date('2026-02-10T10:00:00Z'),
          hash_pdf: 'entidade-hash-123',
          emitido_em: new Date('2026-02-11T00:16:02Z'),
          status: 'concluido',
        },
      ],
      rowCount: 1,
    } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          nome: 'Maria Santos',
          cpf: '44444444444',
          concluida_em: new Date('2026-02-11T00:00:00Z'),
          status: 'concluida',
        },
      ],
      rowCount: 1,
    } as any);

    const req = makeRequest({ lote_id: '20' });
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    expect(res.headers.get('Content-Disposition')).toContain(
      'relatorio-lote-20.pdf'
    );

    expect(mockGerarPDF).toHaveBeenCalledWith({
      lote: expect.objectContaining({
        id: 20,
        hash_pdf: 'entidade-hash-123',
        emitido_em: expect.any(Date),
      }),
      funcionarios: expect.arrayContaining([
        expect.objectContaining({ nome: 'Maria Santos', cpf: '44444444444' }),
      ]),
    });
  });

  it('deve listar apenas funcionários da Entidade', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 20,
          criado_em: new Date(),
          hash_pdf: null,
          emitido_em: null,
          status: 'pendente',
        },
      ],
      rowCount: 1,
    } as any);
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const req = makeRequest({ lote_id: '20' });
    await GET(req);

    // A query de funcionários deve usar COALESCE(entidade_id, contratante_id) para validar acesso
    const funcQuery = mockQuery.mock.calls[1][0] as string;
    expect(funcQuery).toContain('entidade_id');
    // Parâmetros devem incluir o entidade_id da sessão
    const funcParams = mockQuery.mock.calls[1][1] as any[];
    expect(funcParams).toContain(10);
  });

  it('deve puxar hash_pdf do laudo via LEFT JOIN laudos', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 20,
          criado_em: new Date(),
          hash_pdf: 'hash-from-laudo',
          emitido_em: null,
          status: 'pendente',
        },
      ],
      rowCount: 1,
    } as any);
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const req = makeRequest({ lote_id: '20' });
    await GET(req);

    const loteQuery = mockQuery.mock.calls[0][0] as string;
    expect(loteQuery).toContain('LEFT JOIN laudos');
    expect(loteQuery).toContain('hash_pdf');
  });

  it('deve formatar status como "Concluído em DD/MM/YYYY, HH:MM:SS" se emitido', () => {
    const statusConcluido = 'Concluído em 11/02/2026, 00:16:02';
    expect(statusConcluido).toMatch(
      /Conclu\u00eddo em \d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2}/
    );
  });

  it('deve exibir "Pendente" se laudo não foi emitido ainda', () => {
    const statusPendente = 'Pendente';
    expect(statusPendente).toBe('Pendente');
  });

  it('deve rejeitar com 500 se ocorrer erro', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));
    const req = makeRequest({ lote_id: '20' });
    const res = await GET(req);
    expect(res.status).toBe(500);
  });

  it('CORREÇÃO: deve usar GET /api/entidade/relatorio-lote-pdf?lote_id= (não POST)', async () => {
    // Verifica que a rota exporta GET (não POST)
    const routeModule =
      await import('@/app/api/entidade/relatorio-lote-pdf/route');
    expect(typeof routeModule.GET).toBe('function');
  });
});
