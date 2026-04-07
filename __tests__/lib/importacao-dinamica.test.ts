/**
 * Testes unitários para o módulo de importação dinâmica.
 * Cobre: column-matcher, dynamic-parser, data-validator.
 */

import { normalizarNomeColuna } from '@/lib/importacao/dynamic-parser';
import {
  sugerirMapeamento,
  getCamposQWork,
  getCamposObrigatorios,
  verificarCamposObrigatorios,
} from '@/lib/importacao/column-matcher';
import { validarDadosImportacao } from '@/lib/importacao/data-validator';
import type { DetectedColumn } from '@/lib/importacao/dynamic-parser';
import type { MappedRow } from '@/lib/importacao/dynamic-parser';

// ========================================
// normalizarNomeColuna
// ========================================
describe('normalizarNomeColuna', () => {
  it('converte para minúsculas e remove acentos', () => {
    expect(normalizarNomeColuna('Função')).toBe('funcao');
    expect(normalizarNomeColuna('Data de Admissão')).toBe('data_de_admissao');
  });

  it('substitui espaços e caracteres especiais por underscore', () => {
    expect(normalizarNomeColuna('Nome Completo')).toBe('nome_completo');
    expect(normalizarNomeColuna('CPF-Funcionário')).toBe('cpf_funcionario');
  });

  it('remove underscores duplicados e nas bordas', () => {
    expect(normalizarNomeColuna('__nome__empresa__')).toBe('nome_empresa');
  });

  it('lida com string vazia', () => {
    expect(normalizarNomeColuna('')).toBe('');
  });
});

// ========================================
// getCamposQWork / getCamposObrigatorios
// ========================================
describe('getCamposQWork', () => {
  it('retorna lista com campo, label e obrigatorio', () => {
    const campos = getCamposQWork();
    expect(campos.length).toBeGreaterThan(0);
    for (const c of campos) {
      expect(c).toHaveProperty('campo');
      expect(c).toHaveProperty('label');
      expect(c).toHaveProperty('obrigatorio');
    }
  });

  it('inclui cnpj_empresa, nome, data_nascimento, funcao como obrigatórios', () => {
    const obrigatorios = getCamposObrigatorios();
    expect(obrigatorios).toContain('cnpj_empresa');
    expect(obrigatorios).toContain('nome');
    expect(obrigatorios).toContain('data_nascimento');
    expect(obrigatorios).toContain('funcao');
  });

  it('NÃO inclui nome_empresa como obrigatório (campo auxiliar)', () => {
    const obrigatorios = getCamposObrigatorios();
    expect(obrigatorios).not.toContain('nome_empresa');
  });

  it('NÃO inclui cpf como obrigatório no mapeamento (validado na etapa de dados)', () => {
    const obrigatorios = getCamposObrigatorios();
    expect(obrigatorios).not.toContain('cpf');
  });
});

// ========================================
// sugerirMapeamento
// ========================================
describe('sugerirMapeamento', () => {
  it('mapeia colunas com nomes exatos', () => {
    const colunas: DetectedColumn[] = [
      { indice: 0, nomeOriginal: 'CPF', exemploDados: ['123.456.789-09'] },
      { indice: 1, nomeOriginal: 'Nome', exemploDados: ['João Silva'] },
      { indice: 2, nomeOriginal: 'Empresa', exemploDados: ['ACME Ltda'] },
    ];

    const resultado = sugerirMapeamento(colunas);

    const cpf = resultado.find((r) => r.sugestaoQWork === 'cpf');
    expect(cpf).toBeDefined();
    expect(cpf.confianca).toBeGreaterThanOrEqual(0.7);

    const nome = resultado.find((r) => r.sugestaoQWork === 'nome');
    expect(nome).toBeDefined();

    const empresa = resultado.find((r) => r.sugestaoQWork === 'nome_empresa');
    expect(empresa).toBeDefined();
  });

  it('mapeia colunas com sinônimos parciais', () => {
    const colunas: DetectedColumn[] = [
      { indice: 0, nomeOriginal: 'Razão Social', exemploDados: ['Corp SA'] },
      { indice: 1, nomeOriginal: 'Nome Completo', exemploDados: ['Maria'] },
      { indice: 2, nomeOriginal: 'Nr CPF', exemploDados: ['12345678901'] },
    ];

    const resultado = sugerirMapeamento(colunas);
    expect(resultado.some((r) => r.sugestaoQWork === 'nome_empresa')).toBe(
      true
    );
    expect(resultado.some((r) => r.sugestaoQWork === 'nome')).toBe(true);
    expect(resultado.some((r) => r.sugestaoQWork === 'cpf')).toBe(true);
  });

  it('não mapeia a mesma coluna pra dois campos', () => {
    const colunas: DetectedColumn[] = [
      { indice: 0, nomeOriginal: 'CPF', exemploDados: [] },
      { indice: 1, nomeOriginal: 'Nome', exemploDados: [] },
    ];

    const resultado = sugerirMapeamento(colunas);
    const mapeados = resultado.filter((r) => r.sugestaoQWork !== null);
    const campos = mapeados.map((r) => r.sugestaoQWork);
    expect(new Set(campos).size).toBe(campos.length); // sem duplicados
  });

  it('retorna confianca 0 e sugestaoQWork null para colunas desconhecidas', () => {
    const colunas: DetectedColumn[] = [
      { indice: 0, nomeOriginal: 'xyzabc12345', exemploDados: ['foo'] },
    ];

    const resultado = sugerirMapeamento(colunas);
    expect(resultado[0].sugestaoQWork).toBeNull();
    expect(resultado[0].confianca).toBe(0);
  });
});

