/**
 * Helper para criar dados de teste com valores padrão válidos
 * Facilita a criação de entidades de teste sem precisar especificar todos os campos NOT NULL
 */

import { query } from '../../lib/db';

export function uniqueCode(prefix = 'CODE') {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

export interface CreatetomadorOptions {
  tipo?: 'entidade' | 'clinica';
  nome?: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  status?:
    | 'pendente'
    | 'aprovado'
    | 'rejeitado'
    | 'em_reanalise'
    | 'aguardando_pagamento'
    | 'pago';
  responsavel_nome?: string;
  responsavel_cpf?: string;
  responsavel_email?: string;
  responsavel_celular?: string;
}

export interface CreateContratoOptions {
  tomador_id: number;
  numero_funcionarios?: number;
  valor_total?: number;
  status?:
    | 'pendente'
    | 'aprovado'
    | 'rejeitado'
    | 'em_reanalise'
    | 'aguardando_pagamento'
    | 'pago';
  conteudo_gerado?: string;
}

export interface CreatePagamentoOptions {
  entidade_id?: number;
  clinica_id?: number;
  contrato_id?: number | null;
  valor?: number;
  status?: 'pendente' | 'pago' | 'cancelado' | 'expirado';
  metodo?: 'pix' | 'boleto' | 'cartao_credito';
  link_pagamento?: string;
  external_id?: string;
}

/**
 * Cria um tomador de teste com valores padrão válidos
 * Usa tabela 'entidades' se tipo='entidade', ou 'clinicas' se tipo='clinica'
 */
export async function createTesttomador(
  options: CreatetomadorOptions = {}
): Promise<number> {
  const timestamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  const defaults = {
    tipo: options.tipo || 'entidade',
    nome: options.nome || `Empresa Teste ${timestamp}-${rand}`,
    // garantir cnpj com formato único por teste
    cnpj:
      options.cnpj || `${timestamp.toString().slice(-8)}${rand.slice(0, 3)}001`,
    email: options.email || `teste-${timestamp}-${rand}@empresa.com`,
    telefone: options.telefone || '11999999999',
    endereco: options.endereco || 'Rua Teste',
    cidade: options.cidade || 'São Paulo',
    estado: options.estado || 'SP',
    cep: options.cep || '01000-000',
    status: options.status || 'aprovado',
    responsavel_nome: options.responsavel_nome || 'João Responsável',
    // CPF: 11 dígitos aleatórios — evita colisão em Promise.all com múltiplas clínicas
    responsavel_cpf:
      options.responsavel_cpf ||
      String(Math.floor(10000000000 + Math.random() * 89999999999)),
    responsavel_email:
      options.responsavel_email ||
      `responsavel-${timestamp}-${rand}@empresa.com`,
    responsavel_celular: options.responsavel_celular || '11988887777',
  };

  // Usar tabela entidades para tipo='entidade', clinicas para tipo='clinica'
  const isClinica = defaults.tipo === 'clinica';
  const tableName = isClinica ? 'clinicas' : 'entidades';

  // Para clínicas, não incluir 'tipo' (não existe nessa coluna)
  const query_text = isClinica
    ? `INSERT INTO ${tableName} (
         nome, cnpj, email, telefone, endereco, cidade, estado, cep, status,
         responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, ativa
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true)
       RETURNING id`
    : `INSERT INTO ${tableName} (
         tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep, status,
         responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING id`;

  const params = isClinica
    ? [
        defaults.nome,
        defaults.cnpj,
        defaults.email,
        defaults.telefone,
        defaults.endereco,
        defaults.cidade,
        defaults.estado,
        defaults.cep,
        defaults.status,
        defaults.responsavel_nome,
        defaults.responsavel_cpf,
        defaults.responsavel_email,
        defaults.responsavel_celular,
      ]
    : [
        defaults.tipo,
        defaults.nome,
        defaults.cnpj,
        defaults.email,
        defaults.telefone,
        defaults.endereco,
        defaults.cidade,
        defaults.estado,
        defaults.cep,
        defaults.status,
        defaults.responsavel_nome,
        defaults.responsavel_cpf,
        defaults.responsavel_email,
        defaults.responsavel_celular,
      ];

  const result = await query(query_text, params);

  return result.rows[0].id;
}

/**
 * Cria um contrato de teste com valores padrão válidos
 */
export async function createTestContrato(
  options: CreateContratoOptions
): Promise<number> {
  const conteudoDefault =
    options.conteudo_gerado || 'Contrato de teste gerado automaticamente';
  const defaults = {
    numero_funcionarios: options.numero_funcionarios || 10,
    valor_total: options.valor_total || 200.0,
    conteudo: conteudoDefault,
    conteudo_gerado: conteudoDefault,
  };

  const result = await query(
    `INSERT INTO contratos (tomador_id, numero_funcionarios, valor_total, conteudo, conteudo_gerado)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [
      options.tomador_id,
      defaults.numero_funcionarios,
      defaults.valor_total,
      defaults.conteudo,
      defaults.conteudo_gerado,
    ]
  );

  return result.rows[0].id;
}

/**
 * Cria um pagamento de teste com valores padrão válidos
 */
export async function createTestPagamento(
  options: CreatePagamentoOptions
): Promise<number> {
  const defaults = {
    valor: options.valor || 200.0,
    status: options.status || 'pendente',
    metodo: options.metodo || 'pix',
    link_pagamento:
      options.link_pagamento || `https://pagamento.teste/link-${Date.now()}`,
    external_id: options.external_id || `external-${Date.now()}`,
  };

  // Determine which ID to use (entidade_id or clinica_id)
  let query_text: string;
  let params: any[];

  if (options.entidade_id) {
    query_text = `INSERT INTO pagamentos (entidade_id, valor, status, metodo)
     VALUES ($1, $2, $3, $4)
     RETURNING id`;
    params = [
      options.entidade_id,
      defaults.valor,
      defaults.status,
      defaults.metodo,
    ];
  } else if (options.clinica_id) {
    query_text = `INSERT INTO pagamentos (clinica_id, valor, status, metodo)
     VALUES ($1, $2, $3, $4)
     RETURNING id`;
    params = [
      options.clinica_id,
      defaults.valor,
      defaults.status,
      defaults.metodo,
    ];
  } else {
    throw new Error('Either entidade_id or clinica_id must be provided');
  }

  const result = await query(query_text, params);

  return result.rows[0].id;
}

/**
 * Cria um recibo de teste
 */
export async function createTestRecibo(
  tomadorId: number,
  pagamentoId: number,
  contratoId?: number
): Promise<number> {
  const timestamp = Date.now();

  const result = await query(
    `INSERT INTO recibos (
       tomador_id, pagamento_id, contrato_id, numero_recibo, 
       valor, descricao, emitido_em
     )
     VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
     RETURNING id`,
    [
      tomadorId,
      pagamentoId,
      contratoId || null,
      `RECIBO-${timestamp}`,
      200.0,
      'Recibo de teste gerado automaticamente',
    ]
  );

  return result.rows[0].id;
}

/**
 * Remove todos os dados de teste criados
 */
export async function cleanupTestData(): Promise<void> {
  // Ordem importa devido às foreign keys
  await query(`DELETE FROM avaliacoes WHERE funcionario_cpf LIKE '99999%'`);
  await query(
    `DELETE FROM lotes_avaliacao WHERE tipo = 'completo' AND liberado_por LIKE '99999%'`
  );
  await query(
    `DELETE FROM funcionarios WHERE email LIKE 'func-test-%@empresa.com'`
  );
  await query(
    `DELETE FROM pagamentos WHERE valor = 200.0 AND status IN ('pago', 'pendente')`
  );
  await query(
    `DELETE FROM contratos WHERE conteudo LIKE '%gerado automaticamente%'`
  );
  // Deletar de ambas as tabelas
  await query(
    `DELETE FROM entidades WHERE email LIKE 'teste-%@empresa.com' OR email LIKE 'responsavel-%@empresa.com'`
  );
  await query(
    `DELETE FROM clinicas WHERE email LIKE 'teste-%@empresa.com' OR email LIKE 'responsavel-%@empresa.com' OR email LIKE 'clinica-test-%@test.com'`
  );
}

// ─────────────────────────────────────────────────────────────
// Factories adicionais: Clínica, Lote, Funcionário, Avaliação
// ─────────────────────────────────────────────────────────────

export interface CreateClinicaOptions {
  nome?: string;
  cnpj?: string;
  email?: string;
  /** OBRIGATÓRIO pela constraint NOT NULL — padrão: '11987654321' */
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  responsavel_nome?: string;
  responsavel_cpf?: string;
  responsavel_email?: string;
  responsavel_celular?: string;
}

/**
 * Cria uma clínica de teste garantindo todos os campos NOT NULL obrigatórios.
 * Resolve o problema histórico de INSERTs manuais que omitiam `telefone`.
 */
export async function createTestClinica(
  options: CreateClinicaOptions = {}
): Promise<number> {
  const timestamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);

  const defaults = {
    nome: options.nome ?? `Clinica Test ${timestamp}-${rand}`,
    // CNPJ: 14 dígitos aleatórios (evita colisão em chamadas paralelas no mesmo ms)
    cnpj:
      options.cnpj ??
      String(Math.floor(10000000000000 + Math.random() * 89999999999999)),
    email: options.email ?? `clinica-test-${timestamp}-${rand}@test.com`,
    telefone: options.telefone ?? '11987654321', // campo NOT NULL — sempre incluído
    endereco: options.endereco ?? 'Av. Paulista, 1000',
    cidade: options.cidade ?? 'São Paulo',
    estado: options.estado ?? 'SP',
    cep: options.cep ?? '01310-100',
    responsavel_nome: options.responsavel_nome ?? 'Responsável Test',
    // CPF: 11 dígitos aleatórios — evita clinicas_responsavel_cpf_key em Promise.all
    responsavel_cpf:
      options.responsavel_cpf ??
      String(Math.floor(10000000000 + Math.random() * 89999999999)),
    responsavel_email:
      options.responsavel_email ?? `resp-clinica-${timestamp}-${rand}@test.com`,
    responsavel_celular: options.responsavel_celular ?? '11988887777',
  };

  const result = await query(
    `INSERT INTO clinicas (
       nome, cnpj, email, telefone, endereco, cidade, estado, cep,
       responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, ativa
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true)
     RETURNING id`,
    [
      defaults.nome,
      defaults.cnpj,
      defaults.email,
      defaults.telefone,
      defaults.endereco,
      defaults.cidade,
      defaults.estado,
      defaults.cep,
      defaults.responsavel_nome,
      defaults.responsavel_cpf,
      defaults.responsavel_email,
      defaults.responsavel_celular,
    ]
  );

  return result.rows[0].id;
}

