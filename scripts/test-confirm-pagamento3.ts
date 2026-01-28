import { config } from 'dotenv';
import { resolve } from 'path';

// Carregar .env.local
config({ path: resolve(process.cwd(), '.env.local') });

async function testarConfirmacaoPagamento() {
  const url = 'http://localhost:3000/api/pagamento/confirmar';
  const payload = {
    pagamento_id: 3,
    metodo_pagamento: 'pix',
    plataforma_id: null,
    plataforma_nome: 'test',
    numero_parcelas: 1,
  };

  console.log('🔄 Enviando requisição para:', url);
  console.log('📦 Payload:', JSON.stringify(payload, null, 2));

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  console.log('\n📨 Resposta do handler status:', response.status);
  const body = await response.json();
  console.log('Body:', JSON.stringify(body, null, 2));

  if (!response.ok) {
    console.error('❌ Erro na resposta');
    process.exit(1);
  }

  console.log('\n✅ Teste concluído com sucesso!');
  console.log('Verificar no banco:');
  console.log(
    '  - Recibo criado: SELECT * FROM recibos WHERE pagamento_id = 3;'
  );
  console.log(
    '  - Pagamento atualizado: SELECT * FROM pagamentos WHERE id = 3;'
  );
  console.log(
    "  - Login criado: SELECT * FROM funcionarios WHERE cpf = '59681677005';"
  );
  console.log(
    '  - Notificação criada: SELECT * FROM notificacoes ORDER BY criado_em DESC LIMIT 1;'
  );
}

testarConfirmacaoPagamento().catch((err) => {
  console.error('💥 Erro no teste:', err);
  process.exit(1);
});
