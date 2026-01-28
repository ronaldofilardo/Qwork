import {
  GET as getLaudo,
  PUT as updateObservacoes,
  POST as emitirLaudo,
} from '@/app/api/emissor/laudos/[loteId]/route';
import { query } from '@/lib/db';

// Mock das dependências
jest.mock('@/lib/session', () => ({
  requireRole: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/laudo-calculos', () => ({
  gerarDadosGeraisEmpresa: jest.fn(),
  calcularScoresPorGrupo: jest.fn(),
  gerarInterpretacaoRecomendacoes: jest.fn(),
  gerarObservacoesConclusao: jest.fn(),
}));

jest.mock('@/lib/laudo-tipos', () => ({}));

const mockRequireRole = require('@/lib/session').requireRole;
const mockQuery = query as jest.MockedFunction<typeof query>;
const mockGerarDadosGeraisEmpresa =
  require('@/lib/laudo-calculos').gerarDadosGeraisEmpresa;
const mockCalcularScoresPorGrupo =
  require('@/lib/laudo-calculos').calcularScoresPorGrupo;
const mockGerarInterpretacaoRecomendacoes =
  require('@/lib/laudo-calculos').gerarInterpretacaoRecomendacoes;
const mockGerarObservacoesConclusao =
  require('@/lib/laudo-calculos').gerarObservacoesConclusao;

// LEGACY_TEST - mantido temporariamente; refatorar/arquivar
// TODO: remover após validação em `laudo-auto-refactored`

describe.skip('[LEGACY] API Emissor Laudos - Sistema Automático (IGNORADO: refatoração pendente)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/emissor/laudos/[loteId]', () => {
    it('deve retornar laudo com informações de emissão automática', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '12345678901',
        perfil: 'emissor',
      });

      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              id: 1,
              codigo: '001-161225',
              status: 'concluido',
              empresa_nome: 'Empresa Teste',
              clinica_nome: 'Clinica Teste',
              total: 2,
              concluidas: 2,
              auto_emitir_em: new Date(
                Date.now() + 4 * 60 * 60 * 1000
              ).toISOString(),
            },
          ],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 10,
              observacoes: 'Observações teste',
              status: 'rascunho',
              criado_em: new Date().toISOString(),
              emitido_em: null,
              enviado_em: null,
            },
          ],
          rowCount: 1,
        });

      mockGerarDadosGeraisEmpresa.mockResolvedValue({
        empresaAvaliada: 'Empresa Teste',
        cnpj: '12345678000199',
        endereco: 'Rua Teste, 123',
        periodoAvaliacoes: {
          dataLiberacao: '2025-01-01',
          dataUltimaConclusao: '2025-01-15',
        },
        totalFuncionariosAvaliados: 10,
        percentualConclusao: 100,
        amostra: { operacional: 7, gestao: 3 },
      });

      mockCalcularScoresPorGrupo.mockResolvedValue([]);

      mockGerarInterpretacaoRecomendacoes.mockReturnValue([]);

      mockGerarObservacoesConclusao.mockReturnValue({
        observacoesLaudo: 'Observações geradas',
        textoConclusao: 'Conclusão gerada',
        dataEmissao: new Date().toISOString(),
        assinatura: {
          nome: 'Dr. Teste',
          titulo: 'Médico',
          registro: 'CRM123',
          empresa: 'Clinica Teste',
        },
      });

      const request = new Request('http://localhost/api/emissor/laudos/1');
      const response = await getLaudo(request, { params: { loteId: '1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.lote.emissao_automatica).toBe(true);
      expect(data.lote.previsao_emissao).toBeDefined();
      expect(data.bloqueado_edicao).toBe(true);
      expect(data.mensagem).toContain('programado para emissão automática');
    });

    it('deve permitir pré-visualização para lotes não concluídos', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '12345678901',
        perfil: 'emissor',
      });

      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              id: 1,
              codigo: '001-161225',
              status: 'ativo',
              empresa_nome: 'Empresa Teste',
              clinica_nome: 'Clinica Teste',
              total: 2,
              concluidas: 1,
              auto_emitir_em: null,
            },
          ],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 10,
              observacoes: null,
              status: 'rascunho',
              criado_em: new Date().toISOString(),
              emitido_em: null,
              enviado_em: null,
            },
          ],
          rowCount: 1,
        });

      mockGerarDadosGeraisEmpresa.mockResolvedValue({
        empresaAvaliada: 'Empresa Teste',
        cnpj: '12345678000199',
        endereco: 'Rua Teste, 123',
        periodoAvaliacoes: {
          dataLiberacao: '2025-01-01',
          dataUltimaConclusao: '2025-01-15',
        },
        totalFuncionariosAvaliados: 10,
        percentualConclusao: 50,
        amostra: { operacional: 7, gestao: 3 },
      });

      mockCalcularScoresPorGrupo.mockResolvedValue([]);

      mockGerarInterpretacaoRecomendacoes.mockReturnValue([]);

      mockGerarObservacoesConclusao.mockReturnValue({
        observacoesLaudo: 'Pré-visualização',
        textoConclusao: 'Conclusão parcial',
        dataEmissao: new Date().toISOString(),
        assinatura: {
          nome: 'Dr. Teste',
          titulo: 'Médico',
          registro: 'CRM123',
          empresa: 'Clinica Teste',
        },
      });

      const request = new Request('http://localhost/api/emissor/laudos/1');
      const response = await getLaudo(request, { params: { loteId: '1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.previa).toBe(true);
      expect(data.mensagem).toContain('Pré-visualização');
    });
  });

  describe('PUT /api/emissor/laudos/[loteId]', () => {
    it('deve bloquear edição quando lote tem emissão automática', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '12345678901',
        perfil: 'emissor',
      });

      mockQuery.mockResolvedValueOnce({
        rows: [{ auto_emitir_em: new Date().toISOString() }],
        rowCount: 1,
      });

      const request = new Request('http://localhost/api/emissor/laudos/1', {
        method: 'PUT',
        body: JSON.stringify({ observacoes: 'Teste' }),
      });

      const response = await updateObservacoes(request, {
        params: { loteId: '1' },
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('programado para emissão automática');
    });

    it('deve permitir edição quando lote não tem emissão automática', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '12345678901',
        perfil: 'emissor',
      });

      mockQuery
        .mockResolvedValueOnce({
          rows: [{ auto_emitir_em: null }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        });

      const request = new Request('http://localhost/api/emissor/laudos/1', {
        method: 'PUT',
        body: JSON.stringify({ observacoes: 'Observações atualizadas' }),
      });

      const response = await updateObservacoes(request, {
        params: { loteId: '1' },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('POST /api/emissor/laudos/[loteId]', () => {
    it('deve bloquear emissão manual quando lote tem agendamento automático', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '12345678901',
        perfil: 'emissor',
      });

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            codigo: '001-161225',
            status: 'concluido',
            empresa_nome: 'Empresa Teste',
            clinica_nome: 'Clinica Teste',
            total: 2,
            concluidas: 2,
            auto_emitir_em: new Date().toISOString(),
          },
        ],
        rowCount: 1,
      });

      const request = new Request('http://localhost/api/emissor/laudos/1', {
        method: 'POST',
      });

      const response = await emitirLaudo(request, { params: { loteId: '1' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('programado para emissão automática');
    });
  });
});
