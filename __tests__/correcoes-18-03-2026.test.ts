/**
 * correcoes-18-03-2026.test.ts
 *
 * Testes para as correções de 18/03/2026:
 *
 * 1. app/api/cadastro/tomadores/route.ts
 *    - Busca representante por código usa `status = 'ativo'` (não `ativo = true`)
 *    - Coluna `ativo` não existe na tabela `representantes`; o campo correto é `status`
 *
 * 2. app/api/representante/leads/route.ts
 *    - Leads com status 'convertido' não aparecem no filtro padrão da listagem
 *    - Apenas aparecem quando o filtro `status=convertido` é explicitamente passado
 *
 * 3. app/api/representante/vinculos/route.ts
 *    - Dados do lead de origem (valor_negociado, contato, datas) são incluídos no JOIN
 *    - Resposta inclui lead_valor_negociado, lead_contato_nome, lead_contato_email,
 *      lead_criado_em, lead_data_conversao
 *
 * 4. app/api/tomador/contrato-pdf/route.ts
 *    - Coluna da query de representante para vincular usa `status = 'ativo'` (regressão)
 */

// ─── Mocks globais ─────────────────────────────────────────────────────────────
jest.mock('@/lib/db');
jest.mock('@/lib/session');
jest.mock('@/lib/session-representante');

import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import {
  requireRepresentante,
  repAuthErrorResponse,
} from '@/lib/session-representante';
import { NextRequest } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;
const mockRequireRep = requireRepresentante as jest.MockedFunction<
  typeof requireRepresentante
>;
const mockErrResp = repAuthErrorResponse as jest.MockedFunction<
  typeof repAuthErrorResponse
>;

// Importar rotas uma única vez no nível do módulo (evita problemas com resetModules)
import { GET as leadsGet } from '@/app/api/representante/leads/route';
import { GET as vinculosGet } from '@/app/api/representante/vinculos/route';

const repSession = {
  representante_id: 13,
  nome: 'Ronald',
  email: 'rep@test.dev',
  codigo: 'VSSD-BNMF',
  status: 'apto',
  tipo_pessoa: 'pf' as const,
  criado_em_ms: Date.now(),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockRequireRep.mockReturnValue(repSession);
  mockErrResp.mockReturnValue({
    status: 500,
    body: { error: 'Erro interno.' },
  });
  mockRequireRole.mockResolvedValue({
    cpf: '00000000000',
    role: 'admin',
  } as any);
});

// ─── 1. Cadastro de tomadores — busca de representante por código ───────────────
describe('Correção 1: cadastro/tomadores — status = ativo (não coluna ativo)', () => {
  const ROUTE_PATH = path.join(
    process.cwd(),
    'app/api/cadastro/tomadores/route.ts'
  );

  it('não usa ativo = true na query de representante', () => {
    const src = fs.readFileSync(ROUTE_PATH, 'utf8');
    expect(src).not.toMatch(/AND ativo = true/);
  });

  it("usa status = 'ativo' na query de representante por código", () => {
    const src = fs.readFileSync(ROUTE_PATH, 'utf8');
    expect(src).toMatch(/AND status = 'ativo'/);
  });

  it('query de representante por código tem o padrão correto', () => {
    const src = fs.readFileSync(ROUTE_PATH, 'utf8');
    expect(src).toMatch(
      /FROM representantes WHERE codigo = \$\d+ AND status = 'ativo'/
    );
  });
});

