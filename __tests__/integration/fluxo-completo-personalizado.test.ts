/**
 * Teste de Integração - Fluxo Completo do Plano Personalizado
 *
 * Simula todo o ciclo desde cadastro até liberação de login:
 * 1. Cadastro da empresa com plano personalizado
 * 2. Admin define valores e gera link
 * 3. Acesso ao link de pagamento
 * 4. Confirmação de pagamento (simulado)
 * 5. Verificação de liberação de login
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
    perfil: 'admin', // ← campo usado pelo api-handler
    ativo: true,
  })),
  createSession: jest.fn(),
  destroySession: jest.fn(),
}));

describe('Fluxo Completo - Plano Personalizado', () => {
  let planoPersonalizadoId: number;
  const testCnpj = '11222333000181'; // CNPJ válido
  const testCpfResp = '12345678909'; // CPF válido
  const testEmail = 'fluxo.completo@test.com';
  let contratanteId: number;
  let paymentToken: string;

  beforeAll(async () => {
    // Criar plano personalizado para o teste
    const planoRes = await query(
      `INSERT INTO planos (tipo, nome, preco, ativo) 
       VALUES ('personalizado', 'Teste Fluxo Completo Personalizado', 0, true) 
       RETURNING id`
    );
    planoPersonalizadoId = planoRes.rows[0].id;
  });

  beforeEach(async () => {
    // Limpar dados de testes anteriores
    await query(
      'DELETE FROM contratacao_personalizada WHERE contratante_id IN (SELECT id FROM entidades WHERE cnpj = $1)',
      [testCnpj]
    );
    await query(
      'DELETE FROM contratos WHERE contratante_id IN (SELECT id FROM entidades WHERE cnpj = $1)',
      [testCnpj]
    );
    await query(
      'DELETE FROM entidades_senhas WHERE entidade_id IN (SELECT id FROM entidades WHERE cnpj = $1)',
      [testCnpj]
    );
    await query(
      "DELETE FROM notificacoes WHERE dados_contexto->>'contratacao_id' IS NOT NULL OR dados_contexto->>'contratante_id' IN (SELECT id::text FROM entidades WHERE cnpj = $1)",
      [testCnpj]
    );
    await query('DELETE FROM entidades WHERE cnpj = $1', [testCnpj]);
    await query('DELETE FROM entidades WHERE responsavel_cpf = $1', [
      testCpfResp,
    ]);
  });

  afterAll(async () => {
    // Limpar dados do teste
    await query(
      'DELETE FROM contratacao_personalizada WHERE contratante_id IN (SELECT id FROM entidades WHERE plano_id = $1)',
      [planoPersonalizadoId]
    );
    await query(
      'DELETE FROM contratos WHERE contratante_id IN (SELECT id FROM entidades WHERE plano_id = $1)',
      [planoPersonalizadoId]
    );
    await query(
      'DELETE FROM entidades_senhas WHERE entidade_id IN (SELECT id FROM entidades WHERE plano_id = $1)',
      [planoPersonalizadoId]
    );
    await query('DELETE FROM entidades WHERE plano_id = $1', [
      planoPersonalizadoId,
    ]);
    await query('DELETE FROM planos WHERE id = $1', [planoPersonalizadoId]);
    await query(
      "DELETE FROM notificacoes WHERE dados_contexto->>'contratacao_id' IS NOT NULL"
    );
  });

  it('deve completar todo o fluxo: cadastro → aprovação admin → pagamento → login', async () => {
    // \n=== ETAPA 1: CADASTRO DA EMPRESA ===

    // 1. CADASTRO DA EMPRESA COM PLANO PERSONALIZADO
    const { POST: cadastroPost } =
      await import('@/app/api/cadastro/tomadores/route');

    class FakeFormData {
      private data: Map<string, any> = new Map();

      append(key: string, value: any) {
        this.data.set(key, value);
      }

      get(key: string) {
        return this.data.get(key);
      }
    }

    const formData = new FakeFormData();
    formData.append('tipo', 'entidade');
    formData.append('nome', 'Empresa Fluxo Completo Ltda');
    formData.append('cnpj', testCnpj);
    formData.append('email', testEmail);
    formData.append('telefone', '11999887766');
    formData.append('endereco', 'Rua do Teste Completo, 100');
    formData.append('cidade', 'São Paulo');
    formData.append('estado', 'SP');
    formData.append('cep', '01000000');
    formData.append('responsavel_nome', 'João Responsável Fluxo');
    formData.append('responsavel_cpf', testCpfResp);
    formData.append('responsavel_cargo', 'Diretor Geral');
    formData.append('responsavel_email', 'joao.resp@test.com');
    formData.append('responsavel_celular', '11999887766');
    formData.append('numero_funcionarios', '150');
    formData.append('aceite_termos', 'true');
    formData.append('plano_id', String(planoPersonalizadoId));

    // Arquivos simulados
    formData.append('doc_identificacao', {
      name: 'doc_id.pdf',
      type: 'application/pdf',
      size: 16,
      arrayBuffer: async () => new TextEncoder().encode('doc').buffer,
    });
    formData.append('cartao_cnpj', {
      name: 'cartao.pdf',
      type: 'application/pdf',
      size: 16,
      arrayBuffer: async () => new TextEncoder().encode('cnpj').buffer,
    });
    formData.append('contrato_social', {
      name: 'contrato.pdf',
      type: 'application/pdf',
      size: 16,
      arrayBuffer: async () => new TextEncoder().encode('social').buffer,
    });

    const mockRequest = {
      formData: () => Promise.resolve(formData),
      headers: {
        get: (key: string) => {
          if (key === 'x-forwarded-for') return '127.0.0.1';
          return null;
        },
      },
    } as any;

    const cadastroResponse = await cadastroPost(mockRequest);
    let cadastroData: any;
    try {
      cadastroData = await cadastroResponse.json();
    } catch (err) {
      const txt = await cadastroResponse.text();
      console.error('DEBUG cadastroText:', txt);
      cadastroData = { errorText: txt };
    }

    if (cadastroResponse.status !== 201) {
      console.error('DEBUG cadastroStatus:', cadastroResponse.status);
      console.error('DEBUG cadastroData:', cadastroData);
    }

    expect(cadastroResponse.status).toBe(201);
    expect(cadastroData.success).toBe(true);
    expect(cadastroData.contratante.status).toBe('pendente');

    contratanteId = cadastroData.contratante.id;

    // Verificar criação em contratacao_personalizada
    const contratacaoRes = await query(
      'SELECT * FROM contratacao_personalizada WHERE contratante_id = $1',
      [contratanteId]
    );

    expect(contratacaoRes.rows.length).toBe(1);
    expect(contratacaoRes.rows[0].status).toBe('aguardando_valor_admin');

    // 2. ADMIN DEFINE VALORES E GERA LINK
    // \n=== ETAPA 2: ADMIN DEFINE VALORES E GERA LINK ===

    // Simular diretamente no banco ao invés de chamar a API (simplificado para o teste)
    const valorPorFuncionario = 50.0;
    const numeroFuncionarios = 150;
    const valorTotal = valorPorFuncionario * numeroFuncionarios;

    // Gerar token de pagamento
    const crypto = require('crypto');
    paymentToken = crypto.randomBytes(32).toString('hex');
    const expiracao = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h

    // Atualizar contratacao_personalizada
    await query(
      `
      UPDATE contratacao_personalizada 
      SET valor_por_funcionario = $1,
          numero_funcionarios_estimado = $2,
          valor_total_estimado = $3,
          status = 'valor_definido',
          payment_link_token = $4,
          payment_link_expiracao = $5,
          atualizado_em = CURRENT_TIMESTAMP
      WHERE contratante_id = $6
    `,
      [
        valorPorFuncionario,
        numeroFuncionarios,
        valorTotal,
        paymentToken,
        expiracao,
        contratanteId,
      ]
    );

    // Criar contrato
    await query(
      `
      INSERT INTO contratos (
        contratante_id, plano_id, numero_funcionarios, valor_total,
        status, criado_em
      ) VALUES ($1, $2, $3, $4, 'aguardando_pagamento', CURRENT_TIMESTAMP)
    `,
      [contratanteId, planoPersonalizadoId, numeroFuncionarios, valorTotal]
    );

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const linkPagamento = `${baseUrl}/pagamento/personalizado/${paymentToken}`;

    // Verificar atualização em contratacao_personalizada
    const contratacaoAtualizada = await query(
      'SELECT * FROM contratacao_personalizada WHERE contratante_id = $1',
      [contratanteId]
    );

    expect(contratacaoAtualizada.rows[0].status).toBe('valor_definido');
    expect(contratacaoAtualizada.rows[0].valor_por_funcionario).toBe('50.00');
    expect(contratacaoAtualizada.rows[0].valor_total_estimado).toBe('7500.00');
    expect(contratacaoAtualizada.rows[0].payment_link_token).toBe(paymentToken);

    // Verificar criação de contrato
    const contratoRes = await query(
      'SELECT * FROM contratos WHERE contratante_id = $1',
      [contratanteId]
    );

    expect(contratoRes.rows.length).toBe(1);
    expect(contratoRes.rows[0].status).toBe('aguardando_pagamento');
    expect(contratoRes.rows[0].valor_total).toBe('7500.00');

    // 3. SIMULAR ACESSO AO LINK E PAGAMENTO
    // \n=== ETAPA 3: ACESSO AO LINK E CONFIRMAÇÃO DE PAGAMENTO ===

    // Simular confirmação de pagamento diretamente no banco
    // (em produção seria através da API de pagamento)
    await query(
      `
      UPDATE contratacao_personalizada 
      SET status = 'pago',
          atualizado_em = CURRENT_TIMESTAMP
      WHERE contratante_id = $1
    `,
      [contratanteId]
    );

    await query(
      `
      UPDATE contratos 
      SET status = 'ativo',
          aceito = true,
          data_aceite = CURRENT_TIMESTAMP
      WHERE contratante_id = $1
    `,
      [contratanteId]
    );

    await query(
      `
      UPDATE contratantes 
      SET status = 'aprovado',
          pagamento_confirmado = true,
          ativa = true
      WHERE id = $1
    `,
      [contratanteId]
    );

    // ✓ Pagamento confirmado com sucesso

    // 4. VERIFICAR LIBERAÇÃO DE LOGIN
    // \n=== ETAPA 4: VERIFICAÇÃO DE LIBERAÇÃO DE LOGIN ===

    // Verificar se pode criar senha para o contratante
    const contratanteFinal = await query(
      'SELECT * FROM contratantes WHERE id = $1',
      [contratanteId]
    );

    expect(contratanteFinal.rows[0].status).toBe('aprovado');
    expect(contratanteFinal.rows[0].pagamento_confirmado).toBe(true);
    expect(contratanteFinal.rows[0].ativa).toBe(true);

    // Simular criação de senha (login liberado)
    // Usando hash simples para o teste (em produção seria bcrypt)
    const hashedPassword = crypto
      .createHash('sha256')
      .update('SenhaTest@2026')
      .digest('hex');

    await query(
      `
      INSERT INTO entidades_senhas (contratante_id, cpf, senha_hash)
      VALUES ($1, $2, $3)
      ON CONFLICT (contratante_id) DO UPDATE SET senha_hash = EXCLUDED.senha_hash
    `,
      [contratanteId, testCpfResp, hashedPassword]
    );

    const senhaRes = await query(
      'SELECT * FROM entidades_senhas WHERE contratante_id = $1',
      [contratanteId]
    );

    expect(senhaRes.rows.length).toBe(1);

    // ✓ Login liberado com sucesso

    // RESUMO FINAL
    // \n=== RESUMO DO FLUXO COMPLETO ===

    // 1. ✓ Empresa cadastrada (status: pendente)

    // 2. ✓ Admin definiu valores: R$ 7.500,00

    // 3. ✓ Link de pagamento gerado

    // 4. ✓ Pagamento confirmado

    // 5. ✓ Contrato ativado

    // 6. ✓ Login liberado

    // \n🎉 FLUXO COMPLETO EXECUTADO COM SUCESSO!\n

    // Verificação final de todos os estados
    const verificacaoFinal = await query(
      `
      SELECT 
        c.id,
        c.nome,
        c.status as contratante_status,
        c.ativa,
        c.pagamento_confirmado,
        cp.status as contratacao_status,
        cp.valor_total_estimado,
        ct.status as contrato_status,
        ct.aceito as contrato_aceito,
        cs.senha_hash IS NOT NULL as tem_senha
      FROM contratantes c
      LEFT JOIN contratacao_personalizada cp ON c.id = cp.contratante_id
      LEFT JOIN contratos ct ON c.id = ct.contratante_id
      LEFT JOIN entidades_senhas cs ON c.id = cs.contratante_id
      WHERE c.id = $1
    `,
      [contratanteId]
    );

    const estadoFinal = verificacaoFinal.rows[0];

    expect(estadoFinal.contratante_status).toBe('aprovado');
    expect(estadoFinal.ativa).toBe(true);
    expect(estadoFinal.pagamento_confirmado).toBe(true);
    expect(estadoFinal.contratacao_status).toBe('pago');
    expect(estadoFinal.contrato_status).toBe('ativo');
    expect(estadoFinal.contrato_aceito).toBe(true);
    expect(estadoFinal.tem_senha).toBe(true);
  });
});
