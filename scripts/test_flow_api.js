(async () => {
  const base = 'http://localhost:3000';
  try {
    console.log('1) Criando tomador...');
    const cadBody = {
      tipo: 'entidade',
      nome: 'RLGR Fluxo API',
      cnpj: '41.877.277/0001-84',
      email: 'omni@email.com',
      telefone: '(41) 99241-5220',
      responsavel_cpf: '87545772920',
      responsavel_nome: 'RONALDO FILARDO',
      responsavel_email: 'ronaldofilardo@gmail.com',
      planoId: 5,
      numeroFuncionarios: 100,
    };

    let res = await fetch(`${base}/api/cadastro/tomador`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cadBody),
    });
    const cad = await res.json().catch(() => null);
    console.log('→ status', res.status, 'body', JSON.stringify(cad));

    // buscar tomador criado pelo CNPJ
    console.log('2) Iniciando pagamento via endpoint /api/pagamento/iniciar');
    const tomadorId =
      cad?.tomador_id ||
      cad?.id ||
      (() => {
        throw new Error('tomador_id not in response');
      })();

    res = await fetch(`${base}/api/pagamento/iniciar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tomador_id: tomadorId,
        valor: 2000,
        numero_parcelas: 4,
      }),
    });
    const inicio = await res.json().catch(() => null);
    console.log('→ status', res.status, 'body', JSON.stringify(inicio));

    const pagamentoId =
      inicio?.pagamento_id ||
      inicio?.id ||
      (() => {
        throw new Error('pagamento_id not in response');
      })();

    console.log(
      '3) Confirmando pagamento via /api/pagamento/confirmar (parcelado)'
    );
    res = await fetch(`${base}/api/pagamento/confirmar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pagamento_id: pagamentoId,
        metodo_pagamento: 'parcelado',
        plataforma_nome: 'simulador',
        numero_parcelas: 4,
      }),
    });
    const confirmar = await res.json().catch(() => null);
    console.log(
      '→ status',
      res.status,
      'body',
      JSON.stringify(confirmar, null, 2)
    );

    // Consultas de verificação via endpoints /api/documentos ou via DB endpoints
    console.log(
      '4) Verificando estado no banco (via API /api/pagamento/status se existir)'
    );
    try {
      const resp = await fetch(
        `${base}/api/pagamento/status?pagamento_id=${pagamentoId}`
      );
      const status = await resp.json().catch(() => null);
      console.log('→ /api/pagamento/status: status', resp.status, status);
    } catch (e) {
      console.warn('→ No status endpoint, skipping');
    }

    console.log(
      'Script finalizado. Revise os logs e o painel admin para confirmar.'
    );
  } catch (e) {
    console.error('Erro no fluxo API:', e);
    process.exit(1);
  }
})();
