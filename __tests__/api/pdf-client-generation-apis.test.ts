/**
 * Testes para APIs de geração de HTML (laudos e relatórios)
 * Valida retorno correto de HTML para geração client-side
 */

import { NextRequest } from 'next/server';
import { GET as getLaudoHTML } from '@/app/api/emissor/laudos/[loteId]/html/route';
import { GET as getRelatorioHTML } from '@/app/api/entidade/lote/[id]/relatorio-individual/[avaliacaoId]/html/route';
import { GET as exportFuncionariosCSV } from '@/app/api/entidade/lote/[id]/funcionarios/export/route';

// Mocks devem estar no topo
jest.mock('@/lib/db', () => ({
  query: jest.fn(),
  db: {
    query: jest.fn(),
  },
}));

jest.mock('@/lib/auth-require', () => ({
  requireEmissor: jest.fn(),
  requireEntidadeOrRH: jest.fn(),
  requireRH: jest.fn(),
}));

// Mockar funções de laudo e template para testes unitários (sanitização)
jest.mock('@/lib/laudo-calculos', () => ({
  gerarDadosGeraisEmpresa: jest.fn().mockResolvedValue({
    empresaAvaliada: { id: 1, nome: 'Empresa Teste' },
  }),
  calcularScoresPorGrupo: jest
    .fn()
    .mockResolvedValue({ grupo1: { media: 0.9 } }),
  gerarInterpretacaoRecomendacoes: jest
    .fn()
    .mockReturnValue({ texto: 'Interpretação' }),
  gerarObservacoesConclusao: jest.fn().mockReturnValue('Observações'),
}));

jest.mock('@/lib/templates/laudo-html', () => ({
  gerarHTMLLaudoCompleto: jest
    .fn()
    .mockReturnValue('<html><body>Laudo</body></html>'),
}));

describe('API: Laudo HTML Generation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar HTML do laudo para emissor autorizado', async () => {
    const { requireEmissor } = require('@/lib/auth-require');
    const { query } = require('@/lib/db');

    requireEmissor.mockResolvedValue({
      user: { cpf: '12345678901', role: 'emissor' },
    });

    // Mock de dados do banco (lote, laudo, avaliacoes)
    query
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            codigo: 'LOTE-001',
            titulo: 'Lote Teste',
            status: 'encerrado',
            clinica_id: 1,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            hash_pdf: 'abc123',
            status: 'enviado',
            emitido_em: new Date(),
            emissor_cpf: '12345678901',
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            funcionario_cpf: '98765432100',
            status: 'concluida',
            funcionario_nome: 'João Silva',
            funcao: 'Operador',
            setor: 'TI',
            respostas: [{ grupo: 1, item: 1, valor: 1 }],
          },
        ],
      });

    const req = new NextRequest(
      'http://localhost:3000/api/emissor/laudos/1/html'
    );
    const response = await getLaudoHTML(req, { params: { loteId: '1' } });

    if (response.status !== 200) {
      try {
        const jsonBody = await response.json();
        console.error('DEBUG RESPONSE JSON:', jsonBody);
      } catch (e) {
        const textBody = await response.text();
        console.error('DEBUG RESPONSE TEXT:', textBody);
      }
    }

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/html');
    expect(response.headers.get('X-Lote-Id')).toBe('1');
  });

  it('deve retornar 404 se laudo não existir', async () => {
    const { requireEmissor } = require('@/lib/auth-require');
    const { query } = require('@/lib/db');

    requireEmissor.mockResolvedValue({
      user: { cpf: '12345678901', role: 'emissor' },
    });

    query
      .mockResolvedValueOnce({
        rows: [{ id: 1, codigo: 'LOTE-001' }],
      })
      .mockResolvedValueOnce({
        rows: [], // Nenhum laudo encontrado
      });

    const req = new NextRequest(
      'http://localhost:3000/api/emissor/laudos/1/html'
    );
    const response = await getLaudoHTML(req, { params: { loteId: '1' } });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toContain('ainda não foi emitido');
  });
});

