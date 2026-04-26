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

const ROOT = path.resolve(__dirname, '../..');

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

  it('deve usar requireRole(comercial)', () => {
    expect(src).toMatch(/requireRole\('comercial'/);
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
/* 7. Layout Portal — navegação atual                                 */
/* ================================================================== */

describe('7. Sidebar do portal — navegação atual', () => {
  const sidebarPath = path.join(
    ROOT,
    'components',
    'representante',
    'RepresentanteSidebar.tsx'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(sidebarPath, 'utf-8');
  });

  it('deve ter item Dados no menu do portal', () => {
    expect(src).toMatch(/href:\s*'\/representante\/dados'/);
    expect(src).toMatch(/label:\s*'Dados'/);
  });

  it('deve usar SidebarLayout e exibir o portal do representante', () => {
    expect(src).toMatch(/SidebarLayout/);
    expect(src).toMatch(/Portal do Representante/);
  });

  it('deve permitir copiar o código do representante', () => {
    expect(src).toMatch(/handleCopiarCodigo/);
    expect(src).toMatch(/navigator\.clipboard\.writeText/);
  });

  it('NÃO deve conter import de Image', () => {
    expect(src).not.toMatch(/import Image from 'next\/image'/);
  });
});

/* ================================================================== */
/* 8. Página /representante/dados — estrutura                         */
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

  it('deve exibir o campo Wallet ID Asaas', () => {
    expect(src).toMatch(/Wallet ID Asaas/);
    expect(src).toMatch(/asaas_wallet_id/);
  });

  it('CPF e CNPJ devem ser read-only', () => {
    expect(src).toMatch(/Não pode ser alterado/);
  });

  it('deve ter tooltips em tipo_conta e pix_tipo', () => {
    expect(src).toMatch(/tipo_conta/);
    expect(src).toMatch(/Corrente/);
    expect(src).toMatch(/movimentação|diária/i);
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
    expect(src).toMatch(/res\.status\s*===\s*401/);
    expect(src).toMatch(/router\.push\('\/login'\)/);
  });

  it('deve mostrar toast de sucesso e erro', () => {
    expect(src).toMatch(/toastMsg/);
    expect(src).toMatch(/sucesso/);
    expect(src).toMatch(/erro/);
  });

  it('deve chamar PATCH /api/representante/dados-bancarios', () => {
    expect(src).toMatch(/\/api\/representante\/dados-bancarios/);
    expect(src).toMatch(/method:\s*'PATCH'/i);
  });
});

/* ================================================================== */
/* 9. app/admin/representantes — botão solicitar e status             */
/* ================================================================== */

describe('9. app/admin/representantes — botão solicitar dados + status no drawer', () => {
  const cmpPath = path.join(ROOT, 'app', 'admin', 'representantes', 'page.tsx');
  const typesPath = path.join(ROOT, 'app', 'admin', 'representantes', 'types.ts');
  const tabPath = path.join(
    ROOT,
    'app',
    'admin',
    'representantes',
    'components',
    'RepresentantesTab.tsx'
  );
  const actionsPath = path.join(
    ROOT,
    'app',
    'admin',
    'representantes',
    'hooks',
    'useRepActions.ts'
  );
  let src: string;
  let typesSrc: string;
  let tabSrc: string;
  let actionsSrc: string;

  beforeAll(() => {
    src = fs.readFileSync(cmpPath, 'utf-8');
    typesSrc = fs.readFileSync(typesPath, 'utf-8');
    tabSrc = fs.readFileSync(tabPath, 'utf-8');
    actionsSrc = fs.readFileSync(actionsPath, 'utf-8');
  });

  it('interface Representante deve ter dados bancários de controle', () => {
    expect(typesSrc).toMatch(/dados_bancarios_status\?:\s*string/);
    expect(typesSrc).toMatch(/dados_bancarios_solicitado_em\?:\s*string/);
    expect(typesSrc).toMatch(/dados_bancarios_confirmado_em\?:\s*string/);
  });

  it('deve ter função solicitarDadosBancarios', () => {
    expect(actionsSrc).toMatch(/solicitarDadosBancarios/);
  });

  it('deve chamar POST /api/admin/representantes/[id]/solicitar-dados-bancarios', () => {
    expect(actionsSrc).toMatch(/solicitar-dados-bancarios/);
    expect(actionsSrc).toMatch(/method:\s*'POST'/i);
  });

  it('botão Solicitar só deve aparecer quando status === apto e dados !== confirmados', () => {
    expect(tabSrc).toMatch(/detalhes\.status\s*===\s*'apto'/);
    expect(tabSrc).toMatch(/dados_bancarios_status\s*!==\s*'confirmado'/);
    expect(tabSrc).toMatch(/Solicitar dados banc/i);
  });

  it('drawer deve exibir Dados Bancários com status formatado', () => {
    expect(tabSrc).toMatch(/Dados Bancários/);
    expect(tabSrc).toMatch(/Confirmado em/);
    expect(tabSrc).toMatch(/Pendente/);
  });

  it('a página deve usar o hook de ações do representante', () => {
    expect(src).toMatch(/useRepActions/);
  });
});

/* ================================================================== */
/* 10. rep-context.tsx — campos bancários na interface                */
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
