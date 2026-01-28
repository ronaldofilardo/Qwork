import fetch from 'node-fetch';

(async () => {
  const url = 'http://localhost:3000/api/admin/cobranca?cnpj=02494916000170';
  const res = await fetch(url, {
    headers: {
      'x-mock-session': JSON.stringify({ cpf: '00000000000', perfil: 'admin' }),
    },
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
})();
