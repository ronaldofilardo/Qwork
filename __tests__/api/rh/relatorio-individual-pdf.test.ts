/**
 * @jest-environment node
 * @group integration
 *
 * Testes para /api/rh/relatorio-individual-pdf
 *
 * Verifica geração de relatório individual em PDF usando jsPDF
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/rh/relatorio-individual-pdf/route';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import { gerarRelatorioIndividualPDF } from '@/lib/pdf/relatorio-individual';

jest.mock('@/lib/db');
jest.mock('@/lib/session');
jest.mock('@/lib/pdf/relatorio-individual', () => ({
  gerarRelatorioIndividualPDF: jest.fn(() => Buffer.from('mock-pdf-content')),
  buildGruposFromRespostas: jest.fn(),
}));

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;
const _mockGerarPDF = gerarRelatorioIndividualPDF as jest.MockedFunction<
  typeof gerarRelatorioIndividualPDF
>;

describe('GET /api/rh/relatorio-individual-pdf', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue({
      cpf: '04703084945',
      nome: 'RH Test',
      perfil: 'rh',
      clinica_id: 100,
    } as unknown as Awaited<ReturnType<typeof requireRole>>);
  });

  it('deve retornar 400 quando faltam parâmetros obrigatórios', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/rh/relatorio-individual-pdf'
    );

    const response = await GET(request);

    expect(response.status).toBe(400);
    const json: unknown = await response.json();
    expect((json as Record<string, unknown>).error).toContain(
      'lote_id e cpf são obrigatórios'
    );
  });

  it('deve retornar 404 quando avaliação não existe', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [],
    } as unknown as Awaited<ReturnType<typeof query>>);

    const request = new NextRequest(
      'http://localhost:3000/api/rh/relatorio-individual-pdf?lote_id=999&cpf=12345678901'
    );

    const response = await GET(request);

    expect(response.status).toBe(404);
    const json: unknown = await response.json();
    expect((json as Record<string, unknown>).error).toContain(
      'Avaliação não encontrada'
    );
  });

  it('deve gerar PDF com sucesso quando dados são válidos', async () => {
    // Mock da avaliação
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          funcionario_id: 10,
          concluida_em: new Date('2026-02-10'),
          nome: 'João Silva',
          cpf: '12345678901',
          matricula: 'MAT001',
          funcao: 'Analista',
          nivel: 'Junior',
          setor: 'TI',
          empresa_nome: 'Empresa Teste',
          lote_id: 1005,
        },
      ],
    } as unknown as Awaited<ReturnType<typeof query>>);

    // Mock das respostas
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          pergunta_id: 1,
          valor: 75,
          grupo_id: 1,
          grupo_nome: 'Demandas do Trabalho',
          polaridade: 'positiva',
        },
        {
          pergunta_id: 2,
          valor: 50,
          grupo_id: 1,
          grupo_nome: 'Demandas do Trabalho',
          polaridade: 'positiva',
        },
      ],
    } as unknown as Awaited<ReturnType<typeof query>>);

    const request = new NextRequest(
      'http://localhost:3000/api/rh/relatorio-individual-pdf?lote_id=1005&cpf=12345678901'
    );

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(response.headers.get('Content-Disposition')).toContain(
      'relatorio-individual'
    );
  });

  it('deve validar acesso por clinica_id do RH', async () => {
    mockRequireRole.mockResolvedValue({
      cpf: '04703084945',
      nome: 'RH Test',
      perfil: 'rh',
      clinica_id: 200,
    } as unknown as Awaited<ReturnType<typeof requireRole>>);

    mockQuery.mockResolvedValueOnce({
      rows: [],
    } as unknown as Awaited<ReturnType<typeof query>>);

    const request = new NextRequest(
      'http://localhost:3000/api/rh/relatorio-individual-pdf?lote_id=1005&cpf=12345678901'
    );

    await GET(request);

    // Verificar que query foi chamada com clinica_id correto
    expect(mockQuery).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining([expect.any(String), expect.any(String), 200])
    );
  });

  it('deve retornar 500 quando ocorre erro interno', async () => {
    mockQuery.mockRejectedValueOnce(new Error('Erro de banco'));

    const request = new NextRequest(
      'http://localhost:3000/api/rh/relatorio-individual-pdf?lote_id=1005&cpf=12345678901'
    );

    const response = await GET(request);

    expect(response.status).toBe(500);
    const json: unknown = await response.json();
    expect((json as Record<string, unknown>).error).toBeTruthy();
  });
});
