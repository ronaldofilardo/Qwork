/**
 * @file test-fixtures.ts
 * ─────────────────────────────────────────────────────────────
 * Factories de entidades de teste com schema ATUAL (fev/2026).
 *
 * DIFERENTE de test-data-factory.ts (legado, mantido por compatibilidade),
 * este arquivo:
 *  - Reflete o schema real sem colunas removidas.
 *  - Não usa `tomador_id` / `usuario_tipo` em `funcionarios`.
 *  - Fornece limpeza por ID, mais segura que limpeza por padrão de email.
 *  - Exporta interfaces tipadas para todas as opções.
 *
 * USO:
 *   import { makeClinica, makeLote, makeFuncionario, cleanup } from '@/tests/helpers/test-fixtures';
 *
 *   let clinicaId: number;
 *   beforeAll(async () => { clinicaId = await makeClinica(); });
 *   afterAll(async () => { await cleanup(ids); });
 */

import { query } from '@/lib/db';

// ────────────────────────────────────────────────────────────
// Utilitários
// ────────────────────────────────────────────────────────────

function uid(prefix = '') {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);
  return `${prefix}${ts}${rand}`.toUpperCase().slice(0, 20);
}

function uniqueCpf(): string {
  // Gera CPF puramente numérico de 11 dígitos; não validado pelo algoritmo
  // mas único o suficiente para testes.
  return (
    String(Date.now()).slice(-9) + String(Math.floor(Math.random() * 89) + 10)
  );
}

function uniqueCnpj(): string {
  const base = String(Date.now()).slice(-8);
  const rand = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
  return `${base}${rand}00`; // 14 dígitos sem formatação
}

// ────────────────────────────────────────────────────────────
// Rastreamento para cleanup automático
// ────────────────────────────────────────────────────────────

export interface FixtureIds {
  clinicaIds: number[];
  entidadeIds: number[];
  loteIds: number[];
  /** CPFs de funcionários criados */
  funcionarioCpfs: string[];
  avaliacaoIds: number[];
  laudoIds: number[];
}

export function emptyFixtureIds(): FixtureIds {
  return {
    clinicaIds: [],
    entidadeIds: [],
    loteIds: [],
    funcionarioCpfs: [],
    avaliacaoIds: [],
    laudoIds: [],
  };
}

/**
 * Remove todos os registros pelos IDs rastreados.
 * Ordem garante respeito às FK.
 */
export async function cleanupFixtures(ids: FixtureIds): Promise<void> {
  if (ids.laudoIds.length) {
    await query(`DELETE FROM laudos WHERE id = ANY($1)`, [ids.laudoIds]);
  }
  if (ids.avaliacaoIds.length) {
    await query(`DELETE FROM avaliacoes WHERE id = ANY($1)`, [
      ids.avaliacaoIds,
    ]);
  }
  if (ids.funcionarioCpfs.length) {
    await query(`DELETE FROM funcionarios WHERE cpf = ANY($1)`, [
      ids.funcionarioCpfs,
    ]);
  }
  if (ids.loteIds.length) {
    await query(`DELETE FROM lotes_avaliacao WHERE id = ANY($1)`, [
      ids.loteIds,
    ]);
  }
  if (ids.clinicaIds.length) {
    await query(`DELETE FROM clinicas WHERE id = ANY($1)`, [ids.clinicaIds]);
  }
  if (ids.entidadeIds.length) {
    await query(`DELETE FROM entidades WHERE id = ANY($1)`, [ids.entidadeIds]);
  }
}

// ────────────────────────────────────────────────────────────
// Clínica
// ────────────────────────────────────────────────────────────

export interface ClinicaFixture {
  nome?: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  responsavel_nome?: string;
  /** Deve ser único por teste. Padrão: gerado automaticamente. */
  responsavel_cpf?: string;
  responsavel_email?: string;
  responsavel_celular?: string;
  ativa?: boolean;
}

/**
 * Insere uma clínica de teste com TODOS os campos NOT NULL preenchidos.
 * Garante unicidade de `cnpj`, `email` e `responsavel_cpf`.
 */
