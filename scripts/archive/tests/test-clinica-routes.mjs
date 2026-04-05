/**
 * Script de validação das correções nas rotas de clínica
 * Testa se as rotas carregam dados corretamente após as correções
 */

const BASE_URL = 'http://localhost:3000';

async function testClinicaRoutes() {
  console.log('🧪 Testando rotas de clínica após correções...\n');

  // Simular login de RH
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cpf: '87545772920', // CPF do gestor de clínica de teste
      senha: '000170',
    }),
  });

  if (!loginRes.ok) {
    console.error('❌ Falha no login');
    return;
  }

  console.log('✅ Login realizado com sucesso\n');

  // Obter cookies de sessão
  const cookies = loginRes.headers.get('set-cookie');

  // Testar rotas principais
  const tests = [
    {
      name: 'GET /api/rh/empresas',
      url: `${BASE_URL}/api/rh/empresas`,
      expectedKeys: ['id', 'nome', 'cnpj'],
    },
    {
      name: 'GET /api/rh/dashboard (com empresa)',
      url: `${BASE_URL}/api/rh/dashboard?empresa_id=1`,
      expectedKeys: ['stats', 'resultados', 'distribuicao'],
    },
    {
      name: 'GET /api/rh/lotes (com empresa)',
      url: `${BASE_URL}/api/rh/lotes?empresa_id=1&limit=10`,
      expectedKeys: ['lotes', 'success'],
    },
    {
      name: 'GET /api/rh/laudos (sem empresa - toda clínica)',
      url: `${BASE_URL}/api/rh/laudos`,
      expectedKeys: ['laudos', 'success'],
    },
    {
      name: 'GET /api/rh/laudos (com empresa - filtrado)',
      url: `${BASE_URL}/api/rh/laudos?empresa_id=1`,
      expectedKeys: ['laudos', 'success'],
    },
    {
      name: 'GET /api/rh/pendencias (com empresa)',
      url: `${BASE_URL}/api/rh/pendencias?empresa_id=1`,
      expectedKeys: ['anomalias', 'metricas'],
    },
    {
      name: 'GET /api/rh/funcionarios (com empresa)',
      url: `${BASE_URL}/api/rh/funcionarios?empresa_id=1`,
      expectedKeys: ['cpf', 'nome'], // Deve retornar array de funcionários
    },
  ];

  for (const test of tests) {
    try {
      const res = await fetch(test.url, {
        headers: cookies ? { Cookie: cookies } : {},
      });

      const data = await res.json();

      if (!res.ok) {
        console.log(`❌ ${test.name}`);
        console.log(`   Status: ${res.status}`);
        console.log(`   Erro: ${data.error || 'Desconhecido'}\n`);
        continue;
      }

      // Verificar se contém as chaves esperadas
      const hasKeys = test.expectedKeys.every((key) => {
        if (Array.isArray(data)) {
          return data.length === 0 || key in data[0];
        }
        return key in data;
      });

      if (hasKeys) {
        console.log(`✅ ${test.name}`);
        console.log(`   Status: ${res.status}`);
        if (Array.isArray(data)) {
          console.log(`   Resultados: ${data.length} items\n`);
        } else {
          console.log(`   Dados: OK\n`);
        }
      } else {
        console.log(`⚠️  ${test.name}`);
        console.log(`   Status: ${res.status}`);
        console.log(`   Aviso: Estrutura de dados diferente do esperado\n`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}`);
      console.log(`   Erro: ${error.message}\n`);
    }
  }

  console.log('\n✨ Testes concluídos!');
}

// Executar testes
testClinicaRoutes().catch(console.error);
