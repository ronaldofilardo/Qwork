import fs from 'fs';
import path from 'path';

const base = 'http://localhost:3000';

async function run() {
  try {
    console.log('Preparando form-data com arquivos de fixture...');
    const FormData =
      globalThis.FormData || (await import('formdata-node')).FormData;
    const fd = new FormData();

    fd.append('tipo', 'entidade');
    fd.append('nome', 'RLGR Fluxo API Multipart');
    fd.append('cnpj', '41.877.277/0001-84');
    fd.append('email', 'omni@email.com');
    fd.append('telefone', '(41) 99241-5220');
    fd.append('endereco', 'Rua Exemplo, 100');
    fd.append('cidade', 'Curitiba');
    fd.append('estado', 'PR');
    fd.append('cep', '80000-000');
    fd.append('plano_id', '5');
    fd.append('numero_funcionarios_estimado', '100');

    fd.append('responsavel_nome', 'RONALDO FILARDO');
    fd.append('responsavel_cpf', '87545772920');
    fd.append('responsavel_cargo', 'Gestor');
    fd.append('responsavel_email', 'ronaldofilardo@gmail.com');
    fd.append('responsavel_celular', '(41) 59886-6655');

    const samplePath = path.join(
      process.cwd(),
      'scripts',
      'fixtures',
      'sample.txt'
    );
    const buf = fs.readFileSync(samplePath);
    const blob = new Blob([buf], { type: 'application/pdf' });

    fd.append('cartao_cnpj', blob, 'sample.pdf');
    fd.append('contrato_social', blob, 'sample.pdf');
    fd.append('doc_identificacao', blob, 'sample.pdf');

    console.log('Enviando /api/cadastro/tomador');
    const res = await fetch(`${base}/api/cadastro/tomador`, {
      method: 'POST',
      body: fd,
    });

    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Body:', text);

    if (res.status !== 201) {
      console.error(
        'Falha ao criar tomador via multipart; ver logs do servidor'
      );
      process.exit(1);
    }

    const data = JSON.parse(text);
    const tomadorId = data?.id || data?.tomador?.id;
    if (!tomadorId) throw new Error('tomadorId não retornado');

    console.log('tomador criado:', tomadorId);

    console.log('Chamando /api/pagamento/iniciar');
    const resInit = await fetch(`${base}/api/pagamento/iniciar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tomador_id: tomadorId,
        numero_parcelas: 4,
      }),
    });
    const initBody = await resInit.json();
    console.log('Init status:', resInit.status, 'body:', initBody);

    const pagamentoId = initBody?.pagamento_id || initBody?.id;
    if (!pagamentoId) throw new Error('pagamentoId não retornado');

    console.log(
      'Chamando /api/pagamento/confirmar para pagamento',
      pagamentoId
    );
    const resConfirm = await fetch(`${base}/api/pagamento/confirmar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pagamento_id: pagamentoId,
        metodo_pagamento: 'parcelado',
        plataforma_nome: 'simulador',
        numero_parcelas: 4,
      }),
    });
    const confirmBody = await resConfirm.json();
    console.log(
      'Confirm status:',
      resConfirm.status,
      'body:',
      JSON.stringify(confirmBody, null, 2)
    );

    console.log(
      'Fluxo via API concluído. Verifique admin/UI para confirmar ativação e recibo.'
    );
  } catch (e) {
    console.error('Erro no fluxo multipart API:', e);
    process.exit(1);
  }
}

run();
