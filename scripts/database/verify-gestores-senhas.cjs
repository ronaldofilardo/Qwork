/**
 * Verificação de Integridade - Senhas de Gestores
 *
 * Verifica se todos os tomadores aprovados têm senhas criadas
 * Cria senhas automaticamente para tomadores sem senha
 *
 * Uso: node scripts/verify-gestores-senhas.cjs
 */

const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const DATABASE_URL =
  process.env.DATABASE_URL ||
  (process.env.LOCAL_DATABASE_URL ?? 'postgresql://postgres@localhost:5432/nr-bps_db');

async function verificarIntegridadeSenhas() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados');
    console.log('🔍 Verificando integridade de senhas...\n');

    // Buscar tomadores aprovados sem senha
    const result = await client.query(`
      SELECT 
        c.id,
        c.tipo,
        c.cnpj,
        c.responsavel_nome,
        c.responsavel_cpf,
        c.responsavel_email,
        c.responsavel_celular,
        c.status,
        c.ativa,
        c.criado_em
      FROM tomadores c
      LEFT JOIN entidades_senhas cs ON cs.contratante_id = c.id 
        AND cs.cpf = c.responsavel_cpf
      WHERE c.status = 'aprovado' 
        AND c.ativa = true 
        AND cs.senha_hash IS NULL
      ORDER BY c.id
    `);

    if (result.rows.length === 0) {
      console.log('✅ TUDO OK! Todos os tomadores aprovados têm senhas.');
      return;
    }

    console.log(
      `❌ ALERTA: ${result.rows.length} contratante(s) sem senha encontrado(s)!\n`
    );

    // Exibir tabela de tomadores sem senha
    console.table(
      result.rows.map((r) => ({
        ID: r.id,
        Tipo: r.tipo,
        CNPJ: r.cnpj,
        Responsável: r.responsavel_nome,
        CPF: r.responsavel_cpf,
        'Criado Em': r.criado_em.toISOString().split('T')[0],
      }))
    );

    console.log('\n🔧 Criando senhas automaticamente...\n');

    // Criar senhas para cada contratante
    let sucessos = 0;
    let erros = 0;

    for (const contratante of result.rows) {
      try {
        // Extrair últimos 6 dígitos do CNPJ
        const cnpjLimpo = contratante.cnpj.replace(/[./-]/g, '');
        const senha = cnpjLimpo.slice(-6);

        console.log(
          `📝 Contratante ID ${contratante.id} (${contratante.responsavel_nome})`
        );
        console.log(`   CNPJ: ${contratante.cnpj} → Senha: ${senha}`);

        // Gerar hash
        const hash = await bcrypt.hash(senha, 10);

        // Inserir em entidades_senhas
        await client.query(
          'INSERT INTO entidades_senhas (contratante_id, cpf, senha_hash) VALUES ($1, $2, $3)',
          [contratante.id, contratante.responsavel_cpf, hash]
        );

        // Atualizar funcionarios se existir
        await client.query(
          `UPDATE funcionarios 
           SET contratante_id = $1, senha_hash = $2 
           WHERE cpf = $3`,
          [contratante.id, hash, contratante.responsavel_cpf]
        );

        console.log(`   ✅ Senha criada com sucesso!`);
        sucessos++;
      } catch (error) {
        console.error(`   ❌ Erro ao criar senha: ${error.message}`);
        erros++;
      }

      console.log('');
    }

    // Resumo final
    console.log('━'.repeat(60));
    console.log('📊 RESUMO DA OPERAÇÃO');
    console.log('━'.repeat(60));
    console.log(`Total encontrado: ${result.rows.length}`);
    console.log(`✅ Sucessos: ${sucessos}`);
    console.log(`❌ Erros: ${erros}`);

    if (erros === 0) {
      console.log('\n🎉 Todas as senhas foram criadas com sucesso!');
    } else {
      console.log('\n⚠️  Alguns erros ocorreram. Verifique os logs acima.');
    }
  } catch (error) {
    console.error('❌ Erro fatal:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Executar
verificarIntegridadeSenhas();
