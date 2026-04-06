/**
 * Testes unitários para as funções utilitárias de TemplateManager.
 * Cobre: loadTemplates, saveTemplate, deleteTemplate, updateTemplateNivelCargo.
 *
 * Nota: Testa apenas as funções puras exportadas do módulo — não os componentes React.
 */

import {
  loadTemplates,
  saveTemplate,
  deleteTemplate,
  updateTemplateNivelCargo,
  type ImportTemplate,
} from '@/components/importacao/TemplateManager';

const STORAGE_KEY = 'qwork-importacao-templates';

function makeTemplate(
  id: string,
  nome: string,
  nivelCargoMap?: Record<string, string>
): ImportTemplate {
  return {
    id,
    nome,
    criadoEm: '01/01/2026',
    mapeamentos: [
      { nomeOriginal: 'CPF', campoQWork: 'cpf' },
      { nomeOriginal: 'Nome', campoQWork: 'nome' },
    ],
    nivelCargoMap,
  };
}

beforeEach(() => {
  localStorage.clear();
});

// ========================================
// loadTemplates
// ========================================
describe('loadTemplates', () => {
  it('retorna array vazio quando storage está vazio', () => {
    expect(loadTemplates()).toEqual([]);
  });

  it('retorna templates salvos corretamente', () => {
    const t = makeTemplate('1', 'Teste');
    localStorage.setItem(STORAGE_KEY, JSON.stringify([t]));
    const result = loadTemplates();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
    expect(result[0].nome).toBe('Teste');
  });

  it('retorna array vazio para JSON inválido no storage', () => {
    localStorage.setItem(STORAGE_KEY, 'INVALID_JSON{{{');
    expect(loadTemplates()).toEqual([]);
  });
});

// ========================================
// saveTemplate
// ========================================
describe('saveTemplate', () => {
  it('salva um novo template', () => {
    const t = makeTemplate('abc', 'Meu Template');
    saveTemplate(t);
    const all = loadTemplates();
    expect(all).toHaveLength(1);
    expect(all[0].nome).toBe('Meu Template');
  });

  it('coloca o template mais recente no início do array', () => {
    saveTemplate(makeTemplate('1', 'Primeiro'));
    saveTemplate(makeTemplate('2', 'Segundo'));
    const all = loadTemplates();
    expect(all[0].id).toBe('2');
    expect(all[1].id).toBe('1');
  });

  it('substitui template existente com mesmo id', () => {
    saveTemplate(makeTemplate('dup', 'Original'));
    saveTemplate(makeTemplate('dup', 'Atualizado'));
    const all = loadTemplates();
    expect(all).toHaveLength(1);
    expect(all[0].nome).toBe('Atualizado');
  });
});

// ========================================
// deleteTemplate
// ========================================
describe('deleteTemplate', () => {
  it('remove template pelo id', () => {
    saveTemplate(makeTemplate('1', 'A'));
    saveTemplate(makeTemplate('2', 'B'));
    deleteTemplate('1');
    const all = loadTemplates();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('2');
  });

  it('não gera erro ao deletar id inexistente', () => {
    saveTemplate(makeTemplate('1', 'A'));
    expect(() => deleteTemplate('nao-existe')).not.toThrow();
    expect(loadTemplates()).toHaveLength(1);
  });

  it('resulta em array vazio ao deletar único template', () => {
    saveTemplate(makeTemplate('x', 'Solo'));
    deleteTemplate('x');
    expect(loadTemplates()).toHaveLength(0);
  });
});

// ========================================
// updateTemplateNivelCargo
// ========================================
describe('updateTemplateNivelCargo', () => {
  it('adiciona nivelCargoMap em template sem mapa existente', () => {
    saveTemplate(makeTemplate('t1', 'Sem Cargo'));
    updateTemplateNivelCargo('t1', {
      Médico: 'especialista',
      Enfermeiro: 'tecnico',
    });
    const all = loadTemplates();
    expect(all[0].nivelCargoMap).toEqual({
      Médico: 'especialista',
      Enfermeiro: 'tecnico',
    });
  });

  it('mescla novas funções com mapa existente', () => {
    saveTemplate(
      makeTemplate('t2', 'Com Cargo Parcial', { Médico: 'especialista' })
    );
    updateTemplateNivelCargo('t2', { Enfermeiro: 'tecnico' });
    const all = loadTemplates();
    expect(all[0].nivelCargoMap).toEqual({
      Médico: 'especialista',
      Enfermeiro: 'tecnico',
    });
  });

  it('sobrescreve classificação existente ao passar novo valor', () => {
    saveTemplate(makeTemplate('t3', 'Reclassificar', { Médico: 'tecnico' }));
    updateTemplateNivelCargo('t3', { Médico: 'especialista' });
    const all = loadTemplates();
    expect(all[0].nivelCargoMap?.Médico).toBe('especialista');
  });

  it('não afeta outros templates ao atualizar um', () => {
    saveTemplate(makeTemplate('ta', 'A', { Cargo1: 'nivel1' }));
    saveTemplate(makeTemplate('tb', 'B', { Cargo2: 'nivel2' }));
    updateTemplateNivelCargo('ta', { Cargo3: 'nivel3' });
    const all = loadTemplates();
    const ta = all.find((t) => t.id === 'ta');
    const tb = all.find((t) => t.id === 'tb');
    expect(ta.nivelCargoMap).toEqual({ Cargo1: 'nivel1', Cargo3: 'nivel3' });
    expect(tb.nivelCargoMap).toEqual({ Cargo2: 'nivel2' });
  });

  it('não lança erro ao atualizar id inexistente', () => {
    expect(() =>
      updateTemplateNivelCargo('nao-existe', { X: 'y' })
    ).not.toThrow();
  });
});
