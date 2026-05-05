/**
 * @file __tests__/entidade/entidade-lotes-laudo-filter.unit.test.ts
 *
 * Testa a lógica de filtro da página /entidade/lotes que determina quais lotes
 * devem ter laudo exibido no LotesGrid.
 *
 * Fix aplicado: aceitar laudo_status='emitido' ou 'enviado' mesmo sem
 * arquivo_remoto_url (upload-assinado ZapSign preenche key mas não url).
 */

import fs from 'fs';
import path from 'path';

describe('entidade/lotes/page.tsx — filtro de laudos emitidos', () => {
  let pageCode: string;

  beforeAll(() => {
    pageCode = fs.readFileSync(
      path.join(process.cwd(), 'app/entidade/lotes/page.tsx'),
      'utf-8'
    );
  });

  it('deve aceitar laudos com laudo_arquivo_remoto_url preenchida', () => {
    expect(pageCode).toContain('lote.laudo_arquivo_remoto_url');
  });

  it('deve aceitar laudos com laudo_status = emitido mesmo sem arquivo_remoto_url', () => {
    expect(pageCode).toContain("lote.laudo_status === 'emitido'");
  });

  it('deve aceitar laudos com laudo_status = enviado mesmo sem arquivo_remoto_url', () => {
    expect(pageCode).toContain("lote.laudo_status === 'enviado'");
  });

  it('não deve mais exigir exclusivamente arquivo_remoto_url para incluir laudo', () => {
    // O filtro antigo era: lote.laudo_id && lote.laudo_arquivo_remoto_url
    // O novo filtro usa OR, permitindo laudo_status='emitido' ou 'enviado'
    const oldExclusiveFilter =
      /laudo_id\s*&&\s*lote\.laudo_arquivo_remoto_url\s*\n\s*\)/.test(pageCode);
    expect(oldExclusiveFilter).toBe(false);
  });

  it('deve combinar os três critérios com OR', () => {
    // Verifica que o filtro usa OR entre as condições
    expect(pageCode).toContain('lote.laudo_arquivo_remoto_url ||');
  });
});

// ---- Simulação da lógica de filtro em memória ----

type MockLote = {
  laudo_id: number | null;
  laudo_arquivo_remoto_url: string | null;
  laudo_status: string | null;
};

function applyLaudoFilter(lotes: MockLote[]): MockLote[] {
  return lotes.filter(
    (lote) =>
      lote.laudo_id &&
      (lote.laudo_arquivo_remoto_url ||
        lote.laudo_status === 'emitido' ||
        lote.laudo_status === 'enviado')
  );
}

describe('Lógica de filtro de laudos — simulação em memória', () => {
  it('inclui laudo com arquivo_remoto_url preenchida', () => {
    const result = applyLaudoFilter([
      { laudo_id: 1, laudo_arquivo_remoto_url: 'laudos/1.pdf', laudo_status: 'emitido' },
    ]);
    expect(result).toHaveLength(1);
  });

  it('inclui laudo com status=emitido mesmo sem arquivo_remoto_url (fluxo ZapSign)', () => {
    const result = applyLaudoFilter([
      { laudo_id: 1, laudo_arquivo_remoto_url: null, laudo_status: 'emitido' },
    ]);
    expect(result).toHaveLength(1);
  });

  it('inclui laudo com status=enviado mesmo sem arquivo_remoto_url', () => {
    const result = applyLaudoFilter([
      { laudo_id: 1, laudo_arquivo_remoto_url: null, laudo_status: 'enviado' },
    ]);
    expect(result).toHaveLength(1);
  });

  it('exclui laudo sem laudo_id', () => {
    const result = applyLaudoFilter([
      { laudo_id: null, laudo_arquivo_remoto_url: 'laudos/1.pdf', laudo_status: 'emitido' },
    ]);
    expect(result).toHaveLength(0);
  });

  it('exclui laudo sem url e com status aguardando_assinatura', () => {
    const result = applyLaudoFilter([
      { laudo_id: 1, laudo_arquivo_remoto_url: null, laudo_status: 'aguardando_assinatura' },
    ]);
    expect(result).toHaveLength(0);
  });

  it('exclui laudo sem url e com status rascunho', () => {
    const result = applyLaudoFilter([
      { laudo_id: 1, laudo_arquivo_remoto_url: null, laudo_status: 'rascunho' },
    ]);
    expect(result).toHaveLength(0);
  });
});

