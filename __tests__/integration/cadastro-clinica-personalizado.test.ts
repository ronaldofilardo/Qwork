/**
 * Teste de Simulação - Cadastro de Clínica com Plano Personalizado
 *
 * Simula o cadastro real de uma clínica optando por plano personalizado
 * para validar todo o fluxo sem erros de trigger.
 */

import { query } from '@/lib/db';

// Mock do next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '',
}));

// Mock do session para permitir autenticação do admin
jest.mock('@/lib/session', () => ({
  getSession: jest.fn(() => ({
    cpf: '00000000000',
    nome: 'Admin Teste',
    role: 'admin',
    perfil: 'admin',
    ativo: true,
  })),
  createSession: jest.fn(),
  destroySession: jest.fn(),
}));

describe('Simulação Real - Cadastro Clínica Plano Personalizado', () => {
  let planoPersonalizadoId: number;
  const testCnpj = '49303528000129'; // CNPJ válido
  const testCpfResp = '12345678909'; // CPF válido
  const testEmail = 'clinica.personalizada@test.com';
  let contratanteId: number;

  beforeAll(async () => {
    // Buscar plano personalizado existente ou criar
    const planoRes = await query(
      `SELECT id FROM planos WHERE tipo = 'personalizado' AND ativo = true LIMIT 1`
    );

    if (planoRes.rows.length > 0) {
      planoPersonalizadoId = planoRes.rows[0].id;
      console.log(
        '✓ Usando plano personalizado existente:',
        planoPersonalizadoId
      );
    } else {
      const newPlanoRes = await query(
        `INSERT INTO planos (tipo, nome, preco, ativo) 
         VALUES ('personalizado', 'Plano Personalizado Teste', 0, true) 
         RETURNING id`
      );
      planoPersonalizadoId = newPlanoRes.rows[0].id;
      console.log('✓ Plano personalizado criado:', planoPersonalizadoId);
    }
  });

  beforeEach(async () => {
    // Limpar dados de testes anteriores
    await query(
      'DELETE FROM contratacao_personalizada WHERE contratante_id IN (SELECT id FROM contratantes WHERE cnpj = $1)',
      [testCnpj]
    );
    await query(
      'DELETE FROM contratos WHERE contratante_id IN (SELECT id FROM contratantes WHERE cnpj = $1)',
      [testCnpj]
    );
    await query('DELETE FROM contratantes WHERE cnpj = $1', [testCnpj]);
    await query('DELETE FROM contratantes WHERE responsavel_cpf = $1', [
      testCpfResp,
    ]);
  });

  afterAll(async () => {
    // Limpar dados do teste
    await query(
      'DELETE FROM contratacao_personalizada WHERE contratante_id IN (SELECT id FROM contratantes WHERE cnpj = $1)',
      [testCnpj]
    );
    await query(
      'DELETE FROM contratos WHERE contratante_id IN (SELECT id FROM contratantes WHERE cnpj = $1)',
      [testCnpj]
    );
    await query('DELETE FROM contratantes WHERE cnpj = $1', [testCnpj]);
  });

  it('deve cadastrar clínica com plano personalizado sem erro de trigger', async () => {
    console.log(
      '\n=== SIMULAÇÃO: CADASTRO DE CLÍNICA COM PLANO PERSONALIZADO ===\n'
    );

    const { POST: cadastroPost } =
      await import('@/app/api/cadastro/contratante/route');

    class FakeFormData {
      private data: Map<string, string | number | object> = new Map();

      append(key: string, value: string | number | object) {
        this.data.set(key, value);
      }

      get(key: string) {
        return this.data.get(key);
      }
    }

    const formData = new FakeFormData();
    formData.append('tipo', 'clinica');
    formData.append('nome', 'Clínica Saúde Personalizada Ltda');
    formData.append('cnpj', testCnpj);
    formData.append('email', testEmail);
    formData.append('telefone', '11987654321');
    formData.append('endereco', 'Av. Paulista, 1000');
    formData.append('cidade', 'São Paulo');
    formData.append('estado', 'SP');
    formData.append('cep', '01310100');
    formData.append('responsavel_nome', 'Dr. João Silva');
    formData.append('responsavel_cpf', testCpfResp);
    formData.append('responsavel_cargo', 'Diretor Clínico');
    formData.append('responsavel_email', 'joao.silva@clinica.com');
    formData.append('responsavel_celular', '11987654321');
    formData.append('numero_funcionarios_estimado', '2000'); // Grande volume - campo correto
    formData.append('aceite_termos', 'true');
    formData.append('plano_id', String(planoPersonalizadoId));

    // Arquivos simulados
    formData.append('doc_identificacao', {
      name: 'rg.pdf',
      type: 'application/pdf',
      size: 16,
      arrayBuffer: () => new TextEncoder().encode('doc').buffer,
    });
    formData.append('cartao_cnpj', {
      name: 'cnpj.pdf',
      type: 'application/pdf',
      size: 16,
      arrayBuffer: () => new TextEncoder().encode('cnpj').buffer,
    });
    formData.append('contrato_social', {
      name: 'contrato.pdf',
      type: 'application/pdf',
      size: 16,
      arrayBuffer: () => new TextEncoder().encode('social').buffer,
    });

    const mockRequest = {
      formData: () => formData,
      headers: {
        get: (key: string) => {
          if (key === 'x-forwarded-for') return '127.0.0.1';
          return null;
        },
      },
    };

    console.log('→ Enviando cadastro da clínica...');
    const cadastroResponse = await cadastroPost(mockRequest);
    const cadastroData = await cadastroResponse.json();

    console.log('→ Status da resposta:', cadastroResponse.status);
    console.log('→ Dados retornados:', JSON.stringify(cadastroData, null, 2));

    // Verificações
    expect(cadastroResponse.status).toBe(201);
    expect(cadastroData.success).toBe(true);
    expect(cadastroData.contratante.status).toBe('pendente');
    expect(cadastroData.contratante.tipo).toBe('clinica');

    contratanteId = cadastroData.contratante.id;
    console.log('✓ Clínica cadastrada com sucesso! ID:', contratanteId);

    // Verificar criação em contratacao_personalizada
    const contratacaoRes = await query(
      'SELECT * FROM contratacao_personalizada WHERE contratante_id = $1',
      [contratanteId]
    );

    expect(contratacaoRes.rows.length).toBe(1);
    expect(contratacaoRes.rows[0].status).toBe('aguardando_valor_admin');
    expect(contratacaoRes.rows[0].numero_funcionarios_estimado).toBe(2000);

    console.log('✓ Registro em contratacao_personalizada criado:');
    console.log('  - Status:', contratacaoRes.rows[0].status);
    console.log(
      '  - Funcionários estimados:',
      contratacaoRes.rows[0].numero_funcionarios_estimado
    );

    // Verificar notificações criadas (se houver)
    const notifRes = await query(
      `SELECT * FROM notificacoes 
       WHERE dados_contexto->>'contratacao_id' = $1`,
      [String(contratacaoRes.rows[0].id)]
    );

    if (notifRes.rows.length > 0) {
      console.log('✓ Notificações criadas para admins:', notifRes.rows.length);
      console.log('  - Título:', notifRes.rows[0].titulo);
    }

    console.log('\n=== ✓ SIMULAÇÃO CONCLUÍDA COM SUCESSO ===\n');
  });
});
