import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/contratos/[id]/aceitar
 *
 * Endpoint para aceitar um contrato. Marca o contrato como aceito,
 * registra IP e data de aceite.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contratoId = parseInt(params.id);
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    if (!contratoId || isNaN(contratoId)) {
      return NextResponse.json(
        { error: 'ID do contrato inválido' },
        { status: 400 }
      );
    }

    // Atualizar contrato como aceito
    const res = await query(
      `UPDATE contratos 
       SET aceito = true, 
           ip_aceite = $2, 
           data_aceite = NOW(),
           atualizado_em = NOW()
       WHERE id = $1
       RETURNING *`,
      [contratoId, ip]
    );

    if (res.rows.length === 0) {
      return NextResponse.json(
        { error: 'Contrato não encontrado' },
        { status: 404 }
      );
    }

    const contrato = res.rows[0];

    // Buscar dados do tomador para gerar credenciais
    const tabelaTomador =
      contrato.tipo_tomador === 'clinica' ? 'clinicas' : 'entidades';

    const tomadorRes = await query(
      `SELECT cnpj, responsavel_cpf FROM ${tabelaTomador} WHERE id = $1`,
      [contrato.tomador_id]
    );

    const credenciais = {
      login: '',
      senha: '',
    };

    if (tomadorRes.rows.length > 0) {
      const tomador = tomadorRes.rows[0];
      const cleanCnpj = (tomador.cnpj || '').replace(/[./-]/g, '');
      credenciais.login = tomador.responsavel_cpf || cleanCnpj;
      credenciais.senha = cleanCnpj.slice(-6);
    }

    return NextResponse.json({
      success: true,
      contrato,
      credenciais,
    });
  } catch (error) {
    console.error('Erro ao aceitar contrato:', error);
    return NextResponse.json(
      { error: 'Erro ao aceitar contrato' },
      { status: 500 }
    );
  }
}
