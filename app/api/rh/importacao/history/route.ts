import { NextResponse } from 'next/server';
import { requireClinica } from '@/lib/session';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/rh/importacao/history
 * Lista histórico de importações da clínica.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const session = await requireClinica();
    const clinicaId = session.clinica_id;

    const result = await query(
      `SELECT
        id, arquivo_nome, total_linhas,
        empresas_criadas, empresas_existentes,
        funcionarios_criados, funcionarios_atualizados,
        vinculos_criados, vinculos_atualizados,
        inativacoes, total_erros,
        status, tempo_processamento_ms,
        usuario_cpf, criado_em
      FROM importacoes_clinica
      WHERE clinica_id = $1
      ORDER BY criado_em DESC
      LIMIT 50`,
      [clinicaId]
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error: unknown) {
    console.error('[importacao/history] Erro:', error);

    if (error instanceof Error) {
      if (
        error.message.includes('Clínica não identificada') ||
        error.message.includes('Acesso restrito') ||
        error.message.includes('Clínica inativa')
      ) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
