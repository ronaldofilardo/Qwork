import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireEntity } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar sessão e perfil
    const session = await requireEntity();

    const loteId = parseInt(params.id);
    if (isNaN(loteId)) {
      return NextResponse.json(
        { error: 'ID do lote inválido' },
        { status: 400 }
      );
    }

    // Buscar informações do lote e verificar se pertence à entidade do usuário
    const loteResult = await query(
      `
      SELECT
        la.id,
        la.tipo,
        la.status,
        la.criado_em,
        la.liberado_em,
        COALESCE(la.pagamento_pendente, false) as pagamento_pendente,
        l.emitido_em as laudo_emitido_em,
        CASE WHEN fe.id IS NOT NULL THEN true ELSE false END as emissao_solicitada,
        fe.solicitado_em as emissao_solicitado_em,
        CASE 
          WHEN l.id IS NOT NULL AND (l.status = 'enviado' OR l.hash_pdf IS NOT NULL) 
          THEN true 
          ELSE false 
        END as tem_laudo,
        l.id as laudo_id,
        l.status as laudo_status,
        l.emissor_cpf,
        l.hash_pdf
      FROM lotes_avaliacao la
      LEFT JOIN v_fila_emissao fe ON fe.lote_id = la.id
      LEFT JOIN laudos l ON l.lote_id = la.id
      WHERE la.id = $1 
        AND EXISTS (
          SELECT 1 FROM avaliacoes a 
          JOIN funcionarios f ON a.funcionario_cpf = f.cpf 
          WHERE a.lote_id = la.id AND f.tomador_id = $2
        )
      LIMIT 1
    `,
      [loteId, session.entidade_id]
    );

    if (loteResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Lote não encontrado ou não pertence à sua entidade' },
        { status: 404 }
      );
    }

    const lote = loteResult.rows[0];

    // Buscar estatísticas (excluindo avaliações inativadas dos pendentes)
    const statsResult = await query(
      `
      SELECT
        COUNT(DISTINCT f.id) as total_funcionarios,
        COUNT(DISTINCT CASE WHEN a.status = 'concluido' THEN f.id END) as funcionarios_concluidos,
        COUNT(DISTINCT CASE WHEN a.status IN ('iniciada', 'em_andamento') THEN f.id END) as funcionarios_pendentes
      FROM avaliacoes a
      JOIN funcionarios f ON a.funcionario_cpf = f.cpf
      WHERE a.lote_id = $1 AND f.tomador_id = $2 AND a.status != 'inativada'
    `,
      [loteId, session.entidade_id]
    );

    const estatisticas = statsResult.rows[0];

    // Buscar funcionários e suas avaliações (incluindo contagem de respostas)
    const funcionariosResult = await query(
      `
      SELECT
        f.cpf,
        f.nome,
        f.setor,
        f.funcao,
        f.nivel_cargo,
        a.id as avaliacao_id,
        a.status as avaliacao_status,
        a.inicio as avaliacao_data_inicio,
        a.envio as avaliacao_data_conclusao,
        a.motivo_inativacao,
        a.inativada_em,
        (SELECT COUNT(DISTINCT (r.grupo, r.item)) FROM respostas r WHERE r.avaliacao_id = a.id) as total_respostas
      FROM funcionarios f
      JOIN avaliacoes a ON a.funcionario_cpf = f.cpf
      WHERE a.lote_id = $1 AND f.tomador_id = $2
      ORDER BY f.nome ASC
    `,
      [loteId, session.entidade_id]
    );

    // Calcular médias dos grupos G1-G10 para cada funcionário
    const funcionariosComGrupos = await Promise.all(
      funcionariosResult.rows.map(async (row) => {
        const mediasGrupos: { [key: string]: number } = {};

        // Apenas calcular se avaliação está concluída
        if (row.avaliacao_status === 'concluido') {
          const respostasResult = await query(
            `
            SELECT grupo, AVG(valor) as media
            FROM respostas
            WHERE avaliacao_id = $1
            GROUP BY grupo
            ORDER BY grupo
          `,
            [row.avaliacao_id]
          );

          respostasResult.rows.forEach((grupoRow: any) => {
            mediasGrupos[`g${grupoRow.grupo}`] = parseFloat(grupoRow.media);
          });
        }

        return {
          cpf: row.cpf,
          nome: row.nome,
          setor: row.setor,
          funcao: row.funcao,
          nivel_cargo: row.nivel_cargo,
          avaliacao: {
            id: row.avaliacao_id,
            status: row.avaliacao_status,
            data_inicio: row.avaliacao_data_inicio,
            data_conclusao: row.avaliacao_data_conclusao,
            motivo_inativacao: row.motivo_inativacao,
            inativada_em: row.inativada_em,
            total_respostas: parseInt(row.total_respostas) || 0,
          },
          grupos: mediasGrupos,
        };
      })
    );

    const response = NextResponse.json({
      lote,
      estatisticas: {
        total_funcionarios: parseInt(estatisticas.total_funcionarios),
        funcionarios_concluidos: parseInt(estatisticas.funcionarios_concluidos),
        funcionarios_pendentes: parseInt(estatisticas.funcionarios_pendentes),
      },
      funcionarios: funcionariosComGrupos,
    });

    // Forçar sem cache
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, max-age=0'
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('Erro ao buscar detalhes do lote:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
