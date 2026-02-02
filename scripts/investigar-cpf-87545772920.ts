/**
 * Script para investigar CPF 87545772920 que está causando erro
 */

import { query } from '@/lib/db';

async function investigarCPF() {
  const cpf = '87545772920';
  console.log(`🔍 Investigando CPF: ${cpf}\n`);

  // 1. Verificar em contratantes (responsável)
  console.log('1️⃣ Verificando em contratantes...');
  const contratantes = await query(
    `SELECT id, nome, cnpj, responsavel_cpf, responsavel_nome, tipo, ativo 
     FROM contratantes 
     WHERE responsavel_cpf = $1`,
    [cpf]
  );

  if (contratantes.rows.length > 0) {
    console.log(
      `   ✅ Encontrado ${contratantes.rows.length} contratante(s):\n`
    );
    for (const c of contratantes.rows) {
      console.log(`   📋 ID: ${c.id}`);
      console.log(`      Nome: ${c.nome}`);
      console.log(`      CNPJ: ${c.cnpj}`);
      console.log(`      Responsável: ${c.responsavel_nome}`);
      console.log(`      Tipo: ${c.tipo}`);
      console.log(`      Ativo: ${c.ativo}\n`);
    }
  } else {
    console.log('   ❌ Não encontrado em contratantes\n');
  }

  // 2. Verificar em contratantes_senhas
  console.log('2️⃣ Verificando em contratantes_senhas...');
  const senhas = await query(
    'SELECT contratante_id, cpf, LENGTH(senha_hash) as senha_len FROM contratantes_senhas WHERE cpf = $1',
    [cpf]
  );

  if (senhas.rows.length > 0) {
    console.log(`   ✅ Encontrado ${senhas.rows.length} registro(s):\n`);
    for (const s of senhas.rows) {
      console.log(`   🔐 Contratante ID: ${s.contratante_id}`);
      console.log(`      Senha hash length: ${s.senha_len} chars\n`);
    }
  } else {
    console.log('   ❌ Não encontrado em contratantes_senhas\n');
  }

  // 3. Verificar em funcionarios
  console.log('3️⃣ Verificando em funcionarios...');
  const funcionarios = await query(
    'SELECT id, cpf, nome, usuario_tipo, perfil, ativo, contratante_id FROM funcionarios WHERE cpf = $1',
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
      console.log(`      Contratante ID: ${f.contratante_id}\n`);
    }
  } else {
    console.log('   ❌ Não encontrado em funcionarios\n');
  }

  // 4. Se existe contratante mas não existe funcionário, sugerir criação
  if (contratantes.rows.length > 0 && funcionarios.rows.length === 0) {
    console.log('⚠️  PROBLEMA IDENTIFICADO:');
    console.log(
      '   O CPF é responsável por um contratante, mas não existe em funcionarios!'
    );
    console.log('   Isso impede o login do gestor.\n');

    const contratante = contratantes.rows[0];
    console.log(
      '💡 SOLUÇÃO: Executar criarContaResponsavel() para este contratante\n'
    );

    // Importar e executar
    const { criarContaResponsavel } = await import('@/lib/db');

    console.log(`🔧 Criando conta para contratante ID ${contratante.id}...`);

    try {
      await criarContaResponsavel(contratante.id);
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
