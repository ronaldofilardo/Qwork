import { requireAuth } from '@/lib/session';
import { queryWithContext } from '@/lib/db-security';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const POST = async (_req: Request) => {
  const user = await requireAuth();
  if (!user || user.perfil !== 'rh') {
    return NextResponse.json(
      {
        error: 'Acesso negado',
        criadas: 0,
        total: 0,
        success: false,
        detalhes: [],
      },
      { status: 200 }
    );
  }

  const funcs = await queryWithContext(
    user,
    `SELECT cpf FROM funcionarios WHERE perfil = 'funcionario' AND ativo = true`,
    []
  );

  if (funcs.rowCount === 0) {
    return NextResponse.json(
      { criadas: 0, total: 0, success: true, detalhes: [] },
      { status: 200 }
    );
  }

  let criadas = 0;
  const agora = new Date().toISOString();
  const detalhes = [];

  for (const func of funcs.rows) {
    // SEMPRE CRIA NOVA — IGNORA TUDO QUE JÁ EXISTE
    await queryWithContext(
      user,
      `INSERT INTO avaliacoes (funcionario_cpf, status, inicio, liberado_por, liberado_em)
       VALUES ($1, 'iniciada', $2, $3, $2)`,
      [func.cpf, agora, user.cpf]
    );
    criadas++;
    detalhes.push({ cpf: func.cpf, status: 'iniciada' });
  }

  return NextResponse.json(
    { criadas, total: funcs.rowCount, success: true, detalhes },
    { status: 200 }
  );
};
