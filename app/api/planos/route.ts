import { NextResponse } from 'next/server';
import { getPlanos } from '@/lib/db-contratacao';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * GET: Listar planos ativos disponíveis para contratação
 * Acesso público (qualquer pessoa pode ver os planos)
 */
export async function GET() {
  try {
    const session = getSession();

    const planos = await getPlanos(session || undefined);

    return NextResponse.json({
      success: true,
      planos,
    });
  } catch (error) {
    console.error('Erro ao buscar planos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar planos disponíveis' },
      { status: 500 }
    );
  }
}
