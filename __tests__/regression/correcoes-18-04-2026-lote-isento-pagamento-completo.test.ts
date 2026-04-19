/**
 * Regressão 18/04/2026
 *
 * Garante que rotas de liberação de lote para tomadores isentos
 * preencham todos os campos exigidos pela constraint
 * pagamento_completo_check quando registram o lote como pago.
 */

import { describe, it, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = process.cwd();

function read(relPath: string) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf-8');
}

describe('Regressão — lote isento deve preencher pagamento completo', () => {
  it('rota da entidade preenche metodo, parcelas e pago_em ao marcar lote como pago', () => {
    const src = read('app/api/entidade/liberar-lote/route.ts');

    expect(src).toContain("status_pagamento = 'pago'");
    expect(src).toContain('pagamento_metodo');
    expect(src).toContain('pagamento_parcelas');
    expect(src).toContain('pago_em = NOW()');
  });

  it('rota RH individual preenche metodo, parcelas e pago_em ao marcar lote como pago', () => {
    const src = read('app/api/rh/liberar-lote/route.ts');

    expect(src).toContain("status_pagamento = 'pago'");
    expect(src).toContain('pagamento_metodo');
    expect(src).toContain('pagamento_parcelas');
    expect(src).toContain('pago_em = NOW()');
  });

  it('rota RH bulk preenche metodo, parcelas e pago_em ao marcar lote como pago', () => {
    const src = read('app/api/rh/empresas-bulk/liberar-ciclos/route.ts');

    expect(src).toContain("status_pagamento = 'pago'");
    expect(src).toContain('pagamento_metodo');
    expect(src).toContain('pagamento_parcelas');
    expect(src).toContain('pago_em = NOW()');
  });

  it('emissão de laudo considera isenção do tomador ao validar pagamento', () => {
    const src = read('app/api/emissor/laudos/[loteId]/route.ts');

    expect(src).toContain('isento_pagamento');
    expect(src).toContain('const isentoTomador = lote.isento_pagamento === true');
    expect(src).toContain('!isentoTomador');
  });
});
