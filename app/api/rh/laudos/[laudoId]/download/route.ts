import { getSession, requireRHWithEmpresaAccess } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export const GET = async (
  req: Request,
  { params }: { params: { laudoId: string } }
) => {
  const session = await Promise.resolve(getSession());
  if (!session || (session.perfil !== 'rh' && session.perfil !== 'admin')) {
    return NextResponse.json(
      { error: 'Acesso negado', success: false },
      { status: 403 }
    );
  }
  const user = session;

  try {
    const laudoId = parseInt(params.laudoId);
    if (isNaN(laudoId)) {
      return NextResponse.json(
        { error: 'ID do laudo inválido', success: false },
        { status: 400 }
      );
    }

    // Buscar laudo e validar que está enviado
    // Tentamos primeiro selecionar campo arquivo_pdf (compatibilidade com versão que o tem)
    let laudoQuery;
    let arquivoPdfColumnAvailable = true;

    try {
      laudoQuery = await query(
        `
        SELECT
          l.id,
          l.lote_id,
          l.arquivo_pdf,
          l.hash_pdf,
          la.codigo,
          la.titulo,
          la.clinica_id,
          la.empresa_id
        FROM laudos l
        JOIN lotes_avaliacao la ON l.lote_id = la.id
        WHERE l.id = $1 AND l.status = 'enviado'
      `,
        [laudoId]
      );
    } catch (err: any) {
      // Se a coluna não existir (código 42703), fazemos fallback sem arquivo_pdf
      if (err?.code === '42703') {
        arquivoPdfColumnAvailable = false;
        laudoQuery = await query(
          `
          SELECT
            l.id,
            l.lote_id,
            l.hash_pdf,
            la.codigo,
            la.titulo,
            la.clinica_id,
            la.empresa_id
          FROM laudos l
          JOIN lotes_avaliacao la ON l.lote_id = la.id
          WHERE l.id = $1 AND l.status = 'enviado'
        `,
          [laudoId]
        );
      } else {
        throw err;
      }
    }

    if (laudoQuery.rows.length === 0) {
      console.warn(
        `[WARN] Laudo ${laudoId} não encontrado (ou não está 'enviado')`
      );
      return NextResponse.json(
        { error: 'Laudo não encontrado', success: false },
        { status: 404 }
      );
    }

    const laudo = laudoQuery.rows[0];
    console.log(
      `[DEBUG] Laudo encontrado: id=${laudo.id}, lote_id=${laudo.lote_id}, arquivoPdfColumn=${arquivoPdfColumnAvailable}`
    );

    // Se a coluna arquivo_pdf está disponível e contém dados, retornar diretamente
    if (arquivoPdfColumnAvailable && laudo.arquivo_pdf) {
      const fileName = `laudo-${laudo.codigo}.pdf`;
      return new NextResponse(Buffer.from(laudo.arquivo_pdf), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    }

    // Verificar se o usuário tem acesso ao laudo
    // Para RH, validar que o RH tem permissão de acesso à empresa do lote
    if (user.perfil === 'admin') {
      // Admins têm acesso a todos os laudos
    } else if (user.perfil === 'rh') {
      try {
        await requireRHWithEmpresaAccess(Number(laudo.empresa_id));
      } catch {
        console.warn(
          `[WARN] Acesso negado ao laudo ${laudoId} para RH ${user.cpf}`
        );
        return NextResponse.json(
          {
            error: 'Você não tem permissão para acessar este laudo',
            success: false,
          },
          { status: 403 }
        );
      }
    } else {
      // Perfis não-RH/Admin não têm acesso aqui
      return NextResponse.json(
        { error: 'Acesso negado ao laudo', success: false },
        { status: 403 }
      );
    }

    // Tentar múltiplas chaves locais e externas (id, codigo, lote)
    const candidateNames = new Set<string>();
    candidateNames.add(`laudo-${laudo.id}.pdf`);
    if (laudo.codigo) candidateNames.add(`laudo-${laudo.codigo}.pdf`);
    if (laudo.lote_id) candidateNames.add(`laudo-${laudo.lote_id}.pdf`);

    // 1) Procurar em storage/local
    for (const name of candidateNames) {
      const p = path.join(process.cwd(), 'storage', 'laudos', name);
      if (fs.existsSync(p)) {
        const buf = fs.readFileSync(p);
        const fileName = `laudo-${laudo.codigo ?? laudo.id}.pdf`;
        return new NextResponse(buf, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${fileName}"`,
          },
        });
      }
    }

    // Using local and public storage only.

    // 3) Fallback para public (tentar mesmos nomes e o antigo por lote)
    for (const name of candidateNames) {
      const p = path.join(process.cwd(), 'public', 'laudos', name);
      if (fs.existsSync(p)) {
        const buf = fs.readFileSync(p);
        const fileName = `laudo-${laudo.codigo ?? laudo.id}.pdf`;
        return new NextResponse(buf, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${fileName}"`,
          },
        });
      }
    }

    // antigo fallback por lote_id
    const fallbackPath = path.join(
      process.cwd(),
      'public',
      'laudos',
      `laudo-${laudo.lote_id}.pdf`
    );
    if (fs.existsSync(fallbackPath)) {
      const fallbackBuf = fs.readFileSync(fallbackPath);
      const fileName = `laudo-${laudo.codigo ?? laudo.id}.pdf`;
      return new NextResponse(fallbackBuf, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    }

    console.warn(
      `[WARN] Arquivo do laudo ${laudoId} não encontrado em nenhum storage`
    );
    return NextResponse.json(
      { error: 'Arquivo do laudo não encontrado', success: false },
      { status: 404 }
    );
  } catch (error) {
    console.error('Erro ao fazer download do laudo:', error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        success: false,
        detalhes: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
};
