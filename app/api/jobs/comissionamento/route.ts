/**
 * POST /api/jobs/comissionamento
 * Job diário de manutenção do módulo de comissionamento.
 * Executado via cron às 00:00 UTC.
 * Protegido por Authorization: Bearer CRON_SECRET
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Verificar autorização do cron
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const resultados: Record<string, number | string> = {};
  const erros: string[] = [];
  const inicio = Date.now();

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Expirar leads vencidos (status pendente + data_expiracao < NOW())
  // ─────────────────────────────────────────────────────────────────────────
  try {
    const r1 = await query(
      `UPDATE leads_representante
       SET status = 'expirado', atualizado_em = NOW()
       WHERE status = 'pendente' AND data_expiracao < NOW()
       RETURNING id`
    );
    resultados.leads_expirados = r1.rows.length;
  } catch (e: unknown) {
    erros.push(`leads_expirar: ${(e as Error).message}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Marcar vínculos inativos (sem laudos há ≥ 90 dias)
  // ─────────────────────────────────────────────────────────────────────────
  try {
    const r2 = await query(
      `UPDATE vinculos_comissao
       SET status = 'inativo', atualizado_em = NOW()
       WHERE status = 'ativo'
         AND (
           ultimo_laudo_em IS NULL AND criado_em < NOW() - INTERVAL '90 days'
           OR
           ultimo_laudo_em IS NOT NULL AND ultimo_laudo_em < NOW() - INTERVAL '90 days'
         )
       RETURNING id`
    );
    resultados.vinculos_inativados = r2.rows.length;
  } catch (e: unknown) {
    erros.push(`vinculos_inativar: ${(e as Error).message}`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Encerrar vínculos expirados (data_expiracao < CURRENT_DATE)
  // ─────────────────────────────────────────────────────────────────────────
  try {
    const r3 = await query(
      `UPDATE vinculos_comissao
       SET status = 'encerrado',
           encerrado_em = NOW(),
           encerrado_motivo = 'Vínculo expirou (1 ano encerrado)',
           atualizado_em = NOW()
       WHERE status IN ('ativo', 'inativo', 'suspenso')
         AND data_expiracao < CURRENT_DATE
       RETURNING id`
    );
    resultados.vinculos_encerrados = r3.rows.length;

    // Congelar comissões pendente_consolidacao de vínculos encerrados
    if (r3.rows.length > 0) {
      const vinculoIds = r3.rows.map((r: { id: number }) => r.id);
      const r3b = await query(
        `UPDATE comissoes_laudo
         SET status = 'congelada_aguardando_admin',
             motivo_congelamento = 'vinculo_encerrado'
         WHERE vinculo_id = ANY($1::int[])
           AND status IN ('pendente_consolidacao', 'retida')
         RETURNING id`,
        [vinculoIds]
      );
      resultados.comissoes_congeladas_vinculo_expirado = r3b.rows.length;
    }
  } catch (e: unknown) {
    erros.push(`vinculos_encerrar: ${(e as Error).message}`);
  }

  const duracao_ms = Date.now() - inicio;
  resultados.duracao_ms = duracao_ms;

  if (erros.length > 0) {
    console.error('[jobs/comissionamento] Erros:', erros);
  }

  return NextResponse.json({
    ok: erros.length === 0,
    executado_em: new Date().toISOString(),
    resultados,
    erros: erros.length > 0 ? erros : undefined,
  });
}
