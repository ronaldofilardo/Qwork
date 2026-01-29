import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Verificar sessão e perfil
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (session.perfil !== 'gestor_entidade') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Buscar lotes associados aos funcionários da entidade ou lotes diretamente da entidade
    // Inclui informações de validação e laudos (igual à API da clínica)
    const lotesResult = await query(
      `
      SELECT DISTINCT
        la.id,
        la.codigo,
        la.titulo,
        la.tipo,
        la.status,
        la.criado_em,
        la.liberado_em,
        f2.nome as liberado_por_nome,
        COUNT(DISTINCT a.id) as total_avaliacoes,
        COUNT(DISTINCT CASE WHEN a.status = 'concluida' THEN a.id END) as avaliacoes_concluidas,
        COUNT(DISTINCT CASE WHEN a.status = 'inativada' THEN a.id END) as avaliacoes_inativadas,
        -- Informações de laudo
        l.id as laudo_id,
        l.status as laudo_status,
        l.emitido_em as laudo_emitido_em,
        l.enviado_em as laudo_enviado_em,
        l.hash_pdf as laudo_hash,
        f3.nome as emissor_nome
      FROM lotes_avaliacao la
      LEFT JOIN avaliacoes a ON a.lote_id = la.id
      LEFT JOIN funcionarios f ON a.funcionario_cpf = f.cpf
      LEFT JOIN contratantes_funcionarios cf ON cf.funcionario_id = f.id AND cf.vinculo_ativo = true
      LEFT JOIN funcionarios f2 ON la.liberado_por = f2.cpf
      LEFT JOIN laudos l ON l.id = la.id
      LEFT JOIN funcionarios f3 ON l.emissor_cpf = f3.cpf
      WHERE (cf.contratante_id = $1 OR la.contratante_id = $1)
        AND la.status != 'cancelado'
      GROUP BY la.id, la.codigo, la.titulo, la.tipo, la.status, la.criado_em, la.liberado_em, f2.nome,
               l.id, l.status, l.emitido_em, l.enviado_em, l.hash_pdf, f3.nome
      ORDER BY la.criado_em DESC
    `,
      [session.contratante_id]
    );

    // BEFORE returning: para lotes cujo laudo existe mas o hash está nulo,
    // tentar recuperar o hash a partir do arquivo em disco (fallback não intrusivo).
    // Isso evita que a UI mostre 'N/A' para laudos que já possuem PDF no storage.
    // IMPORTANTE: Não atualizamos o banco pois laudos emitidos são IMUTÁVEIS
    await Promise.all(
      lotesResult.rows.map(async (lote) => {
        if (lote.laudo_id && !lote.laudo_hash) {
          try {
            const fs = await import('fs/promises');
            const path = await import('path');
            const filePath = path.join(
              process.cwd(),
              'storage',
              'laudos',
              `laudo-${lote.laudo_id}.pdf`
            );
            const buf = await fs.readFile(filePath);
            const crypto = await import('crypto');
            const h = crypto.createHash('sha256').update(buf).digest('hex');

            // Apenas atualizar na resposta, NÃO no banco (imutabilidade)
            // O hash deveria ter sido calculado na geração, mas para dados legados apenas mostramos
            lote.laudo_hash = h;
          } catch (err) {
            // arquivo ausente ou erro de IO → continuar sem falhar a API
            console.warn(
              `Não foi possível computar hash para laudo ${lote.laudo_id}: ${err instanceof Error ? err.message : String(err)}`
            );
          }
        }
      })
    );

    // Validar cada lote para determinar se pode emitir laudo
    const lotesComValidacao = await Promise.all(
      lotesResult.rows.map(async (lote) => {
        try {
          const validacaoRes = await query(
            `SELECT * FROM validar_lote_pre_laudo($1)`,
            [lote.id]
          );
          const validacao = validacaoRes.rows[0];

          return {
            ...lote,
            // Suporte robusto para variações no retorno da função SQL
            // (pode ser 'pode_emitir' ou 'pode_emitir_laudo')
            pode_emitir_laudo: !!(
              validacao?.pode_emitir ??
              validacao?.pode_emitir_laudo ??
              false
            ),
            // Motivos podem vir em 'motivos_bloqueio' ou 'motivos'
            motivos_bloqueio:
              validacao?.motivos_bloqueio || validacao?.motivos || [],
            // Taxa de conclusão pode estar no topo ou dentro de 'detalhes'
            taxa_conclusao:
              validacao?.taxa_conclusao ||
              validacao?.detalhes?.taxa_conclusao ||
              0,
          };
        } catch (error) {
          console.error(`Erro ao validar lote ${lote.id}:`, error);
          return {
            ...lote,
            pode_emitir_laudo: false,
            motivos_bloqueio: ['Erro ao validar lote'],
            taxa_conclusao: 0,
          };
        }
      })
    );

    return NextResponse.json({
      lotes: lotesComValidacao,
    });
  } catch (error) {
    console.error('Erro ao buscar lotes:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
