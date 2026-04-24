/**
 * Testes: Novo Modelo de Comissionamento — Fase 3 a 8
 *
 * Estratégia: testes de conteúdo de arquivo (static analysis) — verificam
 * que os novos arquivos foram criados corretamente e contêm os patterns
 * esperados de segurança, validação e lógica de negócio.
 *
 * Cobertura:
 * 1. Migration 600 — ciclos_comissao_mensal e repasses_split
 * 2. Migration 601 — remoção de comissão por vendedor
 * 3. lib/asaas/subconta.ts — exports, tipos e funções
 * 4. POST /api/comercial/representantes/[id]/aprovar-comissao — Fase 3 Etapa 1
 * 5. POST /api/suporte/representantes/[id]/ativar — Fase 3 Etapa 2
 * 6. GET/POST /api/suporte/comissionamento/ciclos — Fase 5
 * 7. POST /api/suporte/comissionamento/ciclos/[id]/validar — Fase 5
 * 8. POST /api/suporte/comissionamento/representantes/[id]/desbloquear — Fase 5
 * 9. GET /api/representante/financeiro/ciclos — Fase 6
 * 10. POST /api/representante/financeiro/nf-rpa — Fase 6
 * 11. POST /api/suporte/jobs/fechar-ciclo — Fase 8
 * 12. POST /api/suporte/jobs/verificar-vencimento-nf-rpa — Fase 8
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');

// ---------------------------------------------------------------------------
// 1. Migration 600 — novo modelo de comissionamento
// ---------------------------------------------------------------------------

describe('1. Migration 600 — novo modelo de comissionamento', () => {
  const sqlPath = path.join(
    ROOT,
    'database',
    'migrations',
    '600_novo_modelo_comissionamento.sql'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(sqlPath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(sqlPath)).toBe(true);
  });

  it('deve envolver tudo em transação (BEGIN/COMMIT)', () => {
    expect(src).toMatch(/^\s*BEGIN\s*;/im);
    expect(src).toMatch(/^\s*COMMIT\s*;/im);
  });

  it('deve adicionar modelo_comissionamento à tabela representantes', () => {
    expect(src).toContain('modelo_comissionamento');
  });

  it('deve adicionar asaas_wallet_id à tabela representantes', () => {
    expect(src).toContain('asaas_wallet_id');
  });

  it('deve criar tabela ciclos_comissao_mensal', () => {
    expect(src).toContain('ciclos_comissao_mensal');
    expect(src).toContain('CREATE TABLE');
  });

  it('deve criar tabela repasses_split', () => {
    expect(src).toContain('repasses_split');
    expect(src).toContain('CREATE TABLE');
  });

  it('deve criar enum tipo_modelo_comissionamento ou definir os valores', () => {
    // Pode ser um enum ou check constraint
    expect(src).toMatch(/percentual|custo_fixo/);
  });
});

// ---------------------------------------------------------------------------
// 2. Migration 601 — remoção de comissão por vendedor
// ---------------------------------------------------------------------------

describe('2. Migration 601 — remoção de comissão por vendedor', () => {
  const sqlPath = path.join(
    ROOT,
    'database',
    'migrations',
    '601_remover_comissao_vendedor.sql'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(sqlPath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(sqlPath)).toBe(true);
  });

  it('deve envolver em transação', () => {
    expect(src).toMatch(/BEGIN/im);
    expect(src).toMatch(/COMMIT/im);
  });

  it('deve remover percentual_comissao_vendedor de leads_representante', () => {
    expect(src).toContain('leads_representante');
    expect(src).toContain('percentual_comissao_vendedor');
    expect(src).toMatch(/DROP COLUMN|IF EXISTS/i);
  });
});

// ---------------------------------------------------------------------------
// 3. lib/asaas/subconta.ts — exports e estrutura
// ---------------------------------------------------------------------------

describe('3. lib/asaas/subconta.ts — exports e estrutura', () => {
  const filePath = path.join(ROOT, 'lib', 'asaas', 'subconta.ts');
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('deve exportar CUSTO_MINIMO', () => {
    expect(src).toContain('export const CUSTO_MINIMO');
  });

  it('deve exportar calcularSplit', () => {
    expect(src).toContain('export function calcularSplit');
  });

  it('deve exportar montarSplitAsaas', () => {
    expect(src).toContain('export function montarSplitAsaas');
  });

  it('deve exportar PERCENTUAL_MAXIMO_COMISSAO', () => {
    expect(src).toContain('export const PERCENTUAL_MAXIMO_COMISSAO');
  });

  it('deve suportar modelo percentual e custo_fixo', () => {
    expect(src).toContain("'percentual'");
    expect(src).toContain("'custo_fixo'");
  });

  it('deve ter ResultadoSplit com campo viavel', () => {
    expect(src).toContain('viavel');
    expect(src).toContain('ResultadoSplit');
  });
});

// ---------------------------------------------------------------------------
// 4. POST /api/comercial/representantes/[id]/aprovar-comissao — Fase 3 Etapa 1
// ---------------------------------------------------------------------------

describe('4. POST /api/comercial/representantes/[id]/aprovar-comissao', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'comercial',
    'representantes',
    '[id]',
    'aprovar-comissao',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('deve ter export const dynamic force-dynamic', () => {
    expect(src).toContain("export const dynamic = 'force-dynamic'");
  });

  it('deve validar modelo com z.enum', () => {
    expect(src).toContain("z.enum(['percentual', 'custo_fixo'])");
  });

  it('deve rejeitar percentual > 40', () => {
    expect(src).toContain('.max(40)');
  });

  it('deve verificar status apto ou apto_pendente (STATUS_INVALIDO)', () => {
    // Após correção do bug, aceita tanto 'apto' quanto 'apto_pendente'
    expect(src).toContain("['apto', 'apto_pendente']");
    expect(src).toContain('STATUS_INVALIDO');
  });

  it('deve aceitar representante com status apto (fix bug)', () => {
    expect(src).toContain("'apto'");
    expect(src).toContain("'apto_pendente'");
    // Validação via array, não comparação simples
    expect(src).toMatch(/\['apto',\s*'apto_pendente'\]\.includes/);
  });

  it('deve mover para aprovacao_comercial ao aprovar', () => {
    expect(src).toContain("'aprovacao_comercial'");
  });

  it('deve atualizar modelo_comissionamento no DB', () => {
    expect(src).toContain('modelo_comissionamento = $1');
  });

  it('deve exigir comercial ou admin', () => {
    expect(src).toContain("requireRole(['comercial', 'admin']");
  });

  it('deve retornar 409 se status não é apto_pendente', () => {
    expect(src).toContain('{ status: 409 }');
  });

  it('deve retornar 422 se dados inválidos', () => {
    expect(src).toContain('{ status: 422 }');
  });
});

// ---------------------------------------------------------------------------
// 5. POST /api/suporte/representantes/[id]/ativar — Fase 3 Etapa 2
// ---------------------------------------------------------------------------

describe('5. POST /api/suporte/representantes/[id]/ativar', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'suporte',
    'representantes',
    '[id]',
    'ativar',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('deve verificar status aprovacao_comercial', () => {
    expect(src).toContain("'aprovacao_comercial'");
    expect(src).toContain('STATUS_INVALIDO');
  });

  it('deve verificar que modelo_comissionamento está definido', () => {
    expect(src).toContain('modelo_comissionamento');
  });

  it('deve tentar criar subconta Asaas', () => {
    expect(src).toContain('criarSubcontaRepresentante');
    expect(src).toContain('asaasClient');
  });

  it('deve salvar walletId no DB', () => {
    expect(src).toContain('asaas_wallet_id');
  });

  it('deve ativar para apto mesmo se Asaas falhar (non-blocking)', () => {
    expect(src).toContain("'apto'");
    expect(src).toContain('asaasErro');
    // catch que seta o erro sem re-throw
    expect(src).toMatch(/catch.*\{[^}]*asaasErro/s);
  });

  it('deve exigir suporte ou admin', () => {
    expect(src).toContain("requireRole(['suporte', 'admin']");
  });

  it('deve logar o evento de ativação', () => {
    expect(src).toContain('suporte_ativou_representante');
  });
});

// ---------------------------------------------------------------------------
// 6. GET /api/suporte/comissionamento/ciclos — Fase 5
// ---------------------------------------------------------------------------

describe('6. GET /api/suporte/comissionamento/ciclos', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'suporte',
    'comissionamento',
    'ciclos',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('deve consultar ciclos_comissao_mensal', () => {
    expect(src).toContain('ciclos_comissao_mensal');
  });

  it('deve retornar nome do representante', () => {
    expect(src).toContain('representantes');
  });

  it('deve ter paginação', () => {
    expect(src).toMatch(/limit|offset|LIMIT|OFFSET/);
  });

  it('deve exigir suporte ou admin', () => {
    expect(src).toContain('requireRole');
  });

  it('deve escutar filtro por status', () => {
    expect(src).toContain('status');
  });
});

// ---------------------------------------------------------------------------
// 7. POST /api/suporte/comissionamento/ciclos/[id]/validar — Fase 5
// ---------------------------------------------------------------------------

describe('7. POST /api/suporte/comissionamento/ciclos/[id]/validar', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'suporte',
    'comissionamento',
    'ciclos',
    '[id]',
    'validar',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('deve aceitar acao validar e rejeitar', () => {
    expect(src).toContain("z.enum(['validar', 'rejeitar'])");
  });

  it('deve verificar status nf_rpa_enviada', () => {
    expect(src).toContain("'nf_rpa_enviada'");
    expect(src).toContain('STATUS_INVALIDO');
  });

  it('ao validar deve mover para validado', () => {
    expect(src).toContain("'validado'");
    expect(src).toContain('data_validacao_suporte');
  });

  it('ao rejeitar deve mover para aguardando_nf_rpa', () => {
    expect(src).toContain("'aguardando_nf_rpa'");
  });

  it('deve retornar 409 se status inválido', () => {
    expect(src).toContain('{ status: 409 }');
  });

  it('deve exigir suporte ou admin', () => {
    expect(src).toContain("requireRole(['suporte', 'admin']");
  });
});

// ---------------------------------------------------------------------------
// 8. POST /api/suporte/comissionamento/representantes/[id]/desbloquear — Fase 5
// ---------------------------------------------------------------------------

describe('8. POST /api/suporte/comissionamento/representantes/[id]/desbloquear', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'suporte',
    'comissionamento',
    'representantes',
    '[id]',
    'desbloquear',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('deve verificar status apto_bloqueado', () => {
    expect(src).toContain("'apto_bloqueado'");
  });

  it('deve mover para apto ao desbloquear', () => {
    expect(src).toContain("'apto'");
  });

  it('deve exigir suporte ou admin', () => {
    expect(src).toContain('requireRole');
  });
});

// ---------------------------------------------------------------------------
// 9. GET /api/representante/financeiro/ciclos — Fase 6
// ---------------------------------------------------------------------------

describe('9. GET /api/representante/financeiro/ciclos', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'representante',
    'financeiro',
    'ciclos',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('deve filtrar pelo representante logado', () => {
    expect(src).toContain('representante_id');
  });

  it('deve usar requireRepresentante ou requireRepresentanteComDB', () => {
    expect(src).toMatch(/requireRepresentante/);
  });

  it('deve retornar ciclos_comissao_mensal', () => {
    expect(src).toContain('ciclos_comissao_mensal');
  });

  it('deve incluir total/resumo financeiro', () => {
    // Deve ter algum cálculo de resumo ou SUM
    expect(src).toMatch(/valor_total|SUM|COALESCE/i);
  });
});

// ---------------------------------------------------------------------------
// 10. POST /api/representante/financeiro/nf-rpa — Fase 6
// ---------------------------------------------------------------------------

describe('10. POST /api/representante/financeiro/nf-rpa', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'representante',
    'financeiro',
    'nf-rpa',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('deve aceitar multipart/form-data', () => {
    expect(src).toContain('formData');
    expect(src).toContain('arquivo');
  });

  it('deve validar tamanho máximo de 2MB', () => {
    expect(src).toContain('2 * 1024 * 1024');
    expect(src).toContain('{ status: 422 }');
  });

  it('deve validar tipos aceitos (PDF, JPEG, PNG, WEBP)', () => {
    expect(src).toContain('application/pdf');
    expect(src).toContain('image/jpeg');
  });

  it('deve verificar que ciclo pertence ao representante', () => {
    expect(src).toContain('representante_id');
    expect(src).toContain('$1 AND representante_id = $2');
  });

  it('deve verificar status aguardando_nf_rpa', () => {
    expect(src).toContain("'aguardando_nf_rpa'");
    expect(src).toContain('STATUS_INVALIDO');
  });

  it('deve mover ciclo para nf_rpa_enviada após upload', () => {
    expect(src).toContain("'nf_rpa_enviada'");
  });

  it('deve retornar 409 se ciclo não está aguardando NF', () => {
    expect(src).toContain('{ status: 409 }');
  });

  it('deve usar requireRepresentanteComDB', () => {
    expect(src).toContain('requireRepresentanteComDB');
  });
});

// ---------------------------------------------------------------------------
// 11. POST /api/suporte/jobs/fechar-ciclo — Fase 8
// ---------------------------------------------------------------------------

describe('11. POST /api/suporte/jobs/fechar-ciclo', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'suporte',
    'jobs',
    'fechar-ciclo',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('deve fechar ciclos com status aberto do mês anterior', () => {
    expect(src).toContain("'aberto'");
    expect(src).toContain("'aguardando_nf_rpa'");
  });

  it('deve só fechar ciclos de meses anteriores (mes_ano < atual)', () => {
    expect(src).toContain('mes_ano');
    expect(src).toMatch(/< |<\$/);
  });

  it('deve exigir suporte ou admin', () => {
    expect(src).toContain('requireRole');
  });

  it('deve retornar contagem de ciclos fechados', () => {
    expect(src).toMatch(/ciclos_fechados|ciclos_atualizados/);
  });
});

// ---------------------------------------------------------------------------
// 12. POST /api/suporte/jobs/verificar-vencimento-nf-rpa — Fase 8
// ---------------------------------------------------------------------------

describe('12. POST /api/suporte/jobs/verificar-vencimento-nf-rpa', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'suporte',
    'jobs',
    'verificar-vencimento-nf-rpa',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('deve ter DIA_CORTE = 10', () => {
    expect(src).toContain('DIA_CORTE = 10');
  });

  it('deve retornar early quando dia < DIA_CORTE', () => {
    expect(src).toContain('dentro do prazo');
    expect(src).toContain('ciclos_vencidos: 0');
  });

  it('deve marcar ciclos como vencido', () => {
    expect(src).toContain("'vencido'");
  });

  it('deve bloquear representantes com status apto', () => {
    expect(src).toContain("'apto_bloqueado'");
    expect(src).toContain("status = 'apto'");
  });

  it('deve filtrar ciclos de meses anteriores', () => {
    expect(src).toContain('mes_ano < $1');
  });

  it('deve retornar contagens (ciclos_vencidos e representantes_bloqueados)', () => {
    expect(src).toContain('ciclos_vencidos');
    expect(src).toContain('representantes_bloqueados');
  });

  it('deve exigir suporte ou admin', () => {
    expect(src).toContain('requireRole');
  });
});

// ---------------------------------------------------------------------------
// 13. page.tsx /representante/(portal)/financeiro — Fase 6 UI
// ---------------------------------------------------------------------------

describe('13. page.tsx /representante/(portal)/financeiro', () => {
  const pagePath = path.join(
    ROOT,
    'app',
    'representante',
    '(portal)',
    'financeiro',
    'page.tsx'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(pagePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(pagePath)).toBe(true);
  });

  it('deve buscar ciclos da API', () => {
    expect(src).toContain('/api/representante/financeiro/ciclos');
  });

  it('deve exibir status dos ciclos', () => {
    expect(src).toMatch(/aguardando_nf_rpa|nf_rpa_enviada|validado/);
  });

  it('deve ter opção de upload de NF/RPA', () => {
    expect(src).toMatch(/upload|NF|RPA|nf-rpa/i);
  });
});

// ---------------------------------------------------------------------------
// 14. CiclosComissaoContent — Fase 5 UI (Suporte)
// ---------------------------------------------------------------------------

describe('14. components/suporte/CiclosComissaoContent', () => {
  const componentPath = path.join(
    ROOT,
    'components',
    'suporte',
    'CiclosComissaoContent.tsx'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(componentPath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(componentPath)).toBe(true);
  });

  it('deve buscar ciclos da API', () => {
    expect(src).toContain('/api/suporte/comissionamento/ciclos');
  });

  it('deve ter ação de validar e rejeitar', () => {
    expect(src).toMatch(/validar|rejeitar/i);
  });

  it('deve estar no sidebar do suporte', () => {
    const sidebarPath = path.join(
      ROOT,
      'components',
      'suporte',
      'SuporteSidebar.tsx'
    );
    const sidebarSrc = fs.readFileSync(sidebarPath, 'utf-8');
    expect(sidebarSrc).toMatch(/ciclos|NF.*RPA|RPA.*NF/i);
  });
});

// ---------------------------------------------------------------------------
// 15. GET /api/comercial/representantes/[id] — modelo_comissionamento e asaas_wallet_id
// ---------------------------------------------------------------------------

describe('15. GET /api/comercial/representantes/[id] — campos comissionamento', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'comercial',
    'representantes',
    '[id]',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('SELECT deve incluir modelo_comissionamento', () => {
    expect(src).toContain('r.modelo_comissionamento');
  });

  it('SELECT deve incluir asaas_wallet_id', () => {
    expect(src).toContain('r.asaas_wallet_id');
  });

  it('deve exigir comercial ou admin', () => {
    expect(src).toContain("requireRole(['comercial', 'admin']");
  });
});

// ---------------------------------------------------------------------------
// 16. GET /api/comercial/representantes/metricas — modelo_comissionamento
// ---------------------------------------------------------------------------

describe('16. GET /api/comercial/representantes/metricas — campo modelo_comissionamento', () => {
  const routePath = path.join(
    ROOT,
    'app',
    'api',
    'comercial',
    'representantes',
    'metricas',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(routePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('SELECT deve incluir r.modelo_comissionamento', () => {
    expect(src).toContain('r.modelo_comissionamento');
  });

  it('GROUP BY deve incluir r.modelo_comissionamento', () => {
    expect(src).toContain('GROUP BY r.id');
    expect(src).toContain('r.modelo_comissionamento');
  });

  it('retorno deve mapear modelo_comissionamento', () => {
    expect(src).toContain('modelo_comissionamento: r.modelo_comissionamento');
  });
});

// ---------------------------------------------------------------------------
// 17. AprovarComissaoModal.tsx — componente de frontend
// ---------------------------------------------------------------------------

describe('17. AprovarComissaoModal.tsx — frontend comercial', () => {
  const componentPath = path.join(
    ROOT,
    'app',
    'comercial',
    'representantes',
    '[id]',
    'AprovarComissaoModal.tsx'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(componentPath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(componentPath)).toBe(true);
  });

  it('deve chamar POST /api/comercial/representantes/${repId}/aprovar-comissao', () => {
    expect(src).toContain('aprovar-comissao');
    expect(src).toContain("method: 'POST'");
  });

  it('deve ter seleção de modelo percentual e custo_fixo', () => {
    expect(src).toContain("'percentual'");
    expect(src).toContain("'custo_fixo'");
  });

  it('deve validar percentual entre 0.01 e 40', () => {
    expect(src).toContain('pctNum > 0 && pctNum <= 40');
  });

  it('deve exibir campo percentual somente quando modelo = percentual', () => {
    expect(src).toContain("modelo === 'percentual'");
  });

  it('deve ter callbacks onClose e onSuccess', () => {
    expect(src).toContain('onClose');
    expect(src).toContain('onSuccess');
  });

  it('deve mostrar aviso sobre fluxo de 2 etapas (Suporte)', () => {
    expect(src).toContain('Suporte');
    expect(src).toContain('walletId');
  });

  it('deve exibir estado de loading no botão', () => {
    expect(src).toContain('Salvando...');
    expect(src).toContain('animate-spin');
  });
});
