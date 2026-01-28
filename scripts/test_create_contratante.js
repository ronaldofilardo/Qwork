(async () => {
  const body = {
    tipo: 'entidade',
    nome: 'RLGR Teste Fluxo',
    cnpj: '41.877.277/0001-84',
    email: 'omni@email.com',
    telefone: '(41) 99241-5220',
    responsavel_cpf: '87545772920',
    responsavel_nome: 'RONALDO FILARDO',
    responsavel_email: 'ronaldofilardo@gmail.com',
    planoId: 5,
    numeroFuncionarios: 100,
  };

  try {
    const res = await fetch('http://localhost:3000/api/cadastro/contratante', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    console.log('STATUS', res.status);
    console.log(text);
  } catch (e) {
    console.error('ERROR', e);
    process.exit(1);
  }
})();
