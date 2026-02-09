require('dotenv').config({ path: '.env.local' });
const { query } = require('../../lib/db');

(async () => {
  try {
    console.log('\n🔍 DIAGNÓSTICO: Contratante ID 3 no Neon\n');
    console.log('='.repeat(70));

    const r = await query(
      'SELECT id, responsavel_cpf, responsavel_nome, tipo, ativa, pagamento_confirmado FROM tomadores WHERE id = 3'
    );

    if (r.rows.length === 0) {
      console.log('❌ Contratante 3 NÃO EXISTE no banco');

      // Listar tomadores disponíveis
      const todos = await query(
        'SELECT id, responsavel_nome, tipo FROM tomadores ORDER BY id'
      );
      console.log('\n📋 tomadores disponíveis:');
      todos.rows.forEach((c) =>
        console.log(`   - ID ${c.id}: ${c.responsavel_nome} (${c.tipo})`)
      );
      process.exit(1);
    }

    const contratante = r.rows[0];
    console.log('\n✅ Contratante 3 encontrado:');
    console.log('   ID:', contratante.id);
    console.log('   Nome:', contratante.responsavel_nome);
    console.log('   CPF:', contratante.responsavel_cpf);
    console.log('   Tipo:', contratante.tipo);
    console.log('   Ativa:', contratante.ativa);
    console.log('   Pagamento confirmado:', contratante.pagamento_confirmado);

    const c = await query(
      'SELECT id, nome, contratante_id, ativa FROM clinicas WHERE contratante_id = 3'
    );

    console.log('\n📋 Clínicas associadas:', c.rows.length);
    if (c.rows.length === 0) {
      console.log('   ❌ NENHUMA clínica criada para contratante_id = 3');
      console.log(
        '   🔧 ESTE É O PROBLEMA: RH precisa de uma entrada em "clinicas"'
      );
    } else {
      c.rows.forEach((cl) => {
        console.log(
          `   - Clínica ID ${cl.id}: ${cl.nome} (ativa: ${cl.ativa})`
        );
      });
    }

    const f = await query(
      'SELECT cpf, nome, perfil, contratante_id, clinica_id, ativo FROM funcionarios WHERE cpf = $1',
      [contratante.responsavel_cpf]
    );

    console.log('\n👤 Funcionário responsável:', f.rows.length);
    if (f.rows.length === 0) {
      console.log('   ⚠️ Responsável não tem registro em funcionarios');
    } else {
      const func = f.rows[0];
      console.log('   CPF:', func.cpf);
      console.log('   Nome:', func.nome);
      console.log('   Perfil:', func.perfil);
      console.log('   contratante_id:', func.contratante_id);
      console.log('   clinica_id:', func.clinica_id || '❌ NULL');
      console.log('   Ativo:', func.ativo);
    }

    // Verificar histórico de ativação
    const audit = await query(
      `SELECT acao, criado_em, metadados 
       FROM auditoria 
       WHERE entidade_id = 3 
       AND entidade_tipo = 'contratante'
       AND acao IN ('ativar_contratante', 'aprovar_contratante', 'pagamento_confirmado')
       ORDER BY criado_em DESC 
       LIMIT 5`
    );

    console.log('\n📜 Histórico de ativação:');
    if (audit.rows.length === 0) {
      console.log('   ⚠️ Sem registros de ativação/aprovação');
    } else {
      audit.rows.forEach((a) => {
        console.log(`   - ${a.acao} em ${a.criado_em}`);
        if (a.metadados) {
          console.log(`     Metadados: ${JSON.stringify(a.metadados)}`);
        }
      });
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n');
  } catch (err) {
    console.error('\n❌ Erro:', err.message);
    process.exit(1);
  }
})();
