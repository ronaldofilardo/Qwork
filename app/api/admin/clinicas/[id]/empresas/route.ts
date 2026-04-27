import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole, getSession } from '@/lib/session';

/**
 * GET /api/admin/clinicas/[id]/empresas
 *
 * Lista empresas de uma clínica específica com totais de funcionários e avaliações.
 *
 * Autorização:
 * - admin, suporte: acesso completo com todas as estatísticas (avaliações, funcionários)
 * - comercial: acesso limitado apenas a dados corporativos (CNPJ, email, telefone, localização)
 *   sem contagens de avaliações/lotes por questões de segurança
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Autorizar suporte, admin e comercial
    await requireRole(['suporte', 'admin', 'comercial'], false);

    // Obter sessão para determinar nível de acesso aos dados
    const session = getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Sessão não encontrada' },
        { status: 401 }
      );
    }

    const clinicaId = parseInt(params.id);

    if (isNaN(clinicaId)) {
      return NextResponse.json(
        { error: 'ID da clínica inválido' },
        { status: 400 }
      );
    }

    // Verificar se a clínica existe (busca na tabela clinicas)
    const clinicaResult = await query<{ id: number; nome: string }>(
      'SELECT id, nome FROM clinicas WHERE id = $1',
      [clinicaId]
    );

    if (clinicaResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Clínica não encontrada' },
        { status: 404 }
      );
    }

    // Perfil comercial recebe dados limitados (sem estatísticas sensíveis)
    const isComerciaiPerfil = session.perfil === 'comercial';

    // Construir query SQL condicionada ao perfil
    const selectFields = isComerciaiPerfil
      ? `ec.id, ec.nome, ec.cnpj, ec.email, ec.telefone, ec.cidade, ec.estado, ec.ativa, ec.criado_em`
      : `ec.id, ec.nome, ec.cnpj, ec.email, ec.telefone, ec.cidade, ec.estado, ec.ativa, ec.criado_em,
         COUNT(DISTINCT f.cpf) as total_funcionarios,
         COUNT(DISTINCT a.id) as total_avaliacoes,
         COUNT(DISTINCT CASE WHEN a.status = 'concluida' OR a.status = 'concluido' THEN a.id END) as avaliacoes_concluidas,
         COUNT(DISTINCT CASE WHEN a.status IN ('iniciada', 'em_andamento') THEN a.id END) as avaliacoes_liberadas`;

    const joins = isComerciaiPerfil
      ? '' // Comercial não precisa de JOINs para contagens
      : `LEFT JOIN funcionarios_clinicas fc ON fc.empresa_id = ec.id AND fc.ativo = true
         LEFT JOIN funcionarios f ON f.id = fc.funcionario_id AND f.perfil = 'funcionario'
         LEFT JOIN avaliacoes a ON a.funcionario_cpf = f.cpf`;

    const groupBy = isComerciaiPerfil
      ? '' // Comercial não agrupa
      : `GROUP BY ec.id, ec.nome, ec.cnpj, ec.email, ec.telefone, ec.cidade, ec.estado, ec.ativa, ec.criado_em`;

    // Buscar empresas da clínica
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
      total_funcionarios?: string;
      total_avaliacoes?: string;
      avaliacoes_concluidas?: string;
      avaliacoes_liberadas?: string;
    }

    const result = await query<EmpresaRow>(
      `
      SELECT ${selectFields}
      FROM empresas_clientes ec
      ${joins}
      WHERE ec.clinica_id = $1
      ${groupBy}
      ORDER BY ec.nome
    `,
      [clinicaId]
    );

    // Mapear resposta: filtrar dados sensíveis para comercial
    const empresas = result.rows.map((row) => {
      const baseEmpresa = {
        id: row.id,
        nome: row.nome,
        cnpj: row.cnpj,
        email: row.email,
        telefone: row.telefone,
        cidade: row.cidade,
        estado: row.estado,
        ativa: row.ativa,
        criado_em: row.criado_em,
      };

      // Comercial não recebe contagens de avaliações/funcionários
      if (isComerciaiPerfil) {
        return baseEmpresa;
      }

      // Suporte e admin recebem dados completos
      return {
        ...baseEmpresa,
        total_funcionarios: parseInt(row.total_funcionarios || '0'),
        total_avaliacoes: parseInt(row.total_avaliacoes || '0'),
        avaliacoes_concluidas: parseInt(row.avaliacoes_concluidas || '0'),
        avaliacoes_liberadas: parseInt(row.avaliacoes_liberadas || '0'),
      };
    });

    return NextResponse.json({
      success: true,
      clinica: {
        id: clinicaResult.rows[0].id,
        nome: clinicaResult.rows[0].nome,
      },
      empresas,
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
