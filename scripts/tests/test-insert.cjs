const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgres://postgres:123456@localhost:5432/nr-bps_db_test',
});

async function testInsert() {
  try {
    await client.connect();

    // Primeiro, verificar se existe uma clínica
    const clinicaResult = await client.query('SELECT id FROM clinicas LIMIT 1');
    if (clinicaResult.rows.length === 0) {
      console.log('Nenhuma clínica encontrada!');
      return;
    }
    const clinicaId = clinicaResult.rows[0].id;
    console.log('Usando clinica_id:', clinicaId);

    // Tentar inserir a empresa
    const result = await client.query(
      `
      INSERT INTO empresas_clientes
      (nome, cnpj, email, telefone, endereco, cidade, estado, cep, clinica_id, ativa,
       representante_nome, representante_fone, representante_email)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10, $11, $12)
      RETURNING id, nome, cnpj
    `,
      [
        'dfdsg siderurguc',
        '41877277000184', // CNPJ normalizado
        'ipoipoer@goko.vom',
        '(41) 96558-2225',
        'rua tes 3456',
        'koko',
        'PO',
        '80150-965',
        clinicaId,
        'Ron Fill',
        '(41) 99958-5255',
        'omin@eca.com',
      ]
    );

    console.log('Empresa criada com sucesso:', result.rows[0]);
  } catch (error) {
    console.error('Erro ao inserir:', error);
    console.error('Código do erro:', error.code);
    console.error('Constraint:', error.constraint);
    console.error('Detail:', error.detail);
  } finally {
    await client.end();
  }
}

testInsert();
