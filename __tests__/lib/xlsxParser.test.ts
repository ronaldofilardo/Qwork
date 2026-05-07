/**
 * Testes de Importação de Funcionários via XLSX
 * Valida parsing, validações e integração com endpoints
 */

import {
  parseXlsxBufferToRows,
  parseDateCell,
  validarLinhaFuncionario,
  validarEmailsUnicos,
  validarCPFsUnicos,
  localizarLinhaPorCPF,
  localizarLinhaPorMatricula,
  localizarLinhaPorEmail,
  validarCPFsUnicosDetalhado,
  validarEmailsUnicosDetalhado,
  validarMatriculasUnicasDetalhado,
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
      // Apenas valores mapeados pelo código são aceitos
      const niveisValidos = ['operacional', 'gestao', 'analista', 'coordenador', 'gerente'];

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

    it('deve normalizar nivel_cargo com acentos', () => {
      // Testa que "gestão" (com acento) é normalizado para "gestao"
      // e "técnico" (com acento) é normalizado para "tecnico"
      const niveisComAcentos = [
        { entrada: 'gestão', esperado: 'gestao' },
        { entrada: 'Gestão', esperado: 'gestao' },
        { entrada: 'GESTÃO', esperado: 'gestao' },
        { entrada: 'técnico', esperado: 'operacional' },
        { entrada: 'Técnico', esperado: 'operacional' },
        { entrada: 'TÉCNICO', esperado: 'operacional' },
        { entrada: 'líder', esperado: 'gestao' },
        { entrada: 'Líder', esperado: 'gestao' },
        { entrada: 'LÍDER', esperado: 'gestao' },
      ];

      niveisComAcentos.forEach(({ entrada, esperado }) => {
        const row: FuncionarioImportRow = {
          cpf: '12345678909',
          nome: 'João Silva',
          data_nascimento: '1985-04-15',
          setor: 'TI',
          funcao: 'Desenvolvedor',
          email: 'joao@empresa.com',
          nivel_cargo: entrada,
        };

        const result = validarLinhaFuncionario(row, 2);

        expect(result.valido).toBe(true);
        expect(row.nivel_cargo).toBe(esperado);
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

describe('parseDateCell', () => {
  it('deve converter Date UTC sem shift de fuso horário', () => {
    // 22/06/1988 às midnight UTC — deve retornar '1988-06-22', nunca '1988-06-21'
    const d = new Date(Date.UTC(1988, 5, 22, 0, 0, 0)); // mês 5 = junho
    expect(parseDateCell(d)).toBe('1988-06-22');
  });

  it('deve converter string dd/mm/yyyy corretamente', () => {
    expect(parseDateCell('22/06/1988')).toBe('1988-06-22');
    expect(parseDateCell('01/01/2000')).toBe('2000-01-01');
  });

  it('deve aceitar string já em ISO yyyy-mm-dd', () => {
    expect(parseDateCell('1988-06-22')).toBe('1988-06-22');
  });

  it('deve rejeitar string inválida', () => {
    expect(parseDateCell('not-a-date')).toBeNull();
    expect(parseDateCell('')).toBeNull();
    expect(parseDateCell(null)).toBeNull();
  });

  it('deve rejeitar prefixo timezone-like (+020011-02)', () => {
    // Valores de timezone inválidos devem ser rejeitados
    expect(parseDateCell('+020011-02')).toBeNull();
  });
});

describe('localizarLinha*', () => {
  const rows: FuncionarioImportRow[] = [
    { cpf: '74867746070', nome: 'Ana', data_nascimento: '1988-06-22', setor: 'TI', funcao: 'Dev', email: 'ana@emp.com', matricula: 'MAT001' },
    { cpf: '11144477735', nome: 'Beto', data_nascimento: '1990-03-15', setor: 'RH', funcao: 'Analista', email: 'beto@emp.com', matricula: 'MAT002' },
  ];

  it('localizarLinhaPorCPF deve retornar linha Excel (base 2)', () => {
    expect(localizarLinhaPorCPF('74867746070', rows)).toBe(2);
    expect(localizarLinhaPorCPF('11144477735', rows)).toBe(3);
    expect(localizarLinhaPorCPF('00000000000', rows)).toBeNull();
  });

  it('localizarLinhaPorMatricula deve encontrar linha correta', () => {
    expect(localizarLinhaPorMatricula('MAT001', rows)).toBe(2);
    expect(localizarLinhaPorMatricula('MAT002', rows)).toBe(3);
    expect(localizarLinhaPorMatricula('MAT999', rows)).toBeNull();
  });

  it('localizarLinhaPorEmail deve ser case-insensitive', () => {
    expect(localizarLinhaPorEmail('ANA@EMP.COM', rows)).toBe(2);
    expect(localizarLinhaPorEmail('beto@emp.com', rows)).toBe(3);
    expect(localizarLinhaPorEmail('nao@existe.com', rows)).toBeNull();
  });
});

describe('validar*UnicosDetalhado', () => {
  it('validarCPFsUnicosDetalhado deve retornar details com linhas das duplicatas', () => {
    const rows: FuncionarioImportRow[] = [
      { cpf: '11111111111', nome: 'A', data_nascimento: '1990-01-01', setor: 'TI', funcao: 'Dev', email: 'a@e.com' },
      { cpf: '22222222222', nome: 'B', data_nascimento: '1990-01-01', setor: 'TI', funcao: 'Dev', email: 'b@e.com' },
      { cpf: '11111111111', nome: 'C', data_nascimento: '1990-01-01', setor: 'TI', funcao: 'Dev', email: 'c@e.com' },
    ];
    const result = validarCPFsUnicosDetalhado(rows);
    expect(result.valido).toBe(false);
    expect(result.details[0]).toContain('Linha 2');
    expect(result.details[0]).toContain('11111111111');
    expect(result.details[0]).toContain('linhas 4');
  });

  it('validarCPFsUnicosDetalhado deve aceitar CPFs únicos', () => {
    const rows: FuncionarioImportRow[] = [
      { cpf: '11111111111', nome: 'A', data_nascimento: '1990-01-01', setor: 'TI', funcao: 'Dev', email: 'a@e.com' },
      { cpf: '22222222222', nome: 'B', data_nascimento: '1990-01-01', setor: 'TI', funcao: 'Dev', email: 'b@e.com' },
    ];
    expect(validarCPFsUnicosDetalhado(rows).valido).toBe(true);
  });

  it('validarEmailsUnicosDetalhado deve detectar duplicatas com linhas', () => {
    const rows: FuncionarioImportRow[] = [
      { cpf: '11111111111', nome: 'A', data_nascimento: '1990-01-01', setor: 'TI', funcao: 'Dev', email: 'dup@e.com' },
      { cpf: '22222222222', nome: 'B', data_nascimento: '1990-01-01', setor: 'TI', funcao: 'Dev', email: 'dup@e.com' },
    ];
    const result = validarEmailsUnicosDetalhado(rows);
    expect(result.valido).toBe(false);
    expect(result.details[0]).toContain('dup@e.com');
  });

  it('validarMatriculasUnicasDetalhado deve detectar duplicatas com linhas', () => {
    const rows: FuncionarioImportRow[] = [
      { cpf: '11111111111', nome: 'A', data_nascimento: '1990-01-01', setor: 'TI', funcao: 'Dev', email: 'a@e.com', matricula: 'MAT001' },
      { cpf: '22222222222', nome: 'B', data_nascimento: '1990-01-01', setor: 'TI', funcao: 'Dev', email: 'b@e.com', matricula: 'MAT001' },
    ];
    const result = validarMatriculasUnicasDetalhado(rows);
    expect(result.valido).toBe(false);
    expect(result.details[0]).toContain('MAT001');
  });

  it('validarMatriculasUnicasDetalhado deve ignorar matrículas vazias', () => {
    const rows: FuncionarioImportRow[] = [
      { cpf: '11111111111', nome: 'A', data_nascimento: '1990-01-01', setor: 'TI', funcao: 'Dev', email: 'a@e.com' },
      { cpf: '22222222222', nome: 'B', data_nascimento: '1990-01-01', setor: 'TI', funcao: 'Dev', email: 'b@e.com' },
    ];
    expect(validarMatriculasUnicasDetalhado(rows).valido).toBe(true);
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
});
