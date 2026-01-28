import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getPuppeteerInstance } from '@/lib/infrastructure/pdf/generators/pdf-generator';
import {
  gerarDadosGeraisEmpresa,
  calcularScoresPorGrupo,
  gerarInterpretacaoRecomendacoes,
  gerarObservacoesConclusao,
} from '@/lib/laudo-calculos';
import {
  gerarHTMLLaudoCompleto,
  LaudoDadosCompletos,
} from '@/lib/templates/laudo-html';

export const dynamic = 'force-dynamic';

// Helper para validar e auditar acesso a lote
async function validarAcessoLote(
  loteId: number,
  userCpf: string,
  userRole: string
) {
  const loteCheck = await query(
    `
    SELECT la.id, la.empresa_id, la.status, ec.clinica_id
    FROM lotes_avaliacao la
    LEFT JOIN empresas_clientes ec ON ec.id = la.empresa_id
    WHERE la.id = $1
    `,
    [loteId]
  );

  if (loteCheck.rows.length === 0) {
    throw new Error('Lote não encontrado');
  }

  const lote = loteCheck.rows[0];

  // Auditar acesso
  await query(
    `
    INSERT INTO audit_logs (
      acao, entidade, entidade_id, user_id, user_role, criado_em, dados
    )
    VALUES (
      'acesso_emissor_lote', 'lotes_avaliacao', $1, $2, $3, NOW(), $4
    )
    `,
    [
      loteId,
      userCpf,
      userRole,
      JSON.stringify({
        empresa_id: lote.empresa_id,
        clinica_id: lote.clinica_id,
        status: lote.status,
      }),
    ]
  );

  return lote;
}

/**
 * Criar laudo padronizado para o template centralizado
 */
function criarLaudoPadronizado(
  dadosGeraisEmpresa: any,
  scoresPorGrupo: any[],
  interpretacaoRecomendacoes: any,
  observacoesConclusao: any
): LaudoDadosCompletos {
  return {
    etapa1: dadosGeraisEmpresa,
    etapa2: scoresPorGrupo,
    etapa3: interpretacaoRecomendacoes,
    etapa4: observacoesConclusao,
  };
}

export const GET = async (
  req: Request,
  { params }: { params: { loteId: string } }
) => {
  const user = await requireRole('emissor');
  if (!user) {
    return NextResponse.json(
      { error: 'Acesso negado', success: false },
      { status: 403 }
    );
  }

  try {
    const loteId = parseInt(params.loteId);
    if (isNaN(loteId)) {
      return NextResponse.json(
        { error: 'ID do lote inválido', success: false },
        { status: 400 }
      );
    }

    // Validar acesso ao lote e auditar (emissor é global, mas lote deve existir)
    try {
      const _lote = await validarAcessoLote(loteId, user.cpf, user.perfil);
    } catch (error) {
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : 'Lote não encontrado',
          success: false,
        },
        { status: 404 }
      );
    }

    // Verificar se há laudo emitido para este lote
    const laudoCheck = await query(
      `
      SELECT id, status FROM laudos
      WHERE lote_id = $1 AND emissor_cpf = $2 AND status = 'emitido'
    `,
      [loteId, user.cpf]
    );

    if (laudoCheck.rows.length === 0) {
      return NextResponse.json(
        {
          error:
            'Laudo não encontrado ou não está emitido. Emita o laudo antes de gerar o PDF.',
          success: false,
        },
        { status: 400 }
      );
    }

    // Gerar dados completos do laudo
    const dadosGeraisEmpresa = await gerarDadosGeraisEmpresa(loteId);
    const scoresPorGrupo = await calcularScoresPorGrupo(loteId);
    const interpretacaoRecomendacoes = gerarInterpretacaoRecomendacoes(
      dadosGeraisEmpresa.empresaAvaliada,
      scoresPorGrupo
    );

    // Buscar observações do laudo
    const laudoResult = await query(
      `
      SELECT observacoes FROM laudos
      WHERE lote_id = $1 AND emissor_cpf = $2
    `,
      [loteId, user.cpf]
    );

    const observacoes = laudoResult.rows[0]?.observacoes || '';
    const observacoesConclusao = gerarObservacoesConclusao(observacoes);

    const laudoPadronizado = criarLaudoPadronizado(
      dadosGeraisEmpresa,
      scoresPorGrupo,
      interpretacaoRecomendacoes,
      observacoesConclusao
    );

    // Gerar HTML do laudo usando o template centralizado
    const html = gerarHTMLLaudoCompleto(laudoPadronizado);

    // Gerar PDF
    const puppeteer = await getPuppeteerInstance();
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
      ],
    });

    const page = await (browser as any).newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
    });

    await browser.close();

    // Gerar nome do arquivo
    const fileName = `laudo-${loteId}-${Date.now()}.pdf`;

    // Atualizar laudo com timestamp
    await query(
      `
      UPDATE laudos
      SET atualizado_em = NOW()
      WHERE lote_id = $1 AND emissor_cpf = $2
    `,
      [loteId, user.cpf]
    );

    console.log(`PDF gerado: ${fileName}`);

    // Retornar PDF para download
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Erro ao gerar PDF do laudo:', error);

    // Tratamento específico de erros comuns
    let errorMessage = 'Erro interno do servidor';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('Browser has disconnected')) {
        errorMessage = 'Erro na geração do PDF: navegador desconectado';
        statusCode = 503;
      } else if (error.message.includes('Page crashed')) {
        errorMessage = 'Erro na geração do PDF: página travou';
        statusCode = 503;
      } else if (error.message.includes('Timeout')) {
        errorMessage = 'Erro na geração do PDF: tempo limite excedido';
        statusCode = 504;
      } else {
        errorMessage = `Erro na geração do PDF: ${error.message}`;
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        success: false,
        detalhes: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: statusCode }
    );
  }
};
