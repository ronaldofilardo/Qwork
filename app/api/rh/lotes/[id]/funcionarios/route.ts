import { requireAuth, requireRHWithEmpresaAccess } from '@/lib/session';
import {
  getFuncionariosPorLote,
  getLoteInfo,
  getLoteEstatisticas,
} from '@/lib/queries';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const GET = async (
  req: Request,
  { params }: { params: { id: string } }
) => {
  const user = await requireAuth();
  if (!user || user.perfil !== 'rh') {
    return NextResponse.json(
      { error: 'Acesso negado', success: false },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const empresaId = searchParams.get('empresa_id');
    const loteId = params.id;

    if (!empresaId || !loteId) {
      return NextResponse.json(
        {
          error: 'Parâmetros empresa_id e lote_id são obrigatórios',
          success: false,
        },
        { status: 400 }
      );
    }

    // Reutilizar verificação centralizada de permissões
    let clinicaId: number;
    try {
      const session = await requireRHWithEmpresaAccess(parseInt(empresaId));
      // utilizar clinica_id retornada pela sessão para contextos posteriores
      clinicaId = session.clinica_id;
    } catch (permErr) {
      console.log('[DEBUG] requireRHWithEmpresaAccess falhou:', permErr);
      return NextResponse.json(
        {
          error:
            'Empresa não encontrada ou você não tem permissão para acessá-la',
          success: false,
          error_code: 'permission_clinic_mismatch',
          hint: 'Verifique se o seu usuário pertence à mesma clínica desta empresa. Caso necessário, contate o administrador da clínica ou o suporte.',
        },
        { status: 403 }
      );
    }

    // Buscar informações do lote usando a função utilitária
    const loteInfo = await getLoteInfo(
      parseInt(loteId),
      parseInt(empresaId),
      clinicaId
    );

    if (!loteInfo) {
      return NextResponse.json(
        {
          error: 'Lote não encontrado ou não pertence a esta empresa',
          success: false,
        },
        { status: 404 }
      );
    }

    // Buscar estatísticas do lote
    const estatisticas = await getLoteEstatisticas(parseInt(loteId));

    // Buscar funcionários do lote usando a função utilitária
    const funcionarios = await getFuncionariosPorLote(
      parseInt(loteId),
      parseInt(empresaId),
      clinicaId
    );

    // Buscar dados de inativação para todas as avaliações do lote
    const inativacaoResult = await query(
      `
      SELECT
        id as avaliacao_id,
        inativada_em as data_inativacao,
        motivo_inativacao
      FROM avaliacoes
      WHERE lote_id = $1 AND status = 'inativada'
    `,
      [loteId]
    );

    const dadosInativacao = inativacaoResult.rows.reduce(
      (acc: any, row: any) => {
        acc[row.avaliacao_id] = {
          data_inativacao: row.data_inativacao,
          motivo_inativacao: row.motivo_inativacao,
        };
        return acc;
      },
      {}
    );

    // Calcular médias dos grupos para cada funcionário
    const funcionariosComGrupos = await Promise.all(
      funcionarios.map(async (func) => {
        const mediasGrupos: { [key: string]: number } = {};

        // Apenas calcular se avaliação está concluída
        if (func.status_avaliacao === 'concluido') {
          const respostasResult = await query(
            `
            SELECT grupo, AVG(valor) as media
            FROM respostas
            WHERE avaliacao_id = $1
            GROUP BY grupo
            ORDER BY grupo
          `,
            [func.avaliacao_id]
          );

          respostasResult.rows.forEach((row: any) => {
            mediasGrupos[`g${row.grupo}`] = parseFloat(row.media);
          });
        }

        // Incluir dados de inativação se existirem
        const dadosInativacaoAvaliacao =
          dadosInativacao[func.avaliacao_id] || {};

        return {
          cpf: func.cpf,
          nome: func.nome,
          setor: func.setor,
          funcao: func.funcao,
          matricula: func.matricula,
          nivel_cargo: func.nivel_cargo,
          turno: func.turno,
          escala: func.escala,
          avaliacao: {
            id: func.avaliacao_id,
            status: func.status_avaliacao,
            data_inicio: func.data_inicio,
            data_conclusao: func.data_conclusao,
            data_inativacao: dadosInativacaoAvaliacao.data_inativacao || null,
            motivo_inativacao:
              dadosInativacaoAvaliacao.motivo_inativacao || null,
          },
          grupos: mediasGrupos,
        };
      })
    );

    return NextResponse.json({
      success: true,
      lote: loteInfo,
      estatisticas: {
        total_avaliacoes: parseInt(estatisticas.total_avaliacoes),
        avaliacoes_concluidas: parseInt(estatisticas.avaliacoes_concluidas),
        avaliacoes_inativadas: parseInt(estatisticas.avaliacoes_inativadas),
        avaliacoes_pendentes: parseInt(estatisticas.avaliacoes_pendentes),
      },
      funcionarios: funcionariosComGrupos,
      total: funcionariosComGrupos.length,
    });
  } catch (error) {
    console.error('Erro ao buscar funcionários do lote:', error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        success: false,
      },
      { status: 500 }
    );
  }
};
