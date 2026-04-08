/**
 * Testes de regressão — Correção 08/04/2026
 * Nome completo no Passo 4 (Níveis de Cargo)
 *
 * Contexto: Nomes de funcionários apareciam abreviados ("P. A.") na tela de
 * classificação de nível, mesmo quando a planilha continha o nome completo.
 *
 * Correções aplicadas em app/api/rh/importacao/validate/route.ts:
 *  1. A planilha agora sempre tem prioridade quando o nome não está vazio e
 *     não parece um padrão de iniciais.
 *  2. A regex de detecção de iniciais foi ampliada para cobrir "J.S.", "J. S.",
 *     "P.A.C.", "P. A. C." etc. (qualquer cadeia de letra+ponto+espaço opcional).
 *  3. A deduplicação passou a usar CPF em vez de nomeMascarado, evitando
 *     colisões quando dois funcionários têm as mesmas iniciais.
 */

// ===========================================================================
// 1. Lógica de seleção de nome (replicada dos loops do validate/route.ts)
// ===========================================================================

/**
 * Replica a lógica de seleção de nome usada em ambos os blocos
 * (mudancaRole + mudancaNivel) do validate/route.ts após a correção.
 */
function selecionarNomeCompleto(nomePlanilha: string, nomeDb: string): string {
  const pareceIniciais = /^([A-Za-zÀ-ÿ]\.\s*){2,}$/.test(nomePlanilha.trim());
  if (!nomePlanilha) return nomeDb;
  if (pareceIniciais) return nomeDb || nomePlanilha;
  return nomePlanilha;
}

// ===========================================================================
// 2. Lógica de detecção de padrão de iniciais (regex expandida)
// ===========================================================================

function pareceIniciaisNome(nome: string): boolean {
  return /^([A-Za-zÀ-ÿ]\.\s*){2,}$/.test(nome.trim());
}

// ===========================================================================
// Testes — detecção de padrão de iniciais
// ===========================================================================

describe('pareceIniciaisNome — regex ampliada', () => {
  // Positivos — deve detectar como iniciais
  it('detecta "P. A." como iniciais', () => {
    expect(pareceIniciaisNome('P. A.')).toBe(true);
  });

  it('detecta "J.S." como iniciais (sem espaço)', () => {
    expect(pareceIniciaisNome('J.S.')).toBe(true);
  });

  it('detecta "P. A. C." como iniciais (três letras)', () => {
    expect(pareceIniciaisNome('P. A. C.')).toBe(true);
  });

  it('detecta "M.L.S." como iniciais (sem espaços)', () => {
    expect(pareceIniciaisNome('M.L.S.')).toBe(true);
  });

  it('detecta "j. s." como iniciais (minúsculas)', () => {
    expect(pareceIniciaisNome('j. s.')).toBe(true);
  });

  // Negativos — NÃO deve detectar nomes reais como iniciais
  it('NÃO detecta "Pedro Alcantara" como iniciais', () => {
    expect(pareceIniciaisNome('Pedro Alcantara')).toBe(false);
  });

  it('NÃO detecta "José da Silva" como iniciais', () => {
    expect(pareceIniciaisNome('José da Silva')).toBe(false);
  });

  it('NÃO detecta "Maria" como iniciais (apenas uma parte)', () => {
    // Precisa de {2,} grupos
    expect(pareceIniciaisNome('M.')).toBe(false);
  });

  it('NÃO detecta string vazia como iniciais', () => {
    expect(pareceIniciaisNome('')).toBe(false);
  });

  it('NÃO detecta "Ana Lima" como iniciais', () => {
    expect(pareceIniciaisNome('Ana Lima')).toBe(false);
  });

  it('NÃO detecta "pedro pipoip" como iniciais', () => {
    expect(pareceIniciaisNome('pedro pipoip')).toBe(false);
  });

  it('NÃO detecta "jose test fi" como iniciais', () => {
    expect(pareceIniciaisNome('jose test fi')).toBe(false);
  });
});

// ===========================================================================
// Testes — seleção de nome completo
// ===========================================================================

