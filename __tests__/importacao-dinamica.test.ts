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

  it('inclui cpf, nome, nome_empresa como obrigatórios', () => {
    const obrigatorios = getCamposObrigatorios();
    expect(obrigatorios).toContain('cpf');
    expect(obrigatorios).toContain('nome');
    expect(obrigatorios).toContain('nome_empresa');
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
      { campoQWork: 'cpf' },
      { campoQWork: 'nome' },
      { campoQWork: 'nome_empresa' },
    ];
    const faltando = verificarCamposObrigatorios(mapeados);
    expect(faltando).toHaveLength(0);
  });

  it('retorna campos faltando quando ausentes', () => {
    const mapeados = [{ campoQWork: 'cpf' }];
    const faltando = verificarCamposObrigatorios(mapeados);
    expect(faltando).toContain('nome');
    expect(faltando).toContain('nome_empresa');
  });
});

// ========================================
// validarDadosImportacao
// ========================================
describe('validarDadosImportacao', () => {
  const validRow: MappedRow = {
    cpf: '529.982.247-25',
    nome: 'João da Silva',
    nome_empresa: 'Empresa Teste LTDA',
  };

  it('valida linhas corretas sem erros', () => {
    const result = validarDadosImportacao([validRow]);
    expect(result.erros).toHaveLength(0);
    expect(result.resumo.linhasValidas).toBe(1);
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

  it('gera erro para nome_empresa vazio', () => {
    const row: MappedRow = { ...validRow, nome_empresa: '' };
    const result = validarDadosImportacao([row]);
    expect(result.erros.some((e) => e.campo === 'nome_empresa')).toBe(true);
  });

  it('gera aviso para CPFs duplicados no arquivo', () => {
    const rows: MappedRow[] = [validRow, { ...validRow }];
    const result = validarDadosImportacao(rows);
    expect(result.avisos.some((a) => a.campo === 'cpf')).toBe(true);
    expect(result.resumo.cpfsDuplicadosNoArquivo).toBeGreaterThan(0);
  });

  it('gera aviso para data_demissao preenchida', () => {
    const row: MappedRow = { ...validRow, data_demissao: '2025-01-15' };
    const result = validarDadosImportacao([row]);
    expect(result.avisos.some((a) => a.campo === 'data_demissao')).toBe(true);
    expect(result.resumo.linhasComDemissao).toBe(1);
  });

  it('conta empresas únicas', () => {
    const rows: MappedRow[] = [
      { cpf: '529.982.247-25', nome: 'A', nome_empresa: 'Empresa A' },
      { cpf: '861.424.960-60', nome: 'B', nome_empresa: 'Empresa B' },
      { cpf: '085.178.940-09', nome: 'C', nome_empresa: 'Empresa A' },
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
});
