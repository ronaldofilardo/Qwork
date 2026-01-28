import { POST } from '../app/api/pagamento/confirmar/route';

(async () => {
  try {
    const req = {
      json: async () => ({
        pagamento_id: 2,
        metodo_pagamento: 'pix',
        plataforma_id: null,
        plataforma_nome: 'test',
        numero_parcelas: 1,
      }),
      headers: {
        get: (k: string) => null,
      },
      url: 'http://localhost',
    } as any;

    const res = await POST(req);
    console.log('Resposta do handler status:', res.status);
    // tentar extrair JSON
    if (res && typeof res.json === 'function') {
      const body = await res.json();
      console.log('Body:', body);
    }
  } catch (err) {
    console.error(
      'Erro ao chamar POST /api/pagamento/confirmar diretamente:',
      err
    );
    process.exit(1);
  }
})();
