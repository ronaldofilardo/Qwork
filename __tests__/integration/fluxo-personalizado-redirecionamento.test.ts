/**
 * Teste E2E Simples - Validação do Fluxo de Redirecionamento
 *
 * Valida que o fluxo personalizado redireciona corretamente:
 * Proposta aceita → /sucesso-cadastro → Contrato → Simulador → Login
 */

import { query } from '@/lib/db';

describe('✅ Validação Fluxo Personalizado - Redirecionamento', () => {
  const cnpjTeste = '29599854000150';
  let contratanteId: number;
  let contratacaoId: number;
  let planoId: number;

  beforeAll(async () => {
    // Buscar plano personalizado
    const planoResult = await query(
      "SELECT id FROM planos WHERE tipo = 'personalizado' AND ativo = true LIMIT 1"
    );
    planoId = planoResult.rows[0].id;

    // Limpar
    await query(
      'DELETE FROM contratacao_personalizada WHERE contratante_id IN (SELECT id FROM contratantes WHERE cnpj = $1)',
      [cnpjTeste]
    );
    await query(
      'DELETE FROM contratos WHERE contratante_id IN (SELECT id FROM contratantes WHERE cnpj = $1)',
      [cnpjTeste]
    );
    await query('DELETE FROM contratantes WHERE cnpj = $1', [cnpjTeste]);

    // Criar contratante de teste
    const contratanteResult = await query(
      `INSERT INTO contratantes (
        nome, cnpj, email, telefone, endereco, cidade, estado, cep, tipo, plano_id,
        responsavel_nome, responsavel_cpf, responsavel_cargo, responsavel_email, responsavel_celular,
        status, cartao_cnpj_path, contrato_social_path, doc_identificacao_path
      ) VALUES (
        'Clínica Teste Redirecionamento', $1, 'redir@test.com', '11999999999',
        'Rua Teste, 123', 'São Paulo', 'SP', '01000-000', 'clinica', $2,
        'Dr. Redir', '12345678900', 'Diretor', 'redir@test.com', '11999999999',
        'pendente', '/uploads/cnpj.pdf', '/uploads/contrato.pdf', '/uploads/rg.pdf'
      ) RETURNING id`,
      [cnpjTeste, planoId]
    );
    contratanteId = contratanteResult.rows[0].id;

    // Criar contratacao_personalizada
    const contratacaoResult = await query(
      `INSERT INTO contratacao_personalizada (
        contratante_id, numero_funcionarios_estimado, status,
        valor_por_funcionario, valor_total_estimado
      ) VALUES ($1, 2500, 'valor_definido', 18.00, 45000.00)
      RETURNING id`,
      [contratanteId]
    );
    contratacaoId = contratacaoResult.rows[0].id;
  });

  afterAll(async () => {
    await query('DELETE FROM contratacao_personalizada WHERE id = $1', [
      contratacaoId,
    ]);
    await query('DELETE FROM contratos WHERE contratante_id = $1', [
      contratanteId,
    ]);
    await query('DELETE FROM contratantes WHERE id = $1', [contratanteId]);
  });

  it('deve redirecionar para /sucesso-cadastro após aceitar proposta', async () => {
    console.log('\n=== TESTE: REDIRECIONAMENTO APÓS ACEITE ===\n');

    // Mock session
    jest.mock('@/lib/session', () => ({
      getSession: jest.fn(() => null), // Não autenticado (contratante novo)
    }));

    const { POST } = await import('@/app/api/proposta/aceitar/route');
    const request = new (await import('next/server')).NextRequest(
      'http://localhost:3000/api/proposta/aceitar',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contratacao_id: contratacaoId,
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    console.log('→ Status:', response.status);
    console.log('→ Resposta:', JSON.stringify(data, null, 2));

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.redirect_url).toBeDefined();

    // Validar URL de redirecionamento
    expect(data.redirect_url).toContain('/sucesso-cadastro');
    expect(data.redirect_url).toContain(`id=${contratanteId}`);
    expect(data.redirect_url).toContain('contrato_id=');
    expect(data.redirect_url).toContain('origem=personalizado');

    console.log('✓ URL de redirecionamento correta:', data.redirect_url);

    // Validar criação do contrato
    expect(data.contrato_id).toBeDefined();
    const contratoId = data.contrato_id;

    const contratoResult = await query(
      'SELECT * FROM contratos WHERE id = $1',
      [contratoId]
    );

    expect(contratoResult.rows.length).toBe(1);
    expect(contratoResult.rows[0].status).toBe('aguardando_aceite');
    expect(contratoResult.rows[0].contratante_id).toBe(contratanteId);

    console.log('✓ Contrato criado:', {
      id: contratoId,
      status: contratoResult.rows[0].status,
      contratante_id: contratoResult.rows[0].contratante_id,
    });

    // Validar atualização de status
    const contratacaoResult = await query(
      'SELECT status FROM contratacao_personalizada WHERE id = $1',
      [contratacaoId]
    );

    expect(contratacaoResult.rows[0].status).toBe('aguardando_aceite_contrato');
    console.log('✓ Status atualizado: aguardando_aceite_contrato');

    console.log('\n=== ✅ FLUXO DE REDIRECIONAMENTO VALIDADO ===');
    console.log('📝 Próximos passos do usuário:');
    console.log('  1. Acessa /sucesso-cadastro');
    console.log('  2. Aceita contrato padrão');
    console.log('  3. Confirma pagamento no simulador');
    console.log('  4. Login liberado automaticamente');
  });
});
