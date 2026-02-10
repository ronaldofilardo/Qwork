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
  if (!session || (session.perfil !== 'rh' && session.perfil !== 'emissor')) {
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

    // Buscar laudo e validar que está enviado ou emitido
    // Incluir metadados do arquivo remoto (Backblaze)
    const laudoQuery = await query(
      `
      SELECT
        l.id,
        l.lote_id,
        l.status,
        l.hash_pdf,
        l.arquivo_remoto_provider,
        l.arquivo_remoto_bucket,
        l.arquivo_remoto_key,
        l.arquivo_remoto_url,
        la.clinica_id,
        la.empresa_id
      FROM laudos l
      JOIN lotes_avaliacao la ON l.lote_id = la.id
      WHERE l.id = $1 AND l.status IN ('enviado', 'emitido')
    `,
      [laudoId]
    );

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
      `[DEBUG] Laudo encontrado: id=${laudo.id}, lote_id=${laudo.lote_id}, status=${laudo.status}`
    );

    // Verificar se o usuário tem acesso ao laudo
    // Emissor e RH (com acesso à empresa) podem acessar
    if (user.perfil === 'emissor') {
      // Emissor pode acessar conforme RLS/roles
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
      // Outros perfis não têm acesso aqui (admin NÃO tem acesso operacional)
      return NextResponse.json(
        { error: 'Acesso negado ao laudo', success: false },
        { status: 403 }
      );
    }

    // Tentar múltiplas chaves locais e externas (id, codigo, lote)
    const candidateNames = new Set<string>();
    candidateNames.add(`laudo-${laudo.id}.pdf`);
    if (laudo.codigo) candidateNames.add(`laudo-${laudo.id}.pdf`);
    if (laudo.lote_id) candidateNames.add(`laudo-${laudo.lote_id}.pdf`);

    console.log(
      `[DEBUG] Buscando arquivos para laudo ${laudo.id}:`,
      Array.from(candidateNames)
    );

    // PRIORIDADE 1: Usar arquivo_remoto_key do banco (se existir)
    if (laudo.arquivo_remoto_key) {
      console.log(
        `[BACKBLAZE] Arquivo remoto encontrado no banco: ${laudo.arquivo_remoto_key}`
      );
      try {
        const { getPresignedUrl } = await import('@/lib/storage/backblaze-client');
        const presignedUrl = await getPresignedUrl(laudo.arquivo_remoto_key, 300); // 5 min
        console.log(`[BACKBLAZE] Presigned URL: ${presignedUrl}`);
        console.log(`[BACKBLAZE] Redirecionando (302) para: ${presignedUrl.substring(0, 100)}...`);
        return NextResponse.redirect(presignedUrl, 302);
      } catch (backblazeError) {
        console.error(
          '[BACKBLAZE] Erro ao gerar presigned URL:',
          backblazeError
        );
        // Continuar tentando outras opções
      }
    }

    // PRIORIDADE 2: Procurar em storage/local (apenas desenvolvimento)
    const storageDir = path.join(process.cwd(), 'storage', 'laudos');
    console.log(`[DEBUG] Storage dir: ${storageDir}`);
    console.log(`[DEBUG] Storage exists: ${fs.existsSync(storageDir)}`);

    if (fs.existsSync(storageDir)) {
      const files = fs.readdirSync(storageDir);
      console.log(`[DEBUG] Arquivos em storage:`, files);
    }

    for (const name of candidateNames) {
      const p = path.join(process.cwd(), 'storage', 'laudos', name);
      console.log(`[DEBUG] Tentando: ${p}, existe: ${fs.existsSync(p)}`);
      if (fs.existsSync(p)) {
        const buf = fs.readFileSync(p);
        const fileName = `laudo-${laudo.id}.pdf`;
        console.log(`[SUCCESS] Arquivo encontrado: ${p} (${buf.length} bytes)`);
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
        const fileName = `laudo-${laudo.id}.pdf`;
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

    // Attempt to serve from Backblaze if object exists in remote bucket
    try {
      const metaPath = path.join(
        process.cwd(),
        'storage',
        'laudos',
        `laudo-${laudo.id}.json`
      );
      try {
        const metaRaw = fs.readFileSync(metaPath, 'utf-8');
        const meta = JSON.parse(metaRaw);
        if (meta.arquivo_remoto?.key) {
          // If a public URL is available, redirect to it; otherwise generate presigned URL
          if (meta.arquivo_remoto.url) {
            return NextResponse.redirect(meta.arquivo_remoto.url);
          }
          const { getPresignedUrl } =
            await import('@/lib/storage/backblaze-client');
          const signed = await getPresignedUrl(meta.arquivo_remoto.key, 300);
          return NextResponse.redirect(signed);
        }
      } catch {
        // No metadata — attempt to discover the latest file for the lote
        const { findLatestLaudoForLote, getPresignedUrl } =
          await import('@/lib/storage/backblaze-client');
        const foundKey = await findLatestLaudoForLote(laudo.lote_id);
        if (foundKey) {
          const signed = await getPresignedUrl(foundKey, 300);
          return NextResponse.redirect(signed);
        }
      }
    } catch (err) {
      console.error('[WARN] Falha ao tentar servir laudo via Backblaze:', err);
    }

    console.warn(
      `[WARN] Arquivo do laudo ${laudoId} não encontrado em storage`
    );

    // REGRA DE NEGÓCIO CRÍTICA:
    // Apenas o EMISSOR pode gerar laudos. O RH/clínica apenas baixa laudos já emitidos.
    // Se o arquivo não existe, o emissor ainda não emitiu o laudo.

    return NextResponse.json(
      {
        error:
          'Arquivo do laudo não encontrado. O laudo deve ser emitido pelo emissor antes de poder ser baixado.',
        success: false,
        hint: 'Aguarde o emissor gerar e emitir o laudo.',
      },
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