// ---- Simulação da lógica de filtro de abas do emissor ----

type MockLaudo = {
  _emitido?: boolean;
  _aguardandoAssinatura?: boolean;
  enviado_em?: string | null;
  status?: string;
};

type MockEmissorLote = { id: number; laudo: MockLaudo | null };

function filterByTab(lotes: MockEmissorLote[], tab: string): MockEmissorLote[] {
  return lotes.filter((lote) => {
    switch (tab) {
      case 'laudo-para-emitir':
        return !lote.laudo || (!lote.laudo._emitido && !lote.laudo._aguardandoAssinatura);
      case 'laudo-emitido':
        return (
          (lote.laudo?._emitido === true || lote.laudo?._aguardandoAssinatura === true) &&
          !lote.laudo?.enviado_em
        );
      case 'laudos-enviados':
        return !!(lote.laudo?.enviado_em || lote.laudo?.status === 'enviado');
      default:
        return true;
    }
  });
}

describe('Lógica de filtro de abas do emissor — sem mistura', () => {
  const loteZapSign: MockEmissorLote = {
    id: 8,
    laudo: { status: 'aguardando_assinatura', _emitido: false, _aguardandoAssinatura: true },
  };
  const loteEmitido: MockEmissorLote = {
    id: 2,
    laudo: { status: 'emitido', _emitido: true, _aguardandoAssinatura: false, enviado_em: null },
  };
  const loteSemLaudo: MockEmissorLote = { id: 3, laudo: null };
  const loteEnviado: MockEmissorLote = {
    id: 4,
    laudo: { status: 'enviado', _emitido: true, enviado_em: '2026-05-01T10:00:00Z' },
  };

  it('laudo-para-emitir: inclui lote sem laudo', () => {
    expect(filterByTab([loteSemLaudo], 'laudo-para-emitir')).toHaveLength(1);
  });

  it('laudo-para-emitir: EXCLUI lote ZapSign (aguardando_assinatura)', () => {
    expect(filterByTab([loteZapSign], 'laudo-para-emitir')).toHaveLength(0);
  });

  it('laudo-para-emitir: EXCLUI lote com _emitido=true', () => {
    expect(filterByTab([loteEmitido], 'laudo-para-emitir')).toHaveLength(0);
  });

  it('laudo-emitido: inclui lote ZapSign (aguardando_assinatura)', () => {
    expect(filterByTab([loteZapSign], 'laudo-emitido')).toHaveLength(1);
  });

  it('laudo-emitido: inclui lote emitido sem enviado_em', () => {
    expect(filterByTab([loteEmitido], 'laudo-emitido')).toHaveLength(1);
  });

  it('laudo-emitido: EXCLUI lote já enviado', () => {
    expect(filterByTab([loteEnviado], 'laudo-emitido')).toHaveLength(0);
  });

  it('lote ZapSign aparece em exatamente UMA aba', () => {
    const todos = [loteZapSign, loteEmitido, loteSemLaudo, loteEnviado];
    const paraEmitir = filterByTab(todos, 'laudo-para-emitir');
    const laudoEmitido = filterByTab(todos, 'laudo-emitido');
    const enviados = filterByTab(todos, 'laudos-enviados');

    const loteZapInParaEmitir = paraEmitir.some((l) => l.id === loteZapSign.id);
    const loteZapInEmitido = laudoEmitido.some((l) => l.id === loteZapSign.id);
    const loteZapInEnviados = enviados.some((l) => l.id === loteZapSign.id);

    // Aparece em exatamente uma aba
    const count = [loteZapInParaEmitir, loteZapInEmitido, loteZapInEnviados].filter(Boolean).length;
    expect(count).toBe(1);
    expect(loteZapInEmitido).toBe(true);
  });
});