// ─── 2. Leads do representante — convertidos excluídos do padrão ───────────────
describe('Correção 2: GET /api/representante/leads — convertidos excluídos por padrão', () => {
  it('GET sem filtro não retorna leads convertidos', async () => {
    // count geral
    mockQuery.mockResolvedValueOnce({
      rows: [{ total: '2' }],
      rowCount: 1,
    } as any);
    // contagens por status
    mockQuery.mockResolvedValueOnce({
      rows: [
        { status: 'pendente', count: 2 },
        { status: 'convertido', count: 1 },
      ],
      rowCount: 2,
    } as any);
    // lista de leads (retorna apenas pendentes)
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          cnpj: '11222333000181',
          status: 'pendente',
          criado_em: new Date().toISOString(),
        },
        {
          id: 2,
          cnpj: '22333444000192',
          status: 'pendente',
          criado_em: new Date().toISOString(),
        },
      ],
      rowCount: 2,
    } as any);

    const res = await leadsGet(
      new NextRequest('http://localhost/api/representante/leads')
    );
    expect(res.status).toBe(200);
    const data = await res.json();

    // Nenhum lead convertido na lista padrão
    expect(data.leads.every((l: any) => l.status !== 'convertido')).toBe(true);
  });

  it('GET com ?status=convertido retorna leads convertidos', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ total: '1' }],
      rowCount: 1,
    } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [{ status: 'convertido', count: 1 }],
      rowCount: 1,
    } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 6,
          cnpj: '09247738000122',
          status: 'convertido',
          criado_em: new Date().toISOString(),
        },
      ],
      rowCount: 1,
    } as any);

    const res = await leadsGet(
      new NextRequest(
        'http://localhost/api/representante/leads?status=convertido'
      )
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.leads).toHaveLength(1);
    expect(data.leads[0].status).toBe('convertido');
  });

  it('GET sem filtro inclui cláusula de exclusão de convertidos na query', () => {
    jest.resetModules();
    const src = fs.readFileSync(
      path.join(process.cwd(), 'app/api/representante/leads/route.ts'),
      'utf8'
    );
    expect(src).toMatch(/status != 'convertido'|status <> 'convertido'/);
  });
});

// ─── 3. Vínculos do representante — dados do lead incluídos ────────────────────
describe('Correção 3: GET /api/representante/vinculos — dados do lead de origem incluídos', () => {
  it('inclui JOIN com leads_representante na query', () => {
    const src = fs.readFileSync(
      path.join(process.cwd(), 'app/api/representante/vinculos/route.ts'),
      'utf8'
    );
    expect(src).toMatch(/JOIN leads_representante/);
    expect(src).toMatch(/lead_valor_negociado/);
    expect(src).toMatch(/lead_contato_nome/);
    expect(src).toMatch(/lead_data_conversao/);
  });

  it('GET retorna campos do lead na resposta', async () => {
    const mockVinculo = {
      id: 13,
      representante_id: 13,
      entidade_id: 22,
      lead_id: 6,
      status: 'ativo',
      data_inicio: '2026-03-18',
      data_expiracao: '2027-03-18',
      dias_para_expirar: 365,
      entidade_nome: 'Clinica Lead REP-PJ',
      entidade_cnpj: '09247738000122',
      total_comissoes: '0',
      valor_total_pago: '0',
      valor_pendente: '0',
      ultimo_laudo_em: null,
      lead_valor_negociado: 9.8,
      lead_contato_nome: 'ronad',
      lead_contato_email: 'rona@rffr.co',
      lead_criado_em: '2026-03-18T00:00:00.000Z',
      lead_data_conversao: '2026-03-18T08:09:29.000Z',
    };

    mockQuery.mockResolvedValueOnce({
      rows: [{ total: '1' }],
      rowCount: 1,
    } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [mockVinculo],
      rowCount: 1,
    } as any);

    const res = await vinculosGet(
      new NextRequest('http://localhost/api/representante/vinculos')
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.vinculos).toHaveLength(1);

    const v = data.vinculos[0];
    expect(v.lead_valor_negociado).toBe(9.8);
    expect(v.lead_contato_nome).toBe('ronad');
    expect(v.lead_contato_email).toBe('rona@rffr.co');
    expect(v.lead_data_conversao).toBeDefined();
  });
});

// ─── 4. PDF do contrato — logo QWork na última página ─────────────────────────
describe('Correção 4: contrato-pdf — logo QWork inserida na última página', () => {
  it('a rota de PDF tenta ler o arquivo logo-qwork.png', () => {
    const src = fs.readFileSync(
      path.join(process.cwd(), 'app/api/tomador/contrato-pdf/route.ts'),
      'utf8'
    );
    expect(src).toMatch(/logo-qwork\.png/);
    expect(src).toMatch(/addImage/);
    expect(src).toMatch(/getNumberOfPages/);
  });
});

