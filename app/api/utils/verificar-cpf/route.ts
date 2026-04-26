/**
 * GET /api/utils/verificar-cpf?cpf=XXXXXXXXXXX
 *
 * Endpoint autenticado para verificar se um CPF está disponível no sistema.
 * Usado pelo frontend (onBlur) nos formulários de cadastro de representante,
 * vendedor e gestor.
 *
 * Roles permitidas: representante, comercial, admin, suporte
 * Retorna: { disponivel: boolean, motivo?: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { checkCpfUnicoSistema } from '@/lib/validators/cpf-unico';
import { validarCPF } from '@/lib/cpf-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await requireRole(
      ['representante', 'comercial', 'admin', 'suporte'],
      false
    );

    const { searchParams } = new URL(request.url);
    const cpfRaw = searchParams.get('cpf') ?? '';
    const cpfLimpo = cpfRaw.replace(/\D/g, '');

    if (cpfLimpo.length !== 11) {
      return NextResponse.json(
        { error: 'CPF deve ter 11 dígitos' },
        { status: 400 }
      );
    }

    if (!validarCPF(cpfLimpo)) {
      return NextResponse.json(
        { disponivel: false, motivo: 'CPF inválido' },
        { status: 200 }
      );
    }

    const resultado = await checkCpfUnicoSistema(cpfLimpo);

    return NextResponse.json({
      disponivel: resultado.disponivel,
      motivo: resultado.message ?? undefined,
    });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Não autenticado')
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    if (e.message === 'Sem permissão')
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    console.error('[GET /api/utils/verificar-cpf]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
