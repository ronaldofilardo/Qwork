/**
 * @fileoverview Testes unitários para copsoq-grupos.ts e laudo-calculos-texto.ts
 */

import { gruposCOPSOQ, type GrupoCOPSOQ } from '@/lib/consts/copsoq-grupos';
import {
  determinarAcaoRecomendada,
  gerarObservacoesConclusao,
  gerarInterpretacaoRecomendacoes,
} from '@/lib/laudo-calculos-texto';
import type { ScoreGrupo } from '@/lib/laudo-tipos';

// ── gruposCOPSOQ ────────────────────────────────────────────────────────────

describe('gruposCOPSOQ', () => {
  it('contém exatamente 10 grupos', () => {
    expect(gruposCOPSOQ).toHaveLength(10);
  });

  it('todos os grupos possuem campos obrigatórios', () => {
    gruposCOPSOQ.forEach((g: GrupoCOPSOQ) => {
      expect(g.grupo).toBeGreaterThanOrEqual(1);
      expect(g.grupo).toBeLessThanOrEqual(10);
      expect(g.dominio).toBeTruthy();
      expect(g.descricao).toBeTruthy();
      expect(['positiva', 'negativa']).toContain(g.tipo);
      expect(g.recomendacao).toBeTruthy();
    });
  });

  it('grupos positivos são 2, 3, 5, 6', () => {
    const positivos = gruposCOPSOQ
      .filter((g) => g.tipo === 'positiva')
      .map((g) => g.grupo);
    expect(positivos.sort((a, b) => a - b)).toEqual([2, 3, 5, 6]);
  });

  it('grupos negativos são 1, 4, 7, 8, 9, 10', () => {
    const negativos = gruposCOPSOQ
      .filter((g) => g.tipo === 'negativa')
      .map((g) => g.grupo);
    expect(negativos.sort((a, b) => a - b)).toEqual([1, 4, 7, 8, 9, 10]);
  });
});

// ── determinarAcaoRecomendada ────────────────────────────────────────────────

describe('determinarAcaoRecomendada', () => {
  it('verde → manter', () => {
    expect(determinarAcaoRecomendada('verde')).toContain('Manter');
  });

  it('amarelo → atenção', () => {
    expect(determinarAcaoRecomendada('amarelo')).toContain('Atenção');
  });

  it('vermelho → ação imediata', () => {
    expect(determinarAcaoRecomendada('vermelho')).toContain('Ação imediata');
  });
});

// ── gerarObservacoesConclusao ────────────────────────────────────────────────

describe('gerarObservacoesConclusao', () => {
  it('retorna estrutura com campos obrigatórios', () => {
    const result = gerarObservacoesConclusao();
    expect(result.textoConclusao).toBeTruthy();
    expect(result.observacoesLaudo).toBeTruthy();
    expect(result.dataEmissao).toContain('Curitiba');
    expect(result.assinatura.nome).toBeTruthy();
    expect(result.assinatura.registro).toContain('CRP');
  });

  it('data de emissão contém formato de data', () => {
    const result = gerarObservacoesConclusao();
    expect(result.dataEmissao).toMatch(/Curitiba, \d{2}\/\d{2}\/\d{4}/);
  });
});

// ── gerarInterpretacaoRecomendacoes ──────────────────────────────────────────

describe('gerarInterpretacaoRecomendacoes', () => {
  const scoresBaixo: ScoreGrupo[] = [
    {
      grupo: 'G2',
      dominio: 'Organização',
      score: 80,
      categoriaRisco: 'baixo',
      classificacao: 'verde' as any,
    },
  ];

  const scoresMedio: ScoreGrupo[] = [
    {
      grupo: 'G1',
      dominio: 'Demandas',
      score: 50,
      categoriaRisco: 'medio',
      classificacao: 'amarelo' as any,
    },
  ];

  const scoresAlto: ScoreGrupo[] = [
    {
      grupo: 'G4',
      dominio: 'Interface',
      score: 20,
      categoriaRisco: 'alto',
      classificacao: 'vermelho' as any,
    },
  ];

  it('retorna texto principal com nome da empresa', () => {
    const result = gerarInterpretacaoRecomendacoes(
      'ACME Corp',
      scoresBaixo
    );
    expect(result.textoPrincipal).toContain('ACME Corp');
  });

  it('identifica grupos de baixo risco como excelentes', () => {
    const result = gerarInterpretacaoRecomendacoes(
      'ACME Corp',
      scoresBaixo
    );
    expect(result.gruposExcelente).toHaveLength(1);
    expect(result.textoPrincipal).toContain('Excelente');
  });

  it('identifica grupos de médio risco como atenção', () => {
    const result = gerarInterpretacaoRecomendacoes(
      'ACME Corp',
      scoresMedio
    );
    expect(result.gruposAtencao).toHaveLength(1);
    expect(result.textoPrincipal).toContain('Atenção');
  });

  it('identifica grupos de alto risco', () => {
    const result = gerarInterpretacaoRecomendacoes(
      'ACME Corp',
      scoresAlto
    );
    expect(result.gruposAltoRisco).toHaveLength(1);
    expect(result.textoPrincipal).toContain('alto risco');
  });

  it('retorna conclusão com referência ao COPSOQ III', () => {
    const result = gerarInterpretacaoRecomendacoes(
      'ACME Corp',
      scoresBaixo
    );
    expect(result.conclusao).toContain('COPSOQ III');
  });
});
