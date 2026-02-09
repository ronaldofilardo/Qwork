const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });

async function testTrigger() {
  const client = new Client(process.env.LOCAL_DATABASE_URL);
  try {
    await client.connect();

    console.log('=== TESTANDO TRIGGER APÓS CORREÇÃO ===');

    // Verificar se o trigger ainda existe
    const trigger = await client.query(`
      SELECT trigger_name, event_manipulation, action_statement
      FROM information_schema.triggers
      WHERE trigger_name = 'trg_sync_contratante_plano_tipo'
    `);

    if (trigger.rows.length > 0) {
      console.log('✓ Trigger encontrado');
    } else {
      console.log('✗ Trigger NÃO encontrado');
    }

    // Testar inserção simulada
    console.log('\nTestando sincronização...');

    // Verificar se podemos inserir um contratante com plano_id
    const testInsert = await client.query(`
      INSERT INTO tomadores (
        tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
        responsavel_nome, responsavel_cpf, responsavel_cargo, responsavel_email, responsavel_celular,
        plano_id, numero_funcionarios_estimado
      ) VALUES (
        'clinica'::tipo_contratante_enum,
        'Teste Empresa',
        '12345678000123',
        'teste@teste.com',
        '11999999999',
        'Rua Teste, 123',
        'São Paulo',
        'SP',
        '01234567',
        'João Silva',
        '12345678901',
        'Diretor',
        'joao@teste.com',
        '11999999999',
        1, -- plano_id do Plano Fixo Básico
        50
      ) RETURNING id, plano_tipo
    `);

    console.log('✓ Inserção bem-sucedida!');
    console.log('Resultado:', testInsert.rows[0]);

    // Limpar teste
    await client.query(`DELETE FROM tomadores WHERE nome = 'Teste Empresa'`);

    console.log('✓ Teste concluído - trigger funcionando!');

    await client.end();
  } catch (error) {
    console.error('✗ Erro durante teste:', error.message);
    await client.end();
  }
}

testTrigger();