export interface CreateLoteOptions {
  empresa_id: number;
  clinica_id: number;
  liberado_por: string;
  tipo?: 'completo' | 'parcial';
  status?: 'ativo' | 'concluido' | 'cancelado';
  numero_ordem?: number;
}

/**
 * Cria um lote de avaliação de teste com valores padrão válidos.
 */
export async function createTestLote(
  options: CreateLoteOptions
): Promise<number> {
  const maxOrdem = await query(
    'SELECT COALESCE(MAX(numero_ordem), 0) AS max FROM lotes_avaliacao WHERE empresa_id = $1',
    [options.empresa_id]
  );
  const numeroOrdem = options.numero_ordem ?? maxOrdem.rows[0].max + 1;

  const result = await query(
    `INSERT INTO lotes_avaliacao (empresa_id, clinica_id, tipo, status, numero_ordem, liberado_por)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [
      options.empresa_id,
      options.clinica_id,
      options.tipo ?? 'completo',
      options.status ?? 'ativo',
      numeroOrdem,
      options.liberado_por,
    ]
  );

  return result.rows[0].id;
}

export interface CreateFuncionarioOptions {
  tomador_id: number;
  cpf?: string;
  nome?: string;
  email?: string;
  /** Senha padrão hash = 'test123' */
  senha_hash?: string;
}

/**
 * Cria um funcionário de teste com valores padrão válidos.
 */
export async function createTestFuncionario(
  options: CreateFuncionarioOptions
): Promise<string> {
  const timestamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  const cpf =
    options.cpf ??
    String(Math.floor(Math.random() * 99999999999))
      .padStart(11, '9')
      .slice(0, 11);

  await query(
    `INSERT INTO funcionarios (cpf, nome, tomador_id, usuario_tipo, email, senha_hash)
     VALUES ($1, $2, $3, 'funcionario_entidade', $4, $5)`,
    [
      cpf,
      options.nome ?? `Funcionário Test ${timestamp}`,
      options.tomador_id,
      options.email ?? `func-test-${timestamp}-${rand}@empresa.com`,
      options.senha_hash ??
        '$2a$10$NNUkJ.nfWUrrDcAcwWNjH.RfMEbMfIVW5j7pVz4vTPfEfIqCzUMme',
    ]
  );

  return cpf;
}

export interface CreateAvaliacaoOptions {
  lote_id: number;
  funcionario_cpf: string;
  status?: 'iniciada' | 'em_andamento' | 'concluida' | 'cancelada';
}

/**
 * Cria uma avaliação de teste com status inicial.
 */
export async function createTestAvaliacao(
  options: CreateAvaliacaoOptions
): Promise<number> {
  const result = await query(
    `INSERT INTO avaliacoes (lote_id, funcionario_cpf, status, inicio)
     VALUES ($1, $2, $3, NOW())
     RETURNING id`,
    [options.lote_id, options.funcionario_cpf, options.status ?? 'iniciada']
  );

  return result.rows[0].id;
}

// Testes para as funções de factory de dados de teste
describe('Test Data Factory', () => {
  afterEach(async () => {
    // Limpar dados criados pelos testes do factory
    await cleanupTestData();
  });

  describe('createTesttomador', () => {
    it('deve criar um tomador com valores padrão', async () => {
      const id = await createTesttomador();
      expect(typeof id).toBe('number');
      expect(id).toBeGreaterThan(0);
    });

    it('deve criar um tomador com opções customizadas', async () => {
      const options = {
        nome: 'Empresa Customizada',
        email: `custom-${Date.now()}@empresa.com`,
        status: 'pendente' as const,
      };
      const id = await createTesttomador(options);
      expect(typeof id).toBe('number');
    });
  });

  describe('createTestContrato', () => {
    it('deve criar um contrato para um tomador existente', async () => {
      const tomadorId = await createTesttomador();
      const contratoId = await createTestContrato({
        tomador_id: tomadorId,
      });

      expect(typeof contratoId).toBe('number');
      expect(contratoId).toBeGreaterThan(0);
    });

    it('deve criar um contrato com opções customizadas', async () => {
      const tomadorId = await createTesttomador();
      const options = {
        tomador_id: tomadorId,
        numero_funcionarios: 50,
        valor_total: 1000,
        status: 'aprovado' as const,
      };
      const contratoId = await createTestContrato(options);
      expect(typeof contratoId).toBe('number');
    });
  });

  describe('createTestPagamento', () => {
    it('deve criar um pagamento para um tomador existente', async () => {
      const tomadorId = await createTesttomador();
      const pagamentoId = await createTestPagamento({
        entidade_id: tomadorId,
      });

      expect(typeof pagamentoId).toBe('number');
      expect(pagamentoId).toBeGreaterThan(0);
    });

    it('deve criar um pagamento com opções customizadas', async () => {
      const tomadorId = await createTesttomador();
      const options = {
        entidade_id: tomadorId,
        valor: 500,
        status: 'pago' as const,
        metodo: 'pix' as const,
      };
      const pagamentoId = await createTestPagamento(options);
      expect(typeof pagamentoId).toBe('number');
    });
  });

  describe('cleanupTestData', () => {
    it('deve executar sem erros', async () => {
      await expect(cleanupTestData()).resolves.not.toThrow();
    });
  });
});
