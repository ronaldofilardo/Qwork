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
  plano_id?: number;
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
  tomador_id: number;
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
    responsavel_cpf:
      options.responsavel_cpf ||
      `${timestamp.toString().slice(-9)}${String(Math.floor(Math.random() * 90) + 10)}`,
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
    plano_id: options.plano_id || 1,
    numero_funcionarios: options.numero_funcionarios || 10,
    valor_total: options.valor_total || 200.0,
    conteudo: conteudoDefault,
    conteudo_gerado: conteudoDefault,
  };

  const result = await query(
    `INSERT INTO contratos (tomador_id, plano_id, numero_funcionarios, valor_total, conteudo, conteudo_gerado)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [
      options.tomador_id,
      defaults.plano_id,
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

  const result = await query(
    `INSERT INTO pagamentos (tomador_id, valor, status, metodo)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [options.tomador_id, defaults.valor, defaults.status, defaults.metodo]
  );

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
    `DELETE FROM clinicas WHERE email LIKE 'teste-%@empresa.com' OR email LIKE 'responsavel-%@empresa.com'`
  );
}

// Testes para as funções de factory de dados de teste
describe('Test Data Factory', () => {
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
        tomador_id: tomadorId,
      });

      expect(typeof pagamentoId).toBe('number');
      expect(pagamentoId).toBeGreaterThan(0);
    });

    it('deve criar um pagamento com opções customizadas', async () => {
      const tomadorId = await createTesttomador();
      const options = {
        tomador_id: tomadorId,
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
