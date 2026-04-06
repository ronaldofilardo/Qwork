/**
 * POST /api/rh/logo
 * Upload de logo da clínica (base64 no banco)
 * Auth: perfil RH
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { ClinicaConfiguracaoService } from '@/lib/clinica-configuracao-service';
import {
  assertAuth,
  assertRoles,
  ROLES,
  isApiError,
} from '@/lib/authorization/policies';

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
    const session = getSession();
    assertAuth(session);
    assertRoles(session, [ROLES.RH]);

    if (!session.clinica_id) {
      return NextResponse.json(
        { error: 'Clínica não identificada' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { logo_base64, mime_type } = body as {
      logo_base64?: string;
      mime_type?: string;
    };

    // Se enviou vazio/null, está removendo o logo
    if (!logo_base64) {
      await ClinicaConfiguracaoService.salvar(
        session.clinica_id,
        { logo_url: '' },
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

    await ClinicaConfiguracaoService.salvar(
      session.clinica_id,
      { logo_url: dataUri },
      session.cpf
    );

    return NextResponse.json({ success: true, logo_url: dataUri });
  } catch (erro: unknown) {
    if (isApiError(erro)) {
      return NextResponse.json(
        { error: erro.message, code: erro.code },
        { status: erro.status }
      );
    }
    console.error('[API RH Logo] Erro:', erro);
    return NextResponse.json({ error: 'Erro ao salvar logo' }, { status: 500 });
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    const session = getSession();
    assertAuth(session);
    assertRoles(session, [ROLES.RH]);

    if (!session.clinica_id) {
      return NextResponse.json(
        { error: 'Clínica não identificada' },
        { status: 403 }
      );
    }

    const config = await ClinicaConfiguracaoService.buscarPorClinica(
      session.clinica_id
    );
    return NextResponse.json({ logo_url: config?.logo_url || null });
  } catch (erro: unknown) {
    if (isApiError(erro)) {
      return NextResponse.json(
        { error: erro.message, code: erro.code },
        { status: erro.status }
      );
    }
    console.error('[API RH Logo GET] Erro:', erro);
    return NextResponse.json({ error: 'Erro ao buscar logo' }, { status: 500 });
  }
}