// ========================================
// verificarCamposObrigatorios
// ========================================
describe('verificarCamposObrigatorios', () => {
  it('retorna array vazio quando todos obrigatórios presentes', () => {
    const mapeados = [
      { campoQWork: 'cnpj_empresa' },
      { campoQWork: 'nome' },
      { campoQWork: 'data_nascimento' },
      { campoQWork: 'funcao' },
    ];
    const faltando = verificarCamposObrigatorios(mapeados);
    expect(faltando).toHaveLength(0);
  });

  it('retorna campos faltando quando ausentes', () => {
    const mapeados = [{ campoQWork: 'nome' }];
    const faltando = verificarCamposObrigatorios(mapeados);
    expect(faltando).toContain('cnpj_empresa');
    expect(faltando).toContain('data_nascimento');
    expect(faltando).toContain('funcao');
  });

  it('nome_empresa mapeado não é considerado obrigatório', () => {
    const mapeados = [
      { campoQWork: 'cnpj_empresa' },
      { campoQWork: 'nome' },
      { campoQWork: 'data_nascimento' },
      { campoQWork: 'funcao' },
      { campoQWork: 'nome_empresa' }, // extra — não obrigatório
    ];
    const faltando = verificarCamposObrigatorios(mapeados);
    expect(faltando).toHaveLength(0);
  });
});

