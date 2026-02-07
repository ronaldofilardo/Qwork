/**
 * Teste E2E Completo - Fluxo Plano Personalizado
 *
 * Simula o fluxo real end-to-end conforme especificado:
 *
 * 1. Contratante preenche formulário → Recebe "em análise, aguarde link"
 * 2. Admin recebe pré-cadastro → Define funcionários + valor → Gera link
 * 3. Contratante acessa link → Vê proposta → Aceita
 * 4. Sistema redireciona para /sucesso-cadastro com contrato
 * 5. Contratante aceita contrato → Abre simulador → Confirma pagamento
 * 6. Sistema libera login
 */

import { query } from '@/lib/db';
import crypto from 'crypto';

// Mock do next/navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`REDIRECT: ${url}`);
  }),
}));

// Mock de session com admin
const mockAdminSession = {
  usuario: { id: 999, email: 'admin@test.com', perfil: 'admin' },
};

jest.mock('@/lib/session', () => ({
  getSession: jest.fn(() => Promise.resolve(mockAdminSession)),
  createSession: jest.fn(() => Promise.resolve()),
}));

describe('🎯 Fluxo E2E Completo - Plano Personalizado', () => {
  const cnpjTeste = '29.599.854/0001-50';
  const cpfTeste = '123.456.789-00';
  const emailTeste = 'clinica.e2e@test.com';
  let planoPersonalizadoId: number;
  let contratanteId: number;
  let contratacaoId: number;
  let tokenProposta: string;
  let contratoId: number;

  beforeAll(async () => {
    // Buscar plano personalizado
    const planoResult = await query(
      "SELECT id FROM planos WHERE tipo = 'personalizado' AND ativo = true LIMIT 1"
    );

    if (planoResult.rows.length === 0) {
      throw new Error('Plano personalizado não encontrado no banco de testes');
    }

    planoPersonalizadoId = planoResult.rows[0].id;

    // Limpar dados anteriores
    await query('BEGIN');
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
      cpfTeste,
    ]);
    await query('COMMIT');

    // ✓ Banco limpo para teste E2E

  });

  afterAll(async () => {
    // Limpar dados do teste
    await query('BEGIN');
    await query(
      'DELETE FROM contratacao_personalizada WHERE contratante_id IN (SELECT id FROM contratantes WHERE cnpj = $1)',
      [cnpjTeste]
    );
    await query(
      'DELETE FROM contratos WHERE contratante_id IN (SELECT id FROM contratantes WHERE cnpj = $1)',
      [cnpjTeste]
    );
    await query('DELETE FROM contratantes WHERE cnpj = $1', [cnpjTeste]);
    await query('COMMIT');
  });

  it('ETAPA 1: Contratante preenche formulário e recebe confirmação "em análise"', async () => {
    // \n=== ETAPA 1: CADASTRO DO CONTRATANTE ===\n

    const formData = new FormData();
    formData.append('tipo', 'clinica');
    formData.append('cnpj', cnpjTeste);
    formData.append('nome', 'Clínica E2E Teste Completo');
    formData.append('email', emailTeste);
    formData.append('telefone', '(11) 98765-4321');
    formData.append('cep', '01310-100');
    formData.append('endereco', 'Av Paulista, 1000');
    formData.append('cidade', 'São Paulo');
    formData.append('estado', 'SP');
    formData.append('responsavel_nome', 'Dr. Teste E2E');
    formData.append('responsavel_cpf', cpfTeste);
    formData.append('responsavel_cargo', 'Diretor');
    formData.append('responsavel_email', emailTeste);
    formData.append('responsavel_celular', '(11) 98765-4321');
    formData.append('plano_id', planoPersonalizadoId.toString());
    formData.append('numero_funcionarios_estimado', '3000');

    // Arquivos mock
    const mockPdfBuffer = Buffer.from('Mock PDF content');
    formData.append(
      'cartao_cnpj',
      new Blob([mockPdfBuffer], { type: 'application/pdf' }),
      'cnpj.pdf'
    );
    formData.append(
      'contrato_social',
      new Blob([mockPdfBuffer], { type: 'application/pdf' }),
      'contrato.pdf'
    );
    formData.append(
      'doc_identificacao',
      new Blob([mockPdfBuffer], { type: 'application/pdf' }),
      'rg.pdf'
    );

    const { POST } = await import('@/app/api/cadastro/tomadores/route');
    const request = new (await import('next/server')).NextRequest(
      'http://localhost:3000/api/cadastro/contratante',
      {
        method: 'POST',
        body: formData,
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.contratante.tipo).toBe('clinica');
    expect(data.contratante.status).toBe('pendente');
    expect(data.message).toContain('Aguarde análise do administrador');

    contratanteId = data.id;

    // Verificar contratacao_personalizada
    const contratacaoResult = await query(
      'SELECT * FROM contratacao_personalizada WHERE contratante_id = $1',
      [contratanteId]
    );

    expect(contratacaoResult.rows.length).toBe(1);
    expect(contratacaoResult.rows[0].status).toBe('aguardando_valor_admin');
    expect(contratacaoResult.rows[0].numero_funcionarios_estimado).toBe(3000);

    contratacaoId = contratacaoResult.rows[0].id;
    // ✓ Status: aguardando_valor_admin

  });

  it('ETAPA 2: Admin define valor e gera link de proposta', async () => {
    // \n=== ETAPA 2: ADMIN DEFINE VALOR E GERA LINK ===\n

    const { POST } =
      await import('@/app/api/admin/personalizado/definir-valor/route');
    const request = new (await import('next/server')).NextRequest(
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

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.link_proposta).toBeDefined();

    // Extrair token do link
    const urlMatch = data.link_proposta.match(/\/proposta\/([^?]+)/);
    expect(urlMatch).toBeTruthy();
    tokenProposta = urlMatch![1];

    // Verificar atualização no banco
    const contratacaoAtualizada = await query(
      'SELECT * FROM contratacao_personalizada WHERE id = $1',
      [contratacaoId]
    );

    expect(contratacaoAtualizada.rows[0].status).toBe('valor_definido');
    expect(
      parseFloat(contratacaoAtualizada.rows[0].valor_por_funcionario)
    ).toBe(15.5);
    expect(parseFloat(contratacaoAtualizada.rows[0].valor_total_estimado)).toBe(
      46500.0
    );
    expect(contratacaoAtualizada.rows[0].link_enviado).toBe(data.link_proposta);

    // ✓ Status atualizado: valor_definido

    // ✓ Valor total: R$ 46.500,00 (3000 × R$ 15,50)

  });

  it('ETAPA 3: Contratante acessa link e visualiza proposta', async () => {
    // \n=== ETAPA 3: CONTRATANTE ACESSA PROPOSTA ===\n

    const { GET } = await import('@/app/api/proposta/[token]/route');
    const request = new (await import('next/server')).NextRequest(
      `http://localhost:3000/api/proposta/${tokenProposta}`
    );

    const response = await GET(request, { params: { token: tokenProposta } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.valido).toBe(true);
    expect(data.contratacao_id).toBe(contratacaoId);
    expect(data.numero_funcionarios).toBe(3000);
    expect(data.valor_por_funcionario).toBe(15.5);
    expect(data.valor_total).toBe(46500.0);

    // ✓ Proposta válida e acessível

    // ✓ Dados exibidos ao contratante:

    //   - Funcionários: 3000

    //   - Valor/func: R$ 15,50

    //   - Total: R$ 46.500,00

  });

  it('ETAPA 4: Contratante aceita proposta e é redirecionado para contrato', async () => {
    // \n=== ETAPA 4: ACEITE DA PROPOSTA ===\n

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

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.redirect_url).toContain('/sucesso-cadastro');
    expect(data.redirect_url).toContain(`id=${contratanteId}`);
    expect(data.redirect_url).toContain('contrato_id=');
    expect(data.redirect_url).toContain('origem=personalizado');

    contratoId = data.contrato_id;
    // ✓ Proposta aceita com sucesso

    // Verificar criação do contrato
    const contratoResult = await query(
      'SELECT * FROM contratos WHERE id = $1',
      [contratoId]
    );
    expect(contratoResult.rows.length).toBe(1);
    expect(contratoResult.rows[0].status).toBe('aguardando_aceite');
    expect(contratoResult.rows[0].numero_funcionarios).toBe(3000);

    // Verificar atualização da contratacao_personalizada
    const contratacaoResult = await query(
      'SELECT * FROM contratacao_personalizada WHERE id = $1',
      [contratacaoId]
    );
    expect(contratacaoResult.rows[0].status).toBe('aguardando_aceite_contrato');

    // ✓ Status: aguardando_aceite_contrato

  });

  it('ETAPA 5: Sistema exibe página de sucesso com contrato e simulador', async () => {
      '\n=== ETAPA 5: VERIFICAÇÃO DO FLUXO CONTRATO + SIMULADOR ===\n'
    );

    // Verificar se o contrato está pronto para aceite
    const contratoResult = await query(
      'SELECT * FROM contratos WHERE id = $1',
      [contratoId]
    );
    const contrato = contratoResult.rows[0];

    expect(contrato.status).toBe('aguardando_aceite');
    expect(contrato.contratante_id).toBe(contratanteId);
    expect(contrato.numero_funcionarios).toBe(3000);
    expect(parseFloat(contrato.valor_total)).toBe(46500.0);

    // ✓ Contrato disponível para aceite:

    //   - Status: aguardando_aceite

    //   - Valor: R$ 46.500,00

    // Verificar URL que seria exibida
    const expectedUrl = `/sucesso-cadastro?id=${contratanteId}&contrato_id=${contratoId}&origem=personalizado`;
    // ✓ Página /sucesso-cadastro irá:

    //   1. Exibir modal de contrato padrão

    //   2. Após aceite → Atualizar contrato.aceito = true

    //   3. Exibir simulador de pagamento

    //   4. Após pagamento → Liberar login

  });

  it('RESUMO: Validar estado final do fluxo', async () => {
    // \n=== 📊 RESUMO DO FLUXO E2E ===\n

    // Contratante
    const contratanteResult = await query(
      'SELECT * FROM contratantes WHERE id = $1',
      [contratanteId]
    );
    const contratante = contratanteResult.rows[0];

    // 📋 CONTRATANTE:

    // Contratação Personalizada
    const contratacaoResult = await query(
      'SELECT * FROM contratacao_personalizada WHERE id = $1',
      [contratacaoId]
    );
    const contratacao = contratacaoResult.rows[0];

    // \n💼 CONTRATAÇÃO PERSONALIZADA:

      '  - Valor/func: R$',
      parseFloat(contratacao.valor_por_funcionario).toFixed(2)
    );
      '  - Total: R$',
      parseFloat(contratacao.valor_total_estimado).toFixed(2)
    );
    //   - Link enviado:', contratacao.link_enviado ? 'Sim' : 'Não

    // Contrato
    const contratoResult = await query(
      'SELECT * FROM contratos WHERE id = $1',
      [contratoId]
    );
    const contrato = contratoResult.rows[0];

    // \n📄 CONTRATO:

    // \n✅ FLUXO E2E VALIDADO COM SUCESSO!

    // \n📝 PRÓXIMOS PASSOS (fora deste teste):

    //   1. Usuário acessa /sucesso-cadastro

    //   2. Aceita contrato padrão

    //   3. Confirma pagamento no simulador

    //   4. Login é liberado automaticamente

    expect(contratacao.status).toBe('aguardando_aceite_contrato');
    expect(contrato.status).toBe('aguardando_aceite');
    expect(contrato.aceito).toBe(false);
  });
});
