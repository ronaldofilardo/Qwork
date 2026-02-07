import { query } from '@/lib/db';

// Mock Next.js modules minimalmente
jest.mock('next/server', () => ({
  NextRequest: class NextRequest {
    constructor(
      public url: string,
      public init?: { method?: string }
    ) {}
    get method() {
      return this.init?.method || 'GET';
    }
    json() {
      return {};
    }
  },
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => ({
      json: () => data,
      status: init?.status || 200,
      ok: (init?.status || 200) >= 200 && (init?.status || 200) < 300,
    }),
  },
}));

describe('Integração - Cadastro Plano Personalizado', () => {
  let planoPersonalizadoId: number;

  beforeEach(async () => {
    // Limpar dados específicos do teste que podem ter ficado de execuções anteriores
    await query(
      'DELETE FROM contratacao_personalizada WHERE contratante_id IN (SELECT id FROM contratantes WHERE cnpj = $1)',
      ['06990590000123']
    );
    await query(
      "DELETE FROM notificacoes WHERE dados_contexto->>'contratacao_id' IS NOT NULL"
    );
    await query('DELETE FROM contratantes WHERE cnpj = $1', ['06990590000123']);
    await query('DELETE FROM contratantes WHERE responsavel_cpf = $1', [
      '52998224725',
    ]);
  });

  afterAll(async () => {
    await query(
      'DELETE FROM contratacao_personalizada WHERE contratante_id IN (SELECT id FROM contratantes WHERE plano_id = $1)',
      [planoPersonalizadoId]
    );
    await query('DELETE FROM contratantes WHERE plano_id = $1', [
      planoPersonalizadoId,
    ]);
    await query('DELETE FROM planos WHERE id = $1', [planoPersonalizadoId]);
    // Clean up notifications
    await query(
      "DELETE FROM notificacoes WHERE dados_contexto->>'contratacao_id' IS NOT NULL"
    );
  });

  it('deve criar contratante e registro em contratacao_personalizada e notificar admins', async () => {
    const { POST } = await import('@/app/api/cadastro/tomadores/route');

    const payload = {
      tipo: 'entidade',
      nome: 'Empresa Teste Integração',
      cnpj: '06990590000123',
      email: 'integ@test.com',
      telefone: '21999998877',
      endereco: 'Rua Integração, 1',
      cidade: 'Rio',
      estado: 'RJ',
      cep: '20000000',
      responsavel_nome: 'Resp Integração',
      responsavel_cpf: '52998224725',
      responsavel_cargo: 'Diretor',
      responsavel_celular: '21999998877',
      responsavel_email: 'resp.integ@test.com',
      numero_funcionarios: 120,
      aceite_termos: true,
      plano_id: planoPersonalizadoId,
      // criar file-like objects compatíveis com Node (name, type, size, arrayBuffer)
      doc_identificacao: {
        name: 'doc_identificacao.pdf',
        type: 'application/pdf',
        size: 16,
        arrayBuffer: () => new TextEncoder().encode('pdf').buffer,
      },
      cartao_cnpj: {
        name: 'cartao_cnpj.pdf',
        type: 'application/pdf',
        size: 16,
        arrayBuffer: () => new TextEncoder().encode('cartao').buffer,
      },
      contrato_social: {
        name: 'contrato_social.pdf',
        type: 'application/pdf',
        size: 16,
        arrayBuffer: () => new TextEncoder().encode('contrato').buffer,
      },
    } as any;

    // Criar um formData fake que retorna os nossos file-like objects
    class FakeFormData {
      constructor(
        private map: Record<string, string | number | boolean | object>
      ) {}
      get(key: string): string | number | boolean | object | undefined {
        return this.map[key];
      }
    }

    const fake = new FakeFormData({
      tipo: payload.tipo,
      nome: payload.nome,
      cnpj: payload.cnpj,
      email: payload.email,
      telefone: payload.telefone,
      endereco: payload.endereco,
      cidade: payload.cidade,
      estado: payload.estado,
      cep: payload.cep,
      responsavel_nome: payload.responsavel_nome,
      responsavel_cpf: payload.responsavel_cpf,
      responsavel_cargo: payload.responsavel_cargo,
      responsavel_email: payload.responsavel_email,
      responsavel_celular: payload.responsavel_celular,
      numero_funcionarios: String(payload.numero_funcionarios),
      aceite_termos: String(payload.aceite_termos),
      plano_id: String(payload.plano_id),
      // arquivos: file-like com arrayBuffer
      doc_identificacao: {
        name: 'doc_identificacao.pdf',
        type: 'application/pdf',
        size: 16,
        arrayBuffer: () => new TextEncoder().encode('pdf').buffer,
      },
      cartao_cnpj: {
        name: 'cartao_cnpj.pdf',
        type: 'application/pdf',
        size: 16,
        arrayBuffer: () => new TextEncoder().encode('cartao').buffer,
      },
      contrato_social: {
        name: 'contrato_social.pdf',
        type: 'application/pdf',
        size: 16,
        arrayBuffer: () => new TextEncoder().encode('contrato').buffer,
      },
    });

    const req = {
      url: 'http://localhost:3000/api/cadastro/contratante',
      method: 'POST',
      headers: new Headers({ 'x-forwarded-for': '127.0.0.1' }),
      formData: () => fake,
    };

    // Garantir que não existe um contratante com mesmo CNPJ antes do teste
    await query(
      'DELETE FROM contratacao_personalizada WHERE contratante_id IN (SELECT id FROM contratantes WHERE cnpj = $1)',
      [payload.cnpj]
    );
    await query(
      "DELETE FROM notificacoes WHERE dados_contexto->>'contratacao_id' IS NOT NULL"
    );
    await query('DELETE FROM contratantes WHERE cnpj = $1', [payload.cnpj]);

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.contratante.status).toBe('pendente');

    // Verificar contratacao_personalizada
    const contratacao = await query(
      'SELECT * FROM contratacao_personalizada WHERE contratante_id = $1',
      [data.contratante.id]
    );
    expect(contratacao.rows.length).toBe(1);
    expect(contratacao.rows[0].status).toBe('aguardando_valor_admin');

    // Verificar notificações para admins
    const notificacoes = await query(
      'SELECT * FROM notificacoes WHERE contratacao_personalizada_id = $1',
      [contratacao.rows[0].id]
    );
    expect(notificacoes.rows.length).toBeGreaterThan(0);
  }, 20000);
});
