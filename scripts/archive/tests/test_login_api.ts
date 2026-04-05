import fetch from 'node-fetch';

async function testLogin() {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cpf: '04703084945',
      senha: '000191',
    }),
  });

  const data = await response.json();
  console.log('Status:', response.status);
  console.log('Response:', data);
}

testLogin();
