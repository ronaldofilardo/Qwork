/**
 * API para gerar PDF de relatório individual
 * Usa Puppeteer (server-side) em vez de jsPDF (client-side)
 */

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import { getPuppeteerInstance } from '@/lib/infrastructure/pdf/generators/pdf-generator';
import { gerarHTMLRelatorioIndividual } from '@/lib/templates/relatorio-individual-html';

export async function GET(request: NextRequest) {
  try {
    await requireRole('rh');
    const searchParams = request.nextUrl.searchParams;
    const loteId = searchParams.get('lote_id');
    const cpfFilter = searchParams.get('cpf');

    if (!loteId || !cpfFilter) {
      return NextResponse.json(
        { error: 'Parâmetros lote_id e cpf são obrigatórios' },
        { status: 400 }
      );
    }

    // CORREÇÃO: Usar requireClinica para garantir mapeamento de clinica_id
    const { requireClinica } = await import('@/lib/session');
    const sessionComClinica = await requireClinica();
    const clinicaId = sessionComClinica.clinica_id;

    // Buscar dados da avaliação
    const avaliacaoResult = await query(
      `
      SELECT 
        a.id,
        a.envio,
        f.cpf,
        f.nome,
        f.nivel_cargo,
        f.setor,
        f.funcao,
        f.matricula,
        ec.nome as empresa_nome,
        la.codigo as lote_codigo,
        la.titulo as lote_titulo
      FROM avaliacoes a
      JOIN funcionarios f ON a.funcionario_cpf = f.cpf
      JOIN empresas_clientes ec ON f.empresa_id = ec.id
      JOIN lotes_avaliacao la ON a.lote_id = la.id
      WHERE a.lote_id = $1
        AND a.funcionario_cpf = $2
        AND a.status = 'concluida'
        AND f.clinica_id = $3
    `,
      [loteId, cpfFilter, clinicaId]
    );

    if (avaliacaoResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Avaliação não encontrada ou não concluída' },
        { status: 404 }
      );
    }

    const avaliacao = avaliacaoResult.rows[0] as Record<string, any>;

    // Buscar respostas e calcular médias por grupo
    const respostasResult = await query(
      `
      SELECT 
        r.grupo,
        r.item,
        r.valor
      FROM respostas r
      WHERE r.avaliacao_id = $1
      ORDER BY r.grupo, r.item
    `,
      [avaliacao.id]
    );

    // Construir grupos processados a partir das respostas (filtrando respostas inválidas/legacy)
    const { buildGruposFromRespostas } =
      await import('@/app/api/entidade/lote/[id]/relatorio-individual/route');
    const gruposProcessados = buildGruposFromRespostas(respostasResult.rows);

    // Preparar dados para o template
    const dadosRelatorio = {
      funcionario: {
        nome: avaliacao.nome,
        cpf: avaliacao.cpf,
        perfil: avaliacao.nivel_cargo || 'operacional',
        empresa: avaliacao.empresa_nome,
        setor: avaliacao.setor,
        funcao: avaliacao.funcao,
        matricula: avaliacao.matricula,
      },
      lote: {
        id: loteId,
        codigo: avaliacao.lote_codigo,
        titulo: avaliacao.lote_titulo,
      },
      envio: avaliacao.envio,
      grupos: gruposProcessados.sort((a, b) => a.id - b.id),
    };

    // Gerar HTML
    const html = gerarHTMLRelatorioIndividual(dadosRelatorio);

    // Gerar PDF com Puppeteer
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
        top: '15mm',
        right: '12mm',
        bottom: '15mm',
        left: '12mm',
      },
    });

    await browser.close();

    // Retornar PDF
    const nomeArquivo = `relatorio-individual-${avaliacao.nome.replace(
      /\s+/g,
      '-'
    )}-${avaliacao.lote_codigo}.pdf`;

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${nomeArquivo}"`,
      },
    });
  } catch (error) {
    console.error('Erro ao gerar PDF do relatório individual:', error);
    console.error(
      'Stack trace:',
      error instanceof Error ? error.stack : 'No stack trace'
    );
    return NextResponse.json(
      {
        error: 'Erro ao gerar PDF do relatório individual',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
