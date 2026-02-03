/**
 * Teste de cadastro de contratante para validar fluxo completo
 * Testa se todas as dependências estão corretas após migrations
 */

import { loadEnv } from './load-env';
import { resolve } from 'path';

loadEnv();

async function testarCadastroContratante() {
  const url = 'http://localhost:3000/api/cadastro/contratante';

  const payload = {
    tipo: 'entidade',
    nome: 'Teste Empresa LTDA',
    cnpj: '12.345.678/0001-90',
    email: 'teste@empresa.com',
    telefone: '(41) 98765-4321',
    endereco: 'Rua Teste, 123',
    cidade: 'Curitiba',
    estado: 'PR',
    cep: '80000-000',
    responsavel_nome: 'João da Silva',
    responsavel_cpf: '12345678901',
    responsavel_cargo: 'Diretor',
    responsavel_email: 'joao@empresa.com',
    responsavel_celular: '(41) 98765-4321',
    plano_id: 1,
    numero_funcionarios_estimado: 50,
    aceite_termos: true,
  };

  console.log('🔄 Testando cadastro de contratante...\n');
  console.log('📦 Payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const status = response.status;
    const body = await response.json();

    console.log(`\n📨 Status: ${status}`);
    console.log('📦 Response:', JSON.stringify(body, null, 2));

    if (status === 201) {
      console.log('\n✅ CADASTRO REALIZADO COM SUCESSO!');
      console.log('\nVerificar no banco:');
      console.log(
        `  psql -U postgres -d nr-bps_db -c "SELECT id, nome, status, pagamento_confirmado FROM contratantes WHERE email = '${payload.email}';"`
      );
      console.log(
        `  psql -U postgres -d nr-bps_db -c "SELECT * FROM auditoria WHERE entidade_tipo = 'contratante' ORDER BY criado_em DESC LIMIT 1;"`
      );
    } else {
      console.error('\n❌ ERRO NO CADASTRO!');
      process.exit(1);
    }
  } catch (err) {
    console.error('💥 Erro na requisição:', err);
    process.exit(1);
  }
}

testarCadastroContratante();
