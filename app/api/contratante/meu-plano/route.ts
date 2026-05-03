import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * DEPRECATED: Sistema de planos foi removido completamente
 * Migration 1136: remocao_definitiva_planos_contratacao.sql (2026-04-01)
 * 
 * Use /api/entidade/meu-contrato em vez disso
 */
export async function GET() {
  return NextResponse.json(
    {
      error: 'This endpoint has been removed. The plans system was fully deprecated.',
      message: 'O sistema de planos foi completamente removido. Use /api/entidade/meu-contrato em vez disso.',
      deprecated_since: '2026-04-01',
      migration: '1136',
    },
    { status: 410 }
  );

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: true,
        plano: null,
        message: 'Nenhum plano ativo encontrado',
      });
    }

    return NextResponse.json({
      success: true,
      plano: result.rows[0],
    });
  } catch (error) {
    console.error('[API Meu Plano] Erro ao buscar plano:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar informações do plano',
      },
      { status: 500 }
    );
  }
}
