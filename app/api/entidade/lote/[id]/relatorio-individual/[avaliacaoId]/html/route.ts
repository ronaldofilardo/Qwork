/**
 * API para retornar HTML de relatórios individuais (para geração client-side de PDFs)
 * Solução temporária para Vercel Free Tier
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireGestor } from '@/lib/auth-require';
import { query } from '@/lib/db';
import { gerarHTMLRelatorioIndividual } from '@/lib/templates/relatorio-individual-html';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; avaliacaoId: string } }
) {
  try {
    // Verificar autenticação (gestor de entidade ou gestor RH)
    const session = requireGestor();
    const { id: loteId, avaliacaoId } = params;

    // Verificar acesso ao lote
    const loteResult = await query(
      `SELECT la.id, la.clinica_id, la.empresa_id
       FROM lotes_avaliacao la
       WHERE la.id = $1`,
      [loteId]
    );

    if (loteResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Lote não encontrado' },
        { status: 404 }
      );
    }

    const lote = loteResult.rows[0];

    // Verificar permissão (entidade ou RH)
    if (session.perfil === 'gestor') {
      if (lote.clinica_id !== session.clinica_id) {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }
    } else if (session.perfil === 'rh') {
      const rhAccessResult = await query(
        `SELECT 1 FROM gestores_rh
         WHERE cpf = $1 AND empresa_id = $2`,
        [session.cpf, lote.empresa_id]
      );

      if (rhAccessResult.rows.length === 0) {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }
    }

    // Buscar dados da avaliação
    const avaliacaoResult = await query(
      `SELECT 
        a.id,
        a.funcionario_cpf,
        a.status,
        a.concluida_em,
        f.nome as funcionario_nome,
        f.perfil,
        f.setor,
        f.funcao,
        f.matricula,
        ec.nome as empresa_nome
       FROM avaliacoes a
       JOIN funcionarios f ON a.funcionario_cpf = f.cpf
       JOIN empresas_clientes ec ON f.empresa_id = ec.id
       WHERE a.id = $1 AND a.lote_id = $2`,
      [avaliacaoId, loteId]
    );

    if (avaliacaoResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Avaliação não encontrada' },
        { status: 404 }
      );
    }

    const avaliacao = avaliacaoResult.rows[0];

    if (avaliacao.status !== 'concluido') {
      return NextResponse.json(
        { error: 'Avaliação ainda não foi concluída' },
        { status: 400 }
      );
    }

    // Buscar resultados agrupados por grupo
    const resultadosResult = await query(
      `SELECT 
        r.grupo_id,
        g.titulo as grupo_titulo,
        g.dominio,
        AVG(r.valor)::numeric(10,2) as media,
        r.valor,
        q.texto as item_texto
       FROM resultados r
       JOIN grupos_questoes g ON r.grupo_id = g.id
       JOIN questoes q ON r.questao_id = q.id
       WHERE r.avaliacao_id = $1
       GROUP BY r.grupo_id, g.titulo, g.dominio, r.valor, q.texto
       ORDER BY r.grupo_id, q.texto`,
      [avaliacaoId]
    );

    // Organizar resultados por grupo
    const gruposMap = new Map();
    for (const row of resultadosResult.rows) {
      if (!gruposMap.has(row.grupo_id)) {
        gruposMap.set(row.grupo_id, {
          id: row.grupo_id,
          titulo: row.grupo_titulo,
          dominio: row.dominio,
          media: parseFloat(row.media),
          respostas: [],
        });
      }

      gruposMap.get(row.grupo_id).respostas.push({
        item: row.item_texto,
        valor: row.valor,
        texto: row.valor === 1 ? 'Sim' : 'Não',
      });
    }

    // Adicionar classificação por cores
    const grupos = Array.from(gruposMap.values()).map((grupo) => ({
      ...grupo,
      classificacao:
        grupo.media >= 0.7
          ? 'verde'
          : grupo.media >= 0.4
            ? 'amarelo'
            : 'vermelho',
      corClassificacao:
        grupo.media >= 0.7
          ? '#10b981'
          : grupo.media >= 0.4
            ? '#f59e0b'
            : '#ef4444',
    }));

    // Gerar HTML do relatório
    const htmlContent = gerarHTMLRelatorioIndividual({
      funcionario: {
        nome: avaliacao.funcionario_nome,
        cpf: avaliacao.funcionario_cpf,
        perfil: avaliacao.perfil,
        empresa: avaliacao.empresa_nome,
        setor: avaliacao.setor,
        funcao: avaliacao.funcao,
        matricula: avaliacao.matricula,
      },
      lote: {
        id: lote.id,
      },
      envio: avaliacao.concluida_em
        ? new Date(avaliacao.concluida_em).toLocaleDateString('pt-BR')
        : 'Data não disponível',
      grupos,
    });

    // Retornar HTML com headers apropriados
    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Avaliacao-Id': String(avaliacaoId),
        'X-Lote-Id': String(loteId),
      },
    });
  } catch (error) {
    console.error('Erro ao gerar HTML do relatório:', error);
    return NextResponse.json(
      {
        error: 'Erro ao gerar HTML do relatório',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
