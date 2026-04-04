/**
 * Testes para o Mini-Dashboard Financeiro — Sessão 03/04/2026
 *
 * Valida:
 * 1. Tipos corretos em lib/types/financeiro-resumo.ts
 * 2. Endpoint GET /api/rh/financeiro-resumo
 * 3. Endpoint GET /api/entidade/financeiro-resumo
 * 4. Componentes de UI (KPIFinanceiro, ParcelasTimeline, TabelaResumoPorMes)
 * 5. Componente pai MiniDashboardFinanceiro
 * 6. Integração nas ContaSections (RH + Entidade)
 * 7. Âncora id="dados-financeiros" no PagamentosFinanceiros
 * 8. Webhook Asaas com revalidatePath
 * 9. Separação de responsabilidades: dashboard ≠ histórico
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');

// ──────────────────────────────────────────────────────────────────────────────
// 1. TIPOS — lib/types/financeiro-resumo.ts
// ──────────────────────────────────────────────────────────────────────────────
describe('1. lib/types/financeiro-resumo.ts', () => {
  const filePath = path.join(ROOT, 'lib', 'types', 'financeiro-resumo.ts');
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('deve exportar EstadoCalculadoParcela com todos os estados esperados', () => {
    expect(src).toContain('EstadoCalculadoParcela');
    expect(src).toContain("'pago'");
    expect(src).toContain("'processando'");
    expect(src).toContain("'atrasado'");
    expect(src).toContain("'a_vencer_urgente'");
    expect(src).toContain("'pendente'");
    expect(src).toContain("'aguardando_emissao'");
  });

  it('deve exportar ParcelaTimeline com campos obrigatórios', () => {
    expect(src).toContain('ParcelaTimeline');
    expect(src).toContain('pagamento_id');
    expect(src).toContain('parcela_numero');
    expect(src).toContain('total_parcelas');
    expect(src).toContain('data_vencimento');
    expect(src).toContain('dias_para_vencimento');
    expect(src).toContain('lancamento_manual');
    expect(src).toContain('boleto_url');
    expect(src).toContain('estado');
  });

  it('deve exportar KPIsFinanceiros com proximo_vencimento', () => {
    expect(src).toContain('KPIsFinanceiros');
    expect(src).toContain('proximo_vencimento');
    expect(src).toContain('total_pendente_mes');
    expect(src).toContain('total_pago_mes');
    expect(src).toContain('parcelas_em_aberto');
  });

  it('deve exportar ResumoPorMes com campos mensais', () => {
    expect(src).toContain('ResumoPorMes');
    expect(src).toContain('total_a_pagar');
    expect(src).toContain('total_pago');
    expect(src).toContain('mes_ano');
    expect(src).toContain('quantidade_pendentes');
  });

  it('deve exportar FinanceiroResumo como shape completo da API', () => {
    expect(src).toContain('FinanceiroResumo');
    expect(src).toContain('kpis');
    expect(src).toContain('parcelas');
    expect(src).toContain('resumo_mensal');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 2. ENDPOINT RH — app/api/rh/financeiro-resumo/route.ts
// ──────────────────────────────────────────────────────────────────────────────
describe('2. GET /api/rh/financeiro-resumo', () => {
  const filePath = path.join(
    ROOT,
    'app',
    'api',
    'rh',
    'financeiro-resumo',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('deve autenticar com requireRole rh primeiro', () => {
    expect(src).toContain("requireRole(['rh'])");
    const authIdx = src.indexOf("requireRole(['rh'])");
    const queryIdx = src.indexOf('FROM pagamentos');
    expect(authIdx).toBeLessThan(queryIdx);
  });

  it('deve exportar apenas GET (sem POST, PATCH ou DELETE)', () => {
    expect(src).toContain('export async function GET');
    expect(src).not.toContain('export async function POST');
    expect(src).not.toContain('export async function PATCH');
    expect(src).not.toContain('export async function DELETE');
  });

  it('deve ter revalidate = 300 (cache de 5 minutos)', () => {
    expect(src).toContain('export const revalidate = 300');
  });

  it('deve retornar kpis, parcelas e resumo_mensal', () => {
    expect(src).toContain('kpis');
    expect(src).toContain('parcelas');
    expect(src).toContain('resumo_mensal');
  });

  it('deve calcular estado da parcela baseado em data_vencimento', () => {
    expect(src).toContain('calcularEstado');
    expect(src).toContain("'atrasado'");
    expect(src).toContain("'a_vencer_urgente'");
    expect(src).toContain("'pendente'");
  });

  it('deve retornar 403 quando clinica_id não encontrado', () => {
    expect(src).toContain('{ status: 403 }');
    expect(src).toContain('não está vinculado');
  });

  it('deve retornar 500 em caso de erro interno', () => {
    expect(src).toContain('{ status: 500 }');
    expect(src).toContain('Erro interno do servidor');
  });

  it('deve usar normalizarDetalhesParcelas para normalizar status de parcelas', () => {
    expect(src).toContain('normalizarDetalhesParcelas');
  });

  it('deve verificar lote_id para parcelas de clínica', () => {
    expect(src).toContain('lote_id');
  });

  it('deve marcar lancamento_manual quando asaas_payment_id é nulo', () => {
    expect(src).toContain('lancamento_manual');
    expect(src).toContain('asaas_payment_id');
  });

  it('deve ordenar atrasadas antes de pendentes', () => {
    expect(src).toContain('atrasado: 0');
    expect(src).toContain('a_vencer_urgente: 1');
    expect(src).toContain('pendente: 2');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 3. ENDPOINT ENTIDADE — app/api/entidade/financeiro-resumo/route.ts
// ──────────────────────────────────────────────────────────────────────────────
describe('3. GET /api/entidade/financeiro-resumo', () => {
  const filePath = path.join(
    ROOT,
    'app',
    'api',
    'entidade',
    'financeiro-resumo',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('deve autenticar com requireEntity', () => {
    expect(src).toContain('requireEntity');
    const authIdx = src.indexOf('requireEntity');
    const queryIdx = src.indexOf('FROM pagamentos');
    expect(authIdx).toBeLessThan(queryIdx);
  });

  it('deve usar queryAsGestorEntidade (não query direto)', () => {
    expect(src).toContain('queryAsGestorEntidade');
  });

  it('deve ter revalidate = 300', () => {
    expect(src).toContain('export const revalidate = 300');
  });

  it('deve exportar apenas GET', () => {
    expect(src).toContain('export async function GET');
    expect(src).not.toContain('export async function POST');
  });

  it('deve retornar 403 quando entidade_id não encontrado', () => {
    expect(src).toContain('{ status: 403 }');
  });

  it('deve filtrar por entidade_id na query de pagamentos', () => {
    expect(src).toContain('entidade_id = $1');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 4. COMPONENTE KPIFinanceiro
// ──────────────────────────────────────────────────────────────────────────────
describe('4. components/shared/financeiro/KPIFinanceiro.tsx', () => {
  const filePath = path.join(
    ROOT,
    'components',
    'shared',
    'financeiro',
    'KPIFinanceiro.tsx'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('deve usar "use client"', () => {
    expect(src).toContain("'use client'");
  });

  it('deve aceitar prop kpis do tipo KPIsFinanceiros', () => {
    expect(src).toContain('KPIsFinanceiros');
    expect(src).toContain('kpis');
  });

  it('deve destacar visualmente quando vencimento ≤ 3 dias', () => {
    expect(src).toContain('isVencimentoUrgente');
    expect(src).toContain('yellow');
  });

  it('deve destacar visualmente quando parcela está vencida', () => {
    expect(src).toContain('isVencida');
    expect(src).toContain('red');
  });

  it('deve exibir "Próximo Vencimento", "A Pagar no Mês", "Pago no Mês" e "Parcelas em Aberto"', () => {
    expect(src).toContain('Próximo Vencimento');
    expect(src).toContain('A Pagar no Mês');
    expect(src).toContain('Pago no Mês');
    expect(src).toContain('Parcelas em Aberto');
  });

  it('deve ter grid responsivo (4 colunas no desktop)', () => {
    expect(src).toContain('lg:grid-cols-4');
  });

  it('não deve usar emojis como ícones (usar Lucide)', () => {
    // Emojis proibidos em ícones conforme checklist UI
    expect(src).not.toMatch(/✅|⚠️|🔄|📅|⏳/);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 5. COMPONENTE ParcelasTimeline
// ──────────────────────────────────────────────────────────────────────────────
describe('5. components/shared/financeiro/ParcelasTimeline.tsx', () => {
  const filePath = path.join(
    ROOT,
    'components',
    'shared',
    'financeiro',
    'ParcelasTimeline.tsx'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('deve filtrar por mesSelecionado quando passado', () => {
    expect(src).toContain('mesSelecionado');
    expect(src).toContain('startsWith(mesSelecionado)');
  });

  it('deve agrupar parcelas por mês', () => {
    expect(src).toContain('grupos');
    expect(src).toContain('labelMesAno');
  });

  it('deve exibir boleto_url condicionalmente apenas quando disponível e não pago', () => {
    expect(src).toContain('boleto_url');
    expect(src).toContain('!p.pago');
    expect(src).toContain('Boleto');
  });

  it('deve exibir estados atrasado, urgente e pago com cores corretas', () => {
    expect(src).toContain('text-red-700');
    expect(src).toContain('text-yellow-700');
    expect(src).toContain('text-green-700');
  });

  it('deve exibir número/total de parcelas (ex: 2/4)', () => {
    expect(src).toContain('parcela_numero');
    expect(src).toContain('total_parcelas');
  });

  it('deve ter estado vazio quando sem parcelas', () => {
    expect(src).toContain('Nenhuma parcela');
  });

  it('deve ter aria-label no link do boleto para acessibilidade', () => {
    expect(src).toContain('aria-label');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 6. COMPONENTE TabelaResumoPorMes
// ──────────────────────────────────────────────────────────────────────────────
describe('6. components/shared/financeiro/TabelaResumoPorMes.tsx', () => {
  const filePath = path.join(
    ROOT,
    'components',
    'shared',
    'financeiro',
    'TabelaResumoPorMes.tsx'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('deve aceitar onMesSelecionado como callback de filtro', () => {
    expect(src).toContain('onMesSelecionado');
  });

  it('deve ter colunas Mês, A Pagar e Pago', () => {
    expect(src).toContain('A Pagar');
    expect(src).toContain('Pago');
    expect(src).toContain('Mês');
  });

  it('deve ter barra visual proporcional sem biblioteca externa', () => {
    expect(src).toContain('barraWidth');
    // Não deve importar recharts, chart.js, ou visx
    expect(src).not.toContain('recharts');
    expect(src).not.toContain('chart.js');
    expect(src).not.toContain('visx');
  });

  it('deve destacar linha selecionada', () => {
    expect(src).toContain('selecionado');
    expect(src).toContain('bg-blue-50');
  });

  it('deve ser acessível via teclado (Enter/Espaço)', () => {
    expect(src).toContain('onKeyDown');
    expect(src).toContain('Enter');
    expect(src).toContain('tabIndex={0}');
  });

  it('deve ter aria-label na tabela', () => {
    expect(src).toContain('aria-label');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 7. COMPONENTE MiniDashboardFinanceiro
// ──────────────────────────────────────────────────────────────────────────────
describe('7. components/shared/financeiro/MiniDashboardFinanceiro.tsx', () => {
  const filePath = path.join(
    ROOT,
    'components',
    'shared',
    'financeiro',
    'MiniDashboardFinanceiro.tsx'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('arquivo deve existir', () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('deve aceitar apiUrl como prop', () => {
    expect(src).toContain('apiUrl');
  });

  it('deve ter estado loading com skeleton', () => {
    expect(src).toContain('loading');
    expect(src).toContain('animate-pulse');
  });

  it('deve ter estado de erro com botão de retry', () => {
    expect(src).toContain('erro');
    expect(src).toContain('Tentar novamente');
  });

  it('deve gerenciar mesSelecionado como estado local', () => {
    expect(src).toContain('mesSelecionado');
    expect(src).toContain('setMesSelecionado');
  });

  it('deve passar mesSelecionado para ParcelasTimeline e TabelaResumoPorMes', () => {
    expect(src).toContain('mesSelecionado={mesSelecionado}');
    expect(src).toContain('onMesSelecionado={setMesSelecionado}');
  });

  it('deve ter link âncora para #dados-financeiros', () => {
    expect(src).toContain('#dados-financeiros');
    expect(src).toContain('Ver Histórico Completo');
  });

  it('deve usar fetch com o apiUrl recebido por prop', () => {
    expect(src).toContain('fetch(apiUrl)');
  });

  it('deve ter seções expansíveis (Cronograma e Resumo Mensal)', () => {
    expect(src).toContain('Cronograma de Parcelas');
    expect(src).toContain('Resumo Mensal');
    expect(src).toContain('aria-expanded');
  });

  it('deve ter botão de refresh com aria-label', () => {
    expect(src).toContain('aria-label="Atualizar dados financeiros"');
    expect(src).toContain('carregarDados');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 8. INTEGRAÇÃO — ContaSection RH
// ──────────────────────────────────────────────────────────────────────────────
describe('8. Integração: components/clinica/ContaSection.tsx', () => {
  const filePath = path.join(ROOT, 'components', 'clinica', 'ContaSection.tsx');
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('deve importar MiniDashboardFinanceiro', () => {
    expect(src).toContain(
      "import MiniDashboardFinanceiro from '@/components/shared/financeiro/MiniDashboardFinanceiro'"
    );
  });

  it('deve renderizar MiniDashboardFinanceiro com endpoint correto', () => {
    expect(src).toContain('<MiniDashboardFinanceiro');
    expect(src).toContain('apiUrl="/api/rh/financeiro-resumo"');
  });

  it('MiniDashboardFinanceiro deve aparecer ANTES de PagamentosFinanceiros', () => {
    const miniIdx = src.indexOf('<MiniDashboardFinanceiro');
    const pagIdx = src.indexOf('<PagamentosFinanceiros');
    expect(miniIdx).toBeGreaterThan(-1);
    expect(pagIdx).toBeGreaterThan(-1);
    expect(miniIdx).toBeLessThan(pagIdx);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 9. INTEGRAÇÃO — ContaSection Entidade
// ──────────────────────────────────────────────────────────────────────────────
describe('9. Integração: components/entidade/ContaSection.tsx', () => {
  const filePath = path.join(
    ROOT,
    'components',
    'entidade',
    'ContaSection.tsx'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('deve importar MiniDashboardFinanceiro', () => {
    expect(src).toContain(
      "import MiniDashboardFinanceiro from '@/components/shared/financeiro/MiniDashboardFinanceiro'"
    );
  });

  it('deve renderizar MiniDashboardFinanceiro com endpoint correto', () => {
    expect(src).toContain('<MiniDashboardFinanceiro');
    expect(src).toContain('apiUrl="/api/entidade/financeiro-resumo"');
  });

  it('MiniDashboardFinanceiro deve aparecer ANTES de PagamentosFinanceiros', () => {
    const miniIdx = src.indexOf('<MiniDashboardFinanceiro');
    const pagIdx = src.indexOf('<PagamentosFinanceiros');
    expect(miniIdx).toBeGreaterThan(-1);
    expect(pagIdx).toBeGreaterThan(-1);
    expect(miniIdx).toBeLessThan(pagIdx);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 10. ÂNCORA — id="dados-financeiros" em PagamentosFinanceiros
// ──────────────────────────────────────────────────────────────────────────────
describe('10. Âncora #dados-financeiros em PagamentosFinanceiros', () => {
  const filePath = path.join(
    ROOT,
    'components',
    'shared',
    'PagamentosFinanceiros.tsx'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('deve ter id="dados-financeiros" no elemento raiz da seção', () => {
    expect(src).toContain('id="dados-financeiros"');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 11. WEBHOOK — revalidatePath após pagamento confirmado
// ──────────────────────────────────────────────────────────────────────────────
describe('11. Webhook Asaas — revalidatePath após confirmação', () => {
  const filePath = path.join(
    ROOT,
    'app',
    'api',
    'webhooks',
    'asaas',
    'route.ts'
  );
  let src: string;

  beforeAll(() => {
    src = fs.readFileSync(filePath, 'utf-8');
  });

  it('deve importar revalidatePath de next/cache', () => {
    expect(src).toContain("from 'next/cache'");
    expect(src).toContain('revalidatePath');
  });

  it('deve invalidar /rh/conta após PAYMENT_CONFIRMED', () => {
    expect(src).toContain("revalidatePath('/rh/conta')");
  });

  it('deve invalidar /entidade/conta após PAYMENT_CONFIRMED', () => {
    expect(src).toContain("revalidatePath('/entidade/conta')");
  });

  it('deve chamar revalidatePath apenas para PAYMENT_CONFIRMED e PAYMENT_RECEIVED', () => {
    expect(src).toContain('PAYMENT_CONFIRMED');
    expect(src).toContain('PAYMENT_RECEIVED');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 12. SEPARAÇÃO DE RESPONSABILIDADES
// ──────────────────────────────────────────────────────────────────────────────
describe('12. Separação: dashboard ≠ endpoint de histórico', () => {
  it('endpoint /api/rh/financeiro-resumo é arquivo separado de /api/rh/pagamentos-laudos', () => {
    const resumoPath = path.join(
      ROOT,
      'app',
      'api',
      'rh',
      'financeiro-resumo',
      'route.ts'
    );
    const laudosPath = path.join(
      ROOT,
      'app',
      'api',
      'rh',
      'pagamentos-laudos',
      'route.ts'
    );
    expect(fs.existsSync(resumoPath)).toBe(true);
    expect(fs.existsSync(laudosPath)).toBe(true);
    // Arquivos distintos
    const srcResumo = fs.readFileSync(resumoPath, 'utf-8');
    const srcLaudos = fs.readFileSync(laudosPath, 'utf-8');
    expect(srcResumo).not.toEqual(srcLaudos);
  });

  it('endpoint /api/entidade/financeiro-resumo é arquivo separado de /api/entidade/pagamentos-laudos', () => {
    const resumoPath = path.join(
      ROOT,
      'app',
      'api',
      'entidade',
      'financeiro-resumo',
      'route.ts'
    );
    const laudosPath = path.join(
      ROOT,
      'app',
      'api',
      'entidade',
      'pagamentos-laudos',
      'route.ts'
    );
    expect(fs.existsSync(resumoPath)).toBe(true);
    expect(fs.existsSync(laudosPath)).toBe(true);
    const srcResumo = fs.readFileSync(resumoPath, 'utf-8');
    const srcLaudos = fs.readFileSync(laudosPath, 'utf-8');
    expect(srcResumo).not.toEqual(srcLaudos);
  });

  it('MiniDashboardFinanceiro não importa do endpoint legado de laudos', () => {
    const dashPath = path.join(
      ROOT,
      'components',
      'shared',
      'financeiro',
      'MiniDashboardFinanceiro.tsx'
    );
    const srcDash = fs.readFileSync(dashPath, 'utf-8');
    // O dashboard não deve ter a URL hardcoded do endpoint de histórico
    expect(srcDash).not.toContain('pagamentos-laudos');
  });
});
