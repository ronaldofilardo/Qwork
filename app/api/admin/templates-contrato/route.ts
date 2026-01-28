/**
 * API: GET /api/admin/templates-contrato
 * Listar templates de contratos
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { TemplateContratoService } from '@/lib/template-contrato-service';

export async function GET(request: Request) {
  try {
    const session = getSession();
    if (!session || session.perfil !== 'admin') {
      return NextResponse.json({ erro: 'Acesso negado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo') as any;
    const apenasAtivos = searchParams.get('ativos') !== 'false';

    const templates = await TemplateContratoService.listar(tipo, apenasAtivos);

    return NextResponse.json(templates);
  } catch (erro) {
    console.error('[API Templates] Erro ao listar:', erro);
    return NextResponse.json(
      { erro: 'Erro ao buscar templates' },
      { status: 500 }
    );
  }
}

/**
 * POST: Criar novo template
 */
export async function POST(request: Request) {
  try {
    const session = getSession();
    if (!session || !session.cpf || session.perfil !== 'admin') {
      return NextResponse.json({ erro: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();

    if (!body.nome || !body.tipo_template || !body.conteudo) {
      return NextResponse.json(
        { erro: 'Campos obrigatórios: nome, tipo_template, conteudo' },
        { status: 400 }
      );
    }

    const template = await TemplateContratoService.criar(body, session.cpf);

    return NextResponse.json(template, { status: 201 });
  } catch (erro: any) {
    console.error('[API Templates] Erro ao criar:', erro);
    return NextResponse.json(
      { erro: erro.message || 'Erro ao criar template' },
      { status: 500 }
    );
  }
}
