import { query } from '@/lib/db';
import crypto from 'crypto';

/**
 * Teste de integração: Fluxo completo do plano personalizado (novo fluxo correto)
 *
 * Fluxo esperado:
 * 1. Contratante cadastra-se com plano personalizado
 * 2. Sistema confirma recebimento e informa que está em análise
 * 3. Admin recebe pré-cadastro em status 'aguardando_valor_admin'
 * 4. Admin define número de funcionários e valor → Sistema gera link da proposta
 * 5. Contratante acessa link e vê proposta (plano, funcionários, valor)
 * 6. Contratante aceita proposta → Redireciona para contrato padrão
 * 7. Contratante aceita contrato → Redireciona para simulador de pagamento
 * 8. Sistema simula pagamento → Libera login
 */

// Mock session
jest.mock('@/lib/session', () => ({
  getSession: jest.fn(() => ({
    cpf: '123.456.789-00',
    nome: 'Admin Teste',
    perfil: 'admin',
  })),
  createSession: jest.fn(),
  destroySession: jest.fn(),
}));

describe('Fluxo Completo - Plano Personalizado (Novo Fluxo)', () => {
  const cnpjTeste = '82.457.916/0001-57';
  const cpfResponsavel = '123.456.789-00';
  let planoPersonalizadoId: number;
  let contratanteId: number;
  let contratacaoId: number;
  let token: string;
  let contratoId: number;

  beforeAll(async () => {
    // Buscar ID do plano personalizado
    const planoResult = await query(
      "SELECT id FROM planos WHERE tipo = 'personalizado' AND ativo = true LIMIT 1"
    );

    if (planoResult.rows.length === 0) {
      throw new Error('Plano personalizado não encontrado no banco de testes');
    }

    planoPersonalizadoId = planoResult.rows[0].id;
    console.log(
      '✓ Usando plano personalizado existente:',
      planoPersonalizadoId
    );

    // Limpar registros de teste anteriores
    await query(
      'DELETE FROM contratacao_personalizada WHERE contratante_id IN (SELECT id FROM contratantes WHERE cnpj = $1)',
      [cnpjTeste]
    );
    await query(
      'DELETE FROM contratos WHERE contratante_id IN (SELECT id FROM contratantes WHERE cnpj = $1)',
      [cnpjTeste]
    );
    await query('DELETE FROM contratantes WHERE cnpj = $1', [cnpjTeste]);
    await query('DELETE FROM contratantes WHERE responsavel_cpf = $1', [
      cpfResponsavel,
    ]);
  });

  afterAll(async () => {
    // Limpar dados criados no teste
    if (contratanteId) {
      await query(
        'DELETE FROM contratacao_personalizada WHERE contratante_id = $1',
        [contratanteId]
      );
      await query('DELETE FROM contratos WHERE contratante_id = $1', [
        contratanteId,
      ]);
      await query('DELETE FROM contratantes WHERE id = $1', [contratanteId]);
    }
  });

  it('Etapa 1: Contratante cadastra-se com plano personalizado', async () => {
    console.log('\n=== ETAPA 1: CADASTRO DO CONTRATANTE ===');

    const formData = new FormData();
    formData.append('tipo', 'clinica');
    formData.append('nome', 'Clínica Saúde Teste Fluxo Completo Ltda');
    formData.append('cnpj', cnpjTeste);
    formData.append('plano_id', planoPersonalizadoId.toString());
    formData.append('numero_funcionarios_estimado', '3000');
    formData.append('email', 'fluxo.completo@test.com');
    formData.append('telefone', '(41) 99999-9999');
    formData.append('endereco', 'Rua Teste Fluxo, 123');
    formData.append('cidade', 'Curitiba');
    formData.append('estado', 'PR');
    formData.append('cep', '80000-000');
    formData.append('responsavel_nome', 'Dr. Fluxo Teste');
    formData.append('responsavel_cpf', cpfResponsavel);
    formData.append('responsavel_cargo', 'Diretor');
    formData.append('responsavel_email', 'diretor.fluxo@test.com');
    formData.append('responsavel_celular', '(41) 98888-8888');

    // Arquivos mock
    formData.append(
      'cartao_cnpj',
      new Blob([Buffer.from('mock cnpj')], { type: 'application/pdf' }),
      'cnpj.pdf'
    );
    formData.append(
      'contrato_social',
      new Blob([Buffer.from('mock contrato')], { type: 'application/pdf' }),
      'contrato.pdf'
    );
    formData.append(
      'doc_identificacao',
      new Blob([Buffer.from('mock rg')], { type: 'application/pdf' }),
      'rg.pdf'
    );

    const response = await fetch(
      'http://localhost:3000/api/cadastro/contratante',
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.contratante).toBeDefined();
    expect(data.contratante.status).toBe('pendente');

    contratanteId = data.id;
    console.log('✓ Contratante cadastrado com sucesso! ID:', contratanteId);
    console.log('✓ Status:', data.contratante.status);
  });

  it('Etapa 2: Verificar pré-cadastro criado com status aguardando_valor_admin', async () => {
    console.log('\n=== ETAPA 2: VERIFICAR PRÉ-CADASTRO ===');

    const result = await query(
      'SELECT * FROM contratacao_personalizada WHERE contratante_id = $1',
      [contratanteId]
    );

    expect(result.rows.length).toBe(1);
    const contratacao = result.rows[0];

    expect(contratacao.status).toBe('aguardando_valor_admin');
    expect(contratacao.numero_funcionarios_estimado).toBe(3000);

    contratacaoId = contratacao.id;
    console.log('✓ Pré-cadastro encontrado! ID:', contratacaoId);
    console.log('✓ Status:', contratacao.status);
    console.log(
      '✓ Funcionários estimados:',
      contratacao.numero_funcionarios_estimado
    );
  });

  it('Etapa 3: Admin define valor e gera link da proposta', async () => {
    console.log('\n=== ETAPA 3: ADMIN DEFINE VALOR E GERA LINK ===');

    const response = await fetch(
      'http://localhost:3000/api/admin/personalizado/definir-valor',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contratacao_id: contratacaoId,
          numero_funcionarios: 3000,
          valor_por_funcionario: 15.5,
        }),
      }
    );

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.link_proposta).toBeDefined();
    expect(data.data.token).toBeDefined();
    expect(data.data.proposta_info.numero_funcionarios).toBe(3000);
    expect(data.data.proposta_info.valor_por_funcionario).toBe(15.5);
    expect(data.data.proposta_info.valor_total).toBe(46500);

    token = data.data.token;

    console.log('✓ Link da proposta gerado!');
    console.log('✓ Token:', token);
    console.log('✓ Valor total:', data.data.proposta_info.valor_total);
    console.log('✓ Link:', data.data.link_proposta);

    // Verificar status atualizado
    const contratacaoAtualizada = await query(
      'SELECT status FROM contratacao_personalizada WHERE id = $1',
      [contratacaoId]
    );

    expect(contratacaoAtualizada.rows[0].status).toBe('valor_definido');
    console.log('✓ Status da contratação atualizado para: valor_definido');
  });

  it('Etapa 4: Buscar proposta através do token', async () => {
    console.log('\n=== ETAPA 4: BUSCAR PROPOSTA PELO TOKEN ===');

    const response = await fetch(`http://localhost:3000/api/proposta/${token}`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.valido).toBe(true);
    expect(data.contratacao_id).toBe(contratacaoId);
    expect(data.numero_funcionarios).toBe(3000);
    expect(data.valor_total).toBe(46500);

    console.log('✓ Proposta encontrada!');
    console.log('✓ Contratante:', data.contratante_nome);
    console.log('✓ Funcionários:', data.numero_funcionarios);
    console.log('✓ Valor total:', data.valor_total);
  });

  it('Etapa 5: Contratante aceita proposta', async () => {
    console.log('\n=== ETAPA 5: ACEITAR PROPOSTA ===');

    const response = await fetch('http://localhost:3000/api/proposta/aceitar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contratacao_id: contratacaoId,
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.redirect_url).toContain('/termos/contrato');
    expect(data.contrato_id).toBeDefined();

    contratoId = data.contrato_id;

    console.log('✓ Proposta aceita!');
    console.log('✓ Contrato ID:', contratoId);
    console.log('✓ Redirect URL:', data.redirect_url);

    // Verificar contrato criado
    const contratoResult = await query(
      'SELECT * FROM contratos WHERE id = $1',
      [contratoId]
    );
    expect(contratoResult.rows.length).toBe(1);
    expect(contratoResult.rows[0].status).toBe('aguardando_aceite');

    console.log('✓ Contrato criado com status:', contratoResult.rows[0].status);
  });

  it('Etapa 6: Verificar status final da contratação', async () => {
    console.log('\n=== ETAPA 6: VERIFICAR STATUS FINAL ===');

    const result = await query(
      'SELECT status FROM contratacao_personalizada WHERE id = $1',
      [contratacaoId]
    );

    expect(result.rows[0].status).toBe('aguardando_aceite_contrato');
    console.log('✓ Status da contratação:', result.rows[0].status);

    console.log('\n=== ✓ FLUXO COMPLETO VALIDADO COM SUCESSO ===');
    console.log(
      'Próximo passo: Contratante aceita contrato → Simulador de pagamento → Liberação de login'
    );
  });
});
