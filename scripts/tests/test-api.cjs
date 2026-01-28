#!/usr/bin/env node

const http = require('http');

// Teste simples da API de pagamento
function testAPI() {
  const postData = JSON.stringify({
    contratante_id: 1,
    contrato_id: 1
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/pagamento/iniciar',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log('Status:', res.statusCode);
    console.log('Headers:', res.headers);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        console.log('Resposta:', JSON.stringify(jsonData, null, 2));
      } catch (e) {
        console.log('Resposta (texto):', data);
      }
    });
  });

  req.on('error', (e) => {
    console.error('Erro:', e.message);
  });

  req.write(postData);
  req.end();
}

testAPI();