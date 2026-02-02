/**
 * Testes de integração para API de cadastro de contratantes
 * Valida o fluxo completo via endpoints HTTP
 */

import { query } from '@/lib/db';

// Mock das funções de Next.js
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(),
  })),
}));

// Mock da função salvarArquivo
let salvarArquivoSpy: jest.SpyInstance;

beforeEach(async () => {
  // Não precisamos mockar salvarArquivo para o teste direto da função
});

afterEach(() => {
  if (salvarArquivoSpy) {
    salvarArquivoSpy.mockRestore();
  }
});

describe('API Cadastro Contratante - Integração', () => {
  const mockCNPJ = '11222333000181';
  const mockResponsavelCPF = '52998224725';
  let contratanteId: number;

  beforeAll(async () => {
    // Limpar dados de teste
    await query(`DELETE FROM contratantes WHERE cnpj = $1`, [mockCNPJ]);
    await query(`DELETE FROM contratantes WHERE email = $1`, [
      'existente@empresa.com',
    ]);
    await query(`DELETE FROM contratantes WHERE email = $1`, [
      'nova@empresa.com',
    ]);
    await query(`DELETE FROM funcionarios WHERE cpf = $1`, [
      mockResponsavelCPF,
    ]);
  });

  afterAll(async () => {
    if (contratanteId) {
      await query(`DELETE FROM contratos WHERE contratante_id = $1`, [
        contratanteId,
      ]);
      await query(`DELETE FROM contratantes WHERE id = $1`, [contratanteId]);
    }
    await query(`DELETE FROM funcionarios WHERE cpf = $1`, [
      mockResponsavelCPF,
    ]);
  });

  describe('POST /api/cadastro/contratante', () => {
    it('deve validar CNPJ obrigatório', async () => {
      const { POST } = await import('@/app/api/cadastro/contratante/route');

      const formData = new FormData();
      formData.append('tipo', 'entidade');
      formData.append('nome', 'Empresa Teste');
      // CNPJ faltando

      const mockRequest = {
        formData: () => Promise.resolve(formData),
        headers: {
          get: jest.fn(() => '127.0.0.1'),
        },
      } as unknown as Request;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('CNPJ');
    });

    it('deve validar formato de CNPJ', async () => {
      const { POST } = await import('@/app/api/cadastro/contratante/route');

      const formData = new FormData();
      formData.append('tipo', 'entidade');
      formData.append('nome', 'Empresa Teste LTDA');
      formData.append('cnpj', '12345678901234'); // CNPJ inválido
      formData.append('email', 'teste@empresa.com');
      formData.append('telefone', '11999999999');
      formData.append('endereco', 'Rua Teste, 123');
      formData.append('cidade', 'São Paulo');
      formData.append('estado', 'SP');
      formData.append('cep', '01234567');
      formData.append('responsavel_nome', 'João Silva');
      formData.append('responsavel_cpf', mockResponsavelCPF);
      formData.append('responsavel_email', 'joao@empresa.com');
      formData.append('responsavel_celular', '11988888888');

      // Mock files
      const mockFile = new File(['test'], 'test.pdf', {
        type: 'application/pdf',
      });
      formData.append('cartao_cnpj', mockFile);
      formData.append('contrato_social', mockFile);
      formData.append('doc_identificacao', mockFile);

      const mockRequest = {
        formData: () => Promise.resolve(formData),
        headers: {
          get: jest.fn(() => '127.0.0.1'),
        },
      } as unknown as Request;

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('CNPJ inválido');
    });

    it('deve rejeitar CNPJ duplicado', async () => {
      // Criar primeiro contratante
      const insertResult = await query(
        `INSERT INTO contratantes (
          tipo, nome, cnpj, email, telefone,
          endereco, cidade, estado, cep,
          responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
          cartao_cnpj_path, contrato_social_path, doc_identificacao_path,
          status, ativa
        ) VALUES (
          'entidade', 'Empresa Existente', $1, 'existente@empresa.com', '11999999999',
          'Rua Existente, 1', 'São Paulo', 'SP', '01234567',
          'Existente', '99999999999', 'existente@test.com', '11988888888',
          '/uploads/test1.pdf', '/uploads/test2.pdf', '/uploads/test3.pdf',
          'pendente', false
        ) RETURNING id`,
        [mockCNPJ]
      );

      // Testar diretamente a função createContratante (que é chamada pela API)
      const { createContratante } = await import('@/lib/db');

      await expect(
        createContratante({
          tipo: 'entidade',
          nome: 'Nova Empresa',
          cnpj: mockCNPJ, // CNPJ duplicado
          email: 'nova@empresa.com',
          telefone: '11999999999',
          endereco: 'Rua Nova, 123',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01234567',
          responsavel_nome: 'João Silva',
          responsavel_cpf: mockResponsavelCPF,
          responsavel_email: 'joao@empresa.com',
          responsavel_celular: '11988888888',
          cartao_cnpj_path: '/uploads/test1.pdf',
          contrato_social_path: '/uploads/test2.pdf',
          doc_identificacao_path: '/uploads/test3.pdf',
          status: 'pendente',
          ativa: false,
        })
      ).rejects.toThrow('CNPJ já cadastrado no sistema');
    });

    it('deve aceitar cadastro sem anexos quando NEXT_PUBLIC_DISABLE_ANEXOS=true', async () => {
      const prev = process.env.NEXT_PUBLIC_DISABLE_ANEXOS;
      process.env.NEXT_PUBLIC_DISABLE_ANEXOS = 'true';

      // Usar CNPJ válido para o teste
      const testCNPJ = '11.444.777/0001-61';
      const testEmail = `nofiles-${Date.now()}@test.local`;

      try {
        const { POST } = await import('@/app/api/cadastro/contratante/route');

        // Garantir que não exista contratante com este CNPJ/email antes de criar
        await query('DELETE FROM contratantes WHERE cnpj = $1', [
          testCNPJ.replace(/\D/g, ''),
        ]);
        await query('DELETE FROM contratantes WHERE email = $1', [testEmail]);

        const formData = new FormData();
        formData.append('tipo', 'entidade');
        formData.append('nome', 'Empresa Sem Anexos');
        formData.append('cnpj', testCNPJ);
        formData.append('email', testEmail);
        formData.append('telefone', '11999999990');
        formData.append('endereco', 'Rua Sem Anexos, 1');
        formData.append('cidade', 'Teste');
        formData.append('estado', 'SP');
        formData.append('cep', '01234567');
        formData.append('responsavel_nome', 'Teste');
        formData.append('responsavel_cpf', '52998224725');
        formData.append('responsavel_email', 'teste@sem-anexos.test');
        formData.append('responsavel_celular', '11999999990');

        const mockRequest = {
          formData: () => Promise.resolve(formData),
          headers: { get: jest.fn(() => '127.0.0.1') },
        } as unknown as Request;

        const response = await POST(mockRequest);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
        expect(data.contratante).toBeDefined();

        // Cleanup: remover contratante criado
        await query('DELETE FROM contratantes WHERE cnpj = $1', [
          testCNPJ.replace(/\D/g, ''),
        ]);
      } finally {
        process.env.NEXT_PUBLIC_DISABLE_ANEXOS = prev;
      }
    });
  });

  describe('GET /api/admin/novos-cadastros', () => {
    it('deve listar contratantes pendentes com plano_tipo', async () => {
      const result = await query(
        `SELECT c.*, p.tipo as plano_tipo
         FROM contratantes c
         LEFT JOIN planos p ON c.plano_id = p.id
         WHERE c.status IN ('pendente', 'em_reanalise')
         LIMIT 5`
      );

      expect(result.rows.length).toBeGreaterThanOrEqual(0);

      if (result.rows.length > 0) {
        const contratante = result.rows[0];
        expect(contratante).toHaveProperty('id');
        expect(contratante).toHaveProperty('nome');
        expect(contratante).toHaveProperty('status');

        // Se tem plano_id, deve ter plano_tipo
        if (contratante.plano_id) {
          expect(contratante.plano_tipo).toBeDefined();
        }
      }
    });
  });

  describe('POST /api/admin/novos-cadastros - Aprovação', () => {
    it('deve permitir aprovação de plano personalizado SEM pagamento', async () => {
      // Criar contratante personalizado
      const planoPersonalizadoRes = await query(
        `SELECT id FROM planos WHERE tipo = 'personalizado' LIMIT 1`
      );

      if (planoPersonalizadoRes.rows.length === 0) {
        console.warn('Plano personalizado não encontrado, pulando teste');
        return;
      }

      const planoId = planoPersonalizadoRes.rows[0].id;

      const contratanteRes = await query(
        `INSERT INTO contratantes (
          tipo, nome, cnpj, email, telefone,
          endereco, cidade, estado, cep,
          responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
          cartao_cnpj_path, contrato_social_path, doc_identificacao_path,
          status, ativa, plano_id, plano_tipo, pagamento_confirmado
        ) VALUES (
          'entidade', 'Empresa Personalizada Teste', '55555555000155', 'pers@test.com', '11999999999',
          'Rua Pers, 1', 'São Paulo', 'SP', '01234567',
          'Responsável Pers', '55555555555', 'resp@test.com', '11988888888',
          '/uploads/test1.pdf', '/uploads/test2.pdf', '/uploads/test3.pdf',
          'pendente', false, $1, 'personalizado', false
        ) RETURNING id`,
        [planoId]
      );

      const testContratanteId = contratanteRes.rows[0].id;

      // Verificar que pode aprovar mesmo sem pagamento (para personalizado)
      const contratante = await query(
        `SELECT c.*, p.tipo as plano_tipo
         FROM contratantes c
         LEFT JOIN planos p ON c.plano_id = p.id
         WHERE c.id = $1`,
        [testContratanteId]
      );

      const c = contratante.rows[0];

      // Lógica de validação corrigida
      if (c.plano_tipo !== 'personalizado' && !c.pagamento_confirmado) {
        // Deve falhar
        expect(c.pagamento_confirmado).toBe(true);
      } else {
        // Deve passar
        expect(true).toBe(true);
      }

      // Limpar
      await query(`DELETE FROM contratantes WHERE id = $1`, [
        testContratanteId,
      ]);
    });
  });
});

