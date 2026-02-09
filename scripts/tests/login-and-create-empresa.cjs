require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');
const { query } = require('../../lib/db');

(async () => {
  try {
    const cpf = '70495096040';

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    // Calcular senha a partir do CNPJ do contratante (últimos 6 dígitos)
    const resp = await query(
      'SELECT c.cnpj FROM tomadores c JOIN funcionarios f ON f.contratante_id = c.id WHERE f.cpf = $1 LIMIT 1',
      [cpf]
    );
    const cnpj = resp.rows[0]?.cnpj || '';
    const digits = cnpj.replace(/\D/g, '');
    const senha = digits.length >= 6 ? digits.slice(-6) : 'test1234';
    console.log(
      'Usando senha calculada para login (oculta):',
      '*'.repeat(senha.length)
    );

    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf, senha }),
    });

    const loginBody = await loginRes.json().catch(() => ({}));
    console.log('Login status:', loginRes.status, 'body:', loginBody);
    const setCookie = loginRes.headers.get('set-cookie');
    console.log('set-cookie:', setCookie);

    let cookie;
    if (setCookie) cookie = setCookie.split(/, (?=[^ ]+=)/)[0];
    else {
      console.error('No cookie set. Aborting test.');
      process.exit(1);
    }

    // Attempt to create empresa
    const empresaPayload = {
      nome: 'Empresa Teste API',
      cnpj: '12345678000199',
      email: 'empresa.teste@example.com',
      telefone: '(11) 99999-8888',
      endereco: 'Rua Teste, 123',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01234567',
      representante_nome: 'Fulano da Silva',
      representante_fone: '11999998888',
      representante_email: 'fulano.silva@example.com',
    };

    const createRes = await fetch(`${baseUrl}/api/rh/empresas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: cookie,
      },
      body: JSON.stringify(empresaPayload),
    });

    const createBody = await createRes.json().catch(() => ({}));
    console.log(
      'Create empresa status:',
      createRes.status,
      'body:',
      createBody
    );
  } catch (err) {
    console.error('Erro:', err.message);
    process.exit(1);
  }
})();
