#!/usr/bin/env node

/**
 * Script para corrigir senha de funcionário baseada em data de nascimento
 *
 * Uso: node scripts/fix-funcionario-senha.mjs <cpf> [data_nascimento]
 */

import bcryptjs from 'bcryptjs';
import pkg from 'pg';
const { Pool } = pkg;

// Gerar senha a partir de data de nascimento
function gerarSenhaDeNascimento(dataNascimento) {
  if (!dataNascimento || typeof dataNascimento !== 'string') {
    throw new Error('Data de nascimento é obrigatória');
  }

  let dia, mes, ano;
  const entrada = dataNascimento.trim();

  if (entrada.includes('/')) {
    const partes = entrada.split('/');
    if (partes.length !== 3) throw new Error('Formato inválido DD/MM/YYYY');
    dia = partes[0].padStart(2, '0');
    mes = partes[1].padStart(2, '0');
    ano = partes[2];

    if (ano.length === 2) {
      const anoNum = parseInt(ano, 10);
      ano = anoNum >= 0 && anoNum <= 30 ? `20${ano}` : `19${ano}`;
    }
  } else if (entrada.includes('-')) {
    const partes = entrada.split('-');
    if (partes.length !== 3) throw new Error('Formato inválido YYYY-MM-DD');
    ano = partes[0];
    mes = partes[1].padStart(2, '0');
    dia = partes[2].padStart(2, '0');
  } else if (/^\d{8}$/.test(entrada)) {
    const primeirosPrimeiros4 = parseInt(entrada.substring(0, 4), 10);
    const anoAtual = new Date().getFullYear();

    if (primeirosPrimeiros4 >= 1900 && primeirosPrimeiros4 <= anoAtual) {
      ano = entrada.substring(0, 4);
      mes = entrada.substring(4, 6).padStart(2, '0');
      dia = entrada.substring(6, 8).padStart(2, '0');
    } else {
      dia = entrada.substring(0, 2).padStart(2, '0');
      mes = entrada.substring(2, 4).padStart(2, '0');
      ano = entrada.substring(4, 8);
    }
  } else {
    throw new Error('Formato inválido. Use DD/MM/YYYY, YYYY-MM-DD ou DDMMYYYY');
  }

  return `${dia}${mes}${ano}`;
}

async function fixSenha() {
  const cpf = process.argv[2];
  const dataNascimentoArg = process.argv[3];

  if (!cpf) {
    console.error('❌ CPF é obrigatório');
    console.error(
      'Uso: node scripts/fix-funcionario-senha.mjs <cpf> [data_nascimento]'
    );
    process.exit(1);
  }

  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL ||
      'postgresql://postgres:123456@localhost:5432/nr-bps_db',
  });

  try {
    // 1. Desabilitar RLS temporariamente (admin script - usar CPF admin padrão)
    await pool.query('SET SESSION "app.current_user_cpf" = \'00000000000\'');

    // 2. Buscar dados do funcionário
    const result = await pool.query(
      'SELECT id, cpf, nome, data_nascimento, senha_hash FROM funcionarios WHERE cpf = $1',
      [cpf]
    );

    if (result.rows.length === 0) {
      console.error(`❌ Funcionário com CPF ${cpf} não encontrado`);
      process.exit(1);
    }

    const funcionario = result.rows[0];
    const dataNascimento = dataNascimentoArg || funcionario.data_nascimento;

    if (!dataNascimento) {
      console.error(
        '❌ Data de nascimento não encontrada no banco e não foi fornecida'
      );
      process.exit(1);
    }

    console.log(`\n📋 Funcionário encontrado:`);
    console.log(`   CPF: ${funcionario.cpf}`);
    console.log(`   Nome: ${funcionario.nome}`);
    console.log(`   Data Nascimento: ${dataNascimento}`);
    console.log(
      `   Senha Hash Atual: ${funcionario.senha_hash?.substring(0, 30)}...`
    );

    // 2. Gerar senha a partir de data de nascimento
    const senhaGerada = gerarSenhaDeNascimento(dataNascimento);
    console.log(`\n🔐 Senha gerada: ${senhaGerada}`);

    // 3. Criar novo hash
    const novoHash = await bcryptjs.hash(senhaGerada, 10);
    console.log(`🔒 Novo hash: ${novoHash.substring(0, 30)}...`);

    // 4. Atualizar no banco
    const updateResult = await pool.query(
      'UPDATE funcionarios SET senha_hash = $1, atualizado_em = NOW() WHERE cpf = $2 RETURNING cpf, senha_hash',
      [novoHash, cpf]
    );

    console.log(`\n✅ Senha atualizada com sucesso!`);
    console.log(`   CPF: ${updateResult.rows[0].cpf}`);
    console.log(
      `   Novo hash: ${updateResult.rows[0].senha_hash.substring(0, 30)}...`
    );

    console.log(`\n🎯 Próximos passos:`);
    console.log(`   1. Fazer login com CPF: ${cpf}`);
    console.log(`   2. Usar data de nascimento: ${dataNascimento}`);
    console.log(
      `   3. A senha será gerada automaticamente como: ${senhaGerada}`
    );

    await pool.end();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    await pool.end();
    process.exit(1);
  }
}

fixSenha();
