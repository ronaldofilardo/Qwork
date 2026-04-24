import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';
import { VALOR_TAXA_MANUTENCAO } from '@/lib/manutencao-taxa';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/manutencao/entidade/[id]/confirmar
 * Gera cobrança de taxa de manutenção para uma entidade específica.
 * Apenas administradores e suporte têm acesso.
 *
 * Ação:
 *   - Verifica que a entidade ainda deve a taxa (valida novamente no servidor)
 *   - Cria registro em 'pagamentos' com tipo_cobranca='manutencao', valor=R$250
 *   - Marca entidades.manutencao_ja_cobrada = true
 *   - Retorna pagamento_id para o suporte usar no fluxo de "Gerar Link"
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = getSession();

  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  if (session.perfil !== 'admin' && session.perfil !== 'suporte') {
    return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 });
  }

  const entidadeId = parseInt(params.id, 10);
  if (isNaN(entidadeId)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  try {
    // Validar novamente no servidor (evitar race conditions)
    const entidadeRes = await query(
      `SELECT
         e.id, e.nome, e.cnpj,
         e.manutencao_ja_cobrada,
         e.limite_primeira_cobranca_manutencao,
         e.ativa
       FROM entidades e
       WHERE e.id = $1`,
      [entidadeId]
    );

    if (entidadeRes.rowCount === 0) {
      return NextResponse.json(
        { error: 'Entidade não encontrada' },
        { status: 404 }
      );
    }

    const entidade = entidadeRes.rows[0];

    if (!entidade.ativa) {
      return NextResponse.json({ error: 'Entidade inativa' }, { status: 400 });
    }

    if (entidade.manutencao_ja_cobrada) {
      return NextResponse.json(
        { error: 'Taxa de manutenção já foi gerada para esta entidade' },
        { status: 409 }
      );
    }

    if (!entidade.limite_primeira_cobranca_manutencao) {
      return NextResponse.json(
        { error: 'Entidade não possui data limite de manutenção configurada' },
        { status: 400 }
      );
    }

    const limite = new Date(entidade.limite_primeira_cobranca_manutencao);
    if (limite > new Date()) {
      return NextResponse.json(
        { error: 'Prazo de 90 dias ainda não venceu para esta entidade' },
        { status: 400 }
      );
    }

    // Verificar se já existe laudo emitido (double-check no servidor)
    const laudoRes = await query(
      `SELECT 1
       FROM laudos l
       JOIN lotes_avaliacao la ON la.id = l.lote_id
       WHERE la.entidade_id = $1
         AND l.status IN ('emitido', 'enviado')
       LIMIT 1`,
      [entidadeId]
    );

    if (laudoRes.rowCount > 0) {
      return NextResponse.json(
        {
          error:
            'Entidade já possui laudo emitido — taxa de manutenção não aplicável',
        },
        { status: 409 }
      );
    }

    // Criar pagamento com tipo_cobranca='manutencao'
    const pagamentoRes = await query(
      `INSERT INTO pagamentos
         (entidade_id, valor, status, tipo_cobranca, metodo, observacoes, criado_em, atualizado_em)
       VALUES
         ($1, $2, 'pendente', 'manutencao', 'boleto',
          'Taxa de manutenção — emitida por suporte em ' || NOW()::text,
          NOW(), NOW())
       RETURNING id`,
      [entidadeId, VALOR_TAXA_MANUTENCAO]
    );

    const pagamentoId = pagamentoRes.rows[0].id as number;

    // Marcar entidade como cobrada (evita duplicação)
    await query(
      `UPDATE entidades
       SET manutencao_ja_cobrada = true, atualizado_em = NOW()
       WHERE id = $1`,
      [entidadeId]
    );

    console.info(
      JSON.stringify({
        event: 'taxa_manutencao_gerada',
        tipo: 'entidade',
        entidade_id: entidadeId,
        pagamento_id: pagamentoId,
        valor: VALOR_TAXA_MANUTENCAO,
        gerado_por: session.cpf ?? 'suporte',
        timestamp: new Date().toISOString(),
      })
    );

    return NextResponse.json(
      {
        success: true,
        pagamento_id: pagamentoId,
        valor: VALOR_TAXA_MANUTENCAO,
        entidade_nome: entidade.nome,
        message: 'Cobrança de taxa de manutenção gerada com sucesso',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      '[POST /api/admin/manutencao/entidade/confirmar] Erro:',
      error
    );
    return NextResponse.json(
      { error: 'Erro ao gerar cobrança de manutenção' },
      { status: 500 }
    );
  }
}