export async function makeClinica(opts: ClinicaFixture = {}): Promise<number> {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 6);

  const row = {
    nome: opts.nome ?? `Clinica Fixture ${ts}-${rand}`,
    cnpj: opts.cnpj ?? uniqueCnpj(),
    email: opts.email ?? `fixture-clinica-${ts}-${rand}@test.com`,
    telefone: opts.telefone ?? '11987654321',
    endereco: opts.endereco ?? 'Av. Paulista, 1000',
    cidade: opts.cidade ?? 'São Paulo',
    estado: opts.estado ?? 'SP',
    cep: opts.cep ?? '01310-100',
    responsavel_nome: opts.responsavel_nome ?? 'Responsável Fixture',
    responsavel_cpf: opts.responsavel_cpf ?? uniqueCpf(),
    responsavel_email:
      opts.responsavel_email ?? `resp-fixture-${ts}-${rand}@test.com`,
    responsavel_celular: opts.responsavel_celular ?? '11988887777',
    ativa: opts.ativa ?? true,
  };

  const res = await query(
    `INSERT INTO clinicas
       (nome, cnpj, email, telefone, endereco, cidade, estado, cep,
        responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular, ativa)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING id`,
    [
      row.nome,
      row.cnpj,
      row.email,
      row.telefone,
      row.endereco,
      row.cidade,
      row.estado,
      row.cep,
      row.responsavel_nome,
      row.responsavel_cpf,
      row.responsavel_email,
      row.responsavel_celular,
      row.ativa,
    ]
  );

  return res.rows[0].id as number;
}

// ────────────────────────────────────────────────────────────
// Entidade (empresa contratante)
// ────────────────────────────────────────────────────────────

export interface EntidadeFixture {
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
    | 'aguardando_pagamento'
    | 'pago';
  responsavel_nome?: string;
  responsavel_cpf?: string;
  responsavel_email?: string;
  responsavel_celular?: string;
}

/**
 * Insere uma entidade (empresa RH) de teste.
 * Preenche todos os campos NOT NULL.
 */
export async function makeEntidade(
  opts: EntidadeFixture = {}
): Promise<number> {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 6);

  const row = {
    tipo: opts.tipo ?? 'entidade',
    nome: opts.nome ?? `Entidade Fixture ${ts}-${rand}`,
    cnpj: opts.cnpj ?? uniqueCnpj(),
    email: opts.email ?? `fixture-entidade-${ts}-${rand}@test.com`,
    telefone: opts.telefone ?? '11999998888',
    endereco: opts.endereco ?? 'Rua das Flores, 200',
    cidade: opts.cidade ?? 'Campinas',
    estado: opts.estado ?? 'SP',
    cep: opts.cep ?? '13000-000',
    status: opts.status ?? 'aprovado',
    responsavel_nome: opts.responsavel_nome ?? 'Gestor Fixture',
    responsavel_cpf: opts.responsavel_cpf ?? uniqueCpf(),
    responsavel_email:
      opts.responsavel_email ?? `gestor-fixture-${ts}-${rand}@test.com`,
    responsavel_celular: opts.responsavel_celular ?? '11977776666',
  };

  const res = await query(
    `INSERT INTO entidades
       (tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep, status,
        responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING id`,
    [
      row.tipo,
      row.nome,
      row.cnpj,
      row.email,
      row.telefone,
      row.endereco,
      row.cidade,
      row.estado,
      row.cep,
      row.status,
      row.responsavel_nome,
      row.responsavel_cpf,
      row.responsavel_email,
      row.responsavel_celular,
    ]
  );

  return res.rows[0].id as number;
}

// ────────────────────────────────────────────────────────────
// Lote de Avaliação
// ────────────────────────────────────────────────────────────

export interface LoteFixture {
  empresa_id: number;
  clinica_id: number;
  liberado_por: string;
  tipo?: 'completo' | 'parcial';
  status?: 'ativo' | 'concluido' | 'cancelado';
  numero_ordem?: number;
}

/**
 * Insere um lote de avaliação de teste.
 * `numero_ordem` é calculado automaticamente se não informado.
 */
export async function makeLote(opts: LoteFixture): Promise<number> {
  let numeroOrdem = opts.numero_ordem;
  if (numeroOrdem === undefined) {
    const max = await query(
      `SELECT COALESCE(MAX(numero_ordem), 0) AS m FROM lotes_avaliacao WHERE empresa_id = $1`,
      [opts.empresa_id]
    );
    numeroOrdem = (max.rows[0].m as number) + 1;
  }

  const res = await query(
    `INSERT INTO lotes_avaliacao (empresa_id, clinica_id, tipo, status, numero_ordem, liberado_por)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING id`,
    [
      opts.empresa_id,
      opts.clinica_id,
      opts.tipo ?? 'completo',
      opts.status ?? 'ativo',
      numeroOrdem,
      opts.liberado_por,
    ]
  );

  return res.rows[0].id as number;
}

