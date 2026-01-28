/**
 * API para gerar PDF de relatório de lote (todas avaliações)
 * Logo na primeira página + contador em todas as páginas
 */

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
// requireRole not needed here; use requireClinica when mapping clinica
// import { requireRole } from '@/lib/session';
import { getPuppeteerInstance } from '@/lib/infrastructure/pdf/generators/pdf-generator';
import { gerarHTMLRelatorioLote } from '@/lib/templates/relatorio-lote-html';
import {
  getPDFHeaderTemplate,
  getPDFFooterTemplate,
} from '@/lib/pdf/puppeteer-templates';
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const loteId = searchParams.get('lote_id');

    if (!loteId) {
      return NextResponse.json(
        { error: 'Parâmetro lote_id é obrigatório' },
        { status: 400 }
      );
    }

    // CORREÇÃO: Usar requireClinica para garantir mapeamento de clinica_id
    const { requireClinica } = await import('@/lib/session');
    const session = await requireClinica();
    const clinicaId = session.clinica_id;

    // Buscar informações do lote
    const loteResult = await query(
      `
      SELECT 
        la.codigo,
        la.titulo,
        ec.nome as empresa_nome
      FROM lotes_avaliacao la
      JOIN empresas_clientes ec ON la.empresa_id = ec.id
      WHERE la.id = $1
        AND ec.clinica_id = $2
    `,
      [loteId, clinicaId]
    );

    if (loteResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Lote não encontrado' },
        { status: 404 }
      );
    }

    const lote = loteResult.rows[0] as Record<string, any>;

    // Buscar todas as avaliações concluídas do lote
    const avaliacoesResult = await query(
      `
      SELECT 
        a.id,
        a.envio,
        f.cpf,
        f.nome,
        f.setor,
        f.funcao,
        f.matricula
      FROM avaliacoes a
      JOIN funcionarios f ON a.funcionario_cpf = f.cpf
      WHERE a.lote_id = $1
        AND a.status = 'concluida'
        AND f.clinica_id = $2
      ORDER BY f.nome
    `,
      [loteId, clinicaId]
    );

    if (avaliacoesResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma avaliação concluída encontrada neste lote' },
        { status: 404 }
      );
    }

    // Para cada avaliação, buscar médias dos grupos
    const funcionarios = [];

    for (const avaliacao of avaliacoesResult.rows) {
      // Buscar médias por grupo
      const gruposResult = await query(
        `
        SELECT 
          r.grupo,
          AVG(r.valor) as media
        FROM respostas r
        WHERE r.avaliacao_id = $1
        GROUP BY r.grupo
        ORDER BY r.grupo
      `,
        [avaliacao.id]
      );

      const grupos = gruposResult.rows.map((grupo: any) => {
        const media = parseFloat(grupo.media);
        const mediaStr = media.toFixed(1);

        // Determinar classificação
        let classificacao: 'verde' | 'amarelo' | 'vermelho';

        if (grupo.grupo_tipo === 'positiva') {
          if (media > 66) classificacao = 'verde';
          else if (media >= 33) classificacao = 'amarelo';
          else classificacao = 'vermelho';
        } else {
          if (media < 33) classificacao = 'verde';
          else if (media <= 66) classificacao = 'amarelo';
          else classificacao = 'vermelho';
        }

        return {
          id: grupo.grupo,
          titulo: grupo.grupo_titulo,
          dominio: grupo.grupo_dominio,
          media: mediaStr,
          classificacao,
        };
      });

      funcionarios.push({
        nome: avaliacao.nome,
        cpf: avaliacao.cpf,
        perfil: 'funcionario',
        setor: avaliacao.setor,
        funcao: avaliacao.funcao,
        matricula: avaliacao.matricula,
        envio: avaliacao.envio,
        grupos,
      });
    }

    // Preparar dados para o template
    const dadosRelatorio = {
      lote: {
        codigo: lote.codigo,
        titulo: lote.titulo,
      },
      empresa: lote.empresa_nome,
      totalFuncionarios: funcionarios.length,
      funcionarios,
    };

    // Gerar HTML
    const html = gerarHTMLRelatorioLote(dadosRelatorio);

    // Gerar PDF com Puppeteer (usa @sparticuz/chromium em serverless)
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
      displayHeaderFooter: true,
      headerTemplate: getPDFHeaderTemplate(
        `Lote ${lote.codigo} - ${lote.empresa_nome}`
      ),
      footerTemplate: getPDFFooterTemplate(),
      margin: {
        top: '50mm',
        right: '15mm',
        bottom: '25mm',
        left: '15mm',
      },
    });

    await browser.close();

    // Retornar PDF
    const nomeArquivo = `relatorio-lote-${lote.codigo}.pdf`;

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${nomeArquivo}"`,
      },
    });
  } catch (error) {
    console.error('Erro ao gerar PDF do relatório de lote:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar PDF do relatório de lote' },
      { status: 500 }
    );
  }
}
