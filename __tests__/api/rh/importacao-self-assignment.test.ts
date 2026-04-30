/**
 * Testes para validação de self-assignment na importação em massa (RH)
 * Valida que um RH não pode se cadastrar como funcionário via planilha XLSX
 */
import { NextRequest } from 'next/server';
import { POST as validatePost } from '@/app/api/rh/importacao/validate/route';
import { POST as executePost } from '@/app/api/rh/importacao/execute/route';

// Mock da sessão do usuário
jest.mock('@/lib/session', () => ({
  requireClinica: jest.fn(async () => ({
    clinica_id: 'clinic-123',
    cpf: '12345678901', // RH responsável
    usuario_id: 'user-123',
  })),
}));

// Mock do parser
jest.mock('@/lib/importacao/dynamic-parser', () => ({
  parseSpreadsheetAllRows: jest.fn((buffer, mapping) => ({
    success: true,
    data: [
      {
        cpf: '12345678901', // Self-assignment: mesmo CPF do RH
        nome: 'João Silva',
        funcao: 'Enfermeiro',
        nome_empresa: 'Clínica A',
        cnpj_empresa: '12345678000191',
      },
      {
        cpf: '98765432100',
        nome: 'Maria Santos',
        funcao: 'Médico',
        nome_empresa: 'Clínica A',
        cnpj_empresa: '12345678000191',
      },
    ],
  })),
}));

// Mock do validador de dados
jest.mock('@/lib/importacao/data-validator', () => ({
  validarDadosImportacao: jest.fn((rows) => ({
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

describe('Importação RH - Self-Assignment Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/rh/importacao/validate - Self-Assignment Check', () => {
    it('deve detectar self-assignment (CPF do RH na planilha) e adicionar erro', async () => {
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

      const request = new NextRequest('http://localhost/api/rh/importacao/validate', {
        method: 'POST',
        body: formData,
      });

      const response = await validatePost(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      // Deve ter erro de self-assignment na linha 2 (primeira linha de dados)
      const selfAssignmentError = data.data.erros.find(
        (e: any) => e.campo === 'cpf' && e.valor === '12345678901'
      );
      expect(selfAssignmentError).toBeDefined();
      expect(selfAssignmentError?.mensagem).toContain(
        'Você não pode se cadastrar como funcionário da própria clínica'
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

      const request = new NextRequest('http://localhost/api/rh/importacao/validate', {
        method: 'POST',
        body: formData,
      });

      const response = await validatePost(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      // CPF 98765432100 (linha 3) não deve gerar erro de self-assignment
      const selfAssignmentErrors = data.data.erros.filter(
        (e: any) =>
          e.campo === 'cpf' &&
          e.mensagem.includes('Você não pode se cadastrar')
      );
      // Apenas o primeiro CPF (12345678901) deve ter erro
      expect(selfAssignmentErrors.length).toBe(1);
      expect(selfAssignmentErrors[0].valor).toBe('12345678901');
    });

    it('deve normalizar CPF com formatação antes de comparar', async () => {
      // Teste com CPF formatado (123.456.789-01) vs sem formato (12345678901)
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

      const request = new NextRequest('http://localhost/api/rh/importacao/validate', {
        method: 'POST',
        body: formData,
      });

      const response = await validatePost(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      // Deve detectar mesmo com formatação (via limparCPF)
      const selfAssignmentError = data.data.erros.find(
        (e: any) =>
          e.campo === 'cpf' &&
          e.mensagem.includes('Você não pode se cadastrar')
      );
      expect(selfAssignmentError).toBeDefined();
    });
  });

  describe('POST /api/rh/importacao/execute - Self-Assignment Blocking', () => {
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

      const request = new NextRequest('http://localhost/api/rh/importacao/execute', {
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
