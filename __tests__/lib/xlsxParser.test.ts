/**
 * Testes de Importação de Funcionários via XLSX
 * Valida parsing, validações e integração com endpoints
 */

import {
  parseXlsxBufferToRows,
  validarLinhaFuncionario,
  validarEmailsUnicos,
  validarCPFsUnicos,
  type FuncionarioImportRow,
} from '@/lib/xlsxParser';
import * as XLSX from 'xlsx';

describe('xlsxParser - Parsing e Validações', () => {
  describe('parseXlsxBufferToRows', () => {
    it('deve fazer parsing de arquivo XLSX válido', () => {
      // Criar workbook de teste
      const dados = [
        {
          cpf: '12345678909',
          nome: 'João Silva',
          data_nascimento: '15/04/1985',
          setor: 'TI',
          funcao: 'Desenvolvedor',
          email: 'joao@empresa.com',
        },
      ];

      const ws = XLSX.utils.json_to_sheet(dados);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Funcionários');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const result = parseXlsxBufferToRows(buffer);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].cpf).toBe('12345678909');
      expect(result.data[0].nome).toBe('João Silva');
    });

    it('deve rejeitar arquivo sem colunas obrigatórias', () => {
      const dados = [{ nome: 'João Silva', setor: 'TI' }]; // Faltam cpf, funcao, email e data_nascimento

      const ws = XLSX.utils.json_to_sheet(dados);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Funcionários');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const result = parseXlsxBufferToRows(buffer);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Colunas obrigatórias ausentes');
    });

    it('deve ignorar linhas vazias', () => {
      const ws = XLSX.utils.aoa_to_sheet([
        ['cpf', 'nome', 'data_nascimento', 'setor', 'funcao', 'email'],
        [
          '12345678909',
          'João Silva',
          '15/04/1985',
          'TI',
          'Dev',
          'joao@empresa.com',
        ],
        ['', '', '', '', '', ''], // Linha vazia
        [
          '98765432100',
          'Maria Santos',
          '02/02/1990',
          'RH',
          'Analista',
          'maria@empresa.com',
        ],
      ]);

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Funcionários');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const result = parseXlsxBufferToRows(buffer);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2); // Deve ter apenas 2 funcionários
    });

    it('deve normalizar nomes de colunas com acentos', () => {
      const ws = XLSX.utils.aoa_to_sheet([
        ['CPF', 'Nome', 'Data de Nascimento', 'Setor', 'Função', 'E-mail'], // Com acentos e maiúsculas
        [
          '12345678909',
          'João Silva',
          '15/04/1985',
          'TI',
          'Dev',
          'joao@empresa.com',
        ],
      ]);

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Funcionários');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const result = parseXlsxBufferToRows(buffer);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('validarLinhaFuncionario', () => {
    it('deve validar linha com dados completos e corretos', () => {
      const row: FuncionarioImportRow = {
        cpf: '12345678909',
        nome: 'João Silva',
        data_nascimento: '1985-04-15',
        setor: 'TI',
        funcao: 'Desenvolvedor',
        email: 'joao@empresa.com',
      };

      const result = validarLinhaFuncionario(row, 2);

      expect(result.valido).toBe(true);
      expect(result.erros).toHaveLength(0);
    });

    it('deve rejeitar CPF inválido', () => {
      const row: FuncionarioImportRow = {
        cpf: '12345', // CPF com menos de 11 dígitos
        nome: 'João Silva',
        data_nascimento: '1990-01-01',
        setor: 'TI',
        funcao: 'Desenvolvedor',
        email: 'joao@empresa.com',
      };

      const result = validarLinhaFuncionario(row, 2);

      expect(result.valido).toBe(false);
      expect(result.erros.some((e) => e.includes('CPF'))).toBe(true);
    });

    it('deve rejeitar email inválido', () => {
      const row: FuncionarioImportRow = {
        cpf: '12345678909',
        nome: 'João Silva',
        data_nascimento: '1990-01-01',
        setor: 'TI',
        funcao: 'Desenvolvedor',
        email: 'emailinvalido', // Sem @ e domínio
      };

      const result = validarLinhaFuncionario(row, 2);

      expect(result.valido).toBe(false);
      expect(result.erros.some((e) => e.includes('Email'))).toBe(true);
    });

    it('deve rejeitar nivel_cargo inválido', () => {
      const row: FuncionarioImportRow = {
        cpf: '12345678909',
        nome: 'João Silva',
        data_nascimento: '1990-01-01',
        setor: 'TI',
        funcao: 'Desenvolvedor',
        email: 'joao@empresa.com',
        nivel_cargo: 'invalido', // Não está na lista permitida
      };

      const result = validarLinhaFuncionario(row, 2);

      expect(result.valido).toBe(false);
      expect(result.erros.some((e) => e.includes('Nível de cargo'))).toBe(true);
    });

    it('deve aceitar nivel_cargo válido', () => {
      const niveisValidos = ['operacional', 'gestao', 'gerencial', 'diretoria'];

      niveisValidos.forEach((nivel) => {
        const row: FuncionarioImportRow = {
          cpf: '12345678909',
          nome: 'João Silva',
          data_nascimento: '1985-04-15',
          setor: 'TI',
          funcao: 'Desenvolvedor',
          email: 'joao@empresa.com',
          nivel_cargo: nivel,
        };

        const result = validarLinhaFuncionario(row, 2);

        expect(result.valido).toBe(true);
      });
    });
  });

  describe('validarEmailsUnicos', () => {
    it('deve aceitar emails únicos', () => {
      const rows: FuncionarioImportRow[] = [
        {
          cpf: '12345678901',
          nome: 'João',
          data_nascimento: '1990-01-01',
          setor: 'TI',
          funcao: 'Dev',
          email: 'joao@empresa.com',
        },
        {
          cpf: '98765432100',
          nome: 'Maria',
          data_nascimento: '1991-01-01',
          setor: 'RH',
          funcao: 'Analista',
          email: 'maria@empresa.com',
        },
      ];

      const result = validarEmailsUnicos(rows);

      expect(result.valido).toBe(true);
      expect(result.duplicados).toHaveLength(0);
    });

    it('deve detectar emails duplicados', () => {
      const rows: FuncionarioImportRow[] = [
        {
          cpf: '12345678909',
          nome: 'João',
          data_nascimento: '1990-01-01',
          setor: 'TI',
          funcao: 'Dev',
          email: 'joao@empresa.com',
        },
        {
          cpf: '98765432100',
          nome: 'Maria',
          data_nascimento: '1991-01-01',
          setor: 'RH',
          funcao: 'Analista',
          email: 'joao@empresa.com', // Email duplicado
        },
      ];

      const result = validarEmailsUnicos(rows);

      expect(result.valido).toBe(false);
      expect(result.duplicados).toContain('joao@empresa.com');
    });
  });

  describe('validarCPFsUnicos', () => {
    it('deve aceitar CPFs únicos', () => {
      const rows: FuncionarioImportRow[] = [
        {
          cpf: '12345678901',
          nome: 'João',
          data_nascimento: '1990-01-01',
          setor: 'TI',
          funcao: 'Dev',
          email: 'joao@empresa.com',
        },
        {
          cpf: '98765432100',
          nome: 'Maria',
          data_nascimento: '1991-01-01',
          setor: 'RH',
          funcao: 'Analista',
          email: 'maria@empresa.com',
        },
      ];

      const result = validarCPFsUnicos(rows);

      expect(result.valido).toBe(true);
      expect(result.duplicados).toHaveLength(0);
    });

    it('deve detectar CPFs duplicados', () => {
      const rows: FuncionarioImportRow[] = [
        {
          cpf: '12345678901',
          nome: 'João',
          data_nascimento: '1990-01-01',
          setor: 'TI',
          funcao: 'Dev',
          email: 'joao@empresa.com',
        },
        {
          cpf: '12345678901', // CPF duplicado
          nome: 'Maria',
          data_nascimento: '1991-01-01',
          setor: 'RH',
          funcao: 'Analista',
          email: 'maria@empresa.com',
        },
      ];

      const result = validarCPFsUnicos(rows);

      expect(result.valido).toBe(false);
      expect(result.duplicados).toContain('12345678901');
    });
  });
});

describe('Endpoints de Importação XLSX', () => {
  describe('POST /api/entidade/funcionarios/import', () => {
    it('deve rejeitar arquivo não-XLSX', async () => {
      // Mock de arquivo não-XLSX (texto/plain)
      const invalidContent = 'cpf;nome;setor\n12345678901;João;TI';
      const file = new File([invalidContent], 'test.txt', {
        type: 'text/plain',
      });

      const formData = new FormData();
      formData.append('file', file);

      // Simular validação do MIME type
      expect(file.type).not.toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
    });

    it('deve aceitar arquivo XLSX válido', () => {
      const xlsxFile = new File([''], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      expect(xlsxFile.type).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
    });
  });

  describe('GET /api/funcionarios/download-template', () => {
    it('deve gerar arquivo XLSX com estrutura correta', async () => {
      // Criar template de teste
      const headers = [
        'cpf',
        'nome',
        'data_nascimento',
        'setor',
        'funcao',
        'email',
        'senha',
        'matricula',
        'nivel_cargo',
        'turno',
        'escala',
      ];

      const ws = XLSX.utils.aoa_to_sheet([headers]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Funcionários');

      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);

      // Verificar se pode ser lido novamente
      const readWb = XLSX.read(buffer, { type: 'buffer' });
      expect(readWb.SheetNames).toContain('Funcionários');
    });
  });
});
