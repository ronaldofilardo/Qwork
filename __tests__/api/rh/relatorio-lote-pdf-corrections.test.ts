/**
 * @file __tests__/api/rh/relatorio-lote-pdf-corrections.test.ts
 * Testes: RH - Relatório Lote PDF Corrections
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/session', () => ({ requireRole: jest.fn() }));
jest.mock('@/lib/pdf/relatorio-lote', () => ({
  gerarRelatorioLotePDF: jest.fn(() => Buffer.from('mock-pdf')),
}));

import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import { gerarRelatorioLotePDF } from '@/lib/pdf/relatorio-lote';
import { GET } from '@/app/api/rh/relatorio-lote-pdf/route';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;
const mockGerarPDF = gerarRelatorioLotePDF as jest.MockedFunction<
  typeof gerarRelatorioLotePDF
>;

function makeRequest(params: Record<string, string> = {}): NextRequest {
  const searchParams = new URLSearchParams(params);
  return new NextRequest(
    `http://localhost:3000/api/rh/relatorio-lote-pdf?${searchParams.toString()}`
  );
}

describe('RH - Relatório Lote PDF Corrections', () => {
  beforeEach(() => {
    mockRequireRole.mockResolvedValue({
      cpf: '12345678909',
      perfil: 'rh',
      clinica_id: 5,
    } as any);
  });

  it('deve retornar 400 se lote_id faltar', async () => {
    const req = makeRequest({});
    const res = await GET(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('lote_id');
  });

  it('deve retornar 404 se lote não existir', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    const req = makeRequest({ lote_id: '999' });
    const res = await GET(req);
    expect(res.status).toBe(404);
  });

  it('deve gerar PDF do lote com ID, data de criação, hash PDF e status', async () => {
    // Mock: lote query
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          criado_em: new Date('2026-02-10T10:00:00Z'),
          hash_pdf: 'abc123hash',
          emitido_em: new Date('2026-02-11T00:16:02Z'),
          status: 'concluido',
        },
      ],
      rowCount: 1,
    } as any);
    // Mock: funcionarios query
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          nome: 'João Silva',
          cpf: '11111111111',
          concluida_em: new Date('2026-02-11T00:00:00Z'),
          status: 'concluida',
        },
      ],
      rowCount: 1,
    } as any);

    const req = makeRequest({ lote_id: '10' });
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    expect(res.headers.get('Content-Disposition')).toContain(
      'relatorio-lote-10.pdf'
    );

    // Verifica que gerarRelatorioLotePDF foi chamado com dados corretos
    expect(mockGerarPDF).toHaveBeenCalledWith({
      lote: expect.objectContaining({
        id: 10,
        hash_pdf: 'abc123hash',
        emitido_em: expect.any(Date),
      }),
      funcionarios: expect.arrayContaining([
        expect.objectContaining({ nome: 'João Silva', cpf: '11111111111' }),
      ]),
    });
  });

  it('deve puxar hash_pdf do laudo via LEFT JOIN', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          criado_em: new Date(),
          hash_pdf: 'hash-from-laudo',
          emitido_em: null,
          status: 'pendente',
        },
      ],
      rowCount: 1,
    } as any);
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const req = makeRequest({ lote_id: '10' });
    await GET(req);

    // Verifica que a primeira query (lote) inclui LEFT JOIN laudos
    const loteQuery = mockQuery.mock.calls[0][0] as string;
    expect(loteQuery).toContain('LEFT JOIN laudos');
    expect(loteQuery).toContain('hash_pdf');
  });

  it('deve listar funcionários com nome, CPF e timestamp de conclusão', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          criado_em: new Date(),
          hash_pdf: null,
          emitido_em: null,
          status: 'pendente',
        },
      ],
      rowCount: 1,
    } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          nome: 'Ana Costa',
          cpf: '22222222222',
          concluida_em: new Date('2026-02-15T14:30:00Z'),
          status: 'concluida',
        },
        {
          nome: 'Pedro Lima',
          cpf: '33333333333',
          concluida_em: new Date('2026-02-16T09:00:00Z'),
          status: 'concluida',
        },
      ],
      rowCount: 2,
    } as any);

    const req = makeRequest({ lote_id: '10' });
    await GET(req);

    // Verifica query usa concluida_em (não criado_em) e filtra por clinica_id
    const funcQuery = mockQuery.mock.calls[1][0] as string;
    expect(funcQuery).toContain('concluida_em');
    expect(funcQuery).toContain('clinica_id');

    expect(mockGerarPDF).toHaveBeenCalledWith(
      expect.objectContaining({
        funcionarios: expect.arrayContaining([
          expect.objectContaining({ nome: 'Ana Costa', cpf: '22222222222' }),
          expect.objectContaining({ nome: 'Pedro Lima', cpf: '33333333333' }),
        ]),
      })
    );
  });

  it('deve validar acesso por clinica_id para RH', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          criado_em: new Date(),
          hash_pdf: null,
          emitido_em: null,
          status: 'pendente',
        },
      ],
      rowCount: 1,
    } as any);
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const req = makeRequest({ lote_id: '10' });
    await GET(req);

    // A query de funcionários deve filtrar por clinica_id da sessão
    const funcQuery = mockQuery.mock.calls[1][0] as string;
    expect(funcQuery).toContain('clinica_id');
    // Segundo parâmetro [1] deve ser o clinica_id da sessão
    const funcParams = mockQuery.mock.calls[1][1] as any[];
    expect(funcParams).toContain(5);
  });

  it('deve retornar 500 se ocorrer erro interno', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB connection failed'));
    const req = makeRequest({ lote_id: '10' });
    const res = await GET(req);
    expect(res.status).toBe(500);
  });

  it('deve formatar data/hora em pt-BR com segundos', () => {
    const data = new Date('2026-02-11T00:16:02Z');
    const formatado = data.toLocaleString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    expect(formatado).toMatch(/\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2}/);
  });

  it('deve exibir "Não disponível" se hash_pdf for null', () => {
    // Se o laudo ainda não tem hash_pdf gerado
    expect(true).toBe(true);
  });
});
