/**
 * GET /api/utils/verificar-cnpj?cnpj=XXXXXXXXXXXXXX
 *
 * Endpoint público (sem autenticação necessária) para verificar se um CNPJ
 * está disponível para cadastro de representante.
 *
 * Usado pelo frontend (onBlur) no modal de cadastro de representante.
 *
 * Retorna: { disponivel: boolean, motivo?: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { checkCnpjUnicoRepresentante } from '@/lib/validators/cnpj-unico';
import { validarCNPJ } from '@/lib/validators';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const cnpjRaw = searchParams.get('cnpj') ?? '';
    const cnpjLimpo = cnpjRaw.replace(/\D/g, '');

    if (cnpjLimpo.length !== 14) {
      return NextResponse.json(
        { error: 'CNPJ deve ter 14 dígitos' },
        { status: 400 }
      );
    }

    if (!validarCNPJ(cnpjLimpo)) {
      return NextResponse.json(
        { disponivel: false, motivo: 'CNPJ inválido' },
        { status: 200 }
      );
    }

    const resultado = await checkCnpjUnicoRepresentante(cnpjLimpo);

    return NextResponse.json({
      disponivel: resultado.disponivel,
      motivo: resultado.message ?? undefined,
    });
  } catch (err: unknown) {
    const e = err as Error;
    console.error('[VERIFICAR_CNPJ] Erro:', e);
    return NextResponse.json(
      { error: 'Erro ao verificar CNPJ' },
      { status: 500 }
    );
  }
}
