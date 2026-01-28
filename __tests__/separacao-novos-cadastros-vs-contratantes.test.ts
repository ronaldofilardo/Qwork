/**
 * Teste de validação: contratantes pendentes não devem aparecer em "Contratantes"
 * Devem aparecer apenas em "Novos Cadastros"
 */

import { query } from '@/lib/db';

describe('Separação Novos Cadastros vs Contratantes Aprovados', () => {
  it('contratantes pendentes não devem aparecer na listagem de contratantes', async () => {
    // Query da página "Contratantes" (após correção)
    const contratantesAprovados = await query(
      `SELECT * FROM contratantes 
       WHERE tipo = 'clinica'
       AND status NOT IN ('pendente', 'em_reanalise', 'aguardando_pagamento')
       ORDER BY nome`
    );

    // Query da página "Novos Cadastros"
    const novosCadastros = await query(
      `SELECT * FROM contratantes 
       WHERE status IN ('pendente', 'em_reanalise', 'aguardando_pagamento')
       ORDER BY criado_em DESC`
    );

    console.log('\n=== CONTRATANTES APROVADOS (Página "Contratantes") ===');
    console.log(`Total: ${contratantesAprovados.rows.length}`);
    contratantesAprovados.rows.forEach((c) => {
      console.log(
        `  - ID ${c.id}: ${c.nome} (${c.cnpj}) - Status: ${c.status}, Ativa: ${c.ativa}`
      );
    });

    console.log(
      '\n=== NOVOS CADASTROS PENDENTES (Página "Novos Cadastros") ==='
    );
    console.log(`Total: ${novosCadastros.rows.length}`);
    novosCadastros.rows.forEach((c) => {
      console.log(
        `  - ID ${c.id}: ${c.nome} (${c.cnpj}) - Status: ${c.status}, Ativa: ${c.ativa}`
      );
    });

    // Validações
    expect(contratantesAprovados.rows).toBeDefined();
    expect(novosCadastros.rows).toBeDefined();

    // Contratante ID 68 (sgaji poi po - CNPJ 47742639000106) deve estar APENAS em novos cadastros
    const cnpjAlvo = '47742639000106';
    const emContratantes = contratantesAprovados.rows.find(
      (c) => c.cnpj === cnpjAlvo
    );
    const emNovosCadastros = novosCadastros.rows.find(
      (c) => c.cnpj === cnpjAlvo
    );

    console.log(`\n=== VALIDAÇÃO: ${cnpjAlvo} ===`);
    console.log(
      `Aparece em "Contratantes": ${emContratantes ? 'SIM ❌' : 'NÃO ✅'}`
    );
    console.log(
      `Aparece em "Novos Cadastros": ${emNovosCadastros ? 'SIM ✅' : 'NÃO ❌'}`
    );

    expect(emContratantes).toBeUndefined(); // NÃO deve estar em contratantes
    expect(emNovosCadastros).toBeDefined(); // DEVE estar em novos cadastros
    expect(emNovosCadastros?.status).toBe('pendente');

    // Nenhum contratante aprovado deve ter status pendente
    const pendentesEmContratantes = contratantesAprovados.rows.filter((c) =>
      ['pendente', 'em_reanalise', 'aguardando_pagamento'].includes(c.status)
    );
    console.log(`\n=== VALIDAÇÃO: Pendentes em "Contratantes" ===`);
    console.log(`Total: ${pendentesEmContratantes.length} (deve ser 0)`);
    expect(pendentesEmContratantes).toHaveLength(0);

    // Todos os novos cadastros devem ter status pendente/reanalise/aguardando
    const statusInvalidos = novosCadastros.rows.filter(
      (c) =>
        !['pendente', 'em_reanalise', 'aguardando_pagamento'].includes(c.status)
    );
    console.log(`\n=== VALIDAÇÃO: Status inválidos em "Novos Cadastros" ===`);
    console.log(`Total: ${statusInvalidos.length} (deve ser 0)`);
    expect(statusInvalidos).toHaveLength(0);
  });

  it('contratantes personalizados pendentes devem aparecer em novos cadastros com dados completos', async () => {
    const personalizadosPendentes = await query(
      `SELECT 
        c.id, c.nome, c.cnpj, c.status, c.ativa,
        cp.id as contratacao_id,
        cp.status as contratacao_status,
        cp.numero_funcionarios_estimado
      FROM contratantes c
      LEFT JOIN contratacao_personalizada cp ON c.id = cp.contratante_id
      WHERE c.status = 'pendente'
        AND cp.status = 'aguardando_valor_admin'
      ORDER BY c.criado_em DESC`
    );

    console.log('\n=== PERSONALIZADOS PENDENTES ===');
    console.log(`Total: ${personalizadosPendentes.rows.length}`);
    personalizadosPendentes.rows.forEach((c) => {
      console.log(`  - ID ${c.id}: ${c.nome} (${c.cnpj})`);
      console.log(
        `    Contratação ID: ${c.contratacao_id}, Status: ${c.contratacao_status}`
      );
      console.log(
        `    Funcionários estimados: ${c.numero_funcionarios_estimado}`
      );
      console.log(`    Ativa: ${c.ativa} (deve ser false até aprovação)`);
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
