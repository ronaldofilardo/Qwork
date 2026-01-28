import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ cpf: string }> }
) {
  try {
    const session = getSession();
    if (!session || (session.perfil !== 'rh' && session.perfil !== 'admin')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { cpf } = await context.params;

    // Buscar dados do funcionário
    const funcionarioResult = await query(
      `SELECT f.cpf, f.nome, f.setor, f.funcao, f.email, f.matricula, 
              f.nivel_cargo, f.turno, f.escala, f.ativo, f.data_inclusao,
              f.indice_avaliacao, f.data_ultimo_lote, f.criado_em, f.atualizado_em,
              e.nome as empresa_nome, c.nome as clinica_nome
       FROM funcionarios f
       LEFT JOIN empresas_clientes e ON f.empresa_id = e.id
       LEFT JOIN clinicas c ON f.clinica_id = c.id
       WHERE f.cpf = $1`,
      [cpf]
    );

    if (funcionarioResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Funcionário não encontrado' },
        { status: 404 }
      );
    }

    const funcionario = funcionarioResult.rows[0];

    // Buscar histórico de avaliações
    const avaliacoesResult = await query(
      `SELECT a.id, a.status, a.inicio, a.envio, a.data_inativacao, a.motivo_inativacao,
              l.codigo as lote_codigo, l.titulo as lote_titulo, l.numero_ordem, l.liberado_em,
              CASE 
                WHEN a.status = 'concluida' THEN 'concluída'
                WHEN a.status = 'inativada' THEN 'inativada'
                ELSE 'pendente'
              END as status_display
       FROM avaliacoes a
       INNER JOIN lotes_avaliacao l ON a.lote_id = l.id
       WHERE a.funcionario_cpf = $1
       ORDER BY l.numero_ordem DESC, a.inicio DESC`,
      [cpf]
    );

    // Calcular estatísticas
    const totalAvaliacoes = avaliacoesResult.rows.length;
    const concluidas = avaliacoesResult.rows.filter(
      (a) => a.status === 'concluida'
    ).length;
    const inativadas = avaliacoesResult.rows.filter(
      (a) => a.status === 'inativada'
    ).length;
    const pendentes = avaliacoesResult.rows.filter(
      (a) => a.status !== 'concluida' && a.status !== 'inativada'
    ).length;

    // Verificar se há pendências
    const diasDesdeUltima = funcionario.data_ultimo_lote
      ? Math.floor(
          (Date.now() - new Date(funcionario.data_ultimo_lote).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null;

    const temPendencia =
      funcionario.indice_avaliacao === 0 ||
      (diasDesdeUltima && diasDesdeUltima > 365) ||
      inativadas >= 3;

    let prioridade: 'CRÍTICA' | 'ALTA' | 'MÉDIA' | null = null;
    let mensagemPendencia: string | null = null;

    if (temPendencia) {
      if (diasDesdeUltima && diasDesdeUltima > 730) {
        prioridade = 'CRÍTICA';
        mensagemPendencia = `⚠️ Mais de 2 anos sem avaliação (${diasDesdeUltima} dias)`;
      } else if (inativadas >= 3) {
        prioridade = 'CRÍTICA';
        mensagemPendencia = `⚠️ Funcionário com ${inativadas} inativações consecutivas`;
      } else if (diasDesdeUltima && diasDesdeUltima > 365) {
        prioridade = 'ALTA';
        mensagemPendencia = `⚠️ Mais de 1 ano sem avaliação (${diasDesdeUltima} dias)`;
      } else if (funcionario.indice_avaliacao === 0) {
        prioridade = 'MÉDIA';
        mensagemPendencia = '⚠️ Funcionário nunca fez avaliação';
      }
    }

    return NextResponse.json({
      funcionario: {
        ...funcionario,
        diasDesdeUltima,
      },
      avaliacoes: avaliacoesResult.rows,
      estatisticas: {
        totalAvaliacoes,
        concluidas,
        inativadas,
        pendentes,
      },
      pendencia: temPendencia
        ? {
            prioridade,
            mensagem: mensagemPendencia,
          }
        : null,
    });
  } catch (error) {
    console.error('Erro ao buscar funcionário:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar funcionário' },
      { status: 500 }
    );
  }
}