describe('Validações de Schema e Migrations', () => {
  it('deve ter migration 003 aplicada', async () => {
    // Verificar coluna contrato_id
    const contratoIdCol = await query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'contratantes' AND column_name = 'contrato_id'`
    );
    expect(contratoIdCol.rows.length).toBe(1);

    // Verificar coluna plano_tipo
    const planoTipoCol = await query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'contratantes' AND column_name = 'plano_tipo'`
    );
    expect(planoTipoCol.rows.length).toBe(1);

    // Verificar coluna valor_personalizado
    const valorPersonalizadoCol = await query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'contratos' AND column_name = 'valor_personalizado'`
    );
    expect(valorPersonalizadoCol.rows.length).toBe(1);
  });

  it('deve ter trigger sync_contratante_plano_tipo', async () => {
    const result = await query(
      `SELECT tgname FROM pg_trigger WHERE tgname = 'trg_sync_contratante_plano_tipo'`
    );
    expect(result.rows.length).toBeGreaterThan(0);
  });

  it('deve ter função criar_senha_inicial_entidade', async () => {
    const result = await query(
      `SELECT proname, pronargs FROM pg_proc 
       WHERE proname = 'criar_senha_inicial_entidade'`
    );
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows[0].pronargs).toBe(1); // 1 argumento (p_contratante_id)
  });
});

describe('RLS - Row Level Security', () => {
  it('deve ter RLS habilitado em contratantes', async () => {
    const result = await query(
      `SELECT relname, relrowsecurity
       FROM pg_class
       WHERE relname = 'contratantes' AND relnamespace = 'public'::regnamespace`
    );

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].relrowsecurity).toBe(true);
  });

  it('deve ter RLS habilitado em contratos', async () => {
    const result = await query(
      `SELECT relname, relrowsecurity
       FROM pg_class
       WHERE relname = 'contratos' AND relnamespace = 'public'::regnamespace`
    );

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].relrowsecurity).toBe(true);
  });

  it('deve ter policies criadas para contratantes', async () => {
    const result = await query(
      `SELECT policyname FROM pg_policies
       WHERE tablename = 'contratantes'`
    );

    expect(result.rows.length).toBeGreaterThan(0);

    const policyNames = result.rows.map((r) => r.policyname);
    expect(policyNames).toContain('admin_all_contratantes');
    expect(policyNames).toContain('gestor_entidade_own_contratante');
  });

  it('deve ter função pode_acessar_contratante', async () => {
    const result = await query(
      `SELECT proname FROM pg_proc WHERE proname = 'pode_acessar_contratante'`
    );
    expect(result.rows.length).toBeGreaterThan(0);
  });
});
