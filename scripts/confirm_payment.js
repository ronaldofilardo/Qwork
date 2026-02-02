(async () => {
  try {
    const pagamentoId = parseInt(process.argv[2], 10);
    const metodoPagamento = process.argv[3] || 'parcelado';
    const numeroParcelas = parseInt(process.argv[4], 10) || 1;

    if (!pagamentoId) {
      console.error(
        'Uso: node confirm_payment.js <PagamentoID> [MetodoPagamento] [NumeroParcelas]'
      );
      process.exit(1);
    }

    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${base}/api/pagamento/confirmar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pagamento_id: pagamentoId,
        metodo_pagamento: metodoPagamento,
        plataforma_nome: 'simulador',
        numero_parcelas: numeroParcelas,
      }),
    });
    const text = await res.text().catch(() => null);
    console.log('status', res.status);
    console.log('body', text);
  } catch (e) {
    console.error('error', e);
  }
})();
