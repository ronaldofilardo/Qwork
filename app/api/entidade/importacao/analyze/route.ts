import { NextResponse } from 'next/server';
import { requireEntity } from '@/lib/session';
import { parseSpreadsheetHeaders } from '@/lib/importacao/dynamic-parser';
import {
  sugerirMapeamento,
  getCamposQWorkEntidade,
  getCamposObrigatoriosEntidade,
} from '@/lib/importacao/column-matcher';

export const dynamic = 'force-dynamic';

/**
 * POST /api/entidade/importacao/analyze
 * Recebe arquivo Excel/CSV, lê cabeçalhos + preview e sugere mapeamento.
 * Versão para Entidade — sem campos de empresa/CNPJ.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    await requireEntity();

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: 'Content-Type deve ser multipart/form-data' },
        { status: 400 }
      );
    }
    const file = formData.get('file');

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: 'Arquivo não enviado' },
        { status: 400 }
      );
    }

    // Validar extensão
    const name = file.name.toLowerCase();
    if (
      !name.endsWith('.xlsx') &&
      !name.endsWith('.xls') &&
      !name.endsWith('.csv')
    ) {
      return NextResponse.json(
        { error: 'Apenas arquivos .xlsx, .xls ou .csv são permitidos' },
        { status: 400 }
      );
    }

    // Limite de 10 MB
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo não pode exceder 10 MB' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Análise de cabeçalhos + preview
    const analysis = parseSpreadsheetHeaders(buffer);
    if (!analysis.success) {
      return NextResponse.json(
        { error: analysis.error ?? 'Erro ao analisar arquivo' },
        { status: 400 }
      );
    }

    // Gerar sugestões de mapeamento (filtra campos de empresa automaticamente)
    const sugestoes = sugerirMapeamento(analysis.colunas);

    // Usar campos e obrigatórios da versão Entidade (sem cnpj_empresa / nome_empresa)
    const obrigatorios = getCamposObrigatoriosEntidade();
    const sugeridos = sugestoes
      .filter((s) => s.sugestaoQWork !== null)
      .map((s) => s.sugestaoQWork!);
    const obrigatoriosFaltando = obrigatorios.filter(
      (o) => !sugeridos.includes(o)
    );

    return NextResponse.json({
      success: true,
      data: {
        totalLinhas: analysis.totalLinhas,
        colunasDetectadas: sugestoes,
        camposQWork: getCamposQWorkEntidade(),
        camposObrigatorios: obrigatorios,
        camposObrigatoriosFaltando: obrigatoriosFaltando,
      },
    });
  } catch (error: unknown) {
    console.error('[entidade/importacao/analyze] Erro:', error);

    if (error instanceof Error) {
      if (
        error.message.includes('Entidade não encontrada') ||
        error.message.includes('Acesso restrito') ||
        error.message.includes('Entidade inativa')
      ) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      if (
        error.message.includes('Não autenticado') ||
        error.message.includes('não é gestor')
      ) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
