/**
 * Teste direto do fluxo de confirmação de pagamento
 * Chama o handler diretamente sem precisar do servidor Next.js
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Carregar .env.local
config({ path: resolve(process.cwd(), '.env.local') });

// Importar handler diretamente
import { POST } from '../app/api/pagamento/confirmar/route';

async function testarConfirmacaoPagamento() {
  console.log('🔄 Testando confirmação de pagamento (pagamento_id=3)...\n');

  const payload = {
    pagamento_id: 3,
    metodo_pagamento: 'pix',
    plataforma_id: null,
    plataforma_nome: 'test',
    numero_parcelas: 1,
  };

  // Simular Request
  const request = new Request('http://localhost:3000/api/pagamento/confirmar', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  try {
    // POST espera NextRequest; em script de teste usamos Request — fazer cast para compatibilidade de tipagem
    const response = await POST(request as any);
    const status = response.status;
    const body = await response.json();

    console.log(`📨 Status: ${status}`);
    console.log('📦 Body:', JSON.stringify(body, null, 2));

    if (status !== 200) {
      console.error('\n❌ Teste falhou!');
      process.exit(1);
    }

    console.log('\n✅ Teste concluído com sucesso!');
    console.log('\nVerificar no banco:');
    console.log(
      '  psql -U postgres -d nr-bps_db -c "SELECT * FROM recibos WHERE pagamento_id = 3;"'
    );
    console.log(
      '  psql -U postgres -d nr-bps_db -c "SELECT id, status, recibo_numero, recibo_url FROM pagamentos WHERE id = 3;"'
    );
    console.log(
      '  psql -U postgres -d nr-bps_db -c "SELECT * FROM funcionarios WHERE cpf = \'59681677005\';"'
    );
    console.log(
      '  psql -U postgres -d nr-bps_db -c "SELECT * FROM notificacoes ORDER BY criado_em DESC LIMIT 1;"'
    );
  } catch (err) {
    console.error('💥 Erro no teste:', err);
    process.exit(1);
  }
}

testarConfirmacaoPagamento();
