import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

/**
 * GET /api/admin/clinicas/[id]/empresas
 *
 * Lista empresas de uma clínica específica com totais de funcionários e avaliações
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole('admin');

    const clinicaId = parseInt(params.id);

    if (isNaN(clinicaId)) {
      return NextResponse.json(
        { error: 'ID da clínica inválido' },
        { status: 400 }
      );
    }

    // Verificar se a clínica existe (busca em contratantes)
    const clinicaResult = await query<{ id: number; nome: string }>(
      "SELECT id, nome FROM contratantes WHERE id = $1 AND tipo = 'clinica'",
      [clinicaId]
    );

    if (clinicaResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Clínica não encontrada' },
        { status: 404 }
      );
    }

    // Buscar empresas da clínica com estatísticas
    interface EmpresaRow {
      id: number;
      nome: string;
      cnpj: string | null;
      email: string | null;
      telefone: string | null;
      cidade: string | null;
      estado: string | null;
      ativa: boolean;
      criado_em: string;
      total_funcionarios: string;
      total_avaliacoes: string;
      avaliacoes_concluidas: string;
      avaliacoes_liberadas: string;
    }

    const result = await query<EmpresaRow>(
      `
      SELECT 
        ec.id,
        ec.nome,
        ec.cnpj,
        ec.email,
        ec.telefone,
        ec.cidade,
        ec.estado,
        ec.ativa,
        ec.criado_em,
        COUNT(DISTINCT f.cpf) as total_funcionarios,
        COUNT(DISTINCT a.id) as total_avaliacoes,
        COUNT(DISTINCT CASE WHEN a.status = 'concluido' THEN a.id END) as avaliacoes_concluidas,
        COUNT(DISTINCT CASE WHEN a.status IN ('iniciada', 'em_andamento') THEN a.id END) as avaliacoes_liberadas
      FROM empresas_clientes ec
      LEFT JOIN funcionarios f ON f.empresa_id = ec.id AND f.perfil = 'funcionario'
      LEFT JOIN avaliacoes a ON a.funcionario_cpf = f.cpf
      WHERE ec.clinica_id = $1
      GROUP BY ec.id, ec.nome, ec.cnpj, ec.email, ec.telefone, ec.cidade, ec.estado, ec.ativa, ec.criado_em
      ORDER BY ec.nome
    `,
      [clinicaId]
    );

    return NextResponse.json({
      success: true,
      clinica: {
        id: clinicaResult.rows[0].id,
        nome: clinicaResult.rows[0].nome,
      },
      empresas: result.rows.map((row) => ({
        id: row.id,
        nome: row.nome,
        cnpj: row.cnpj,
        email: row.email,
        telefone: row.telefone,
        cidade: row.cidade,
        estado: row.estado,
        ativa: row.ativa,
        criado_em: row.criado_em,
        total_funcionarios: parseInt(row.total_funcionarios),
        total_avaliacoes: parseInt(row.total_avaliacoes),
        avaliacoes_concluidas: parseInt(row.avaliacoes_concluidas),
        avaliacoes_liberadas: parseInt(row.avaliacoes_liberadas),
      })),
    });
  } catch (error) {
    console.error('Erro ao buscar empresas da clínica:', error);

    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
