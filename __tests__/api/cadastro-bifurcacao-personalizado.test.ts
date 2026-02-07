/**
 * Teste de bifurcação do fluxo de cadastro entre plano fixo e personalizado
 * Valida que personalizado entra em status 'pendente' aguardando ação do admin
 * e fixo entra diretamente em 'aguardando_pagamento'
 */

import { query } from '@/lib/db';

// Mock Next.js modules
jest.mock('next/server', () => ({
  NextRequest: class NextRequest {
    constructor(
      public url: string,
      public init?: { method?: string }
    ) {}
    get method() {
      return this.init?.method || 'GET';
    }
    async json() {
      return {};
    }
  },
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => ({
      json: async () => data,
      status: init?.status || 200,
      ok: (init?.status || 200) >= 200 && (init?.status || 200) < 300,
    }),
  },
}));

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

describe('Cadastro Contratante - Bifurcação Personalizado vs Fixo', () => {
  let planoFixoId: number;
  let planoPersonalizadoId: number;

  beforeAll(async () => {
    // Criar plano fixo e personalizado
    const planoFixo = await query(
      `INSERT INTO planos (tipo, nome, preco, ativo) VALUES ('fixo', 'Teste Fixo', 100, true) RETURNING id`
    );
    planoFixoId = planoFixo.rows[0].id;

    const planoPersonalizado = await query(
      `INSERT INTO planos (tipo, nome, preco, ativo) VALUES ('personalizado', 'Teste Personalizado', 0, true) RETURNING id`
    );
    planoPersonalizadoId = planoPersonalizado.rows[0].id;
  });

  afterAll(async () => {
    // Cleanup
    await query(
      'DELETE FROM contratacao_personalizada WHERE contratante_id IS NOT NULL'
    );
    await query('DELETE FROM contratantes WHERE cnpj IN ($1, $2)', [
      '06990590000123',
      '07234453000189',
    ]);
    await query('DELETE FROM planos WHERE id IN ($1, $2)', [
      planoFixoId,
      planoPersonalizadoId,
    ]);
  });

  it('deve criar contratante com plano FIXO em status aguardando_pagamento', async () => {
    const { POST } = await import('@/app/api/cadastro/tomadores/route');

    const payload = {
      tipo: 'entidade',
      nome: 'Empresa Plano Fixo',
      cnpj: '06990590000123',
      email: 'fixo@test.com',
      telefone: '11987654321',
      endereco: 'Rua A, 123',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01000000',
      responsavel_nome: 'Responsável Fixo',
      responsavel_cpf: '52998224725',
      responsavel_cargo: 'Gerente',
      responsavel_telefone: '11987654321',
      responsavel_email: 'resp.fixo@test.com',
      numero_funcionarios: 50,
      aceite_termos: true,
      plano_id: planoFixoId,
      doc_identificacao: new Blob(['test'], { type: 'application/pdf' }),
    };

    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      formData.append(key, value as string | Blob);
    });

    const req = {
      url: 'http://localhost:3000/api/cadastro/contratante',
      method: 'POST',
      headers: new Headers({ 'x-forwarded-for': '127.0.0.1' }),
      formData: async () => formData,
    } as any;

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.contratante.status).toBe('aguardando_pagamento');

    // Verificar que NÃO foi criado registro em contratacao_personalizada
    const personalizadoCheck = await query(
      'SELECT * FROM contratacao_personalizada WHERE contratante_id = $1',
      [data.contratante.id]
    );
    expect(personalizadoCheck.rows.length).toBe(0);
  });

  it('deve criar contratante com plano PERSONALIZADO em status pendente', async () => {
    const { POST } = await import('@/app/api/cadastro/tomadores/route');

    const payload = {
      tipo: 'entidade',
      nome: 'Empresa Plano Personalizado',
      cnpj: '07234453000189',
      email: 'personalizado@test.com',
      telefone: '11987654321',
      endereco: 'Rua B, 456',
      cidade: 'Rio de Janeiro',
      estado: 'RJ',
      cep: '20000000',
      responsavel_nome: 'Responsável Personalizado',
      responsavel_cpf: '34608775009',
      responsavel_cargo: 'Diretor',
      responsavel_telefone: '21987654321',
      responsavel_email: 'resp.personalizado@test.com',
      numero_funcionarios: 150,
      aceite_termos: true,
      plano_id: planoPersonalizadoId,
      doc_identificacao: new Blob(['test'], { type: 'application/pdf' }),
    };

    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      formData.append(key, value as string | Blob);
    });

    const req = {
      url: 'http://localhost:3000/api/cadastro/contratante',
      method: 'POST',
      headers: new Headers({ 'x-forwarded-for': '127.0.0.1' }),
      formData: async () => formData,
    } as any;

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.contratante.status).toBe('pendente');

    // Verificar que FOI criado registro em contratacao_personalizada
    const personalizadoCheck = await query(
      'SELECT * FROM contratacao_personalizada WHERE contratante_id = $1',
      [data.contratante.id]
    );
    expect(personalizadoCheck.rows.length).toBe(1);
    expect(personalizadoCheck.rows[0].status).toBe('pendente');
    expect(personalizadoCheck.rows[0].numero_funcionarios).toBe(150);
  });
});
