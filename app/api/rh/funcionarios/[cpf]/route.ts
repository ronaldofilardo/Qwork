import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { query } from '@/lib/db';
import { assertRoles, ROLES, isApiError } from '@/lib/authorization/policies';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ cpf: string }> }
) {
  try {
    const session = await requireAuth();
    assertRoles(session, [ROLES.RH, ROLES.GESTOR]);

    const { cpf } = await context.params;

    // Determinar contexto de isolamento baseado no perfil
    const isRH = session.perfil === 'rh';
    const clinicaId = session.clinica_id;

    if (isRH && !clinicaId) {
      return NextResponse.json(
        { error: 'Clínica não identificada na sessão do RH' },
        { status: 403 }
      );
    }

    // Buscar dados do funcionário via funcionarios_clinicas (JOINs corretos)
    // SEGREGAÇÃO: RH só vê dados vinculados à sua clínica
    const funcionarioResult = isRH
      ? await query(
          `SELECT f.cpf, f.nome, f.setor, f.funcao, f.email, f.matricula, 
                  f.nivel_cargo, f.turno, f.escala, f.ativo, f.criado_em, f.atualizado_em,
                  fc.indice_avaliacao, fc.data_ultimo_lote,
                  ec.nome as empresa_nome, cl.nome as clinica_nome,
                  ec.id as empresa_id
           FROM funcionarios f
           INNER JOIN funcionarios_clinicas fc ON fc.funcionario_id = f.id
           INNER JOIN empresas_clientes ec ON ec.id = fc.empresa_id
           INNER JOIN clinicas cl ON cl.id = ec.clinica_id
           WHERE f.cpf = $1 AND fc.clinica_id = $2 AND fc.ativo = true`,
          [cpf, clinicaId],
          session
        )
      : await query(
          `SELECT f.cpf, f.nome, f.setor, f.funcao, f.email, f.matricula, 
                  f.nivel_cargo, f.turno, f.escala, f.ativo, f.criado_em, f.atualizado_em,
                  fe.indice_avaliacao, fe.data_ultimo_lote,
                  ent.nome as empresa_nome
           FROM funcionarios f
           INNER JOIN funcionarios_entidades fe ON fe.funcionario_id = f.id
           INNER JOIN entidades ent ON ent.id = fe.entidade_id
           WHERE f.cpf = $1 AND fe.entidade_id = $2 AND fe.ativo = true`,
          [cpf, session.entidade_id],
          session
        );

    if (funcionarioResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Funcionário não encontrado' },
        { status: 404 }
      );
    }

    const funcionario = funcionarioResult.rows[0];

    // Buscar histórico de avaliações FILTRADO por empresa/entidade (SEGREGAÇÃO)
    const avaliacoesResult = isRH
      ? await query(
          `SELECT a.id, a.status, a.inicio, a.envio, a.inativada_em as data_inativacao, a.motivo_inativacao,
                  l.id as lote_id, l.descricao as lote_descricao, l.numero_ordem, l.liberado_em,
                  CASE 
                    WHEN a.status = 'concluida' THEN 'concluída'
                    WHEN a.status = 'inativada' THEN 'inativada'
                    ELSE 'pendente'
                  END as status_display
           FROM avaliacoes a
           INNER JOIN lotes_avaliacao l ON a.lote_id = l.id
           WHERE a.funcionario_cpf = $1 AND l.clinica_id = $2
           ORDER BY l.numero_ordem DESC, a.inicio DESC`,
          [cpf, clinicaId],
          session
        )
      : await query(
          `SELECT a.id, a.status, a.inicio, a.envio, a.inativada_em as data_inativacao, a.motivo_inativacao,
                  l.id as lote_id, l.descricao as lote_descricao, l.numero_ordem, l.liberado_em,
                  CASE 
                    WHEN a.status = 'concluida' THEN 'concluída'
                    WHEN a.status = 'inativada' THEN 'inativada'
                    ELSE 'pendente'
                  END as status_display
           FROM avaliacoes a
           INNER JOIN lotes_avaliacao l ON a.lote_id = l.id
           WHERE a.funcionario_cpf = $1 AND l.entidade_id = $2
           ORDER BY l.numero_ordem DESC, a.inicio DESC`,
          [cpf, session.entidade_id],
          session
        );

    // Calcular estatísticas
    const totalAvaliacoes = avaliacoesResult.rows.length;
    const concluidas = avaliacoesResult.rows.filter(
      (a) => a.status === 'concluida' || a.status === 'concluido'
    ).length;
    const inativadas = avaliacoesResult.rows.filter(
      (a) => a.status === 'inativada'
    ).length;
    const pendentes = avaliacoesResult.rows.filter(
      (a) =>
        a.status !== 'concluida' &&
        a.status !== 'concluido' &&
        a.status !== 'inativada'
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
    if (isApiError(error)) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error('Erro ao buscar funcionário:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar funcionário' },
      { status: 500 }
    );
  }
}