// ────────────────────────────────────────────────────────────
// Funcionário
// ────────────────────────────────────────────────────────────

export interface FuncionarioFixture {
  cpf?: string;
  nome?: string;
  email?: string;
  data_nascimento?: string;
  /** Hash bcrypt de 'test123' */
  senha_hash?: string;
}

const DEFAULT_SENHA_HASH =
  '$2a$10$NNUkJ.nfWUrrDcAcwWNjH.RfMEbMfIVW5j7pVz4vTPfEfIqCzUMme';

/**
 * Insere um funcionário de teste usando APENAS as colunas existentes
 * no schema atual (sem `tomador_id`, `usuario_tipo`, `empresa_id`).
 *
 * Retorna o `cpf` (PK natural da tabela).
 */
export async function makeFuncionario(
  opts: FuncionarioFixture = {}
): Promise<string> {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 6);
  const cpf = opts.cpf ?? uniqueCpf();

  await query(
    `INSERT INTO funcionarios (cpf, nome, email, data_nascimento, senha_hash)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (cpf) DO NOTHING`,
    [
      cpf,
      opts.nome ?? `Funcionario Fixture ${ts}`,
      opts.email ?? `func-fixture-${ts}-${rand}@test.com`,
      opts.data_nascimento ?? '1990-01-01',
      opts.senha_hash ?? DEFAULT_SENHA_HASH,
    ]
  );

  return cpf;
}

// ────────────────────────────────────────────────────────────
// Avaliação
// ────────────────────────────────────────────────────────────

export interface AvaliacaoFixture {
  lote_id: number;
  funcionario_cpf: string;
  status?: 'iniciada' | 'em_andamento' | 'concluida' | 'cancelada';
}

export async function makeAvaliacao(opts: AvaliacaoFixture): Promise<number> {
  const res = await query(
    `INSERT INTO avaliacoes (lote_id, funcionario_cpf, status, inicio)
     VALUES ($1,$2,$3,NOW())
     RETURNING id`,
    [opts.lote_id, opts.funcionario_cpf, opts.status ?? 'iniciada']
  );

  return res.rows[0].id as number;
}

// ────────────────────────────────────────────────────────────
// Builder fluente para uso simples em beforeAll/afterAll
// ────────────────────────────────────────────────────────────

/**
 * Cria um contexto de fixtures com cleanup automático.
 *
 * @example
 * const fx = useFixtures();
 * beforeAll(async () => {
 *   fx.clinicaId = await fx.clinica();
 *   fx.entidadeId = await fx.entidade();
 *   fx.loteId = await fx.lote({ empresa_id: fx.entidadeId!, clinica_id: fx.clinicaId!, liberado_por: '00000000000' });
 * });
 * afterAll(() => fx.cleanup());
 */
export function useFixtures() {
  const ids = emptyFixtureIds();

  return {
    // IDs rastreados (mutáveis, definidos pelo teste)
    clinicaId: undefined as number | undefined,
    entidadeId: undefined as number | undefined,
    loteId: undefined as number | undefined,

    async clinica(opts?: ClinicaFixture): Promise<number> {
      const id = await makeClinica(opts);
      ids.clinicaIds.push(id);
      return id;
    },
    async entidade(opts?: EntidadeFixture): Promise<number> {
      const id = await makeEntidade(opts);
      ids.entidadeIds.push(id);
      return id;
    },
    async lote(opts: LoteFixture): Promise<number> {
      const id = await makeLote(opts);
      ids.loteIds.push(id);
      return id;
    },
    async funcionario(opts?: FuncionarioFixture): Promise<string> {
      const cpf = await makeFuncionario(opts);
      ids.funcionarioCpfs.push(cpf);
      return cpf;
    },
    async avaliacao(opts: AvaliacaoFixture): Promise<number> {
      const id = await makeAvaliacao(opts);
      ids.avaliacaoIds.push(id);
      return id;
    },
    async cleanup(): Promise<void> {
      await cleanupFixtures(ids);
    },
  };
}
