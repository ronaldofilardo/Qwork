import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * API para buscar informações do plano de um tomador (entidade/clínica)
 * GET /api/tomador/meu-plano
 */
export async function GET() {
  try {
    const session = await requireRole(['gestor', 'rh']);

    // Usar entidade_id ou clinica_id da sessão (arquitetura segregada)
    const tomadorId = session.entidade_id || session.clinica_id;

    // Buscar plano ativo do tomador (entidade ou clínica)
    const result = await query(
      `SELECT 
        cp.id,
        p.nome as plano_nome,
        p.tipo as plano_tipo,
        p.descricao as plano_descricao,
        cp.numero_funcionarios_estimado,
        cp.numero_funcionarios_atual,
        cp.valor_pago,
        cp.tipo_pagamento,
        cp.modalidade_pagamento,
        cp.numero_parcelas,
        cp.status,
        cp.data_contratacao,
        cp.data_fim_vigencia,
        c.id as contrato_numero,
        c.conteudo as contrato_conteudo
      FROM contratos_planos cp
      JOIN planos p ON cp.plano_id = p.id
      LEFT JOIN contratos c ON (
        (cp.tipo_tomador = 'entidade' AND c.entidade_id = cp.entidade_id) OR
        (cp.tipo_tomador = 'clinica' AND c.clinica_id = cp.clinica_id)
      )
      WHERE (
        (cp.tipo_tomador = 'entidade' AND cp.entidade_id = $1) OR
        (cp.tipo_tomador = 'clinica' AND cp.clinica_id = $1)
      )
      AND cp.status = 'ativo'
      ORDER BY cp.created_at DESC
      LIMIT 1`,
      [tomadorId],
      session
    );

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: true,
        plano: null,
        message: 'Nenhum plano ativo encontrado',
      });
    }

    return NextResponse.json({
      success: true,
      plano: result.rows[0],
    });
  } catch (error) {
    console.error('[API Meu Plano] Erro ao buscar plano:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar informações do plano',
      },
      { status: 500 }
    );
  }
}
