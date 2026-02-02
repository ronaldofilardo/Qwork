import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/session';

export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  try {
    const _session = await requireAuth();
    const { respostas } = await request.json();

    if (!respostas || typeof respostas !== 'object') {
      return NextResponse.json(
        { error: 'Respostas são obrigatórias' },
        { status: 400 }
      );
    }

    // Buscar todas as condições de cascata
    const condicoesResult = await query(`
      SELECT questao_id, questao_dependente, operador, valor_condicao, categoria
      FROM questao_condicoes 
      WHERE ativo = true
      ORDER BY questao_id
    `);

    const questoesVisiveis = new Set<number>();
    const questoesCondicionais = new Map<number, any>();

    // Marcar questões principais (1-56) como sempre visíveis
    for (let i = 1; i <= 56; i++) {
      questoesVisiveis.add(i);
    }

    // Avaliar condições para questões comportamentais e financeiras
    for (const condicao of condicoesResult.rows) {
      const { questao_id, questao_dependente, operador, valor_condicao } =
        condicao;
      questoesCondicionais.set(questao_id, condicao);

      // Verificar se a questão dependente foi respondida
      const valorResposta = respostas[`Q${questao_dependente}`];

      if (valorResposta !== undefined) {
        let condicaoAtendida = false;

        switch (operador) {
          case 'gt':
            condicaoAtendida = valorResposta > valor_condicao;
            break;
          case 'gte':
            condicaoAtendida = valorResposta >= valor_condicao;
            break;
          case 'lt':
            condicaoAtendida = valorResposta < valor_condicao;
            break;
          case 'lte':
            condicaoAtendida = valorResposta <= valor_condicao;
            break;
          case 'eq':
            condicaoAtendida = valorResposta === valor_condicao;
            break;
          case 'ne':
            condicaoAtendida = valorResposta !== valor_condicao;
            break;
        }

        if (condicaoAtendida) {
          questoesVisiveis.add(questao_id);
        }
      }
    }

    // Lógicas especiais de cascata

    // 1. Questões de violência (57-58): aparecem se houve assédio sexual (Q56 > 0)
    const assedioSexual = respostas['Q56'];
    if (assedioSexual && assedioSexual > 0) {
      questoesVisiveis.add(57);
      questoesVisiveis.add(58);
    }

    // 2. Questões de jogos: Q59 sempre visível, outras dependem dela
    questoesVisiveis.add(59); // Questão inicial de jogos sempre visível

    // 3. Questões de endividamento: Q65 sempre visível, outras dependem dela
    questoesVisiveis.add(65); // Questão inicial de endividamento sempre visível

    // Preparar resposta com detalhes de visibilidade
    const questoesPorCategoria = {
      core: Array.from({ length: 56 }, (_, i) => i + 1), // Q1-Q56
      behavioral: [56, 57, 58, 59, 60, 61, 62, 63, 64], // Violência + Jogos
      financial: [65, 66, 67, 68, 69, 70], // Endividamento
    };

    const visibilidade = {
      core: questoesPorCategoria.core.filter((q) => questoesVisiveis.has(q)),
      behavioral: questoesPorCategoria.behavioral.filter((q) =>
        questoesVisiveis.has(q)
      ),
      financial: questoesPorCategoria.financial.filter((q) =>
        questoesVisiveis.has(q)
      ),
    };

    return NextResponse.json({
      success: true,
      questoesVisiveis: Array.from(questoesVisiveis).sort((a, b) => a - b),
      totalVisiveis: questoesVisiveis.size,
      totalPossiveis: 37,
      visibilidadePorCategoria: visibilidade,
      condicoesAvaliadas: condicoesResult.rows.length,
    });
  } catch (error) {
    console.error('Erro ao avaliar condições de cascata:', error);
    return NextResponse.json(
      { error: 'Erro ao avaliar condições' },
      { status: 500 }
    );
  }
}
