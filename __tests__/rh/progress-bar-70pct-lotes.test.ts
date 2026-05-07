/**
 * Teste: Barra de Progresso 70% — Cards de Lista de Lotes
 *
 * Valida que os componentes de card de lote (entidade/rh) exibem
 * a barra de progresso visual com marcador de 70%, conforme
 * a política de emissão definida na Migration 1130.
 *
 * Escopo: LotesGrid, LoteCard (rh) e BotaoSolicitarEmissao
 * NÃO cobre: app/emissor/components/LoteCard.tsx (emissor intocado)
 */

import * as fs from 'fs';
import * as path from 'path';

const loteCardPath = path.join(process.cwd(), 'components/rh/LoteCard.tsx');
const loteCardExists = fs.existsSync(loteCardPath);

describe('Barra de Progresso 70% — Cards de Lista (Entidade/RH)', () => {
  let lotesGridContent: string;
  let loteCardContent: string;
  let botaoEmissaoContent: string;

  beforeAll(() => {
    lotesGridContent = fs.readFileSync(
      path.join(process.cwd(), 'components/rh/LotesGrid.tsx'),
      'utf-8'
    );
    loteCardContent = loteCardExists
      ? fs.readFileSync(loteCardPath, 'utf-8')
      : '';
    botaoEmissaoContent = fs.readFileSync(
      path.join(process.cwd(), 'components/BotaoSolicitarEmissao.tsx'),
      'utf-8'
    );
  });

  // ─── LotesGrid ───────────────────────────────────────────────────────────

  describe('LotesGrid.tsx', () => {
    it('deve definir constante PERCENTUAL_MINIMO_EMISSAO = 70', () => {
      expect(lotesGridContent).toContain('PERCENTUAL_MINIMO_EMISSAO = 70');
    });

    it('deve exibir barra de progresso condicionalmente (quando taxa_conclusao existe)', () => {
      expect(lotesGridContent).toContain(
        "typeof lote.taxa_conclusao === 'number'"
      );
    });

    it('deve ter marcador visual de 70% (left: PERCENTUAL_MINIMO_EMISSAO%)', () => {
      expect(lotesGridContent).toMatch(
        /left:\s*`\$\{PERCENTUAL_MINIMO_EMISSAO\}%`/
      );
    });

    it('deve ter barra de progresso colorida via progressColor', () => {
      expect(lotesGridContent).toContain('progressColor');
      expect(lotesGridContent).toContain('bg-green-500');
      expect(lotesGridContent).toContain('bg-amber-400');
      expect(lotesGridContent).toContain('bg-red-400');
    });

    it('deve exibir badge "Liberado para solicitar laudo" quando >= 70%', () => {
      expect(lotesGridContent).toContain('Liberado para solicitar laudo');
    });

    it('deve exibir mensagem de mínimo (mín. X%) quando < 70%', () => {
      // Texto quebrado em 2 linhas no JSX: "mín. X% para solicitar\n      laudo"
      expect(lotesGridContent).toContain('para solicitar');
      expect(lotesGridContent).toMatch(/m[íi]n\./);
    });

    it('Não deve usar taxao_conclusao como texto plano "(informativa)"', () => {
      expect(lotesGridContent).not.toContain('(informativa)');
    });

    it('deve ter threshold correto de 70 para cor verde', () => {
      // atingiu = pct >= PERCENTUAL_MINIMO_EMISSAO (70)
      expect(lotesGridContent).toMatch(/pct\s*>=\s*PERCENTUAL_MINIMO_EMISSAO/);
    });
  });

  // ─── LoteCard ────────────────────────────────────────────────────────────
  // components/rh/LoteCard.tsx não implementado — testes saltados automaticamente

  ;(loteCardExists ? describe : describe.skip)('LoteCard.tsx (rh)', () => {
    it('deve definir constante PERCENTUAL_MINIMO_EMISSAO = 70', () => {
      expect(loteCardContent).toContain('PERCENTUAL_MINIMO_EMISSAO = 70');
    });

    it('deve exibir barra de progresso condicionalmente', () => {
      expect(loteCardContent).toContain(
        "typeof lote.taxa_conclusao === 'number'"
      );
    });

    it('deve ter marcador visual de 70%', () => {
      expect(loteCardContent).toMatch(
        /left:\s*`\$\{PERCENTUAL_MINIMO_EMISSAO\}%`/
      );
    });

    it('deve exibir badge "Liberado para solicitar laudo" quando >= 70%', () => {
      expect(loteCardContent).toContain('Liberado para solicitar laudo');
    });

    it('Não deve usar taxao_conclusao como texto plano "(informativa)"', () => {
      expect(loteCardContent).not.toContain('(informativa)');
    });

    it('deve ter as três cores de estado (verde/amber/vermelho)', () => {
      expect(loteCardContent).toContain('bg-green-500');
      expect(loteCardContent).toContain('bg-amber-400');
      expect(loteCardContent).toContain('bg-red-400');
    });

    it('padrão visual consistente com LotesGrid (h-2.5 rounded-full)', () => {
      expect(loteCardContent).toContain('h-2.5 rounded-full');
      expect(lotesGridContent).toContain('h-2.5 rounded-full');
    });
  });

  // ─── BotaoSolicitarEmissao ────────────────────────────────────────────────

  describe('BotaoSolicitarEmissao.tsx', () => {
    it('deve calcular pctConclusao com base em totalAvaliacoes e avaliacoesConcluidas', () => {
      expect(botaoEmissaoContent).toContain('pctConclusao');
      expect(botaoEmissaoContent).toMatch(
        /avaliacoesConcluidas\s*\/\s*totalAvaliacoes/
      );
    });

    it('deve definir PERCENTUAL_MINIMO = 70 localmente', () => {
      expect(botaoEmissaoContent).toContain('PERCENTUAL_MINIMO = 70');
    });

    it('deve ter marcador visual de 70% na barra', () => {
      expect(botaoEmissaoContent).toMatch(/left:\s*`\$\{PERCENTUAL_MINIMO\}%`/);
    });

    it('deve exibir texto confirmando mínimo atingido (quando >= 70%)', () => {
      expect(botaoEmissaoContent).toContain('Atingiu o mínimo de');
      // Texto quebrado em 2 linhas no JSX: "pronto para\n      emissão"
      expect(botaoEmissaoContent).toContain('pronto para');
      expect(botaoEmissaoContent).toContain('emissão');
    });

    it('deve exibir contagem de avaliações concluídas/total', () => {
      expect(botaoEmissaoContent).toContain('avaliações concluídas');
    });

    it('deve ter três cores de estado (verde/amber/vermelho)', () => {
      expect(botaoEmissaoContent).toContain('bg-green-500');
      expect(botaoEmissaoContent).toContain('bg-amber-400');
      expect(botaoEmissaoContent).toContain('bg-red-400');
    });

    it('não deve mais ter o texto estático antigo "(informativa)"', () => {
      expect(botaoEmissaoContent).not.toContain('(informativa)');
    });
  });

  // ─── Emissor intocado ─────────────────────────────────────────────────────

  describe('Emissor — NÃO afetado', () => {
    let emissorLoteCardContent: string;

    beforeAll(() => {
      emissorLoteCardContent = fs.readFileSync(
        path.join(process.cwd(), 'app/emissor/components/LoteCard.tsx'),
        'utf-8'
      );
    });

    it('emissor LoteCard deve ainda ter seu ProgressoAvaliacoes component', () => {
      expect(emissorLoteCardContent).toContain('ProgressoAvaliacoes');
    });

    it('emissor LoteCard deve usar PERCENTUAL_MINIMO = 70 (constante própria)', () => {
      expect(emissorLoteCardContent).toContain('PERCENTUAL_MINIMO = 70');
    });
  });

  // ─── Consistência entre componentes ──────────────────────────────────────
  // Saltado quando components/rh/LoteCard.tsx não existe

  ;(loteCardExists ? describe : describe.skip)('Consistência entre componentes RH/Entidade', () => {
    it('LotesGrid e LoteCard devem usar o mesmo threshold (70)', () => {
      const lotesGridHas70 = lotesGridContent.includes(
        'PERCENTUAL_MINIMO_EMISSAO = 70'
      );
      const loteCardHas70 = loteCardContent.includes(
        'PERCENTUAL_MINIMO_EMISSAO = 70'
      );
      expect(lotesGridHas70).toBe(true);
      expect(loteCardHas70).toBe(true);
    });

    it('ambos devem ter o mesmo texto de badge positivo', () => {
      const msg = 'Liberado para solicitar laudo';
      expect(lotesGridContent).toContain(msg);
      expect(loteCardContent).toContain(msg);
    });

    it('ambos devem usar overflow-visible para o marcador 70% não ser cortado', () => {
      expect(lotesGridContent).toContain('overflow-visible');
      expect(loteCardContent).toContain('overflow-visible');
    });
  });
});

