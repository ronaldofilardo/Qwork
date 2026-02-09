/**
 * Row Level Security (RLS) Context Manager
 * Garante que todas as queries respeitam isolamento de dados por clínica/entidade
 */

import { query } from '../db';

export interface RLSContext {
  clinica_id?: number;
  entidade_id?: number;
  perfil?: string;
  cpf?: string;
}

let currentContext: RLSContext | null = null;

/**
 * Define o contexto RLS para a sessão atual
 */
export function setRLSContext(context: RLSContext): void {
  currentContext = context;
}

/**
 * Obtém o contexto RLS atual
 */
export function getRLSContext(): RLSContext | null {
  return currentContext;
}

/**
 * Limpa o contexto RLS
 */
export function clearRLSContext(): void {
  currentContext = null;
}

/**
 * Executa query com contexto RLS aplicado (PostgreSQL SET LOCAL)
 */
export async function queryWithRLS<T = any>(
  sql: string,
  params: any[],
  context?: RLSContext
): Promise<{ rows: T[]; rowCount: number }> {
  const ctx = context || currentContext;

  if (!ctx) {
    console.warn(
      '[RLS] Executando query sem contexto RLS. Isso pode expor dados entre clínicas/entidades.'
    );
    return query<T>(sql, params);
  }

  // Iniciar transação com contexto
  await query('BEGIN', []);

  try {
    // Definir variáveis locais para RLS
    if (ctx.clinica_id) {
      await query(`SET LOCAL app.current_clinica_id = $1`, [ctx.clinica_id]);
    }

    if (ctx.entidade_id) {
      await query(`SET LOCAL app.current_entidade_id = $1`, [ctx.entidade_id]);
    }

    if (ctx.perfil) {
      await query(`SET LOCAL app.current_perfil = $1`, [ctx.perfil]);
    }

    if (ctx.cpf) {
      await query(`SET LOCAL app.current_cpf = $1`, [ctx.cpf]);
    }

    // Executar query principal
    const result = await query<T>(sql, params);

    await query('COMMIT', []);
    return result;
  } catch (error) {
    await query('ROLLBACK', []);
    throw error;
  }
}

/**
 * Helper para criar políticas RLS no PostgreSQL
 */
export function gerarPoliticaRLS(
  tabela: string,
  nome: string,
  comando: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
  using: string,
  withCheck?: string
): string {
  let sql = `CREATE POLICY ${nome} ON ${tabela} FOR ${comando} USING (${using})`;

  if (withCheck && (comando === 'INSERT' || comando === 'UPDATE')) {
    sql += ` WITH CHECK (${withCheck})`;
  }

  return sql + ';';
}

/**
 * Políticas RLS recomendadas para entidades
 */
export const POLITICAS_tomadorS = {
  select: gerarPoliticaRLS(
    'entidades',
    'tomadors_select_policy',
    'SELECT',
    `
    -- Admin vê tudo
    (current_setting('app.current_perfil', true) = 'admin')
    OR
    -- Gestor vê apenas seu tomador
    (id = current_setting('app.current_entidade_id', true)::int)
  `
  ),

  update: gerarPoliticaRLS(
    'entidades',
    'tomadors_update_policy',
    'UPDATE',
    `
    -- Admin pode atualizar tudo
    (current_setting('app.current_perfil', true) = 'admin')
    OR
    -- Gestor pode atualizar apenas seu tomador
    (id = current_setting('app.current_entidade_id', true)::int)
  `
  ),
};

/**
 * Políticas RLS para funcionários
 */
export const POLITICAS_FUNCIONARIOS = {
  select: gerarPoliticaRLS(
    'funcionarios',
    'funcionarios_select_policy',
    'SELECT',
    `
    -- Admin vê tudo
    (current_setting('app.current_perfil', true) = 'admin')
    OR
    -- RH vê funcionários da sua clínica
    (clinica_id = current_setting('app.current_clinica_id', true)::int)
    OR
    -- Gestor de entidade vê funcionários vinculados ao tomador
    EXISTS (
      SELECT 1 FROM tomadors_funcionarios cf
      WHERE cf.funcionario_id = funcionarios.id
      AND cf.entidade_id = current_setting('app.current_entidade_id', true)::int
      AND cf.vinculo_ativo = true
    )
    OR
    -- Funcionário vê apenas seus próprios dados
    (cpf = current_setting('app.current_cpf', true))
  `
  ),
};

/**
 * Script para habilitar RLS em todas as tabelas sensíveis
 */
export const HABILITAR_RLS_SCRIPT = `
-- Habilitar RLS nas tabelas
ALTER TABLE tomadors ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados ENABLE ROW LEVEL SECURITY;
ALTER TABLE laudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE recibos ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;

-- Aplicar políticas
${POLITICAS_tomadorS.select}
${POLITICAS_tomadorS.update}
${POLITICAS_FUNCIONARIOS.select}

-- Política para avaliações
CREATE POLICY avaliacoes_select_policy ON avaliacoes FOR SELECT USING (
  (current_setting('app.current_perfil', true) = 'admin')
  OR
  EXISTS (
    SELECT 1 FROM funcionarios f
    WHERE f.cpf = avaliacoes.funcionario_cpf
    AND (
      f.clinica_id = current_setting('app.current_clinica_id', true)::int
      OR
      EXISTS (
        SELECT 1 FROM tomadors_funcionarios cf
        WHERE cf.funcionario_id = f.id
        AND cf.entidade_id = current_setting('app.current_entidade_id', true)::int
      )
    )
  )
);

-- Política para laudos
CREATE POLICY laudos_select_policy ON laudos FOR SELECT USING (
  (current_setting('app.current_perfil', true) IN ('admin', 'emissor'))
  OR
  (clinica_id = current_setting('app.current_clinica_id', true)::int)
  OR
  EXISTS (
    SELECT 1 FROM empresas_clientes ec
    WHERE ec.id = laudos.empresa_id
    AND ec.entidade_id = current_setting('app.current_entidade_id', true)::int
  )
);

-- Comentários
COMMENT ON POLICY tomadors_select_policy ON tomadors IS
  'RLS: Admin vê tudo, gestores veem apenas seu tomador';

COMMENT ON POLICY funcionarios_select_policy ON funcionarios IS
  'RLS: Isola funcionários por clínica/tomador, usuário vê apenas seus dados';
`;

/**
 * Wrapper para Session com RLS automático
 */
export function withRLSFromSession<T>(
  session: {
    clinica_id?: number;
    entidade_id?: number;
    perfil?: string;
    cpf?: string;
  },
  fn: () => Promise<T>
): Promise<T> {
  setRLSContext({
    clinica_id: session.clinica_id,
    entidade_id: session.entidade_id,
    perfil: session.perfil,
    cpf: session.cpf,
  });

  return fn().finally(() => clearRLSContext());
}
