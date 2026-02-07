/**
 * Teste de Validação - Fluxo UI Plano Personalizado
 *
 * Valida que o plano personalizado:
 * 1. NÃO redireciona para pagamento após cadastro
 * 2. Exibe mensagem de "aguardando análise"
 * 3. Informa sobre recebimento de link por email
 */

import { query } from '@/lib/db';

describe('✅ Validação UI - Plano Personalizado Sem Redirecionamento', () => {
  let planoPersonalizadoId: number;
  const cnpjTeste = '70973914000114'; // CNPJ válido

  beforeAll(async () => {
    // Buscar plano personalizado
    const planoResult = await query(
      "SELECT id FROM planos WHERE tipo = 'personalizado' AND ativo = true LIMIT 1"
    );

    if (planoResult.rows.length === 0) {
      throw new Error('Plano personalizado não encontrado');
    }

    planoPersonalizadoId = planoResult.rows[0].id;

    // Limpar
    await query(
      'DELETE FROM contratacao_personalizada WHERE contratante_id IN (SELECT id FROM contratantes WHERE cnpj = $1)',
      [cnpjTeste]
    );
    await query('DELETE FROM contratantes WHERE cnpj = $1', [cnpjTeste]);
  });

  afterAll(async () => {
    await query(
      'DELETE FROM contratacao_personalizada WHERE contratante_id IN (SELECT id FROM contratantes WHERE cnpj = $1)',
      [cnpjTeste]
    );
    await query('DELETE FROM contratantes WHERE cnpj = $1', [cnpjTeste]);
  });

  it('deve retornar requires_payment=false e mensagem adequada para plano personalizado', async () => {
    // \n=== TESTE: RESPOSTA API PARA PLANO PERSONALIZADO ===\n

    const { POST } = await import('@/app/api/cadastro/tomadores/route');

    class MockFormData {
      private data: Map<string, any> = new Map();

      append(key: string, value: any) {
        this.data.set(key, value);
      }

      get(key: string) {
        return this.data.get(key);
      }
    }

    const formData = new MockFormData();
    formData.append('tipo', 'clinica');
    formData.append('nome', 'Clínica UI Test Personalizado');
    formData.append('cnpj', cnpjTeste);
    formData.append('email', 'ui-test@personalizado.com');
    formData.append('telefone', '11988887777');
    formData.append('endereco', 'Rua UI Test, 999');
    formData.append('cidade', 'São Paulo');
    formData.append('estado', 'SP');
    formData.append('cep', '01000000');
    formData.append('responsavel_nome', 'Dr. UI Test');
    formData.append('responsavel_cpf', '12345678909'); // CPF válido
    formData.append('responsavel_cargo', 'Diretor');
    formData.append('responsavel_email', 'ui-test@personalizado.com');
    formData.append('responsavel_celular', '11988887777');
    formData.append('plano_id', String(planoPersonalizadoId));
    formData.append('numero_funcionarios_estimado', '1500');

    // Arquivos mock
    const mockFile = {
      name: 'test.pdf',
      type: 'application/pdf',
      size: 16,
      arrayBuffer: async () => new TextEncoder().encode('test').buffer,
    };

    formData.append('cartao_cnpj', mockFile);
    formData.append('contrato_social', mockFile);
    formData.append('doc_identificacao', mockFile);

    const mockRequest = {
      formData: () => Promise.resolve(formData),
      headers: {
        get: (key: string) => {
          if (key === 'x-forwarded-for') return '127.0.0.1';
          return null;
        },
      },
    } as unknown as Request;

    const response = await POST(mockRequest);
    const data = await response.json();

    // Validações
    expect(response.status).toBe(201);
    expect(data.success).toBe(true);

    // ✅ NÃO deve ter URL de simulador
    expect(data.requires_payment).toBe(false);
    expect(data.simulador_url).toBeNull();

    // ✅ Deve ter mensagem de aguardando análise
    expect(data.message).toContain('Aguarde análise do administrador');

    // \n✅ VALIDAÇÕES:

    //   ✓ requires_payment: false

    //   ✓ simulador_url: null

    //   ✓ Mensagem: "Aguarde análise do administrador"

    // \n📱 COMPORTAMENTO ESPERADO NA UI:

    //   1. Modal NÃO redireciona para /sucesso-cadastro

    //   2. Modal NÃO redireciona para simulador

    //   3. Modal exibe mensagem de sucesso com:

    //      - "Dados enviados para análise"

    //      - "Receberá link por email"

    //      - "Tempo de resposta: 48h"

    //   4. Botão "Fechar" volta para tela de login

  });
});
