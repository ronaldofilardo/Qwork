/**
 * fluxo-dados-bancarios-representante.test.ts
 *
 * Testes para a implementação do fluxo completo de dados bancários:
 * 1. Migration 521 — novos campos na tabela representantes
 * 2. API PATCH /api/representante/dados-bancarios — validações e estrutura
 * 3. API POST /api/admin/representantes/[id]/solicitar-dados-bancarios — estrutura
 * 4. Webhook pós-status 'apto' — update de dados_bancarios_status
 * 5. GET /api/representante/me — campos bancários incluídos
 * 6. GET /api/admin/representantes — campos bancários incluídos
 * 7. Layout portal — botão Voltar, tab Dados, badge, sem logo
 * 8. Página /dados — guard desativado, seções, edit inline
 * 9. app/admin/representantes/page.tsx — botão solicitar, display status
 * 10. rep-context — novos campos de interface
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');

/* ================================================================== */
/* 1. Migration 521                                                    */
/* ================================================================== */

describe('1. Migration 521 — dados_bancarios_status', () => {
  const sqlPath = path.join(
    ROOT,
    'database',
    'migrations',
    '521_dados_bancarios_status.sql'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(sqlPath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(sqlPath)).toBe(true);
  });

  it('deve adicionar coluna dados_bancarios_status com CHECK constraint', () => {
    expect(src).toMatch(/dados_bancarios_status/i);
    expect(src).toMatch(/nao_informado/i);
    expect(src).toMatch(/pendente_confirmacao/i);
    expect(src).toMatch(/confirmado/i);
    expect(src).toMatch(/rejeitado/i);
  });

  it('deve adicionar dados_bancarios_solicitado_em', () => {
    expect(src).toMatch(/dados_bancarios_solicitado_em/i);
    expect(src).toMatch(/TIMESTAMPTZ/i);
  });

  it('deve adicionar dados_bancarios_confirmado_em', () => {
    expect(src).toMatch(/dados_bancarios_confirmado_em/i);
    expect(src).toMatch(/TIMESTAMPTZ/i);
  });

  it('deve criar índice em dados_bancarios_status', () => {
    expect(src).toMatch(/CREATE INDEX IF NOT EXISTS/i);
    expect(src).toMatch(/dados_bancarios_status/i);
  });

  it('deve estar em transação (BEGIN/COMMIT)', () => {
    expect(src).toMatch(/^BEGIN/m);
    expect(src).toMatch(/^COMMIT/m);
  });

  it('deve usar ADD COLUMN IF NOT EXISTS (idempotente)', () => {
    expect(src).toMatch(/ADD COLUMN IF NOT EXISTS/i);
  });
});

/* ================================================================== */
/* 2. API PATCH /api/representante/dados-bancarios                    */
/* ================================================================== */

describe('2. PATCH /api/representante/dados-bancarios — estrutura', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'representante',
    'dados-bancarios',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('deve exportar função PATCH', () => {
    expect(src).toMatch(/export async function PATCH/);
  });

  it('deve usar requireRepresentante para autenticação', () => {
    expect(src).toMatch(/requireRepresentante/);
  });

  it('deve rejeitar campos imutáveis (cpf, cnpj, tipo_pessoa)', () => {
    expect(src).toMatch(/CAMPOS_IMUTAVEIS/);
    expect(src).toMatch(/'cpf'/);
    expect(src).toMatch(/'cnpj'/);
    expect(src).toMatch(/'tipo_pessoa'/);
  });

  it('deve usar schema Zod com .strict()', () => {
    expect(src).toMatch(/\.strict\(\)/);
  });

  it('deve marcar confirmação ao salvar campo bancário', () => {
    expect(src).toMatch(/dados_bancarios_status.*confirmado/i);
    expect(src).toMatch(/dados_bancarios_confirmado_em.*NOW/i);
  });

  it('deve retornar 400 para campo imutável', () => {
    expect(src).toMatch(/status: 400/);
    expect(src).toMatch(/não pode ser alterado/i);
  });

  it('deve bloquear rep desativado (403)', () => {
    expect(src).toMatch(/desativado/);
    expect(src).toMatch(/status: 403/);
  });

  it('deve ter export const dynamic = force-dynamic', () => {
    expect(src).toMatch(/export const dynamic = 'force-dynamic'/);
  });
});

/* ================================================================== */
/* 3. API POST solicitar-dados-bancarios                              */
/* ================================================================== */

describe('3. POST /api/admin/representantes/[id]/solicitar-dados-bancarios', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'admin',
    'representantes',
    '[id]',
    'solicitar-dados-bancarios',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('deve exportar função POST', () => {
    expect(src).toMatch(/export async function POST/);
  });

  it('deve usar requireRole(admin)', () => {
    expect(src).toMatch(/requireRole.*admin/);
  });

  it('deve verificar pré-condição: status apto', () => {
    expect(src).toMatch(/status.*apto/i);
    expect(src).toMatch(/status: 422/);
  });

  it('deve rejeitar se dados já confirmados (409)', () => {
    expect(src).toMatch(/confirmado/);
    expect(src).toMatch(/status: 409/);
  });

  it('deve atualizar dados_bancarios_status para pendente_confirmacao', () => {
    expect(src).toMatch(/pendente_confirmacao/);
    expect(src).toMatch(/dados_bancarios_solicitado_em.*NOW/i);
  });

  it('deve retornar success + solicitado_em', () => {
    expect(src).toMatch(/success.*true/);
    expect(src).toMatch(/solicitado_em/);
  });
});