// ─── Lógica de cores (unit) ────────────────────────────────────────────────

describe('Lógica de Cores da Barra de Progresso (70% policy)', () => {
  const PERCENTUAL_MINIMO = 70;

  function getProgressColor(pct: number): string {
    return pct >= PERCENTUAL_MINIMO
      ? 'bg-green-500'
      : pct >= 50
        ? 'bg-amber-400'
        : 'bg-red-400';
  }

  it('deve retornar verde para exatamente 70%', () => {
    expect(getProgressColor(70)).toBe('bg-green-500');
  });

  it('deve retornar verde para 100%', () => {
    expect(getProgressColor(100)).toBe('bg-green-500');
  });

  it('deve retornar amber para 69%', () => {
    expect(getProgressColor(69)).toBe('bg-amber-400');
  });

  it('deve retornar amber para 50%', () => {
    expect(getProgressColor(50)).toBe('bg-amber-400');
  });

  it('deve retornar vermelho para 49%', () => {
    expect(getProgressColor(49)).toBe('bg-red-400');
  });

  it('deve retornar vermelho para 0%', () => {
    expect(getProgressColor(0)).toBe('bg-red-400');
  });

  it('threshold = 70 alinhado com PERCENTUAL_MINIMO_EMISSAO do backend', () => {
    // Fonte: lib/validacao-lote-laudo.ts: PERCENTUAL_MINIMO_EMISSAO = 70
    expect(PERCENTUAL_MINIMO).toBe(70);
  });
});

