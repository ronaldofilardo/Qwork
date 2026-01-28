/**
 * Testes para a API /api/entidade/lotes
 */

import { GET } from '@/app/api/entidade/lotes/route';
import { query } from '@/lib/db';

// Mock do db
jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

// Mock da sessão
jest.mock('@/lib/session', () => ({
  getSession: jest.fn(),
}));

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockGetSession = require('@/lib/session').getSession;

describe('/api/entidade/lotes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar lista de lotes com sucesso', async () => {
    // Mock da sessão
    mockGetSession.mockReturnValue({
      perfil: 'gestor_entidade',
      contratante_id: 1,
    });

    // Mock da consulta
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          codigo: '001-291125',
          titulo: 'Lote Teste',
          tipo: 'completo',
          status: 'ativo',
          data_criacao: '2025-11-29T10:00:00Z',
          data_envio: '2025-12-01T10:00:00Z',
          total_funcionarios: 5,
          funcionarios_concluidos: 3,
        },
      ],
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.lotes).toHaveLength(1);
    expect(data.lotes[0].codigo).toBe('001-291125');
    expect(data.lotes[0].total_funcionarios).toBe(5);
    expect(data.lotes[0].funcionarios_concluidos).toBe(3);
  });

  it('deve retornar erro 401 quando não há sessão', async () => {
    mockGetSession.mockReturnValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Não autorizado');
  });

  it('deve retornar erro 403 quando perfil incorreto', async () => {
    mockGetSession.mockReturnValue({
      perfil: 'funcionario',
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Acesso negado');
  });

  it('deve retornar erro 500 quando ocorre erro na consulta', async () => {
    mockGetSession.mockReturnValue({
      perfil: 'gestor_entidade',
      contratante_id: 1,
    });

    mockQuery.mockRejectedValueOnce(new Error('Erro de banco'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Erro interno do servidor');
  });

  it('deve aceitar retorno da função validar_lote_para_laudo com campo pode_emitir_laudo', async () => {
    mockGetSession.mockReturnValue({
      perfil: 'gestor_entidade',
      contratante_id: 1,
    });

    // Primeiro SELECT (lotes)
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          codigo: '001-291125',
          titulo: 'Lote Teste',
          tipo: 'completo',
          status: 'concluido',
          criado_em: '2025-11-29T10:00:00Z',
          liberado_em: '2025-12-01T10:00:00Z',
          total_avaliacoes: 5,
          avaliacoes_concluidas: 5,
          avaliacoes_inativadas: 0,
          laudo_id: 10,
          laudo_status: 'enviado',
        },
      ],
    });

    // Segundo SELECT (validacao)
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          pode_emitir_laudo: true,
          motivos_bloqueio: [],
          taxa_conclusao: 100,
        },
      ],
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.lotes[0].pode_emitir_laudo).toBe(true);
  });

  it('deve aceitar retorno da função validar_lote_para_laudo com campo pode_emitir', async () => {
    mockGetSession.mockReturnValue({
      perfil: 'gestor_entidade',
      contratante_id: 1,
    });

    // Primeiro SELECT (lotes)
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 2,
          codigo: '002-291125',
          titulo: 'Lote Teste 2',
          tipo: 'completo',
          status: 'concluido',
          criado_em: '2025-11-29T10:00:00Z',
          liberado_em: '2025-12-01T10:00:00Z',
          total_avaliacoes: 5,
          avaliacoes_concluidas: 5,
          avaliacoes_inativadas: 0,
          laudo_id: null,
          laudo_status: null,
        },
      ],
    });

    // Segundo SELECT retorna 'pode_emitir'
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          pode_emitir: true,
          motivos_bloqueio: [],
          taxa_conclusao: 100,
        },
      ],
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.lotes[0].pode_emitir_laudo).toBe(true);
  });
});
