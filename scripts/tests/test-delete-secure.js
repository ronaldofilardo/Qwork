import fetch from 'node-fetch';

async function testDeleteSecure() {
  try {
    // Primeiro, fazer login como admin
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cpf: '00000000000', // CPF do admin
        senha: 'admin123', // Senha do admin
      }),
    });

    if (!loginResponse.ok) {
      console.log('Login falhou:', loginResponse.status);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('Login realizado com sucesso');

    // Agora testar a deleção segura
    const deleteResponse = await fetch(
      'http://localhost:3000/api/admin/clinicas/delete-secure',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: loginResponse.headers.get('set-cookie') || '',
        },
        body: JSON.stringify({
          clinicaId: 1, // ID de uma clínica de teste
          senha: 'admin123', // Senha do admin
        }),
      }
    );

    const deleteData = await deleteResponse.json();
    console.log('Status da deleção:', deleteResponse.status);
    console.log('Resposta da deleção:', deleteData);
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

testDeleteSecure();
