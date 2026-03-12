/**
 * POST /api/representante/login
 * Autenticação via email + codigo único.
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { criarSessaoRepresentante } from '@/lib/session-representante';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, codigo } = body;

    if (!email?.trim() || !codigo?.trim()) {
      return NextResponse.json(
        { error: 'E-mail e código são obrigatórios' },
        { status: 400 }
      );
    }

    const result = await query(
      `SELECT id, nome, email, codigo, status, tipo_pessoa
       FROM representantes
       WHERE email = $1 AND codigo = $2
       LIMIT 1`,
      [email.toLowerCase().trim(), codigo.toUpperCase().trim()]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'E-mail ou código inválidos' },
        { status: 401 }
      );
    }

    const rep = result.rows[0];

    if (['desativado', 'rejeitado'].includes(rep.status)) {
      return NextResponse.json(
        {
          error: 'Conta inativa ou rejeitada. Entre em contato com o suporte.',
        },
        { status: 403 }
      );
    }

    criarSessaoRepresentante({
      representante_id: rep.id,
      nome: rep.nome,
      email: rep.email,
      codigo: rep.codigo,
      status: rep.status,
      tipo_pessoa: rep.tipo_pessoa,
      criado_em_ms: Date.now(),
    });

    return NextResponse.json({
      success: true,
      representante: {
        id: rep.id,
        nome: rep.nome,
        email: rep.email,
        codigo: rep.codigo,
        status: rep.status,
        tipo_pessoa: rep.tipo_pessoa,
      },
    });
  } catch (err) {
    console.error('[/api/representante/login]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
