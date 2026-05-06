import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/auditorias/funcionarios
 *
 * Retorna auditoria de funcionários RH (clínica/empresa) e Entidade
 * com contexto de tomador, data de inclusão e status
 */
export async function GET() {
  try {
    await requireRole('admin', false);

    const result = await query(`
      -- Funcionários de RH (clínica/empresa)
      SELECT
        f.id                    AS funcionario_id,
        f.cpf,
        f.nome,
        fc.data_vinculo         AS data_inclusao,
        f.ativo                 AS status_atual,
        'rh'                    AS tomador_tipo,
        c.nome                  AS tomador_nome,
        ec.nome                 AS empresa_nome,
        f.setor
      FROM funcionarios f
      INNER JOIN funcionarios_clinicas fc ON fc.funcionario_id = f.id
      INNER JOIN clinicas c ON c.id = fc.clinica_id
      LEFT JOIN empresas_clientes ec ON ec.id = fc.empresa_id

      UNION ALL

      -- Funcionários de Entidade
      SELECT
        f.id                    AS funcionario_id,
        f.cpf,
        f.nome,
        fe.data_vinculo         AS data_inclusao,
        f.ativo                 AS status_atual,
        'entidade'              AS tomador_tipo,
        ent.nome                AS tomador_nome,
        NULL                    AS empresa_nome,
        f.setor
      FROM funcionarios f
      INNER JOIN funcionarios_entidades fe ON fe.funcionario_id = f.id
      INNER JOIN entidades ent ON ent.id = fe.entidade_id

      ORDER BY data_inclusao DESC
      LIMIT 5000
    `);

    return NextResponse.json({
      success: true,
      funcionarios: result.rows,
    });
  } catch (error) {
    console.error('Erro ao buscar auditoria de funcionários:', error);

    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
