(async () => {
  try {
    const base = 'http://localhost:3000';
    const res = await fetch(`${base}/api/pagamento/confirmar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pagamento_id: 5,
        metodo_pagamento: 'parcelado',
        plataforma_nome: 'simulador',
        numero_parcelas: 4,
      }),
    });
    const text = await res.text().catch(() => null);
    console.log('status', res.status);
    console.log('body', text);
  } catch (e) {
    console.error('error', e);
  }
})();