describe('API: Relatório Individual HTML Generation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar HTML do relatório para entidade autorizada', async () => {
    const { requireEntidadeOrRH, requireRH } = require('@/lib/auth-require');
    const { query } = require('@/lib/db');

    // Mock both helpers used in route - requireRH delegates to either RH or entidade
    requireEntidadeOrRH.mockResolvedValue({
      user: { cpf: '12345678901', role: 'entidade', clinica_id: 1 },
    });
    requireRH.mockReturnValue({
      perfil: 'gestor_entidade',
      cpf: '12345678901',
      clinica_id: 1,
    });

    query
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            codigo: 'LOTE-001',
            titulo: 'Lote Teste',
            clinica_id: 1,
            empresa_id: 1,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            funcionario_cpf: '98765432100',
            status: 'concluida',
            concluida_em: new Date(),
            funcionario_nome: 'João Silva',
            perfil: 'operacional',
            empresa_nome: 'Empresa Teste',
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            grupo_id: 1,
            grupo_titulo: 'Grupo Teste',
            dominio: 'Domínio Teste',
            media: '0.75',
            valor: 1,
            item_texto: 'Questão teste',
          },
        ],
      });

    const req = new NextRequest(
      'http://localhost:3000/api/entidade/lote/1/relatorio-individual/1/html'
    );
    const response = await getRelatorioHTML(req, {
      params: { id: '1', avaliacaoId: '1' },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/html');
  });

  it('deve retornar 400 se avaliação não foi concluída', async () => {
    const { requireEntidadeOrRH, requireRH } = require('@/lib/auth-require');
    const { query } = require('@/lib/db');

    requireEntidadeOrRH.mockResolvedValue({
      user: { cpf: '12345678901', role: 'entidade', clinica_id: 1 },
    });
    requireRH.mockResolvedValue({
      perfil: 'gestor_entidade',
      cpf: '12345678901',
      clinica_id: 1,
    });

    query
      .mockResolvedValueOnce({
        rows: [{ id: 1, clinica_id: 1, empresa_id: 1 }],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            status: 'em_andamento', // Não concluída
          },
        ],
      });

    const req = new NextRequest(
      'http://localhost:3000/api/entidade/lote/1/relatorio-individual/1/html'
    );
    const response = await getRelatorioHTML(req, {
      params: { id: '1', avaliacaoId: '1' },
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('ainda não foi concluída');
  });
});

describe('API: Export Funcionários CSV', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar CSV com funcionários do lote', async () => {
    const { requireEntidadeOrRH, requireRH } = require('@/lib/auth-require');
    const { query } = require('@/lib/db');

    requireEntidadeOrRH.mockResolvedValue({
      user: { cpf: '12345678901', role: 'entidade', clinica_id: 1 },
    });
    requireRH.mockReturnValue({
      perfil: 'gestor_entidade',
      cpf: '12345678901',
      clinica_id: 1,
    });

    query
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            codigo: 'LOTE-001',
            titulo: 'Lote Teste',
            clinica_id: 1,
            empresa_id: 1,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            cpf: '98765432100',
            nome: 'João Silva',
            email: 'joao@teste.com',
            perfil: 'operacional',
            setor: 'TI',
            funcao: 'Desenvolvedor',
            matricula: '001',
            funcionario_status: 'ativo',
            avaliacao_status: 'concluida',
            concluida_em: new Date('2025-01-15'),
            status_descricao: 'Concluída',
          },
        ],
      });

    const req = new NextRequest(
      'http://localhost:3000/api/entidade/lote/1/funcionarios/export'
    );
    const response = await exportFuncionariosCSV(req, { params: { id: '1' } });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/csv');
    expect(response.headers.get('Content-Disposition')).toContain('attachment');
    expect(response.headers.get('X-Total-Funcionarios')).toBe('1');

    const csv = await response.text();
    expect(csv).toContain('CPF,Nome,Email');
    expect(csv).toContain('98765432100');
    expect(csv).toContain('João Silva');
  });

  it('deve retornar 403 para acesso não autorizado', async () => {
    const { requireEntidadeOrRH, requireRH } = require('@/lib/auth-require');
    const { query } = require('@/lib/db');

    requireEntidadeOrRH.mockResolvedValue({
      user: { cpf: '12345678901', role: 'entidade', clinica_id: 2 }, // Clínica diferente
    });
    requireRH.mockReturnValue({
      perfil: 'gestor_entidade',
      cpf: '12345678901',
      clinica_id: 2,
    });

    query.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          codigo: 'LOTE-001',
          clinica_id: 1, // Clínica 1
          empresa_id: 1,
        },
      ],
    });

    const req = new NextRequest(
      'http://localhost:3000/api/entidade/lote/1/funcionarios/export'
    );
    const response = await exportFuncionariosCSV(req, { params: { id: '1' } });

    if (response.status !== 403) {
      try {
        console.error('DEBUG CSV JSON:', await response.json());
      } catch (e) {
        console.error('DEBUG CSV TEXT:', await response.text());
      }
    }

    expect(response.status).toBe(403);
  });
});