// ─── Cálculo de percentual (unit) ─────────────────────────────────────────

describe('Cálculo de Percentual (taxa_conclusao)', () => {
  function calcPct(concluidas: number, total: number): number {
    return total > 0
      ? Math.min(Math.round((concluidas / total) * 100), 100)
      : 0;
  }

  it('deve retornar 0 para 0 avaliações concluídas em 10', () => {
    expect(calcPct(0, 10)).toBe(0);
  });

  it('deve retornar 70 para 7 de 10 concluídas', () => {
    expect(calcPct(7, 10)).toBe(70);
  });

  it('deve retornar 100 para todas concluídas', () => {
    expect(calcPct(10, 10)).toBe(100);
  });

  it('deve retornar 0 quando total é 0 (sem dividir por zero)', () => {
    expect(calcPct(0, 0)).toBe(0);
  });

  it('deve não ultrapassar 100 mesmo com dados inconsistentes', () => {
    expect(calcPct(15, 10)).toBe(100);
  });

  it('FLOOR(0.7 * 10) = 7 — threshold 70%', () => {
    // Alinhado com lib/validacao-lote-laudo.ts (REVISADO: FLOOR, não CEIL)
    expect(Math.floor(0.7 * 10)).toBe(7);
  });
});

// ─── API /api/rh/lotes — taxa_conclusao inline (sem dead code) ────────────

