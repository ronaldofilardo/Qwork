(async () => {
  try {
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf: '00000000000', senha: '123456' }),
    });

    console.log('Login status:', loginRes.status);
    const loginText = await loginRes.text();
    console.log('Login response body (truncated):', loginText.slice(0, 2000));

    const setCookie =
      loginRes.headers.get('set-cookie') || loginRes.headers.get('Set-Cookie');
    console.log('Set-Cookie header:', setCookie);
    const cookie = setCookie ? setCookie.split(';')[0] : '';

    const listRes = await fetch(
      'http://localhost:3000/api/admin/contratantes/list',
      {
        headers: { Cookie: cookie },
      }
    );

    console.log('List status:', listRes.status);
    const listText = await listRes.text();
    console.log('List response body (truncated):', listText.slice(0, 2000));
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
