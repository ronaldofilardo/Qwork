const FormData = require('form-data');
const http = require('http');

async function test() {
  const form = new FormData();

  form.append('tipo', 'clinica');
  form.append('nome', 'TEST CLINICA');
  form.append('cnpj', '09.110.380/0001-93');
  form.append('email', 'test@example.com');
  form.append('telefone', '1199999999');
  form.append('endereco', 'Rua Teste, 123');
  form.append('cidade', 'Sao Paulo');
  form.append('estado', 'SP');
  form.append('cep', '01310100');

  try {
    const response = await fetch(
      'http://localhost:3000/api/cadastro/tomadores',
      {
        method: 'POST',
        body: form,
        headers: form.getHeaders(),
      }
    );

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
