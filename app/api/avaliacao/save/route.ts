import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { queryWithContext } from '@/lib/db-security';
import { requireAuth } from '@/lib/session';
import { verificarEConcluirAvaliacao } from '@/lib/avaliacao-conclusao';
import { grupos } from '@/lib/questoes';

export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const { grupo, respostas } = await request.json();

    // Validar dados
    if (!grupo || !respostas || !Array.isArray(respostas)) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    // Buscar avaliação em andamento ou criar nova se não existir
    let avaliacaoId: number;
    const avaliacaoResult = await query(
      `SELECT id, lote_id FROM avaliacoes
       WHERE funcionario_cpf = $1 AND status IN ('iniciada', 'em_andamento')
       ORDER BY inicio DESC LIMIT 1`,
      [session.cpf]
    );

    if (avaliacaoResult.rows.length === 0) {
      // Criar nova avaliação
      const newAvaliacao = await query(
        `INSERT INTO avaliacoes (funcionario_cpf, status)
         VALUES ($1, 'em_andamento')
         RETURNING id, lote_id`,
        [session.cpf]
      );
      avaliacaoId = newAvaliacao.rows[0].id;
    } else {
      avaliacaoId = avaliacaoResult.rows[0].id;
    }

    // Salvar respostas (upsert)
    for (const resposta of respostas) {
      await query(
        `INSERT INTO respostas (avaliacao_id, grupo, item, valor)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (avaliacao_id, grupo, item) 
         DO UPDATE SET valor = EXCLUDED.valor`,
        [avaliacaoId, resposta.grupo, resposta.item, resposta.valor]
      );
    }

    // Contar total de respostas únicas (grupo, item)
    const respostasCountResult = await query(
      `SELECT COUNT(DISTINCT (grupo, item)) as total 
       FROM respostas 
       WHERE avaliacao_id = $1`,
      [avaliacaoId]
    );

    const totalRespostas = parseInt(respostasCountResult.rows[0]?.total || '0');
    const totalPerguntasObrigatorias = grupos.reduce(
      (acc, g) => acc + g.itens.length,
      0
    );

    console.log(
      `[SAVE] Avaliação ${avaliacaoId}: ${totalRespostas}/${totalPerguntasObrigatorias} respostas`
    );

    // ✅ VERIFICAR SE COMPLETOU 37 RESPOSTAS (AUTO-CONCLUSÃO)
    // Usando função consolidada para idempotência e consistência
    const resultadoConclusao = await verificarEConcluirAvaliacao(
      avaliacaoId,
      session.cpf
    );

    if (resultadoConclusao.concluida) {
      return NextResponse.json({
        success: true,
        avaliacaoId,
        completed: true,
        message: 'Avaliação concluída com sucesso!',
      });
    }

    // Ainda não completou - apenas atualizar grupo_atual
    const grupoObj = grupos.find((g) => g.id === grupo);
    const totalItensGrupo = grupoObj ? grupoObj.itens.length : 0;
    const respostasNoGrupo = respostas.length;

    let grupoAtualParaSalvar = grupo;
    if (totalItensGrupo > 0 && respostasNoGrupo >= totalItensGrupo) {
      grupoAtualParaSalvar = grupo + 1;
    }

    await queryWithContext(
      'UPDATE avaliacoes SET grupo_atual = $1, status = $2, atualizado_em = NOW() WHERE id = $3',
      [grupoAtualParaSalvar, 'em_andamento', avaliacaoId]
    );

    return NextResponse.json({ success: true, avaliacaoId, completed: false });
  } catch (error) {
    console.error('Erro ao salvar avaliação:', error);
    return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 });
  }
}
