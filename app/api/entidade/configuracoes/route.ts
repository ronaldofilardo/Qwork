/**
 * API: GET/PUT /api/entidade/configuracoes
 * Gerenciar configurações de branding da entidade (logo, cores)
 */

import { NextResponse } from 'next/server';
import { requireEntity } from '@/lib/session';
import { EntidadeConfiguracaoService } from '@/lib/entidade-configuracao-service';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    const session = await requireEntity();

    const config = await EntidadeConfiguracaoService.buscarPorEntidade(
      session.entidade_id
    );

    if (!config) {
      return NextResponse.json({
        entidade_id: session.entidade_id,
        logo_url: null,
        cor_primaria: '#FF6B00',
        cor_secundaria: '#0066CC',
      });
    }

    return NextResponse.json(config);
  } catch (erro: unknown) {
    const msg = erro instanceof Error ? erro.message : String(erro);
    console.error('[API EntidadeConfiguracoes] Erro ao buscar:', erro);
    return NextResponse.json(
      { error: msg || 'Erro ao buscar configurações' },
      {
        status:
          msg.includes('Acesso restrito') || msg.includes('não identificada')
            ? 403
            : 500,
      }
    );
  }
}

export async function PUT(request: Request): Promise<NextResponse> {
  try {
    const session = await requireEntity();
    const body = await request.json();

    if (
      body.cor_primaria &&
      !EntidadeConfiguracaoService.validarCor(body.cor_primaria)
    ) {
      return NextResponse.json(
        { error: 'Cor primária inválida (formato: #RRGGBB)' },
        { status: 400 }
      );
    }

    if (
      body.cor_secundaria &&
      !EntidadeConfiguracaoService.validarCor(body.cor_secundaria)
    ) {
      return NextResponse.json(
        { error: 'Cor secundária inválida (formato: #RRGGBB)' },
        { status: 400 }
      );
    }

    const config = await EntidadeConfiguracaoService.salvar(
      session.entidade_id,
      body,
      session.cpf
    );

    return NextResponse.json(config);
  } catch (erro: unknown) {
    const msg = erro instanceof Error ? erro.message : String(erro);
    console.error('[API EntidadeConfiguracoes] Erro ao atualizar:', erro);
    return NextResponse.json(
      { error: msg || 'Erro ao atualizar configurações' },
      {
        status:
          msg.includes('Acesso restrito') || msg.includes('não identificada')
            ? 403
            : 500,
      }
    );
  }
}
