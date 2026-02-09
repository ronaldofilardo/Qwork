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
  requireEntity: jest.fn(),
}));

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireEntity = require('@/lib/session').requireEntity;

describe('/api/entidade/lotes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar lista de lotes com sucesso', async () => {
    // Mock da sessão
    mockRequireEntity.mockResolvedValueOnce({
      perfil: 'gestor',
      entidade_id: 1,
    });

    // Mock da consulta principal (lotes)
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          titulo: 'Lote Teste',
          tipo: 'completo',
          status: 'ativo',
          criado_em: '2025-11-29T10:00:00Z',
          liberado_em: '2025-12-01T10:00:00Z',
          liberado_por_nome: 'João Silva',
          empresa_nome: 'Empresa Teste',
          total_avaliacoes: 5,
          avaliacoes_concluidas: 3,
          avaliacoes_inativadas: 0,
          laudo_id: null,
          laudo_status: null,
          laudo_emitido_em: null,
          laudo_enviado_em: null,
          laudo_hash: null,
          emissor_nome: null,
          solicitado_por: null,
          solicitado_em: null,
          tipo_solicitante: null,
        },
      ],
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.lotes).toHaveLength(1);
    expect(data.lotes[0].empresa_nome).toBe('Empresa Teste');
    expect(data.lotes[0].total_avaliacoes).toBe(5);
    expect(data.lotes[0].avaliacoes_concluidas).toBe(3);
  });

  it('deve retornar erro quando requireEntity lança exceção', async () => {
    mockRequireEntity.mockRejectedValueOnce(
      new Error('Entidade não encontrada')
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();
  });

  it('deve retornar erro 500 quando ocorre erro na consulta', async () => {
    mockRequireEntity.mockResolvedValueOnce({
      perfil: 'gestor',
      entidade_id: 1,
    });

    mockQuery.mockRejectedValueOnce(new Error('Erro de banco'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Erro ao buscar lotes');
  });

  it('deve aceitar retorno da função validar_lote_para_laudo com campo pode_emitir_laudo', async () => {
    mockRequireEntity.mockResolvedValueOnce({
      perfil: 'gestor',
      entidade_id: 1,
    });

    // Primeiro SELECT (lotes)
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          titulo: 'Lote Teste',
          tipo: 'completo',
          status: 'concluido',
          criado_em: '2025-11-29T10:00:00Z',
          liberado_em: '2025-12-01T10:00:00Z',
          liberado_por_nome: 'João Silva',
          empresa_nome: 'Empresa Teste',
          total_avaliacoes: 5,
          avaliacoes_concluidas: 5,
          avaliacoes_inativadas: 0,
          laudo_id: 10,
          laudo_status: 'enviado',
          laudo_emitido_em: '2025-12-02T10:00:00Z',
          laudo_enviado_em: '2025-12-02T11:00:00Z',
          laudo_hash: 'hash123',
          emissor_nome: 'Maria Santos',
          solicitado_por: null,
          solicitado_em: null,
          tipo_solicitante: null,
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
    mockRequireEntity.mockResolvedValueOnce({
      perfil: 'gestor',
      entidade_id: 1,
    });

    // Primeiro SELECT (lotes)
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 2,
          titulo: 'Lote Teste 2',
          tipo: 'completo',
          status: 'concluido',
          criado_em: '2025-11-29T10:00:00Z',
          liberado_em: '2025-12-01T10:00:00Z',
          liberado_por_nome: 'João Silva',
          empresa_nome: 'Empresa Teste 2',
          total_avaliacoes: 5,
          avaliacoes_concluidas: 5,
          avaliacoes_inativadas: 0,
          laudo_id: null,
          laudo_status: null,
          laudo_emitido_em: null,
          laudo_enviado_em: null,
          laudo_hash: null,
          emissor_nome: null,
          solicitado_por: null,
          solicitado_em: null,
          tipo_solicitante: null,
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

  it('deve usar a view v_fila_emissao na query de lotes da entidade', async () => {
    mockRequireEntity.mockResolvedValueOnce({
      perfil: 'gestor',
      entidade_id: 1,
    });

    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          titulo: 'Lote Teste',
          tipo: 'completo',
          status: 'ativo',
          criado_em: '2025-11-29T10:00:00Z',
          liberado_em: '2025-12-01T10:00:00Z',
          liberado_por_nome: 'João Silva',
          empresa_nome: 'Empresa Teste',
          total_avaliacoes: 5,
          avaliacoes_concluidas: 3,
          avaliacoes_inativadas: 0,
          laudo_id: null,
          laudo_status: null,
          laudo_emitido_em: null,
          laudo_enviado_em: null,
          laudo_hash: null,
          emissor_nome: null,
          solicitado_por: null,
          solicitado_em: null,
          tipo_solicitante: null,
        },
      ],
    });

    await GET();

    const anyContains = mockQuery.mock.calls.some(
      (call) =>
        typeof call[0] === 'string' && call[0].includes('v_fila_emissao')
    );
    expect(anyContains).toBe(true);
  });
});
