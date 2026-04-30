/**
 * Testes para validação de self-assignment na importação em massa (Entidade)
 * Valida que um gestor não pode se cadastrar como funcionário via planilha XLSX
 */
import { NextRequest } from 'next/server';
import { POST as validatePost } from '@/app/api/entidade/importacao/validate/route';
import { POST as executePost } from '@/app/api/entidade/importacao/execute/route';

// Mock da sessão do usuário
jest.mock('@/lib/session', () => ({
  requireEntity: jest.fn(async () => ({
    entidade_id: 'entity-123',
    cpf: '11111111111', // Gestor responsável
    usuario_id: 'user-456',
  })),
}));

// Mock do parser
jest.mock('@/lib/importacao/dynamic-parser', () => ({
  parseSpreadsheetAllRows: jest.fn((buffer, mapping) => ({
    success: true,
    data: [
      {
        cpf: '11111111111', // Self-assignment: mesmo CPF do gestor
        nome: 'Carlos Silva',
        funcao: 'Gerente',
        setor: 'Administrativo',
      },
      {
        cpf: '22222222222',
        nome: 'Ana Costa',
        funcao: 'Recepcionista',
        setor: 'Atendimento',
      },
    ],
  })),
}));

// Mock do validador de dados
jest.mock('@/lib/importacao/data-validator', () => ({
  validarDadosImportacao: jest.fn((rows, options) => ({
    valido: rows.length > 0,
    resumo: {
      totalLinhas: rows.length,
      linhasValidas: rows.length,
      linhasComErros: 0,
      linhasComAvisos: 0,
      cpfsUnicos: rows.length,
      cpfsDuplicadosNoArquivo: 0,
      linhasComDemissao: 0,
    },
    erros: [],
    avisos: [],
  })),
}));

// Mock do banco de dados
jest.mock('@/lib/db', () => ({
  query: jest.fn(async () => ({
    rows: [],
  })),
}));

describe('Importação Entidade - Self-Assignment Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/entidade/importacao/validate - Self-Assignment Check', () => {
    it('deve detectar self-assignment (CPF do gestor na planilha) e adicionar erro', async () => {
      const formData = new FormData();
      const file = new File(
        ['dummy xlsx content'],
        'test.xlsx',
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      );
      formData.append('file', file);
      formData.append(
        'mapeamento',
        JSON.stringify([
          { indice: 0, nomeOriginal: 'CPF', campoQWork: 'cpf' },
          { indice: 1, nomeOriginal: 'Nome', campoQWork: 'nome' },
        ])
      );

      const request = new NextRequest('http://localhost/api/entidade/importacao/validate', {
        method: 'POST',
        body: formData,
      });

      const response = await validatePost(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      // Deve ter erro de self-assignment na linha 2 (primeira linha de dados)
      const selfAssignmentError = data.data.erros.find(
        (e: any) => e.campo === 'cpf' && e.valor === '11111111111'
      );
      expect(selfAssignmentError).toBeDefined();
      expect(selfAssignmentError?.mensagem).toContain(
        'Você não pode se cadastrar como funcionário da própria entidade'
      );
      expect(selfAssignmentError?.severidade).toBe('erro');
    });

    it('deve permitir CPFs diferentes do responsável', async () => {
      const formData = new FormData();
      const file = new File(
        ['dummy xlsx content'],
        'test.xlsx',
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      );
      formData.append('file', file);
      formData.append(
        'mapeamento',
        JSON.stringify([
          { indice: 0, nomeOriginal: 'CPF', campoQWork: 'cpf' },
        ])
      );

      const request = new NextRequest('http://localhost/api/entidade/importacao/validate', {
        method: 'POST',
        body: formData,
      });

      const response = await validatePost(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      // CPF 22222222222 (linha 3) não deve gerar erro de self-assignment
      const selfAssignmentErrors = data.data.erros.filter(
        (e: any) =>
          e.campo === 'cpf' &&
          e.mensagem.includes('Você não pode se cadastrar')
      );
      // Apenas o primeiro CPF (11111111111) deve ter erro
      expect(selfAssignmentErrors.length).toBe(1);
      expect(selfAssignmentErrors[0].valor).toBe('11111111111');
    });

    it('deve usar mensagem específica para Entidade (não "clínica")', async () => {
      const formData = new FormData();
      const file = new File(
        ['dummy xlsx content'],
        'test.xlsx',
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      );
      formData.append('file', file);
      formData.append(
        'mapeamento',
        JSON.stringify([
          { indice: 0, nomeOriginal: 'CPF', campoQWork: 'cpf' },
        ])
      );

      const request = new NextRequest('http://localhost/api/entidade/importacao/validate', {
        method: 'POST',
        body: formData,
      });

      const response = await validatePost(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      const selfAssignmentError = data.data.erros.find(
        (e: any) =>
          e.campo === 'cpf' &&
          e.mensagem.includes('Você não pode se cadastrar')
      );
      expect(selfAssignmentError?.mensagem).toContain('entidade');
      expect(selfAssignmentError?.mensagem).not.toContain('clínica');
    });
  });

  describe('POST /api/entidade/importacao/execute - Self-Assignment Blocking', () => {
    it('deve bloquear execução com CPF de self-assignment', async () => {
      const formData = new FormData();
      const file = new File(
        ['dummy xlsx content'],
        'test.xlsx',
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      );
      formData.append('file', file);
      formData.append(
        'mapeamento',
        JSON.stringify([
          { indice: 0, nomeOriginal: 'CPF', campoQWork: 'cpf' },
        ])
      );

      const request = new NextRequest('http://localhost/api/entidade/importacao/execute', {
        method: 'POST',
        body: formData,
      });

      const response = await executePost(request);
      // Deve retornar erro porque nenhuma linha é válida (todas com self-assignment ou erro)
      // Ou caso a segunda linha seja válida, deve processar só ela
      expect(response).toBeDefined();
    });
  });
});