// ─── 5. Entidade lote [id] — tem_laudo deve incluir status 'enviado' ───────────
describe("Correção 5: entidade/lote/[id] — tem_laudo inclui status 'enviado'", () => {
  const LOTE_ROUTE = path.join(
    process.cwd(),
    'app/api/entidade/lote/[id]/route.ts'
  );

  it("usa IN ('emitido', 'enviado') no CASE de tem_laudo (não só '= emitido')", () => {
    const src = fs.readFileSync(LOTE_ROUTE, 'utf8');
    expect(src).toMatch(/l\.status IN \('emitido', 'enviado'\)/);
  });

  it("não usa l.status = 'emitido' isolado no CASE de tem_laudo", () => {
    const src = fs.readFileSync(LOTE_ROUTE, 'utf8');
    // O CASE de tem_laudo não deve mais usar comparação simples = 'emitido'
    const caseBlock = src.match(
      /CASE\s*WHEN l\.id IS NOT NULL[\s\S]*?END as tem_laudo/
    );
    expect(caseBlock).not.toBeNull();
    if (caseBlock) {
      expect(caseBlock[0]).not.toMatch(/l\.status = 'emitido'/);
    }
  });
});

// ─── 6. Emissor download — status IN (emitido, enviado) + sem coluna titulo ────
describe("Correção 6: emissor/laudos/[loteId]/download — status 'enviado' e sem titulo", () => {
  const DOWNLOAD_ROUTE = path.join(
    process.cwd(),
    'app/api/emissor/laudos/[loteId]/download/route.ts'
  );

  it("query principal usa IN ('emitido', 'enviado') para buscar laudo", () => {
    const src = fs.readFileSync(DOWNLOAD_ROUTE, 'utf8');
    expect(src).toMatch(/l\.status IN \('emitido', 'enviado'\)/);
  });

  it('query de fallback (lotes_avaliacao) não usa coluna titulo (removida na migration 164)', () => {
    const src = fs.readFileSync(DOWNLOAD_ROUTE, 'utf8');
    // A query de fallback deve selecionar apenas id e emissor_cpf
    expect(src).toMatch(/SELECT id, emissor_cpf FROM lotes_avaliacao/);
    // Não deve mais conter SELECT id, titulo, emissor_cpf
    expect(src).not.toMatch(
      /SELECT id, titulo, emissor_cpf FROM lotes_avaliacao/
    );
  });

  it("não usa l.status = 'emitido' isolado na query principal", () => {
    const src = fs.readFileSync(DOWNLOAD_ROUTE, 'utf8');
    expect(src).not.toMatch(/AND l\.status = 'emitido'/);
  });
});

// ─── 7. Upload — step 16 (UPDATE lotes_avaliacao) protegido por try/catch ──────
describe('Correção 7: emissor/laudos/[loteId]/upload — step 16 envolto em try/catch', () => {
  const UPLOAD_ROUTE = path.join(
    process.cwd(),
    'app/api/emissor/laudos/[loteId]/upload/route.ts'
  );

  it('step 16 está envolvido em bloco try/catch', () => {
    const src = fs.readFileSync(UPLOAD_ROUTE, 'utf8');
    // Verificar que o UPDATE de finalizado está dentro de um try/catch
    const tryBlock = src.match(
      /try\s*\{[\s\S]*?UPDATE lotes_avaliacao SET status = 'finalizado'[\s\S]*?\}\s*catch/
    );
    expect(tryBlock).not.toBeNull();
  });

  it('catch do step 16 usa console.warn (não rethrow — upload já concluído)', () => {
    const src = fs.readFileSync(UPLOAD_ROUTE, 'utf8');
    // O catch deve logar warning, não relançar o erro
    const catchBlock = src.match(
      /catch \(loteUpdateError[^)]*\)\s*\{[\s\S]*?console\.warn/
    );
    expect(catchBlock).not.toBeNull();
  });

  it('migration 1021 existe e corrige o trigger de lotes_avaliacao', () => {
    const migrationPath = path.join(
      process.cwd(),
      'database/migrations/1021_fix_trigger_allow_finalizado_after_upload.sql'
    );
    expect(fs.existsSync(migrationPath)).toBe(true);
    const sql = fs.readFileSync(migrationPath, 'utf8');
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION/);
    expect(sql).toMatch(/prevent_modification_lote_when_laudo_emitted/);
    // Permite status → finalizado
    expect(sql).toMatch(/NEW\.status != 'finalizado'/);
  });
});

