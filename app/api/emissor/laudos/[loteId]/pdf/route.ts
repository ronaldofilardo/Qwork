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
      action, resource, resource_id, user_cpf, user_perfil, created_at, new_data
    )
    VALUES (
      'acesso_emissor_lote', 'lotes_avaliacao', $1, $2, $3, NOW(), $4
    )
    `,
    [
      loteId.toString(),
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
  // APENAS EMISSOR pode gerar laudos
  const user = await requireRole('emissor');
  if (!user) {
    return NextResponse.json(
      {
        error: 'Acesso negado. Apenas emissores podem gerar laudos.',
        success: false,
      },
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

    // Validar acesso ao lote
    try {
      await validarAcessoLote(loteId, user.cpf, user.perfil);
    } catch (error) {
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : 'Lote não encontrado',
          success: false,
        },
        { status: 404 }
      );
    }

    // Buscar laudo emitido por ESTE emissor
    const laudoCheck = await query(
      `
      SELECT id, status, emissor_cpf FROM laudos
      WHERE lote_id = $1 AND emissor_cpf = $2 AND status IN ('emitido','enviado')
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

    const laudo = laudoCheck.rows[0];

    // VERIFICAR SE O LAUDO JÁ FOI GERADO (IMUTABILIDADE)
    // Uma vez gerado o PDF, não pode ser regenerado para garantir integridade
    const fs = await import('fs');
    const path = await import('path');

    const storageDir = path.join(process.cwd(), 'storage', 'laudos');
    const fileName = `laudo-${laudo.id}.pdf`;
    const filePath = path.join(storageDir, fileName);

    if (fs.existsSync(filePath)) {
      console.log(
        `[IMUTABILIDADE] Laudo ${laudo.id} já foi gerado. Bloqueando regeneração.`
      );

      // Retornar o PDF existente em vez de gerar novamente
      const pdfBuffer = fs.readFileSync(filePath);
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'X-Laudo-Status': 'existente',
          'X-Laudo-Imutavel': 'true',
        },
      });
    }

    console.log(
      `[GERACAO] Iniciando geração do laudo ${laudo.id} (primeira vez)`
    );

    // Gerar dados completos do laudo
    const dadosGeraisEmpresa = await gerarDadosGeraisEmpresa(loteId);
    const scoresPorGrupo = await calcularScoresPorGrupo(loteId);
    const interpretacaoRecomendacoes = gerarInterpretacaoRecomendacoes(
      dadosGeraisEmpresa.empresaAvaliada,
      scoresPorGrupo
    );

    // Buscar observações do laudo deste emissor
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

    // PERSISTIR O PDF EM STORAGE PARA QUE O RH POSSA BAIXAR O MESMO ARQUIVO
    // (fs, path, storageDir, fileName, filePath já foram declarados acima)
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    fs.writeFileSync(filePath, Buffer.from(pdfBuffer));

    // Salvar metadata para facilitar buscas futuras
    const metaFileName = `laudo-${laudo.id}.json`;
    const metaFilePath = path.join(storageDir, metaFileName);
    const metadata = {
      laudo_id: laudo.id,
      lote_id: loteId,
      emissor_cpf: laudo.emissor_cpf,
      gerado_em: new Date().toISOString(),
      gerado_por_cpf: user.cpf,
      arquivo_local: fileName,
      tamanho_bytes: pdfBuffer.byteLength,
    };
    fs.writeFileSync(metaFilePath, JSON.stringify(metadata, null, 2));

    console.log(
      `[PERSISTIDO] PDF salvo: ${filePath} (${pdfBuffer.byteLength} bytes)`
    );

    // Nota: Não atualizamos atualizado_em pois laudos emitidos são imutáveis
    // O PDF é gerado on-demand sem modificar o registro do laudo

    console.log(`PDF gerado e persistido: ${fileName}`);

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
