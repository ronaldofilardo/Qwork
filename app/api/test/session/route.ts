import { NextResponse } from 'next/server';
import { createSession, Session } from '@/lib/session';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  // Permitir apenas em ambiente de teste para evitar exposição em produção
  if (process.env.NODE_ENV === 'production' && !process.env.TEST_DATABASE_URL) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  try {
    const body = await request.json();

    // Determinar clinica_id: usar valor explícito se fornecido, senão tentar mapear via contratante_id quando perfil for 'rh'
    let clinicaId = body.clinica_id;
    if (!clinicaId && body.perfil === 'rh' && body.contratante_id) {
      try {
        const clinicaRes = await query(
          'SELECT id, ativa FROM clinicas WHERE contratante_id = $1 AND ativa = true LIMIT 1',
          [body.contratante_id]
        );
        if (clinicaRes.rows.length > 0) {
          clinicaId = clinicaRes.rows[0].id;
        }
      } catch (err: any) {
        // Pode acontecer em esquemas legados onde a coluna `contratante_id` não existe.
        // Não queremos bloquear a criação de sessão de teste por isso — apenas logar e prosseguir.
        console.warn(
          `[DEBUG] /api/test/session - Falha ao mapear clinica via contratante_id: ${err?.message || err}`
        );
      }
    }

    const session: Session = {
      cpf: body.cpf || '00000000000',
      nome: body.nome || 'Sessão de Teste',
      perfil: (body.perfil as any) || 'funcionario',
      clinica_id: clinicaId,
      contratante_id: body.contratante_id,
      mfaVerified: true,
    };

    console.log('[DEBUG] /api/test/session - Criando sessão:', {
      cpf: session.cpf,
      perfil: session.perfil,
      clinica_id: session.clinica_id,
      bodyPerfil: body.perfil,
      contratante_id: body.contratante_id,
    });

    // Em ambiente de teste, garantir que exista um funcionário correspondente
    // para que validações de contexto (queryWithContext) passem.
    try {
      if (session.perfil === 'rh') {
        // Hash conhecido para senha 123456 (apenas em dev/test)
        const KNOWN_HASH =
          '$2a$10$1FmG9Rn0QJ9T78GbvS/Yf.AfR9tp9qTxBznhUWLwBhsP8BChtmSVW';
        await query(
          `INSERT INTO funcionarios (cpf, nome, perfil, clinica_id, ativo, senha_hash)
           VALUES ($1, $2, $3, $4, true, $5)
           ON CONFLICT (cpf) DO UPDATE SET nome = EXCLUDED.nome, perfil = EXCLUDED.perfil, clinica_id = EXCLUDED.clinica_id, ativo = true`,
          [
            session.cpf,
            session.nome,
            'rh',
            session.clinica_id || null,
            KNOWN_HASH,
          ]
        );
      }
    } catch (err) {
      console.warn(
        '[DEBUG] /api/test/session - Falha ao garantir funcionario de teste:',
        err
      );
    }

    // Criar sessão (cookie é setado automaticamente)
    createSession(session);

    return NextResponse.json(
      { ok: true, session },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erro em /api/test/session:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
