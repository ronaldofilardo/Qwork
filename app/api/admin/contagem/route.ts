import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

interface ContagemMetricas {
  funcionarios: number;
  lotes: number;
  laudos: number;
  avaliacoes_liberadas: number;
  avaliacoes_concluidas: number;
  entidades?: number;
  clinicas?: number;
}

export interface ItemEntidade {
  id: number;
  nome: string;
  ativa: boolean;
  criado_em: string;
  data_aceite: string | null;
  ativos: number;
  inativos: number;
}

export interface ItemClinica {
  id: number;
  nome: string;
  ativa: boolean;
  criado_em: string;
  data_aceite: string | null;
  empresas_clientes: number;
  ativos: number;
  inativos: number;
}

interface ContagemResponse {
  entidades: ContagemMetricas;
  clinicas: ContagemMetricas;
  lista_entidades: ItemEntidade[];
  lista_clinicas: ItemClinica[];
  success: boolean;
  error?: string;
}

/**
 * GET /api/admin/contagem
 * Retorna número de funcionários, lotes, laudos, avaliações abertas e concluídas
 * para Entidades e Clínicas.
 *
 * Schema real:
 * - lotes_avaliacao: entidade_id IS NOT NULL → entidade | clinica_id IS NOT NULL → clínica
 * - avaliacoes: status ∈ {'iniciada','em_andamento','concluida','inativada'}; link via lote_id
 * - funcionarios_entidades / funcionarios_clinicas: junction tables
 */