/* ================================================================== */
/* 4. Webhook em PATCH status — virar apto                           */
/* ================================================================== */

describe('4. Webhook pós-status "apto" em /api/admin/representantes/[id]/status', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'admin',
    'representantes',
    '[id]',
    'status',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('deve marcar dados_bancarios_status = pendente_confirmacao quando status vira apto', () => {
    expect(src).toMatch(/novo_status.*apto/);
    expect(src).toMatch(/dados_bancarios_status.*nao_informado/i);
    expect(src).toMatch(/pendente_confirmacao/);
    expect(src).toMatch(/dados_bancarios_solicitado_em.*NOW/i);
  });
});

/* ================================================================== */
/* 5. GET /api/representante/me — campos bancários                   */
/* ================================================================== */

describe('5. GET /api/representante/me — inclui campos bancários', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'representante',
    'me',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('deve incluir banco_codigo no SELECT', () => {
    expect(src).toMatch(/banco_codigo/);
  });

  it('deve incluir pix_chave e pix_tipo no SELECT', () => {
    expect(src).toMatch(/pix_chave/);
    expect(src).toMatch(/pix_tipo/);
  });

  it('deve incluir dados_bancarios_status no SELECT', () => {
    expect(src).toMatch(/dados_bancarios_status/);
  });

  it('deve incluir dados_bancarios_solicitado_em e confirmado_em', () => {
    expect(src).toMatch(/dados_bancarios_solicitado_em/);
    expect(src).toMatch(/dados_bancarios_confirmado_em/);
  });

  it('deve incluir cpf e cnpj no SELECT', () => {
    expect(src).toMatch(/cpf/);
    expect(src).toMatch(/cnpj/);
  });
});

/* ================================================================== */
/* 6. GET /api/admin/representantes — campos bancários               */
/* ================================================================== */

describe('6. GET /api/admin/representantes — inclui campos bancários novos', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'admin',
    'representantes',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('deve incluir dados_bancarios_status no SELECT', () => {
    expect(src).toMatch(/dados_bancarios_status/);
  });

  it('deve incluir dados_bancarios_solicitado_em no SELECT', () => {
    expect(src).toMatch(/dados_bancarios_solicitado_em/);
  });

  it('deve incluir dados_bancarios_confirmado_em no SELECT', () => {
    expect(src).toMatch(/dados_bancarios_confirmado_em/);
  });

  it('deve incluir tipo_conta no SELECT', () => {
    expect(src).toMatch(/r\.tipo_conta/);
  });
});

/* ================================================================== */
/* 7. Layout Portal — Voltar, Dados, badge, sem logo               */
/* ================================================================== */

describe('7. Layout portal — novas funcionalidades', () => {
  const layoutPath = path.join(
    ROOT,
    'app',
    'representante',
    '(portal)',
    'layout.tsx'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(layoutPath, 'utf-8');
  });

  it('deve ter botão Voltar', () => {
    expect(src).toMatch(/Voltar/);
    expect(src).toMatch(/handleVoltar/);
  });

  it('deve usar router.back()', () => {
    expect(src).toMatch(/router\.back\(\)/);
  });

  it('deve ter tab Dados como primeira na lista', () => {
    const posicaoDados = src.indexOf("label: 'Dados'");
    const posicaoDashboard = src.indexOf("label: 'Dashboard'");
    expect(posicaoDados).toBeGreaterThan(-1);
    expect(posicaoDashboard).toBeGreaterThan(-1);
    expect(posicaoDados).toBeLessThan(posicaoDashboard);
  });

  it('deve exibir badge quando dados_bancarios_status !== confirmado', () => {
    expect(src).toMatch(/mostrarBadgeDados/);
    // o status é lido de session?.dados_bancarios_status e comparado com 'confirmado'
    expect(src).toMatch(/session\?\.dados_bancarios_status/);
    expect(src).toMatch(/'confirmado'/);
  });

  it('NÃO deve conter import de Image (logo removido)', () => {
    expect(src).not.toMatch(/import Image from 'next\/image'/);
  });

  it('NÃO deve conter QWORK_BRANDING (logo removido)', () => {
    expect(src).not.toMatch(/QWORK_BRANDING/);
  });

  it('NÃO deve conter texto "QWork Representante" (removido)', () => {
    expect(src).not.toMatch(/QWork.*Representante/);
  });
});

/* ================================================================== */
/* 8. Página /dados — estrutura e comportamentos                     */
/* ================================================================== */