// ========================================
// validarDadosImportacao
// ========================================
describe('validarDadosImportacao', () => {
  // validRow agora inclui todos os campos obrigatórios
  const validRow: MappedRow = {
    cpf: '529.982.247-25',
    nome: 'João da Silva',
    cnpj_empresa: '11222333000181',
    data_nascimento: '1990-05-15',
    funcao: 'Analista',
  };

  it('valida linhas corretas sem erros', () => {
    const result = validarDadosImportacao([validRow]);
    expect(result.erros).toHaveLength(0);
    expect(result.resumo.linhasValidas).toBe(1);
  });

  it('nome_empresa opcional — não gera erro quando ausente', () => {
    const row: MappedRow = { ...validRow };
    delete (row as Record<string, string>).nome_empresa;
    const result = validarDadosImportacao([row]);
    expect(result.erros.filter((e) => e.campo === 'nome_empresa')).toHaveLength(0);
  });

  it('gera erro para CPF vazio', () => {
    const row: MappedRow = { ...validRow, cpf: '' };
    const result = validarDadosImportacao([row]);
    expect(result.erros.length).toBeGreaterThan(0);
    expect(result.erros[0].campo).toBe('cpf');
  });

  it('gera erro para CPF inválido', () => {
    const row: MappedRow = { ...validRow, cpf: '111.111.111-11' };
    const result = validarDadosImportacao([row]);
    expect(result.erros.length).toBeGreaterThan(0);
    expect(result.erros.some((e) => e.campo === 'cpf')).toBe(true);
  });

  it('gera erro para nome vazio', () => {
    const row: MappedRow = { ...validRow, nome: '' };
    const result = validarDadosImportacao([row]);
    expect(result.erros.some((e) => e.campo === 'nome')).toBe(true);
  });

  it('gera erro para cnpj_empresa ausente', () => {
    const row: MappedRow = { ...validRow, cnpj_empresa: '' };
    const result = validarDadosImportacao([row]);
    expect(result.erros.some((e) => e.campo === 'cnpj_empresa')).toBe(true);
  });

  it('gera erro para cnpj_empresa inválido', () => {
    const row: MappedRow = { ...validRow, cnpj_empresa: '12345678000100' };
    const result = validarDadosImportacao([row]);
    expect(result.erros.some((e) => e.campo === 'cnpj_empresa')).toBe(true);
  });

  it('gera erro para data_nascimento ausente', () => {
    const row: MappedRow = { ...validRow, data_nascimento: '' };
    const result = validarDadosImportacao([row]);
    expect(result.erros.some((e) => e.campo === 'data_nascimento')).toBe(true);
  });

  it('gera erro para funcao ausente', () => {
    const row: MappedRow = { ...validRow, funcao: '' };
    const result = validarDadosImportacao([row]);
    expect(result.erros.some((e) => e.campo === 'funcao')).toBe(true);
  });

  it('gera aviso para CPFs duplicados no arquivo', () => {
    const rows: MappedRow[] = [validRow, { ...validRow }];
    const result = validarDadosImportacao(rows);
    expect(result.avisos.some((a) => a.campo === 'cpf')).toBe(true);
    expect(result.resumo.cpfsDuplicadosNoArquivo).toBeGreaterThan(0);
  });

  it('gera aviso quando CPF original tinha 10 dígitos (corrigido automaticamente)', () => {
    // Simula o que o parser faz: CPF '2998224725' (10 dígitos) → '02998224725' (11 dígitos)
    // Para o teste de validador, usamos um CPF válido com a flag __cpf_corrigido setada
    // 529.982.247-25 = '52998224725' é um CPF válido conhecido
    const row: MappedRow = { ...validRow, cpf: '52998224725', __cpf_corrigido: '1' };
    const result = validarDadosImportacao([row]);
    expect(result.avisos.some((a) => a.campo === 'cpf' && a.mensagem.includes('10 dígitos'))).toBe(true);
    // Não deve gerar erro — o CPF foi corrigido
    expect(result.erros.filter((e) => e.campo === 'cpf')).toHaveLength(0);
  });

  it('gera aviso para data_demissao preenchida', () => {
    const row: MappedRow = { ...validRow, data_demissao: '2025-01-15' };
    const result = validarDadosImportacao([row]);
    expect(result.avisos.some((a) => a.campo === 'data_demissao')).toBe(true);
    expect(result.resumo.linhasComDemissao).toBe(1);
  });

  it('conta empresas únicas por CNPJ', () => {
    const rows: MappedRow[] = [
      { cpf: '529.982.247-25', nome: 'A', cnpj_empresa: '11222333000181', data_nascimento: '1990-01-01', funcao: 'Analista' },
      { cpf: '861.424.960-60', nome: 'B', cnpj_empresa: '11444777000161', data_nascimento: '1985-03-10', funcao: 'Gerente' },
      { cpf: '085.178.940-09', nome: 'C', cnpj_empresa: '11222333000181', data_nascimento: '1992-07-22', funcao: 'Analista' },
    ];
    const result = validarDadosImportacao(rows);
    expect(result.resumo.empresasUnicas).toBe(2);
  });

  it('gera erro para data_demissao antes de data_admissao', () => {
    const row: MappedRow = {
      ...validRow,
      data_admissao: '2025-06-01',
      data_demissao: '2025-01-01',
    };
    const result = validarDadosImportacao([row]);
    expect(result.erros.some((e) => e.campo === 'data_demissao')).toBe(true);
  });

  it('não gera erro para usuario_tipo não preenchido (será calculado automaticamente)', () => {
    // usuario_tipo é calculado automaticamente na rota baseado em empresa_id e clinica_id
    // não precisa estar presente no arquivo Excel
    const row: MappedRow = {
      cpf: '529.982.247-25',
      nome: 'João da Silva',
      cnpj_empresa: '11222333000181',
      data_nascimento: '1990-05-15',
      funcao: 'Analista',
    };
    const result = validarDadosImportacao([row]);
    // Não deve gerar erro por usuario_tipo faltante
    expect(result.erros.filter((e) => e.campo === 'usuario_tipo')).toHaveLength(
      0
    );
  });

  it('aceita usuario_tipo no arquivo (será sobrescrito pela rota)', () => {
    // Se usuario_tipo vier no arquivo, será ignorado
    const row: MappedRow = {
      cpf: '529.982.247-25',
      nome: 'João da Silva',
      cnpj_empresa: '11222333000181',
      data_nascimento: '1990-05-15',
      funcao: 'Analista',
      usuario_tipo: 'funcionario_clinica',
    };
    const result = validarDadosImportacao([row]);
    expect(result.erros.filter((e) => e.campo === 'usuario_tipo')).toHaveLength(
      0
    );
  });
});
