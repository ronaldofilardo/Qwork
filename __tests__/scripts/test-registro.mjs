async function test() {
  const params = new URLSearchParams();
  params.append('tipo', 'clinica');
  params.append('nome', 'TEST CLINICA');
  params.append('cnpj', '09.110.380/0001-94');
  params.append('email', 'test@example.com');
  params.append('telefone', '1199999999');
  params.append('endereco', 'Rua Teste, 123');
  params.append('cidade', 'Sao Paulo');
  params.append('estado', 'SP');
  params.append('cep', '01310100');

  try {
    const response = await fetch(
      'http://localhost:3000/api/cadastro/tomadores',
      {
        method: 'POST',
        body: params,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const text = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', text.substring(0, 500));

    if (response.status === 200 || response.status === 400) {
      try {
        const data = JSON.parse(text);
        console.log('Parsed:', JSON.stringify(data, null, 2));
      } catch (e) {
        console.log('(Non-JSON response)');
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
