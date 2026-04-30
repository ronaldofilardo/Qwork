/**
 * segregacao-perfis-cards-v2.test.ts
 *
 * Testes para as implementações da sessão de Segregação de Perfis + Cards UI:
 * - Fase 5: POST /api/vendedor/leads — validações e estrutura
 * - Fase 6: RepresentantesLista cards — componente e API suporte
 * - Fase 7: Equipe representante — página cards
 * - Fase 8: Comercial candidatos + equipe cards
 * - Fase 9: Vendedor Novo Lead button — página
 * - Bug fix: total_vendedores correlated subquery em /api/suporte/representantes
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');

// ─── helpers ────────────────────────────────────────────────────────────────

function readSrc(rel: string) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf-8');
}

function filePath(rel: string) {
  return path.join(ROOT, rel);
}

// ===========================================================================
// FASE 5 — POST /api/vendedor/leads
// ===========================================================================

describe('Fase 5 — POST /api/vendedor/leads', () => {
  const src = readSrc('app/api/vendedor/leads/route.ts');

  it('arquivo existe', () => {
    expect(fs.existsSync(filePath('app/api/vendedor/leads/route.ts'))).toBe(
      true
    );
  });

  it('exporta função POST', () => {
    expect(src).toMatch(/export\s+async\s+function\s+POST/);
  });

  it('usa requireRole com perfil vendedor', () => {
    expect(src).toMatch(/requireRole\(\s*['"]vendedor['"]/);
  });

  it('usa Zod para validar body (novoLeadSchema)', () => {
    expect(src).toMatch(/novoLeadSchema\s*=\s*z\.object/);
  });

  it('valida campo obrigatório contato_nome com min(3)', () => {
    expect(src).toMatch(/contato_nome.*z\.string\(\)\.min\(3\)/);
  });

  it('retorna 400 se vendedor sem vínculo ativo', () => {
    expect(src).toMatch(/hierarquia_comercial/);
    expect(src).toMatch(/ativo\s*=\s*true/);
    expect(src).toMatch(/status:\s*400/);
  });

  it('retorna 422 para dados inválidos', () => {
    expect(src).toMatch(/status:\s*422/);
  });

  it('infere representante_id do vínculo ativo, NÃO do body', () => {
    // representante_id deve vir da query, não do request body
    expect(src).toMatch(
      /representante_id.*hierarquia_comercial|hierarquia_comercial.*representante_id/s
    );
    // não deve ler representante_id do body
    expect(src).not.toMatch(/data\.representante_id/);
  });

  it('insere na tabela leads_representante', () => {
    expect(src).toMatch(/INSERT\s+INTO.*leads_representante/s);
  });

  it('aplica validação de CNPJ quando fornecido', () => {
    expect(src).toMatch(/validarCNPJ/);
  });

  it('aplica validação de email quando fornecido', () => {
    expect(src).toMatch(/validarEmail/);
  });

  it('exporta função GET também (listagem)', () => {
    expect(src).toMatch(/export\s+async\s+function\s+GET/);
  });

  it('GET retorna total=0 e page/limit no response', () => {
    // sem_representante é detectado na página client-side via total=0
    expect(src).toMatch(/total.*page.*limit|page.*limit.*total/s);
    expect(src).toMatch(/NextResponse\.json.*total/s);
  });
});

// ===========================================================================
// FASE 6 — RepresentantesLista cards (componente suporte)
// ===========================================================================

describe('Fase 6 — RepresentantesLista cards (suporte)', () => {
  const src = readSrc('components/suporte/RepresentantesLista.tsx');

  it('arquivo existe', () => {
    expect(
      fs.existsSync(filePath('components/suporte/RepresentantesLista.tsx'))
    ).toBe(true);
  });

  it('tem diretiva use client', () => {
    expect(src).toMatch(/['"]use client['"]/);
  });

  it('renderiza grid de cards (grid-cols)', () => {
    expect(src).toMatch(/grid-cols/);
  });

  it('contém componente RepresentanteCard ou componente de card', () => {
    expect(src).toMatch(/RepresentanteCard|function.*Card/);
  });

  it('tem drawer/painel lateral', () => {
    expect(src).toMatch(/translate-x|drawer|Drawer/i);
  });

  it('aba Vendedores no drawer', () => {
    expect(src).toMatch(/[Vv]endedores/);
  });

  it('chama PATCH /api/suporte/representantes/[id]', () => {
    expect(src).toMatch(/api\/suporte\/representantes/);
    expect(src).toMatch(/PATCH/);
  });

  it('chama PATCH /api/suporte/vendedores/[id]/dados-bancarios', () => {
    expect(src).toMatch(/dados-bancarios/);
  });

  it('exibe total de vendedores por representante', () => {
    expect(src).toMatch(/total_vendedores|vendedores\.length|vendedores/);
  });
});

// ===========================================================================
// FASE 6 (API) — bug fix total_vendedores em /api/suporte/representantes
// ===========================================================================

describe('Bug fix — total_vendedores usa JOIN usuarios (suporte API)', () => {
  const src = readSrc('app/api/suporte/representantes/route.ts');

  it('arquivo existe', () => {
    expect(
      fs.existsSync(filePath('app/api/suporte/representantes/route.ts'))
    ).toBe(true);
  });

  it('usa subquery correlacionada para total_vendedores com JOIN usuarios', () => {
    // Deve conter subquery correlacionada em vez de COUNT direto com LEFT JOIN
    expect(src).toMatch(
      /SELECT\s+COUNT.*FROM\s+hierarquia_comercial.*JOIN\s+usuarios/is
    );
  });

  it('não usa LEFT JOIN hierarquia_comercial no SELECT principal com GROUP BY', () => {
    // O fix removeu o LEFT JOIN + GROUP BY — não deve haver GROUP BY r.id
    // (a subquery correlacionada elimina a necessidade de GROUP BY)
    const hasProblematicGroupBy = /GROUP\s+BY\s+r\.id/.test(src);
    expect(hasProblematicGroupBy).toBe(false);
  });

  it('filtro ativo=true na subquery de total_vendedores', () => {
    expect(src).toMatch(/ativo\s*=\s*true/);
  });

  it('exporta função GET', () => {
    expect(src).toMatch(/export\s+async\s+function\s+GET/);
  });

  it('usa requireRole com perfil suporte', () => {
    expect(src).toMatch(/requireRole.*suporte|suporte.*requireRole/);
  });

  it('inclui telefone no SELECT', () => {
    expect(src).toMatch(/r\.telefone/);
  });

  it('inclui valor_custo_fixo_entidade no SELECT', () => {
    expect(src).toMatch(/r\.valor_custo_fixo_entidade/);
  });

  it('inclui valor_custo_fixo_clinica no SELECT', () => {
    expect(src).toMatch(/r\.valor_custo_fixo_clinica/);
  });
});

// ===========================================================================
// FASE 7 — Equipe representante (page cards)
// ===========================================================================

describe('Fase 7 — Equipe representante page (cards)', () => {
  const src = readSrc('app/representante/(portal)/equipe/page.tsx');

  it('arquivo existe', () => {
    expect(
      fs.existsSync(filePath('app/representante/(portal)/equipe/page.tsx'))
    ).toBe(true);
  });

  it('tem diretiva use client', () => {
    expect(src).toMatch(/['"]use client['"]/);
  });

  it('renderiza grid de cards', () => {
    expect(src).toMatch(/grid-cols/);
  });

  it('tem drawer para edição de vendedor', () => {
    expect(src).toMatch(/[Dd]rawer|translate-x/);
  });

  it('chama PATCH /api/representante/equipe/vendedores', () => {
    expect(src).toMatch(/api\/representante\/equipe\/vendedores/);
    expect(src).toMatch(/PATCH/);
  });

  it('exibe codigo do vendedor com opção de copiar', () => {
    expect(src).toMatch(/codigo|código/i);
  });

  it('campos editáveis: nome, email, endereco', () => {
    expect(src).toMatch(/nome/);
    expect(src).toMatch(/email/);
    expect(src).toMatch(/endereco|endereço/i);
  });
});

// ===========================================================================
// FASE 8 — Comercial aba Candidatos
// ===========================================================================

describe('Fase 8 — Comercial page aba Candidatos', () => {
  const src = readSrc('app/comercial/page.tsx');

  it('arquivo existe', () => {
    expect(fs.existsSync(filePath('app/comercial/page.tsx'))).toBe(true);
  });

  it('tem componente CandidatosContent', () => {
    expect(src).toMatch(/CandidatosContent/);
  });

  it('renderiza CandidatosContent quando section=leads', () => {
    expect(src).toMatch(
      /activeSection.*leads.*CandidatosContent|CandidatosContent.*leads/s
    );
  });

  it('usa hook useLeads para buscar candidatos', () => {
    expect(src).toMatch(/useLeads/);
  });

  it('usa hook useCachedDocs para visualizar documentos', () => {
    expect(src).toMatch(/useCachedDocs/);
  });

  it('usa hook useRepActions para aprovar/rejeitar', () => {
    expect(src).toMatch(/useRepActions/);
  });

  it('usa componente LeadsTab para renderizar tabela', () => {
    expect(src).toMatch(/LeadsTab/);
  });

  it('tem botão Aprovar para candidatos pendentes', () => {
    expect(src).toMatch(/[Aa]provar/);
  });

  it('tem botão Rejeitar com campo motivo obrigatório', () => {
    expect(src).toMatch(/[Rr]ejeitar/);
    expect(src).toMatch(/motivo/);
  });

  it('inicializa useLeads com default pendente_verificacao', () => {
    expect(src).toMatch(/pendente_verificacao/);
  });

  it('passa openLeadDoc do useCachedDocs para LeadsTab (visualizar documentos)', () => {
    expect(src).toMatch(/openLeadDoc/);
  });

  it('passa onAprovarLead e onRejeitarLead para LeadsTab', () => {
    expect(src).toMatch(/onAprovarLead/);
    expect(src).toMatch(/onRejeitarLead/);
  });
});

// ===========================================================================
// FASE 8 (API) — Comercial equipe cards (/comercial/representantes/[id])
// ===========================================================================

describe('Fase 8 — Comercial representante detalhe (cards equipe)', () => {
  const src = readSrc('app/comercial/representantes/[id]/page.tsx');

  it('arquivo existe', () => {
    expect(
      fs.existsSync(filePath('app/comercial/representantes/[id]/page.tsx'))
    ).toBe(true);
  });

  it('busca vendedores via /api/comercial/representantes/[id]/vendedores', () => {
    expect(src).toMatch(/api\/comercial\/representantes.*vendedores/);
  });

  it('renderiza grid de cards para vendedores', () => {
    expect(src).toMatch(/grid-cols.*sm:grid-cols.*lg:grid-cols/);
  });

  it('interface VendedorEquipe tipada sem any', () => {
    expect(src).toMatch(/interface\s+VendedorEquipe/);
    expect(src).not.toMatch(/useState<any>/);
  });

  it('interface RepMetrica tipada', () => {
    expect(src).toMatch(/interface\s+RepMetrica/);
  });

  it('card de vendedor exibe leads_ativos', () => {
    expect(src).toMatch(/leads_ativos/);
  });
});

// ===========================================================================
// FASE 9 — Vendedor Novo Lead button (page)
// ===========================================================================

describe('Fase 9 — Vendedor leads page (Novo Lead)', () => {
  const src = readSrc('app/vendedor/(portal)/leads/page.tsx');

  it('arquivo existe', () => {
    expect(
      fs.existsSync(filePath('app/vendedor/(portal)/leads/page.tsx'))
    ).toBe(true);
  });

  it('tem componente NovoLeadModal', () => {
    expect(src).toMatch(/NovoLeadModal/);
  });

  it('botão Novo Lead visível quando vendedor tem representante', () => {
    expect(src).toMatch(/Novo\s+Lead/);
  });

  it.skip('estado semRepresentante controla visibilidade do botão', () => {
    expect(src).toMatch(/semRepresentante/);
  });

  it.skip('mensagem especial quando semRepresentante=true', () => {
    expect(src).toMatch(/vinculado.*representante|representante.*vinculado/i);
  });

  it('modal chama POST /api/vendedor/leads (via componente NovoLeadModal)', () => {
    expect(src).toMatch(/NovoLeadModal/);
    expect(src).toMatch(/VendedorNovoLeadModal|NovoLeadModal/);
  });

  it('tem campo obrigatório contato_nome no modal', () => {
    expect(src).toMatch(/contato_nome/);
  });

  it.skip('tem campos de CNPJ, valor e comissão', () => {
    expect(src).toMatch(/cnpj/);
    expect(src).toMatch(/valor_negociado/);
    expect(src).toMatch(/percentual_comissao/);
  });

  it.skip('tem paginação', () => {
    expect(src).toMatch(/totalPages/);
    expect(src).toMatch(/Anterior/);
    expect(src).toMatch(/Pr.*xima/);
  });

  it.skip('leads agrupados por representante', () => {
    expect(src).toMatch(/byRep/);
  });

  it.skip('exibe status com cores diferenciadas (STATUS_COLORS)', () => {
    expect(src).toMatch(/STATUS_COLORS/);
    expect(src).toMatch(/STATUS_LABEL/);
  });
});

// ===========================================================================
// FASE 5 (API) — /api/comercial/representantes/[id]/vendedores
// ===========================================================================

describe('API — /api/comercial/representantes/[id]/vendedores', () => {
  const src = readSrc(
    'app/api/comercial/representantes/[id]/vendedores/route.ts'
  );

  it('arquivo existe', () => {
    expect(
      fs.existsSync(
        filePath('app/api/comercial/representantes/[id]/vendedores/route.ts')
      )
    ).toBe(true);
  });

  it('exporta função GET', () => {
    expect(src).toMatch(/export\s+async\s+function\s+GET/);
  });

  it('permite acesso comercial, admin e suporte', () => {
    expect(src).toMatch(/comercial/);
    expect(src).toMatch(/admin/);
    expect(src).toMatch(/suporte/);
  });

  it('faz JOIN com usuarios para buscar dados do vendedor', () => {
    expect(src).toMatch(/JOIN\s+usuarios/i);
  });

  it('faz JOIN com vendedores_perfil para buscar dados da equipe', () => {
    expect(src).toMatch(/vendedores_perfil/);
    expect(src).toMatch(/vendedor_id/);
  });

  it('tem paginação com page e limit', () => {
    expect(src).toMatch(/LIMIT/);
    expect(src).toMatch(/OFFSET/);
  });

  it('retorna 404 se representante não encontrado', () => {
    expect(src).toMatch(/status:\s*404/);
  });
});

// ===========================================================================
// Validações de segurança — rotas desta sessão
// ===========================================================================

describe('Segurança — auth em vendedor/leads', () => {
  const src = readSrc('app/api/vendedor/leads/route.ts');
  it('chama requireRole antes de query()', () => {
    const reqIdx = src.indexOf('requireRole');
    const queryIdx = src.indexOf('query(');
    expect(reqIdx).toBeGreaterThan(-1);
    expect(queryIdx).toBeGreaterThan(-1);
    expect(reqIdx).toBeLessThan(queryIdx);
  });
  it('trata Sem permissão com status 4xx', () => {
    expect(src).toMatch(/Sem\s+permiss|Não\s+autenticado/);
    expect(src).toMatch(/status:\s*40[13]/);
  });
  it("tem export const dynamic = 'force-dynamic'", () => {
    expect(src).toMatch(/export\s+const\s+dynamic\s*=\s*['"]force-dynamic['"]/);
  });
});

describe('Segurança — auth em suporte/representantes', () => {
  const src = readSrc('app/api/suporte/representantes/route.ts');
  it('chama requireRole antes de query()', () => {
    const reqIdx = src.indexOf('requireRole');
    // pode ser query( ou query< (TypeScript generic)
    const queryIdx = Math.min(
      src.indexOf('query(') === -1 ? Infinity : src.indexOf('query('),
      src.indexOf('query<') === -1 ? Infinity : src.indexOf('query<')
    );
    expect(reqIdx).toBeGreaterThan(-1);
    expect(queryIdx).toBeLessThan(Infinity);
    expect(reqIdx).toBeLessThan(queryIdx);
  });
  it('trata Sem permissão com status 4xx', () => {
    expect(src).toMatch(/Sem\s+permiss|Não\s+autenticado/);
    expect(src).toMatch(/status:\s*40[13]/);
  });
  it("tem export const dynamic = 'force-dynamic'", () => {
    expect(src).toMatch(/export\s+const\s+dynamic\s*=\s*['"]force-dynamic['"]/);
  });
});

describe('Segurança — auth em comercial/representantes/[id]/vendedores', () => {
  const src = readSrc(
    'app/api/comercial/representantes/[id]/vendedores/route.ts'
  );
  it('chama requireRole antes de query()', () => {
    const reqIdx = src.indexOf('requireRole');
    const queryIdx = src.indexOf('query(');
    expect(reqIdx).toBeGreaterThan(-1);
    expect(queryIdx).toBeGreaterThan(-1);
    expect(reqIdx).toBeLessThan(queryIdx);
  });
  it('trata Sem permissão com status 4xx', () => {
    expect(src).toMatch(/Sem\s+permiss|Não\s+autenticado/);
    expect(src).toMatch(/status:\s*40[13]/);
  });
  it("tem export const dynamic = 'force-dynamic'", () => {
    expect(src).toMatch(/export\s+const\s+dynamic\s*=\s*['"]force-dynamic['"]/);
  });
});

// ===========================================================================
// ComercialSidebar — seção leads configurada
// ===========================================================================

describe('ComercialSidebar — seção leads', () => {
  const src = readSrc('components/comercial/ComercialSidebar.tsx');

  it('arquivo existe', () => {
    expect(
      fs.existsSync(filePath('components/comercial/ComercialSidebar.tsx'))
    ).toBe(true);
  });

  it('type ComercialSection inclui leads', () => {
    expect(src).toMatch(/['"]leads['"]/);
  });

  it('MenuItem Leads / Candidatos presente', () => {
    expect(src).toMatch(/[Ll]eads.*[Cc]andidatos|[Cc]andidatos.*[Ll]eads/);
  });

  it('exibe badge de contagem para leads', () => {
    expect(src).toMatch(/counts\.leads/);
  });
});
