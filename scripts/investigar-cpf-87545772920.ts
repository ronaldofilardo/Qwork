/**
 * Script para investigar CPF 87545772920 que está causando erro
 */

import { query } from '@/lib/db';

async function investigarCPF() {
  const cpf = '87545772920';
  console.log(`🔍 Investigando CPF: ${cpf}\n`);

  // 1. Verificar em tomadors (responsável)
  console.log('1️⃣ Verificando em tomadors...');
  const tomadors = await query(
    `SELECT id, nome, cnpj, responsavel_cpf, responsavel_nome, tipo, ativo 
     FROM tomadors 
     WHERE responsavel_cpf = $1`,
    [cpf]
  );

  if (tomadors.rows.length > 0) {
    console.log(
      `   ✅ Encontrado ${tomadors.rows.length} tomador(s):\n`
    );
    for (const c of tomadors.rows) {
      console.log(`   📋 ID: ${c.id}`);
      console.log(`      Nome: ${c.nome}`);
      console.log(`      CNPJ: ${c.cnpj}`);
      console.log(`      Responsável: ${c.responsavel_nome}`);
      console.log(`      Tipo: ${c.tipo}`);
      console.log(`      Ativo: ${c.ativo}\n`);
    }
  } else {
    console.log('   ❌ Não encontrado em tomadors\n');
  }

  // 2. Verificar em entidades_senhas
  console.log('2️⃣ Verificando em entidades_senhas...');
  const senhas = await query(
    'SELECT tomador_id, cpf, LENGTH(senha_hash) as senha_len FROM entidades_senhas WHERE cpf = $1',
    [cpf]
  );

  if (senhas.rows.length > 0) {
    console.log(`   ✅ Encontrado ${senhas.rows.length} registro(s):\n`);
    for (const s of senhas.rows) {
      console.log(`   🔐 tomador ID: ${s.tomador_id}`);
      console.log(`      Senha hash length: ${s.senha_len} chars\n`);
    }
  } else {
    console.log('   ❌ Não encontrado em entidades_senhas\n');
  }

  // 3. Verificar em funcionarios
  console.log('3️⃣ Verificando em funcionarios...');
  const funcionarios = await query(
    'SELECT id, cpf, nome, usuario_tipo, perfil, ativo, tomador_id FROM funcionarios WHERE cpf = $1',
    [cpf]
  );

  if (funcionarios.rows.length > 0) {
    console.log(`   ✅ Encontrado ${funcionarios.rows.length} registro(s):\n`);
    for (const f of funcionarios.rows) {
      console.log(`   👤 ID: ${f.id}`);
      console.log(`      Nome: ${f.nome}`);
      console.log(`      Tipo: ${f.usuario_tipo}`);
      console.log(`      Perfil: ${f.perfil}`);
      console.log(`      Ativo: ${f.ativo}`);
      console.log(`      tomador ID: ${f.tomador_id}\n`);
    }
  } else {
    console.log('   ❌ Não encontrado em funcionarios\n');
  }

  // 4. Se existe tomador mas não existe funcionário, sugerir criação
  if (tomadors.rows.length > 0 && funcionarios.rows.length === 0) {
    console.log('⚠️  PROBLEMA IDENTIFICADO:');
    console.log(
      '   O CPF é responsável por um tomador, mas não existe em funcionarios!'
    );
    console.log('   Isso impede o login do gestor.\n');

    const tomador = tomadors.rows[0];
    console.log(
      '💡 SOLUÇÃO: Executar criarContaResponsavel() para este tomador\n'
    );

    // Importar e executar
    const { criarContaResponsavel } = await import('@/lib/db');

    console.log(`🔧 Criando conta para tomador ID ${tomador.id}...`);

    try {
      await criarContaResponsavel(tomador.id);
      console.log('✅ Conta criada com sucesso!');

      // Verificar novamente
      console.log('\n4️⃣ Verificação pós-criação...');
      const verificacao = await query(
        'SELECT id, cpf, nome, usuario_tipo, perfil, ativo FROM funcionarios WHERE cpf = $1',
        [cpf]
      );

      if (verificacao.rows.length > 0) {
        const f = verificacao.rows[0];
        console.log('   ✅ Funcionário criado com sucesso!\n');
        console.log(`   👤 ID: ${f.id}`);
        console.log(`      Nome: ${f.nome}`);
        console.log(`      Tipo: ${f.usuario_tipo}`);
        console.log(`      Perfil: ${f.perfil}`);
        console.log(`      Ativo: ${f.ativo}`);
      }
    } catch (error: any) {
      console.error('❌ Erro ao criar conta:', error.message);
    }
  }
}

// Executar
(async () => {
  try {
    await investigarCPF();
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
})();
