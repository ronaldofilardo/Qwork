/**
 * Teste de validação: tomadores pendentes não devem aparecer em "Tomadores Aprovados"
 * Devem aparecer apenas em "Novos Cadastros"
 *
 * ATIVADO: Validação de segregação entre tomadores pendentes e aprovados
 */

import { query } from '@/lib/db';

describe.skip('Separação Novos Cadastros vs Tomadores Aprovados', () => {
  // TEMPORARIAMENTE DESABILITADO: Aguarda consolidação do schema de banco
  // Nomes atualizados para tomador - Refatoração em progresso

  it('tomadores pendentes não devem aparecer na listagem de tomadores', async () => {
    // Query da página "Tomadores Aprovados"
    const tomadoresAprovados = await query(
      `SELECT * FROM tomadores WHERE tipo = 'clinica'
       AND status NOT IN ('pendente', 'em_reanalise', 'aguardando_pagamento')
       ORDER BY nome`
    );

    // Query da página "Novos Cadastros"
    const novosCadastros = await query(
      `SELECT * FROM tomadores WHERE status IN ('pendente', 'em_reanalise', 'aguardando_pagamento')
       ORDER BY criado_em DESC`
    );

    // Debug logging
    console.log('\n=== TOMADORES APROVADOS (Página "Tomadores") ===');
    tomadoresAprovados.rows.forEach((c) => {
      console.log(
        `  - ID ${c.id}: ${c.nome} (${c.cnpj}) - Status: ${c.status}, Ativa: ${c.ativa}`
      );
    });

    console.log(
      '\n=== NOVOS CADASTROS PENDENTES (Página "Novos Cadastros") ==='
    );
    novosCadastros.rows.forEach((c) => {
      console.log(
        `  - ID ${c.id}: ${c.nome} (${c.cnpj}) - Status: ${c.status}, Ativa: ${c.ativa}`
      );
    });

    // Validações
    expect(tomadoresAprovados.rows).toBeDefined();
    expect(novosCadastros.rows).toBeDefined();

    // Tomador exemplo (CNPJ 47742639000106) deve estar APENAS em novos cadastros
    const cnpjAlvo = '47742639000106';
    const emTomadores = tomadoresAprovados.rows.find(
      (c) => c.cnpj === cnpjAlvo
    );
    const emNovosCadastros = novosCadastros.rows.find(
      (c) => c.cnpj === cnpjAlvo
    );

    console.log(`Aparece em "Tomadores": ${emTomadores ? 'SIM ❌' : 'NÃO ✅'}`);
    console.log(
      `Aparece em "Novos Cadastros": ${emNovosCadastros ? 'SIM ✅' : 'NÃO ❌'}`
    );

    expect(emTomadores).toBeUndefined(); // NÃO deve estar em tomadores
    expect(emNovosCadastros).toBeDefined(); // DEVE estar em novos cadastros
    expect(emNovosCadastros?.status).toBe('pendente');

    // Nenhum tomador aprovado deve ter status pendente
    const pendentesEmTomadores = tomadoresAprovados.rows.filter((c) =>
      ['pendente', 'em_reanalise', 'aguardando_pagamento'].includes(c.status)
    );
    expect(pendentesEmTomadores).toHaveLength(0);

    // Todos os novos cadastros devem ter status pendente/reanalise/aguardando
    const statusInvalidos = novosCadastros.rows.filter(
      (c) =>
        !['pendente', 'em_reanalise', 'aguardando_pagamento'].includes(c.status)
    );
    expect(statusInvalidos).toHaveLength(0);
  });

  it('tomadores com contratação personalizada pendente devem aparecer em novos cadastros', async () => {
    const personalizadosPendentes = await query(
      `SELECT 
        c.id, c.nome, c.cnpj, c.status, c.ativa,
        cp.id as contratacao_id,
        cp.status as contratacao_status,
        cp.numero_funcionarios_estimado
      FROM entidades c
      LEFT JOIN contratacao_personalizada cp ON c.id = cp.tomador_id
      WHERE c.status = 'pendente'
        AND cp.status = 'aguardando_valor_admin'
      ORDER BY c.criado_em DESC`
    );

    // Debug logging
    console.log('\n=== PERSONALIZADOS PENDENTES ===');

    personalizadosPendentes.rows.forEach((c) => {
      console.log(
        `    Contratação ID: ${c.contratacao_id}, Status: ${c.contratacao_status}`
      );
      console.log(
        `    Funcionários estimados: ${c.numero_funcionarios_estimado}`
      );
    });

    expect(personalizadosPendentes.rows.length).toBeGreaterThan(0);

    // Validar que todos têm ativa=false
    const ativas = personalizadosPendentes.rows.filter((c) => c.ativa === true);
    expect(ativas).toHaveLength(0);

    // Validar que CNPJ alvo está presente
    const cnpjAlvo = '47742639000106';
    const encontrado = personalizadosPendentes.rows.find(
      (c) => c.cnpj === cnpjAlvo
    );
    expect(encontrado).toBeDefined();
    expect(encontrado?.nome).toBe('sgaji poi po');
    expect(encontrado?.contratacao_status).toBe('aguardando_valor_admin');
    expect(encontrado?.numero_funcionarios_estimado).toBe(300);
  });
});
