/**
 * API: GET/PUT /api/clinica/configuracoes
 * Gerenciar configurações customizáveis da clínica
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

/**
 * GET: Buscar configurações da clínica
 */
export async function GET() {
  try {
    const session = getSession();
    assertAuth(session);
    if (!session.clinica_id) {
      return NextResponse.json(
        { erro: 'Clínica não identificada' },
        { status: 403 }
      );
    }

    const config = await ClinicaConfiguracaoService.buscarPorClinica(
      session.clinica_id
    );

    if (!config) {
      // Retornar configuração padrão
      return NextResponse.json({
        clinica_id: session.clinica_id,
        campos_customizados: {},
        incluir_logo_relatorios: true,
        formato_data_preferencial: 'dd/MM/yyyy',
        cor_primaria: '#FF6B00',
        cor_secundaria: '#0066CC',
      });
    }

    return NextResponse.json(config);
  } catch (erro) {
    if (isApiError(erro)) {
      return NextResponse.json(
        { erro: erro.message, code: erro.code },
        { status: erro.status }
      );
    }
    console.error('[API Configuracoes] Erro ao buscar:', erro);
    return NextResponse.json(
      { erro: 'Erro ao buscar configurações' },
      { status: 500 }
    );
  }
}

/**
 * PUT: Atualizar configurações da clínica
 */
export async function PUT(request: Request) {
  try {
    const session = getSession();
    assertRoles(session, [ROLES.ADMIN, ROLES.RH]);
    if (!session.clinica_id) {
      return NextResponse.json(
        { erro: 'Clínica não identificada' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validar cores se fornecidas
    if (
      body.cor_primaria &&
      !ClinicaConfiguracaoService.validarCor(body.cor_primaria)
    ) {
      return NextResponse.json(
        { erro: 'Cor primária inválida (formato: #RRGGBB)' },
        { status: 400 }
      );
    }

    if (
      body.cor_secundaria &&
      !ClinicaConfiguracaoService.validarCor(body.cor_secundaria)
    ) {
      return NextResponse.json(
        { erro: 'Cor secundária inválida (formato: #RRGGBB)' },
        { status: 400 }
      );
    }

    const config = await ClinicaConfiguracaoService.salvar(
      session.clinica_id,
      body,
      session.cpf
    );

    return NextResponse.json(config);
  } catch (erro: any) {
    if (isApiError(erro)) {
      return NextResponse.json(
        { erro: erro.message, code: erro.code },
        { status: erro.status }
      );
    }
    console.error('[API Configuracoes] Erro ao atualizar:', erro);
    return NextResponse.json(
      { erro: erro.message || 'Erro ao atualizar configurações' },
      { status: 500 }
    );
  }
}
