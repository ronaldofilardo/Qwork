import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

const CODIGOS_VALIDOS = [
  'impostos',
  'boleto',
  'pix',
  'credit_card_1x',
  'credit_card_2_6x',
  'credit_card_7_12x',
  'taxa_transacao',
] as const;

const GatewayConfigPatchSchema = z.object({
  codigo: z.enum(CODIGOS_VALIDOS),
  valor: z.number().min(0).max(100),
});

export async function GET() {
  try {
    await requireRole('admin', false);

    const result = await query<{
      codigo: string;
      descricao: string | null;
      tipo: 'taxa_fixa' | 'percentual';
      valor: string | number;
      ativo: boolean;
    }>(
      `SELECT codigo, descricao, tipo, valor, ativo
         FROM configuracoes_gateway
         ORDER BY codigo ASC`
    );

    const configuracoes = result.rows.map((row) => ({
      codigo: row.codigo,
      descricao: row.descricao,
      tipo: row.tipo,
      valor: Number(row.valor),
      ativo: row.ativo,
    }));

    return NextResponse.json({ success: true, configuracoes });
  } catch (error) {
    console.error('[GET /api/admin/financeiro/gateway-config]', error);
    return NextResponse.json(
      { error: 'Erro ao carregar configurações do gateway' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireRole('admin', false);

    const body = (await request.json()) as unknown;
    const parsed = GatewayConfigPatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { codigo, valor } = parsed.data;

    await query(
      `UPDATE configuracoes_gateway
          SET valor = $1, atualizado_em = NOW()
        WHERE codigo = $2`,
      [valor, codigo]
    );

    return NextResponse.json({
      success: true,
      message: `Taxa "${codigo}" atualizada para ${valor}.`,
    });
  } catch (error) {
    console.error('[PATCH /api/admin/financeiro/gateway-config]', error);
    return NextResponse.json(
      { error: 'Erro ao salvar configuração do gateway' },
      { status: 500 }
    );
  }
}
