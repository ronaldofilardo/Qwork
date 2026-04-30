/**
 * Testes de regressao -- nivel_cargo nao-bloqueante (30/04/2026)
 *
 * Contexto: Anteriormente, nivel_cargo vazio em uma linha da planilha
 * gerava um ERRO bloqueante (severidade: 'erro'), o que descartava a linha
 * inteiramente da importacao. A correcao muda a severidade para 'aviso',
 * permitindo que a linha seja processada e o nivel seja classificado
 * manualmente no Step 4 (NivelCargoStep).
 *
 * Arquivo alterado: lib/importacao/data-validator.ts
 * Componente adicionado: NivelCargoWarningModal (para exibir o aviso antes de avancar)
 */

import { validarDadosImportacao } from '@/lib/importacao/data-validator';
import type { MappedRow } from '@/lib/importacao/dynamic-parser';

jest.mock('@/lib/cpf-utils', () => ({
  validarCPF: jest.fn(() => true),
  limparCPF: jest.fn((v: string) => v?.replace(/\D/g, '') ?? ''),
}));

jest.mock('@/lib/validators', () => ({
  validarCNPJ: jest.fn(() => true),
  normalizeCNPJ: jest.fn((v: string) => v?.replace(/\D/g, '') ?? ''),
}));

jest.mock('@/lib/xlsxParser', () => ({
  parseDateCell: jest.fn((v: string) => (v ? '1990-01-01' : null)),
}));

const rowBase: MappedRow = {
  cpf: '12345678901',
  nome: 'Joao Silva',
  funcao: 'Enfermeiro',
  nome_empresa: 'Clinica A',
  cnpj_empresa: '12345678000191',
  data_nascimento: '01/01/1990',
  nivel_cargo: 'operacional',
};

function makeRow(overrides: Partial<MappedRow> = {}): MappedRow {
  return { ...rowBase, ...overrides };
}

describe('nivel_cargo nao-bloqueante', () => {
  it('nivel_cargo vazio gera aviso (nao erro)', () => {
    const rows = [makeRow({ nivel_cargo: '' })];
    const result = validarDadosImportacao(rows);
    expect(result.erros.filter((e) => e.campo === 'nivel_cargo')).toHaveLength(0);
    expect(result.avisos.filter((a) => a.campo === 'nivel_cargo')).toHaveLength(1);
  });

  it('nivel_cargo ausente (undefined) gera aviso (nao erro)', () => {
    const { nivel_cargo: _omit, ...rowSemNivel } = makeRow() as MappedRow & { nivel_cargo?: string };
    const result = validarDadosImportacao([rowSemNivel as MappedRow]);
    expect(result.erros.filter((e) => e.campo === 'nivel_cargo')).toHaveLength(0);
    expect(result.avisos.filter((a) => a.campo === 'nivel_cargo')).toHaveLength(1);
  });

  it('nivel_cargo vazio nao bloqueia linha -- linha contada como valida', () => {
    const result = validarDadosImportacao([makeRow({ nivel_cargo: '' })]);
    expect(result.resumo.linhasValidas).toBe(1);
    expect(result.resumo.linhasComErros).toBe(0);
  });

  it('aviso de nivel_cargo tem severidade "aviso"', () => {
    const result = validarDadosImportacao([makeRow({ nivel_cargo: '' })]);
    const aviso = result.avisos.find((a) => a.campo === 'nivel_cargo');
    expect(aviso).toBeDefined();
    expect(aviso?.severidade).toBe('aviso');
  });

  it('aviso inclui numero de linha correto', () => {
    const rows = [makeRow(), makeRow({ cpf: '98765432100', nivel_cargo: '' })];
    const result = validarDadosImportacao(rows);
    const aviso = result.avisos.find((a) => a.campo === 'nivel_cargo');
    expect(aviso?.linha).toBe(3);
  });

  it('multiplas linhas sem nivel_cargo geram um aviso por linha', () => {
    const rows = [
      makeRow({ nivel_cargo: '' }),
      makeRow({ cpf: '98765432100', nivel_cargo: '' }),
      makeRow({ cpf: '11122233344', nivel_cargo: '' }),
    ];
    const result = validarDadosImportacao(rows);
    expect(result.avisos.filter((a) => a.campo === 'nivel_cargo')).toHaveLength(3);
  });

  it('nivel_cargo preenchido nao gera aviso de nivel', () => {
    const result = validarDadosImportacao([makeRow({ nivel_cargo: 'operacional' })]);
    expect(result.avisos.filter((a) => a.campo === 'nivel_cargo')).toHaveLength(0);
  });
});

describe('outros erros bloqueantes inalterados', () => {
  it('CPF ausente gera ERRO bloqueante', () => {
    const result = validarDadosImportacao([makeRow({ cpf: '' })]);
    const erros = result.erros.filter((e) => e.campo === 'cpf');
    expect(erros.length).toBeGreaterThan(0);
    expect(erros[0].severidade).toBe('erro');
  });

  it('nome ausente gera ERRO bloqueante', () => {
    const result = validarDadosImportacao([makeRow({ nome: '' })]);
    const erros = result.erros.filter((e) => e.campo === 'nome');
    expect(erros.length).toBeGreaterThan(0);
    expect(erros[0].severidade).toBe('erro');
  });

  it('data_nascimento ausente gera ERRO bloqueante', () => {
    const result = validarDadosImportacao([makeRow({ data_nascimento: '' })]);
    const erros = result.erros.filter((e) => e.campo === 'data_nascimento');
    expect(erros.length).toBeGreaterThan(0);
    expect(erros[0].severidade).toBe('erro');
  });

  it('linha com erro bloqueante e nivel_cargo vazio: invalida + aviso gerado', () => {
    const result = validarDadosImportacao([makeRow({ nome: '', nivel_cargo: '' })]);
    expect(result.resumo.linhasComErros).toBe(1);
    expect(result.resumo.linhasValidas).toBe(0);
    expect(result.erros.filter((e) => e.campo === 'nome').length).toBeGreaterThan(0);
    expect(result.avisos.filter((a) => a.campo === 'nivel_cargo')).toHaveLength(1);
  });
});