// ─── 8. Relatórios PDF — entidade_id direto (sem COALESCE com contratante_id) ─
describe('Correção 8: relatorios-pdf entidade — usa entidade_id (sem contratante_id)', () => {
  const RELATORIO_LOTE = path.join(
    process.cwd(),
    'app/api/entidade/relatorio-lote-pdf/route.ts'
  );
  const RELATORIO_INDIVIDUAL = path.join(
    process.cwd(),
    'app/api/entidade/relatorio-individual-pdf/route.ts'
  );
  const RELATORIO_SETOR = path.join(
    process.cwd(),
    'app/api/entidade/relatorio-setor-pdf/route.ts'
  );

  it('relatorio-lote-pdf não usa COALESCE com contratante_id', () => {
    const src = fs.readFileSync(RELATORIO_LOTE, 'utf8');
    expect(src).not.toMatch(/COALESCE\(la\.entidade_id, la\.contratante_id\)/);
  });

  it('relatorio-lote-pdf usa la.entidade_id diretamente na query', () => {
    const src = fs.readFileSync(RELATORIO_LOTE, 'utf8');
    expect(src).toMatch(/AND la\.entidade_id = \$2/);
  });

  it('relatorio-individual-pdf não usa COALESCE com contratante_id', () => {
    const src = fs.readFileSync(RELATORIO_INDIVIDUAL, 'utf8');
    expect(src).not.toMatch(/COALESCE\(la\.entidade_id, la\.contratante_id\)/);
  });

  it('relatorio-individual-pdf JOIN tomadores usa la.entidade_id diretamente', () => {
    const src = fs.readFileSync(RELATORIO_INDIVIDUAL, 'utf8');
    expect(src).toMatch(/JOIN tomadores t ON t\.id = la\.entidade_id/);
    expect(src).toMatch(/AND la\.entidade_id = \$3/);
  });

  it('relatorio-setor-pdf já usa la.entidade_id diretamente (sem contratante_id)', () => {
    const src = fs.readFileSync(RELATORIO_SETOR, 'utf8');
    expect(src).not.toContain('contratante_id');
    expect(src).toMatch(/la\.entidade_id = \$2/);
  });

  it('relatorio-setor-pdf JOIN tomadores usa la.entidade_id', () => {
    const src = fs.readFileSync(RELATORIO_SETOR, 'utf8');
    expect(src).toMatch(/JOIN tomadores t ON t\.id = la\.entidade_id/);
  });

  it('nenhuma rota de relatório entidade referencia contratante_id', () => {
    const routeFiles = [RELATORIO_LOTE, RELATORIO_INDIVIDUAL, RELATORIO_SETOR];
    for (const file of routeFiles) {
      const src = fs.readFileSync(file, 'utf8');
      expect(src).not.toContain('contratante_id');
    }
  });
});

describe('Correção 9: entidade lote page — botão duplicado removido e condição do setor corrigida', () => {
  const ENTIDADE_LOTE_PAGE = path.join(
    process.cwd(),
    'app/entidade/lote/[id]/page.tsx'
  );

  it('não há botão "Gerar Relatório" duplicado no header (ao lado de Atualizar)', () => {
    const src = fs.readFileSync(ENTIDADE_LOTE_PAGE, 'utf8');
    // O header tem apenas o botão "Atualizar" — não deve haver handleDownloadReport no contexto do header
    // Para verificar: o fragmento que continha o botão duplicado no header não existe mais
    expect(src).not.toMatch(
      /onClick=\{handleDownloadReport\}[\s\S]*?disabled=\{lote\.status === 'criado'\}/
    );
  });

  it('botão "Gerar Relatório por Setor" aceita laudo_status "enviado" além de "emitido"', () => {
    const src = fs.readFileSync(ENTIDADE_LOTE_PAGE, 'utf8');
    expect(src).toMatch(
      /\['emitido', 'enviado'\]\.includes\(lote\.laudo_status/
    );
  });

  it('botão "Gerar Relatório por Setor" não usa comparação simples !== "emitido"', () => {
    const src = fs.readFileSync(ENTIDADE_LOTE_PAGE, 'utf8');
    // Não deve mais ter a lógica antiga de comparação única com 'emitido' no disabled do setor
    expect(src).not.toMatch(
      /disabled=\{[\s\n]*lote\.laudo_status !== 'emitido'/
    );
  });
});