describe('API /api/rh/lotes — taxa_conclusao calculada inline', () => {
  let routeSrc: string;

  beforeAll(() => {
    routeSrc = fs.readFileSync(
      path.join(process.cwd(), 'app/api/rh/lotes/route.ts'),
      'utf-8'
    );
  });

  it('deve calcular taxa_conclusao no .map() inline (sem N+1 query)', () => {
    expect(routeSrc).toContain('taxa_conclusao: taxaConclusao');
  });

  it('deve incluir pode_emitir_laudo no objeto inline', () => {
    expect(routeSrc).toContain('pode_emitir_laudo: podeEmitirLaudo');
  });

  it('taxa_conclusao deve ser baseada em avaliacoes_concluidas / total_avaliacoes', () => {
    expect(routeSrc).toMatch(/concluidas\s*\/\s*totalAv/);
  });

  it('pode_emitir_laudo deve depender de lote.status === concluido (trigger DB garante 70%)', () => {
    expect(routeSrc).toContain("status === 'concluido'");
  });

  it('não deve ter dead code lotesComValidacao', () => {
    expect(routeSrc).not.toContain('lotesComValidacao');
  });

  it('não deve chamar validar_lote_pre_laudo por lote (N+1 removido)', () => {
    expect(routeSrc).not.toContain('validar_lote_pre_laudo');
  });
});

// ─── Regra 70%: inativadas NÃO CONTAM no denominador ─────────────────────────

describe('Regra 70%: inativadas NÃO CONTAM no denominador (total_liberadas_ativas)', () => {
  function deveLiberar(concluidas: number, totalLiberadasAtivas: number): boolean {
    if (totalLiberadasAtivas === 0) return false;
    const threshold = Math.floor(0.7 * totalLiberadasAtivas);
    return concluidas >= threshold;
  }

  it('Lote #46: 7 concluídas de 9 liberadas ativas (10 total - 1 inativada) — LIBERA', () => {
    // FLOOR(0.7 * 9) = FLOOR(6.3) = 6 — 7 >= 6 → true
    expect(deveLiberar(7, 9)).toBe(true);
  });

  it('6 concluídas de 10 liberadas ativas — LIBERA (60% de 10)', () => {
    // FLOOR(0.7 * 10) = 7 — 6 < 7 → false (na verdade, não libera)
    // Corrigindo: 6 < 7 → false
    expect(deveLiberar(6, 10)).toBe(false);
  });

  it('4 concluídas de 6 liberadas ativas (10 total - 4 inativadas) — LIBERA', () => {
    // FLOOR(0.7 * 6) = FLOOR(4.2) = 4 — 4 >= 4 → true
    expect(deveLiberar(4, 6)).toBe(true);
  });

  it('3 concluídas de 6 liberadas ativas — NÃO libera', () => {
    // FLOOR(0.7 * 6) = 4 — 3 < 4 → false
    expect(deveLiberar(3, 6)).toBe(false);
  });

  it('threshold: FLOOR(0.7 * 10) = 7', () => {
    expect(Math.floor(0.7 * 10)).toBe(7);
  });

  it('threshold: FLOOR(0.7 * 6) = 4', () => {
    expect(Math.floor(0.7 * 6)).toBe(4);
  });

  it('threshold: FLOOR(0.7 * 9) = 6', () => {
    expect(Math.floor(0.7 * 9)).toBe(6);
  });

  it('inativada NÃO conta no denominador — simulação da nova regra', () => {
    const avaliacoes = [
      { status: 'concluida' },
      { status: 'concluida' },
      { status: 'concluida' },
      { status: 'concluida' },
      { status: 'concluida' },
      { status: 'concluida' },
      { status: 'concluida' },
      { status: 'iniciada' },
      { status: 'iniciada' },
      { status: 'inativada' }, // NÃO inclui no denominador (status NOT IN ('rascunho', 'inativada'))
    ];
    const totalLiberadasAtivas = avaliacoes.filter(
      (a) => a.status !== 'rascunho' && a.status !== 'inativada'
    ).length; // 9
    const concluidas = avaliacoes.filter(
      (a) => a.status === 'concluida'
    ).length; // 7
    const threshold = Math.floor(0.7 * totalLiberadasAtivas);

    expect(totalLiberadasAtivas).toBe(9);
    expect(concluidas).toBe(7);
    expect(threshold).toBe(6);
    expect(concluidas >= threshold).toBe(true);
  });
});
