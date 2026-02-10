export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { queryWithContext } from '@/lib/db-security';
import { getSession } from '@/lib/session';
import { StructuredLogger } from '@/lib/structured-logger';

export async function POST(request: Request) {
  let grupo: number | undefined;
  try {
    const session = await Promise.resolve(getSession());
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    grupo = body.grupo;
    const timestamp = body.timestamp;

    if (!grupo || !timestamp) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: grupo, timestamp' },
        { status: 400 }
      );
    }

    // Verificar se já existe avaliação para este funcionário neste grupo com timestamp próximo
    const result = await queryWithContext(
      `SELECT id, inicio
       FROM avaliacoes
       WHERE funcionario_cpf = $1 AND grupo = $2
       ORDER BY inicio DESC
       LIMIT 1`,
      [session.cpf, grupo]
    );

    if (result.rows.length > 0) {
      const existingAvaliacao = result.rows[0] as Record<string, any>;
      const existingTime = new Date(existingAvaliacao.inicio).getTime();
      const requestTime = new Date(timestamp).getTime();

      // Considerar sincronizado se timestamp estiver dentro de 5 minutos
      const timeDiff = Math.abs(existingTime - requestTime);
      const fiveMinutes = 5 * 60 * 1000;

      if (timeDiff <= fiveMinutes) {
        return NextResponse.json({
          alreadySynced: true,
          avaliacaoId: existingAvaliacao.id,
        });
      }
    }

    return NextResponse.json({ alreadySynced: false });
  } catch (err: unknown) {
    await StructuredLogger.logError(
      'Erro ao verificar sincronização de avaliação',
      err instanceof Error ? err : new Error(String(err)),
      request as unknown as import('next/server').NextRequest,
      getSession(),
      { grupo: typeof grupo !== 'undefined' ? grupo : undefined }
    );
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