describe('8. Página /representante/dados — estrutura', () => {
  const pagePath = path.join(
    ROOT,
    'app',
    'representante',
    '(portal)',
    'dados',
    'page.tsx'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(pagePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(pagePath)).toBe(true);
  });

  it('deve ter guard para rep desativado (redirect)', () => {
    expect(src).toMatch(/desativado/);
    expect(src).toMatch(/router\.replace/);
  });

  it('deve ter seção de Dados Cadastrais', () => {
    expect(src).toMatch(/Dados Cadastrais/);
  });

  it('deve ter seção de Dados Bancários', () => {
    expect(src).toMatch(/Dados Bancários/);
  });

  it('CPF e CNPJ devem ser read-only (ícone trancado)', () => {
    expect(src).toMatch(/Não pode ser alterado/);
    expect(src).toMatch(/🔒/);
  });

  it('deve ter tooltips em tipo_conta e pix_tipo', () => {
    // Tooltips definidos no objeto TOOLTIP do arquivo
    expect(src).toMatch(/tipo_conta/);
    expect(src).toMatch(/Corrente/);
    expect(src).toMatch(/movimdção|movimentação|diária/i);
    expect(src).toMatch(/pix_tipo/);
    expect(src).toMatch(/chave PIX/i);
  });

  it('deve ter banner condicional por status de dados', () => {
    expect(src).toMatch(/nao_informado/);
    expect(src).toMatch(/pendente_confirmacao/);
    expect(src).toMatch(/rejeitado/);
  });

  it('deve confirmar ao tentar mudar campo com outro aberto', () => {
    expect(src).toMatch(/window\.confirm/);
    expect(src).toMatch(/Descartar/);
  });

  it('deve redirecionar para login em 401', () => {
    expect(src).toMatch(/status.*401/);
    expect(src).toMatch(/router\.push.*login/i);
  });

  it('deve mostrar toast de sucesso e erro', () => {
    expect(src).toMatch(/toastMsg/);
    expect(src).toMatch(/sucesso/);
    expect(src).toMatch(/erro/);
  });

  it('deve chamar PATCH /api/representante/dados-bancarios', () => {
    expect(src).toMatch(/\/api\/representante\/dados-bancarios/);
    expect(src).toMatch(/method.*PATCH/i);
  });
});

/* ================================================================== */
/* 9. app/admin/representantes/page.tsx — botão solicitar + exibição status */
/* =========================================================================== */

describe('9. app/admin/representantes/page.tsx — botão solicitar dados + status no drawer', () => {
  const cmpPath = path.join(ROOT, 'app', 'admin', 'representantes', 'page.tsx');
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(cmpPath, 'utf-8');
  });

  it('interface Representante deve ter dados_bancarios_status', () => {
    expect(src).toMatch(/dados_bancarios_status\?:\s*string/);
  });

  it('interface Representante deve ter dados_bancarios_solicitado_em', () => {
    expect(src).toMatch(/dados_bancarios_solicitado_em\?:\s*string/);
  });

  it('interface Representante deve ter dados_bancarios_confirmado_em', () => {
    expect(src).toMatch(/dados_bancarios_confirmado_em\?:\s*string/);
  });

  it('deve ter função solicitarDadosBancarios', () => {
    expect(src).toMatch(/solicitarDadosBancarios/);
  });

  it('deve chamar POST /api/admin/representantes/[id]/solicitar-dados-bancarios', () => {
    expect(src).toMatch(/solicitar-dados-bancarios/);
    expect(src).toMatch(/method.*POST/i);
  });

  it('botão Solicitar só deve aparecer quando status === apto e dados !== confirmados', () => {
    expect(src).toMatch(/detalhes\.status.*apto/);
    expect(src).toMatch(/dados_bancarios_status.*confirmado/);
    expect(src).toMatch(/Solicitar dados banc/i);
  });

  it('drawer deve exibir Dados Bancários com status formatado', () => {
    expect(src).toMatch(/Dados Bancários/);
    expect(src).toMatch(/Confirmado em/);
    expect(src).toMatch(/Pendente/);
  });
});

/* ================================================================== */
/* 10. rep-context — novos campos na interface                       */
/* ================================================================== */

describe('10. rep-context.tsx — campos bancários na interface', () => {
  const ctxPath = path.join(
    ROOT,
    'app',
    'representante',
    '(portal)',
    'rep-context.tsx'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(ctxPath, 'utf-8');
  });

  it('deve ter banco_codigo na interface', () => {
    expect(src).toMatch(/banco_codigo\?:\s*string/);
  });

  it('deve ter pix_chave e pix_tipo na interface', () => {
    expect(src).toMatch(/pix_chave\?:\s*string/);
    expect(src).toMatch(/pix_tipo\?:\s*string/);
  });

  it('deve ter dados_bancarios_status na interface', () => {
    expect(src).toMatch(/dados_bancarios_status\?:\s*string/);
  });

  it('deve ter cpf e cnpj na interface', () => {
    expect(src).toMatch(/cpf\?:\s*string/);
    expect(src).toMatch(/cnpj\?:\s*string/);
  });
});
