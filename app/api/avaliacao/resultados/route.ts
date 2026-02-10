import { NextResponse } from 'next/server';
import { queryWithContext } from '@/lib/db-security';
import { requireAuth } from '@/lib/session';
import { grupos } from '@/lib/questoes';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const avaliacaoIdParam = searchParams.get('avaliacao_id');

    let avaliacaoId: number;

    if (avaliacaoIdParam) {
      // Verificar se a avaliação pertence ao usuário e não está inativada
      const checkResult = await queryWithContext(
        session,
        "SELECT id FROM avaliacoes WHERE id = $1 AND funcionario_cpf = $2 AND status != 'inativada'",
        [parseInt(avaliacaoIdParam), session.cpf]
      );
      if (checkResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Avaliação não encontrada' },
          { status: 404 }
        );
      }
      avaliacaoId = parseInt(avaliacaoIdParam);
    } else {
      // Buscar avaliação mais recente (em andamento ou concluída, não inativada)
      const avaliacaoResult = await queryWithContext(
        session,
        `SELECT id FROM avaliacoes
         WHERE funcionario_cpf = $1 AND status IN ('em_andamento', 'concluida') AND status != 'inativada'
         ORDER BY atualizado_em DESC, envio DESC LIMIT 1`,
        [session.cpf]
      );

      if (avaliacaoResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Nenhuma avaliação encontrada' },
          { status: 404 }
        );
      }

      avaliacaoId = (avaliacaoResult.rows[0] as { id: number }).id;
    }

    // Buscar todas as respostas da avaliação (deduplicando por grupo+item, mantendo a mais recente)
    const respostasResult = await queryWithContext(
      session,
      `SELECT DISTINCT ON (r.grupo, r.item) r.grupo, r.item, r.valor
       FROM respostas r
       WHERE r.avaliacao_id = $1
       ORDER BY r.grupo, r.item, r.id DESC`,
      [avaliacaoId]
    );

    // Organizar respostas por grupo
    const respostasPorGrupo = new Map<
      number,
      Array<{ item: string; valor: number }>
    >();
    respostasResult.rows.forEach(
      (r: { grupo: number; item: string; valor: number }) => {
        if (!respostasPorGrupo.has(r.grupo)) {
          respostasPorGrupo.set(r.grupo, []);
        }
        respostasPorGrupo.get(r.grupo)!.push({ item: r.item, valor: r.valor });
      }
    );

    // Criar mapa de tipos de grupos
    const _gruposTipo = new Map(
      grupos.map((g) => [g.id, { dominio: g.dominio, tipo: g.tipo }])
    );

    // Calcular resultados dinâmicos
    const { calcularResultados, categorizarScore } =
      await import('@/lib/calculate');
    const resultadosCalculados = grupos.map((grupo) => {
      const respostas = respostasPorGrupo.get(grupo.id) || [];
      let score = 0;
      let categoria: string = 'não_respondido';
      if (respostas.length > 0) {
        score =
          calcularResultados(
            new Map([[grupo.id, respostas]]),
            new Map([[grupo.id, { dominio: grupo.dominio, tipo: grupo.tipo }]])
          )[0]?.score || 0;
        categoria = categorizarScore(score, grupo.tipo);
      }
      return {
        grupo: grupo.id,
        dominio: grupo.dominio,
        score,
        categoria,
        tipo: grupo.tipo,
      };
    });

    return NextResponse.json({ resultados: resultadosCalculados });
  } catch (error) {
    console.error('Erro ao buscar resultados:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar resultados' },
      { status: 500 }
    );
  }
}