export async function GET(
  _request: NextRequest
): Promise<NextResponse<ContagemResponse>> {
  try {
    await requireRole('admin', false);

    // ── ENTIDADES ──────────────────────────────────────────────────────────

    // Total de entidades (tabela 'entidades' — NÃO 'tomadores')
    const entidadesCountResult = await query(
      `SELECT COUNT(*) as count FROM entidades`
    );
    const entidadesCount = parseInt(entidadesCountResult.rows[0].count) || 0;

    // Funcionários vinculados a entidades (via junction table)
    const entidadesFuncionariosResult = await query(
      `SELECT COUNT(DISTINCT fe.funcionario_id) as count 
       FROM funcionarios_entidades fe`
    );
    const entidadesFuncionarios =
      parseInt(entidadesFuncionariosResult.rows[0].count) || 0;

    // Lotes de entidades: entidade_id IS NOT NULL
    const entidadesLotesResult = await query(
      `SELECT COUNT(*) as count FROM lotes_avaliacao 
       WHERE entidade_id IS NOT NULL`
    );
    const entidadesLotes = parseInt(entidadesLotesResult.rows[0].count) || 0;

    // Laudos de lotes de entidades
    const entidadesLaudosResult = await query(
      `SELECT COUNT(*) as count FROM laudos 
       WHERE lote_id IN (
         SELECT id FROM lotes_avaliacao WHERE entidade_id IS NOT NULL
       )`
    );
    const entidadesLaudos = parseInt(entidadesLaudosResult.rows[0].count) || 0;

    // Avaliações abertas (iniciada + em_andamento) — lotes de entidades
    const entidadesAvaliaoesLiberadasResult = await query(
      `SELECT COUNT(*) as count FROM avaliacoes 
       WHERE lote_id IN (
         SELECT id FROM lotes_avaliacao WHERE entidade_id IS NOT NULL
       ) AND status IN ('iniciada', 'em_andamento')`
    );
    const entidadesAvaliaoesLiberadas =
      parseInt(entidadesAvaliaoesLiberadasResult.rows[0].count) || 0;

    // Avaliações concluídas — lotes de entidades
    const entidadesAvaliaoesConcluidasResult = await query(
      `SELECT COUNT(*) as count FROM avaliacoes 
       WHERE lote_id IN (
         SELECT id FROM lotes_avaliacao WHERE entidade_id IS NOT NULL
       ) AND status = 'concluida'`
    );
    const entidadesAvaliaoesConcluidass =
      parseInt(entidadesAvaliaoesConcluidasResult.rows[0].count) || 0;

    // ── CLÍNICAS ───────────────────────────────────────────────────────────

    // Total de clínicas cadastradas
    const clinicasCountResult = await query(
      'SELECT COUNT(*) as count FROM clinicas'
    );
    const clinicasCount = parseInt(clinicasCountResult.rows[0].count) || 0;

    // Funcionários vinculados a clínicas (via junction table)
    const clinicasFuncionariosResult = await query(
      `SELECT COUNT(DISTINCT fc.funcionario_id) as count 
       FROM funcionarios_clinicas fc`
    );
    const clinicasFuncionarios =
      parseInt(clinicasFuncionariosResult.rows[0].count) || 0;

    // Lotes de clínicas: clinica_id IS NOT NULL
    const clinicasLotesResult = await query(
      `SELECT COUNT(*) as count FROM lotes_avaliacao 
       WHERE clinica_id IS NOT NULL`
    );
    const clinicasLotes = parseInt(clinicasLotesResult.rows[0].count) || 0;

    // Laudos de lotes de clínicas
    const clinicasLaudosResult = await query(
      `SELECT COUNT(*) as count FROM laudos 
       WHERE lote_id IN (
         SELECT id FROM lotes_avaliacao WHERE clinica_id IS NOT NULL
       )`
    );
    const clinicasLaudos = parseInt(clinicasLaudosResult.rows[0].count) || 0;

    // Avaliações abertas (iniciada + em_andamento) — lotes de clínicas
    const clinicasAvaliaoesLiberadasResult = await query(
      `SELECT COUNT(*) as count FROM avaliacoes 
       WHERE lote_id IN (
         SELECT id FROM lotes_avaliacao WHERE clinica_id IS NOT NULL
       ) AND status IN ('iniciada', 'em_andamento')`
    );
    const clinicasAvaliaoesLiberadas =
      parseInt(clinicasAvaliaoesLiberadasResult.rows[0].count) || 0;

    // Avaliações concluídas — lotes de clínicas
    const clinicasAvaliaoesConcluidasResult = await query(
      `SELECT COUNT(*) as count FROM avaliacoes 
       WHERE lote_id IN (
         SELECT id FROM lotes_avaliacao WHERE clinica_id IS NOT NULL
       ) AND status = 'concluida'`
    );
    const clinicasAvaliaoesConcluidass =
      parseInt(clinicasAvaliaoesConcluidasResult.rows[0].count) || 0;

    // ── LISTAS DETALHADAS ─────────────────────────────────────────────────

    // Lista de entidades com ativos/inativos
    // CORREÇÃO: usa tabela `entidades` — funcionarios_entidades.entidade_id → entidades.id
    // CORREÇÃO 2: usa funcionarios.ativo (f.ativo) — status real do funcionário
    // (funcionarios_entidades.ativo pode não sincronizar quando funcionário fica inativo)
    const listaEntidadesResult = await query(
      `SELECT
         e.id,
         e.nome,
         e.ativa,
         e.criado_em,
         ct.data_aceite,
         COUNT(CASE WHEN f.ativo = true  THEN 1 END)::int AS ativos,
         COUNT(CASE WHEN f.ativo = false THEN 1 END)::int AS inativos
       FROM entidades e
       LEFT JOIN funcionarios_entidades fe ON fe.entidade_id = e.id
       LEFT JOIN funcionarios f ON f.id = fe.funcionario_id
       LEFT JOIN (
         SELECT tomador_id, MAX(data_aceite) AS data_aceite
         FROM contratos
         WHERE tipo_tomador = 'entidade' AND aceito = true
         GROUP BY tomador_id
       ) ct ON ct.tomador_id = e.id
       GROUP BY e.id, e.nome, e.ativa, e.criado_em, ct.data_aceite
       ORDER BY e.nome`
    );
    const lista_entidades: ItemEntidade[] = listaEntidadesResult.rows.map(
      (r: {
        id: number;
        nome: string;
        ativa: boolean;
        criado_em: string;
        data_aceite: string | null;
        ativos: string | number;
        inativos: string | number;
      }) => ({
        id: r.id,
        nome: r.nome,
        ativa: r.ativa,
        criado_em: r.criado_em,
        data_aceite: r.data_aceite ?? null,
        ativos: parseInt(String(r.ativos)) || 0,
        inativos: parseInt(String(r.inativos)) || 0,
      })
    );

    // Lista de clínicas com empresas_clientes, ativos e inativos
    // CORREÇÃO 1: empresas = COUNT DISTINCT empresa_id em funcionarios_clinicas
    // CORREÇÃO 2: ativos/inativos usam funcionarios.ativo (f.ativo), NÃO fc.ativo
    // (fc.ativo pode não sincronizar quando funcionário muda de status)
    const listaClinicasResult = await query(
      `SELECT
         c.id,
         c.nome,
         c.ativa,
         c.criado_em,
         ct.data_aceite,
         COALESCE(emp.total, 0)::int    AS empresas_clientes,
         COALESCE(func.ativos, 0)::int  AS ativos,
         COALESCE(func.inativos, 0)::int AS inativos
       FROM clinicas c
       LEFT JOIN (
         SELECT clinica_id, COUNT(DISTINCT empresa_id) AS total
         FROM funcionarios_clinicas
         GROUP BY clinica_id
       ) emp ON emp.clinica_id = c.id
       LEFT JOIN (
         SELECT
           fc.clinica_id,
           COUNT(CASE WHEN f.ativo = true  THEN 1 END) AS ativos,
           COUNT(CASE WHEN f.ativo = false THEN 1 END) AS inativos
         FROM funcionarios_clinicas fc
         JOIN funcionarios f ON f.id = fc.funcionario_id
         GROUP BY fc.clinica_id
       ) func ON func.clinica_id = c.id
       LEFT JOIN (
         SELECT tomador_id, MAX(data_aceite) AS data_aceite
         FROM contratos
         WHERE tipo_tomador = 'clinica' AND aceito = true
         GROUP BY tomador_id
       ) ct ON ct.tomador_id = c.id
       ORDER BY c.nome`
    );
    const lista_clinicas: ItemClinica[] = listaClinicasResult.rows.map(
      (r: {
        id: number;
        nome: string;
        ativa: boolean;
        criado_em: string;
        data_aceite: string | null;
        empresas_clientes: string | number;
        ativos: string | number;
        inativos: string | number;
      }) => ({
        id: r.id,
        nome: r.nome,
        ativa: r.ativa,
        criado_em: r.criado_em,
        data_aceite: r.data_aceite ?? null,
        empresas_clientes: parseInt(String(r.empresas_clientes)) || 0,
        ativos: parseInt(String(r.ativos)) || 0,
        inativos: parseInt(String(r.inativos)) || 0,
      })
    );

    const response: ContagemResponse = {
      entidades: {
        entidades: entidadesCount,
        funcionarios: entidadesFuncionarios,
        lotes: entidadesLotes,
        laudos: entidadesLaudos,
        avaliacoes_liberadas: entidadesAvaliaoesLiberadas,
        avaliacoes_concluidas: entidadesAvaliaoesConcluidass,
      },
      clinicas: {
        clinicas: clinicasCount,
        funcionarios: clinicasFuncionarios,
        lotes: clinicasLotes,
        laudos: clinicasLaudos,
        avaliacoes_liberadas: clinicasAvaliaoesLiberadas,
        avaliacoes_concluidas: clinicasAvaliaoesConcluidass,
      },
      lista_entidades,
      lista_clinicas,
      success: true,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Erro ao buscar contagem:', error);
    return NextResponse.json(
      {
        entidades: {
          entidades: 0,
          funcionarios: 0,
          lotes: 0,
          laudos: 0,
          avaliacoes_liberadas: 0,
          avaliacoes_concluidas: 0,
        },
        clinicas: {
          clinicas: 0,
          funcionarios: 0,
          lotes: 0,
          laudos: 0,
          avaliacoes_liberadas: 0,
          avaliacoes_concluidas: 0,
        },
        lista_entidades: [],
        lista_clinicas: [],
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
