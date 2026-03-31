/**
 * POST /api/entidade/logo
 * Upload de logo da entidade (base64 no banco)
 * Auth: perfil gestor (entidade)
 */

import { NextResponse } from 'next/server';
import { requireEntity } from '@/lib/session';
import { EntidadeConfiguracaoService } from '@/lib/entidade-configuracao-service';

export const dynamic = 'force-dynamic';

const MAX_DECODED_SIZE = 256 * 1024; // 256 KB
const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
];

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await requireEntity();

    const body = await request.json();
    const { logo_base64, mime_type } = body as {
      logo_base64?: string;
      mime_type?: string;
    };

    // Se enviou vazio/null, está removendo o logo
    if (!logo_base64) {
      await EntidadeConfiguracaoService.removerLogo(
        session.entidade_id,
        session.cpf
      );
      return NextResponse.json({ success: true, logo_url: null });
    }

    // Validar MIME type
    if (!mime_type || !ALLOWED_MIME_TYPES.includes(mime_type)) {
      return NextResponse.json(
        {
          error: `Formato não suportado. Use: PNG, JPG, WEBP ou SVG.`,
        },
        { status: 400 }
      );
    }

    // Extrair base64 puro (remover prefixo data:... se presente)
    let rawBase64 = logo_base64;
    if (rawBase64.startsWith('data:')) {
      const commaIdx = rawBase64.indexOf(',');
      if (commaIdx > -1) {
        rawBase64 = rawBase64.substring(commaIdx + 1);
      }
    }

    // Validar que é base64 válido
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(rawBase64)) {
      return NextResponse.json(
        { error: 'Dados da imagem inválidos' },
        { status: 400 }
      );
    }

    // Calcular tamanho decodificado
    const decodedSize = Math.floor((rawBase64.length * 3) / 4);
    if (decodedSize > MAX_DECODED_SIZE) {
      return NextResponse.json(
        {
          error: `Imagem muito grande (${Math.round(decodedSize / 1024)} KB). Máximo permitido: 256 KB.`,
        },
        { status: 400 }
      );
    }

    // Montar data URI completa
    const dataUri = `data:${mime_type};base64,${rawBase64}`;

    await EntidadeConfiguracaoService.salvar(
      session.entidade_id,
      { logo_url: dataUri },
      session.cpf
    );

    return NextResponse.json({ success: true, logo_url: dataUri });
  } catch (erro: unknown) {
    const msg = erro instanceof Error ? erro.message : String(erro);
    console.error('[API Entidade Logo] Erro:', erro);
    return NextResponse.json(
      { error: msg || 'Erro ao salvar logo' },
      {
        status:
          msg.includes('Acesso restrito') || msg.includes('não identificada')
            ? 403
            : 500,
      }
    );
  }
}
