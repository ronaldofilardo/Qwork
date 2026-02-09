#!/usr/bin/env node

// Script para criar usuário RH de teste// IMPORTANTE: Este script deve usar APENAS o banco de testes nr-bps_db_test
// NUNCA deve usar o banco de desenvolvimento nr-bps_db

// Forçar ambiente de teste para garantir uso do banco correto
process.env.NODE_ENV = 'test';

// Verificar se TEST_DATABASE_URL está configurado
if (!process.env.TEST_DATABASE_URL) {
  console.error('⠌ ERRO: TEST_DATABASE_URL não está definido!');
  console.error('Configure TEST_DATABASE_URL para apontar para nr-bps_db_test');
  console.error(
    'Exemplo: TEST_DATABASE_URL="postgresql://postgres:123456@localhost:5432/nr-bps_db_test"'
  );
  process.exit(1);
}

// Verificar se a URL aponta para o banco correto
try {
  const url = new URL(process.env.TEST_DATABASE_URL);
  const dbName = url.pathname.replace(/^\//, '');
  if (dbName !== 'nr-bps_db_test') {
    console.error(
      `⠌ ERRO: TEST_DATABASE_URL deve apontar para nr-bps_db_test, mas aponta para "${dbName}"`
    );
    console.error(
      'Configure corretamente: TEST_DATABASE_URL="postgresql://postgres:123456@localhost:5432/nr-bps_db_test"'
    );
    process.exit(1);
  }
} catch (error) {
  console.error('⠌ ERRO: TEST_DATABASE_URL não é uma URL válida');
  process.exit(1);
}

console.log('✅ Ambiente de teste configurado corretamente');
console.log(
  `📠 Usando banco: ${process.env.TEST_DATABASE_URL.replace(/password=[^&]+/, 'password=***')}`
);

// Import dinâmico para evitar problemas de resolução de módulos
const { query } = await import('../lib/db.ts');

async function createTestRHUser() {
  try {
    console.log('🔧 Criando usuário RH de teste...');

    // Primeiro, criar um tomador de teste
    const tomadorResult = await query(`
      INSERT INTO tomadors (
        tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
        responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
        ativa, status, pagamento_confirmado
      ) VALUES (
        'clinica', 'Clínica Teste RH', '11111111000111', 'rh@teste.com',
        '(11) 99999-9999', 'Rua Teste, 123', 'São Paulo', 'SP', '01234-567',
        'RH Teste', '11111111111', 'rh@teste.com', '(11) 99999-9999',
        true, 'aprovado', true
      )
      ON CONFLICT (cnpj) DO UPDATE SET
        nome = EXCLUDED.nome,
        responsavel_nome = EXCLUDED.responsavel_nome,
        responsavel_cpf = EXCLUDED.responsavel_cpf,
        ativa = true,
        status = 'aprovado',
        pagamento_confirmado = true
      RETURNING id
    `);

    const tomadorId = tomadorResult.rows[0].id;
    console.log(`✅ tomador criado/atualizado com ID: ${tomadorId}`);

    // Agora criar a senha para o RH
    await query(
      `
      INSERT INTO entidades_senhas (tomador_id, cpf, senha_hash, primeira_senha_alterada)
      VALUES ($1, $2, $3, true)
      ON CONFLICT (tomador_id) DO UPDATE SET
        cpf = EXCLUDED.cpf,
        senha_hash = EXCLUDED.senha_hash,
        primeira_senha_alterada = true
    `,
      [
        tomadorId,
        '11111111111',
        '$2a$10$qFf73.uHvCCBGdBXS64LNeMsNXorsmRqfIyXFACTY733BlIRleOiy', // hash para 'rh123'
      ]
    );

    console.log('✅ Senha RH criada/atualizada');

    // Verificar se foi criado corretamente
    const verifyResult = await query(
      `
      SELECT cs.cpf, c.nome as tomador_nome, c.ativa
      FROM entidades_senhas cs
      JOIN tomadors c ON c.id = cs.tomador_id
      WHERE cs.cpf = $1
    `,
      ['11111111111']
    );

    console.log('✅ Verificação do usuário RH:');
    console.table(verifyResult.rows);

    console.log('🎉 Usuário RH de teste criado com sucesso!');
  } catch (error) {
    console.error('⠌ Erro ao criar usuário RH de teste:', error.message);
    process.exit(1);
  }
}

createTestRHUser();