describe('selecionarNomeCompleto — planilha tem prioridade sobre DB', () => {
  it('usa planilha quando nome está por extenso', () => {
    const resultado = selecionarNomeCompleto('Pedro Alcantara', 'P. A.');
    expect(resultado).toBe('Pedro Alcantara');
  });

  it('usa planilha mesmo que DB tenha nome diferente', () => {
    const resultado = selecionarNomeCompleto('Maria da Silva', 'Maria Silva');
    expect(resultado).toBe('Maria da Silva');
  });

  it('usa DB quando planilha parece iniciais e DB está disponível', () => {
    const resultado = selecionarNomeCompleto('P. A.', 'Pedro Alcantara');
    expect(resultado).toBe('Pedro Alcantara');
  });

  it('usa planilha como fallback quando planilha é iniciais mas DB está vazio', () => {
    const resultado = selecionarNomeCompleto('P. A.', '');
    expect(resultado).toBe('P. A.');
  });

  it('usa DB quando planilha está vazia', () => {
    const resultado = selecionarNomeCompleto('', 'João Silva');
    expect(resultado).toBe('João Silva');
  });

  it('retorna string vazia quando ambos estão vazios', () => {
    const resultado = selecionarNomeCompleto('', '');
    expect(resultado).toBe('');
  });

  it('usa planilha "jose test fi" sem modificação', () => {
    const resultado = selecionarNomeCompleto('jose test fi', 'J. t.');
    expect(resultado).toBe('jose test fi');
  });

  it('usa planilha "pedro pipoip" sem modificação', () => {
    const resultado = selecionarNomeCompleto('pedro pipoip', 'P. p.');
    expect(resultado).toBe('pedro pipoip');
  });

  it('usa planilha quando DB e planilha têm o mesmo comprimento', () => {
    // Comportamento antigo (length comparison) falhava aqui — agora corrigido
    const resultado = selecionarNomeCompleto('Pedro Costa', 'PEDRO COSTA');
    expect(resultado).toBe('Pedro Costa');
  });

  it('usa planilha "J.S." como iniciais? — não, fallback para DB', () => {
    const resultado = selecionarNomeCompleto('J.S.', 'João Silva');
    expect(resultado).toBe('João Silva');
  });
});

// ===========================================================================
// 3. Deduplicação por CPF (nova lógica vs. antiga)
// ===========================================================================

type MudancaRoleDetalhe = {
  nome: string;
  funcaoAnterior: string;
  nivelAtual: 'gestao' | 'operacional' | null;
  empresa: string;
};

/**
 * Replica a nova lógica de deduplicação por CPF do validate/route.ts.
 * Usa um Set<string> de CPFs visitados por funcao em vez de comparar nomeMascarado.
 */
function coletarComDedupCPF(
  linhasValidas: Array<{ cpf?: string; funcao?: string; nome?: string }>,
  existingFuncaoMap: Map<string, string>,
  existingNivelCargoMap: Map<string, string | null>,
  existingNomeMap: Map<string, string>,
  existingEmpresaMap: Map<string, string>
): Map<string, MudancaRoleDetalhe[]> {
  function limparCPF(cpf: string) {
    return cpf.replace(/\D/g, '');
  }

  const result = new Map<string, MudancaRoleDetalhe[]>();
  const cpfsAdicionados = new Map<string, Set<string>>();

  for (const row of linhasValidas) {
    const cpf = limparCPF(row.cpf ?? '');
    const novaFuncao = (row.funcao ?? '').trim();
    if (
      !novaFuncao ||
      novaFuncao === 'Não informado' ||
      !existingFuncaoMap.has(cpf)
    )
      continue;
    const funcaoAtual = (existingFuncaoMap.get(cpf) ?? '').trim();
    if (funcaoAtual === novaFuncao) continue;

    const nomePlanilha = (row.nome ?? '').trim();
    const nomeDb = existingNomeMap.get(cpf) || '';
    const nomeCompleto = selecionarNomeCompleto(nomePlanilha, nomeDb);

    const nivelRaw = existingNivelCargoMap.get(cpf) ?? null;
    const nivelAtual =
      nivelRaw === 'gestao' || nivelRaw === 'operacional' ? nivelRaw : null;

    if (!result.has(novaFuncao)) result.set(novaFuncao, []);
    if (!cpfsAdicionados.has(novaFuncao))
      cpfsAdicionados.set(novaFuncao, new Set());

    const cpfsSet = cpfsAdicionados.get(novaFuncao);
    if (!cpfsSet.has(cpf)) {
      cpfsSet.add(cpf);
      result.get(novaFuncao).push({
        nome: nomeCompleto,
        funcaoAnterior: funcaoAtual,
        nivelAtual,
        empresa: existingEmpresaMap.get(cpf) ?? '',
      });
    }
  }
  return result;
}

