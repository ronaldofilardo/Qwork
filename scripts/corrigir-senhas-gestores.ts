/**
 * Script de correção para funcionários gestores com senhas em texto plano
 *
 * PROBLEMA: Alguns funcionários (gestor/rh) foram criados com
 * senha em texto plano no campo senha_hash em vez de hash bcrypt
 *
 * SOLUÇÃO:
 * 1. Identificar funcionários com senha em texto plano (não começa com $2b$)
 * 2. Buscar a senha correta em entidades_senhas
 * 3. Atualizar funcionarios.senha_hash com o hash correto
 * 4. Garantir que usuario_tipo e perfil estão consistentes
 */

import { query } from '@/lib/db';

async function corrigirSenhasGestores() {
  console.log(
    '🔍 Verificando funcionários gestores com possíveis problemas...\n'
  );

  // 1. Buscar gestores com senha em texto plano (não começa com $2b$ que é bcrypt)
  const gestoresComProblema = await query(`
    SELECT 
      f.id,
      f.cpf,
      f.nome,
      f.email,
      f.usuario_tipo,
      f.perfil,
      f.contratante_id,
      f.senha_hash,
      f.ativo,
      LENGTH(f.senha_hash) as senha_len,
      SUBSTRING(f.senha_hash, 1, 4) as senha_prefix
    FROM usuarios f
    WHERE f.tipo_usuario IN ('gestor', 'rh')
      AND (
        f.senha_hash NOT LIKE '$2b$%' 
        OR LENGTH(f.senha_hash) < 50
      )
    ORDER BY f.cpf
  `);

  console.log(
    `📊 Encontrados ${gestoresComProblema.rows.length} gestores com possíveis problemas\n`
  );

  if (gestoresComProblema.rows.length === 0) {
    console.log('✅ Nenhum problema encontrado!');
    return;
  }

  // Exibir detalhes
  for (const gestor of gestoresComProblema.rows) {
    console.log(`\n👤 Gestor: ${gestor.nome} (CPF: ${gestor.cpf})`);
    console.log(`   Tipo: ${gestor.usuario_tipo} | Perfil: ${gestor.perfil}`);
    console.log(`   Ativo: ${gestor.ativo}`);
    console.log(
      `   Senha atual: ${gestor.senha_prefix}... (${gestor.senha_len} chars)`
    );
    console.log(`   Contratante ID: ${gestor.contratante_id}`);

    // Buscar senha correta em entidades_senhas
    const senhaCorreta = await query(
      'SELECT senha_hash FROM entidades_senhas WHERE cpf = $1 AND contratante_id = $2',
      [gestor.cpf, gestor.contratante_id]
    );

    if (senhaCorreta.rows.length > 0) {
      const hashCorreto = senhaCorreta.rows[0].senha_hash;
      console.log(
        `   ✅ Hash correto encontrado em entidades_senhas (${hashCorreto.length} chars)`
      );

      // Atualizar funcionarios com hash correto
      await query('UPDATE usuarios SET senha_hash = $1 WHERE id = $2', [
        hashCorreto,
        gestor.id,
      ]);
      console.log(`   ✅ Senha atualizada em usuarios com sucesso!`);
    } else {
      console.log(`   ⚠️  Hash não encontrado em entidades_senhas`);
      console.log(`   ℹ️  Será necessário recriar a senha para este gestor`);
    }

    // Verificar consistência perfil/usuario_tipo
    const tipoEsperado = gestor.usuario_tipo;
    if (gestor.perfil !== tipoEsperado) {
      console.log(
        `   ⚠️  Inconsistência: perfil="${gestor.perfil}" mas usuario_tipo="${gestor.usuario_tipo}"`
      );
      console.log(`   🔧 Corrigindo perfil para "${tipoEsperado}"...`);

      await query('UPDATE usuarios SET tipo_usuario = $1 WHERE id = $2', [
        tipoEsperado,
        gestor.id,
      ]);
      console.log(`   ✅ Tipo de usuário corrigido em usuarios!`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Correção concluída!');
  console.log('='.repeat(80));

  // Verificação final
  const verificacao = await query(`
    SELECT COUNT(*) as total
    FROM usuarios
    WHERE tipo_usuario IN ('gestor', 'rh')
      AND senha_hash LIKE '$2b$%'
      AND LENGTH(senha_hash) >= 50
  `);

  console.log(
    `\n📊 Gestores com hash bcrypt válido: ${verificacao.rows[0].total}`
  );
}

async function verificarUsuarioEspecifico(cpf: string) {
  console.log(`\n🔍 Verificando usuário específico: ${cpf}\n`);

  const resultado = await query(
    `
    SELECT 
      f.id,
      f.cpf,
      f.nome,
      f.email,
      f.usuario_tipo,
      f.perfil,
      f.contratante_id,
      f.clinica_id,
      f.empresa_id,
      f.ativo,
      LENGTH(f.senha_hash) as senha_len,
      SUBSTRING(f.senha_hash, 1, 10) as senha_prefix,
      c.nome as contratante_nome
    FROM usuarios f
    LEFT JOIN contratantes c ON f.contratante_id = c.id
    WHERE f.cpf = $1
  `,
    [cpf]
  );

  if (resultado.rows.length === 0) {
    console.log('❌ Usuário não encontrado na tabela funcionarios');
    return;
  }

  const user = resultado.rows[0];
  console.log('📋 Dados do usuário:');
  console.log(`   ID: ${user.id}`);
  console.log(`   Nome: ${user.nome}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Usuario Tipo: ${user.usuario_tipo}`);
  console.log(`   Perfil: ${user.perfil}`);
  console.log(`   Ativo: ${user.ativo}`);
  console.log(`   Senha (length): ${user.senha_len} chars`);
  console.log(`   Senha (prefix): ${user.senha_prefix}...`);
  console.log(`   Contratante ID: ${user.contratante_id}`);
  console.log(`   Contratante Nome: ${user.contratante_nome || 'N/A'}`);
  console.log(`   Clinica ID: ${user.clinica_id || 'N/A'}`);
  console.log(`   Empresa ID: ${user.empresa_id || 'N/A'}`);

  // Verificar em entidades_senhas
  const senhaContratante = await query(
    'SELECT senha_hash FROM entidades_senhas WHERE cpf = $1',
    [cpf]
  );

  if (senhaContratante.rows.length > 0) {
    console.log(
      `\n✅ Senha encontrada em entidades_senhas (${senhaContratante.rows[0].senha_hash.length} chars)`
    );
  } else {
    console.log('\n⚠️  Senha NÃO encontrada em entidades_senhas');
  }
}

// Executar correção
(async () => {
  try {
    // Verificar usuário específico que está causando o erro
    await verificarUsuarioEspecifico('87545772920');

    console.log('\n' + '='.repeat(80) + '\n');

    // Executar correção geral
    await corrigirSenhasGestores();
  } catch (error) {
    console.error('❌ Erro ao executar correção:', error);
    process.exit(1);
  }
})();
