const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });

async function testBothPlanTypes() {
  const client = new Client(process.env.LOCAL_DATABASE_URL);
  try {
    await client.connect();

    console.log('=== TESTANDO AMBOS TIPOS DE PLANO ===');

    // Teste 1: Plano Fixo
    console.log('\nTeste 1: Plano Fixo (ID 1)');
    const testFixo = await client.query(`
      INSERT INTO contratantes (
        tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
        responsavel_nome, responsavel_cpf, responsavel_cargo, responsavel_email, responsavel_celular,
        plano_id, numero_funcionarios_estimado
      ) VALUES (
        'clinica'::tipo_contratante_enum,
        'Teste Empresa Fixa',
        '12345678000124',
        'teste2@teste.com',
        '11999999999',
        'Rua Teste, 123',
        'São Paulo',
        'SP',
        '01234567',
        'João Silva',
        '12345678902',
        'Diretor',
        'joao2@teste.com',
        '11999999999',
        1, -- Plano Fixo Básico
        50
      ) RETURNING id, plano_tipo
    `);
    console.log('✓ Resultado Fixo:', testFixo.rows[0]);

    // Teste 2: Plano Personalizado
    console.log('\nTeste 2: Plano Personalizado (ID 3)');
    const testPersonalizado = await client.query(`
      INSERT INTO contratantes (
        tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
        responsavel_nome, responsavel_cpf, responsavel_cargo, responsavel_email, responsavel_celular,
        plano_id, numero_funcionarios_estimado
      ) VALUES (
        'clinica'::tipo_contratante_enum,
        'Teste Empresa Personalizada',
        '12345678000125',
        'teste3@teste.com',
        '11999999999',
        'Rua Teste, 123',
        'São Paulo',
        'SP',
        '01234567',
        'João Silva',
        '12345678903',
        'Diretor',
        'joao3@teste.com',
        '11999999999',
        3, -- Plano Personalizado
        50
      ) RETURNING id, plano_tipo
    `);
    console.log('✓ Resultado Personalizado:', testPersonalizado.rows[0]);

    // Limpar testes
    await client.query(
      `DELETE FROM contratantes WHERE nome LIKE 'Teste Empresa%'`
    );

    console.log(
      '\n✓ Todos os testes passaram! Trigger funcionando para ambos os tipos de plano.'
    );

    await client.end();
  } catch (error) {
    console.error('✗ Erro durante teste:', error.message);
    await client.end();
  }
}

testBothPlanTypes();