describe('deduplicação por CPF (nova lógica)', () => {
  it('remove duplicatas mesmo quando dois funcionários têm as mesmas iniciais', () => {
    // "Pedro Alves" e "Paulo Andrade" → ambos "P. A." → ANTIGA lógica filtrava Paulo
    // Nova lógica usa CPF → cada um entra corretamente
    const funcaoMap = new Map([
      ['11111111111', 'AUXILIAR'],
      ['22222222222', 'AUXILIAR'],
    ]);
    const nivelMap = new Map<string, string | null>([
      ['11111111111', 'operacional'],
      ['22222222222', 'gestao'],
    ]);
    const nomeMap = new Map<string, string>(); // banco vazio — usa planilha
    const empresaMap = new Map<string, string>();
    const linhas = [
      { cpf: '111.111.111-11', funcao: 'ANALISTA', nome: 'Pedro Alves' },
      { cpf: '222.222.222-22', funcao: 'ANALISTA', nome: 'Paulo Andrade' },
    ];

    const result = coletarComDedupCPF(
      linhas,
      funcaoMap,
      nivelMap,
      nomeMap,
      empresaMap
    );
    const lista = result.get('ANALISTA');

    // Ambos devem aparecer pois têm CPFs diferentes
    expect(lista).toHaveLength(2);
    expect(lista.map((d) => d.nome)).toEqual(
      expect.arrayContaining(['Pedro Alves', 'Paulo Andrade'])
    );
  });

  it('dedup por CPF corretamente remove o mesmo funcionário em linhas duplicadas', () => {
    const funcaoMap = new Map([['12345678901', 'AUXILIAR']]);
    const nivelMap = new Map<string, string | null>([
      ['12345678901', 'operacional'],
    ]);
    const nomeMap = new Map<string, string>();
    const empresaMap = new Map<string, string>();
    const linhas = [
      { cpf: '123.456.789-01', funcao: 'GERENTE', nome: 'João Silva' },
      { cpf: '123.456.789-01', funcao: 'GERENTE', nome: 'João Silva' }, // linha duplicada
    ];

    const result = coletarComDedupCPF(
      linhas,
      funcaoMap,
      nivelMap,
      nomeMap,
      empresaMap
    );
    expect(result.get('GERENTE')).toHaveLength(1);
  });

  it('usa nome da planilha por extenso mesmo quando DB está vazio', () => {
    const funcaoMap = new Map([['12345678901', 'MOTORISTA']]);
    const nivelMap = new Map<string, string | null>([['12345678901', null]]);
    const nomeMap = new Map<string, string>(); // sem nome no banco
    const empresaMap = new Map<string, string>();
    const linhas = [
      { cpf: '123.456.789-01', funcao: 'SUPERVISOR', nome: 'Pedro Alcantara' },
    ];

    const result = coletarComDedupCPF(
      linhas,
      funcaoMap,
      nivelMap,
      nomeMap,
      empresaMap
    );
    const detalhe = result.get('SUPERVISOR')[0];
    expect(detalhe.nome).toBe('Pedro Alcantara');
  });

  it('usa planilha "pedro pipoip" e não usa DB abreviado', () => {
    const funcaoMap = new Map([['98765432100', 'CAIXA']]);
    const nivelMap = new Map<string, string | null>([
      ['98765432100', 'operacional'],
    ]);
    const nomeMap = new Map([['98765432100', 'P. p.']]); // DB com iniciais erradas
    const empresaMap = new Map<string, string>();
    const linhas = [
      { cpf: '987.654.321-00', funcao: 'LIDER', nome: 'pedro pipoip' },
    ];

    const result = coletarComDedupCPF(
      linhas,
      funcaoMap,
      nivelMap,
      nomeMap,
      empresaMap
    );
    const detalhe = result.get('LIDER')[0];
    // Planilha tem "pedro pipoip" → não são iniciais → deve usar planilha
    expect(detalhe.nome).toBe('pedro pipoip');
  });
});
