export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole, requireClinica, requireEntity } from '@/lib/session';
import { getPuppeteerInstance } from '@/lib/infrastructure/pdf/generators/pdf-generator';
import { gerarHTMLRelatorioIndividual } from '@/lib/templates/relatorio-individual-html';
import { grupos } from '@/lib/questoes';
import crypto from 'crypto';

// Exported helper to build grupos processados from respostas rows
export function buildGruposFromRespostas(
  respostasRows: Array<{ grupo: number; item: number | string; valor: number }>
) {
  const gruposMap = new Map<number, GrupoRelatorio>();

  const respostasFiltradas = respostasRows.filter((resposta: any) => {
    const v = Number(resposta.valor);
    if (!Number.isFinite(v) || v < 0 || v > 100) return false;

    const grupoDef = grupos.find((g) => g.id === resposta.grupo);
    if (!grupoDef) return false;
    const itemDef = grupoDef.itens.find((i) => i.id === String(resposta.item));
    if (!itemDef) return false;

    return true;
  });

  respostasFiltradas.forEach((resposta) => {
    if (!gruposMap.has(resposta.grupo)) {
      const grupoDef = grupos.find((g) => g.id === resposta.grupo);
      const grupoObj: GrupoRelatorio = {
        id: resposta.grupo,
        titulo: grupoDef?.titulo || `Grupo ${resposta.grupo}`,
        dominio: grupoDef?.dominio || `Domínio ${resposta.grupo}`,
        tipo: grupoDef?.tipo || 'positiva',
        valores: [],
        respostas: [],
      };
      gruposMap.set(resposta.grupo, grupoObj);
    }

    const grupoDef = grupos.find((g) => g.id === resposta.grupo);
    const itemDef = grupoDef?.itens.find((i) => i.id === String(resposta.item));
    const perguntaTexto = itemDef?.texto || `Pergunta ${resposta.item}`;

    const grupo = gruposMap.get(resposta.grupo)!;
    grupo.valores.push(Number(resposta.valor));
    grupo.respostas.push({
      item: String(resposta.item),
      valor: Number(resposta.valor),
      texto: perguntaTexto,
    });
  });

  // Calcular médias e classificações
  const gruposProcessados = Array.from(gruposMap.values()).map((grupo) => {
    const media =
      grupo.valores.reduce((sum, val) => sum + val, 0) / grupo.valores.length;
    const mediaStr = media.toFixed(1);

    let classificacao: 'verde' | 'amarelo' | 'vermelho';
    let corClassificacao: string;

    if (grupo.tipo === 'positiva') {
      if (media > 66) {
        classificacao = 'verde';
        corClassificacao = '#166534';
      } else if (media >= 33) {
        classificacao = 'amarelo';
        corClassificacao = '#854D0E';
      } else {
        classificacao = 'vermelho';
        corClassificacao = '#991B1B';
      }
    } else {
      if (media < 33) {
        classificacao = 'verde';
        corClassificacao = '#166534';
      } else if (media <= 66) {
        classificacao = 'amarelo';
        corClassificacao = '#854D0E';
      } else {
        classificacao = 'vermelho';
        corClassificacao = '#991B1B';
      }
    }

    return {
      id: grupo.id,
      titulo: grupo.titulo,
      dominio: grupo.dominio,
      media: mediaStr,
      classificacao,
      corClassificacao,
      respostas: grupo.respostas,
    };
  });

  return gruposProcessados;
}

interface GrupoRelatorio {
  id: number;
  titulo: string;
  dominio: string;
  tipo: 'positiva' | 'negativa';
  valores: number[];
  respostas: Array<{
    item: string;
    valor: number;
    texto: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Permitir RH e Gestor de Entidade
    const session = await requireRole(['rh', 'gestor_entidade']);

    const searchParams = request.nextUrl.searchParams;
    const loteIdParam = params.id;
    const cpfFilter = searchParams.get('cpf');

    if (!loteIdParam || !cpfFilter) {
      return NextResponse.json(
        { error: 'Parâmetros lote_id e cpf são obrigatórios' },
        { status: 400 }
      );
    }

    const loteId = parseInt(loteIdParam);
    if (isNaN(loteId)) {
      return NextResponse.json(
        { error: 'ID do lote inválido' },
        { status: 400 }
      );
    }

    // Verificar acesso: RH -> requireClinica (usa clinica_id); gestor_entidade -> requireEntity (usa contratante_id)
    let ownershipField: 'clinica' | 'contratante';
    let ownerId: number;

    if (session.perfil === 'rh') {
      const clinicaSession = await requireClinica();
      ownershipField = 'clinica';
      ownerId = clinicaSession.clinica_id;
    } else {
      const entitySession = await requireEntity();
      ownershipField = 'contratante';
      ownerId = entitySession.contratante_id;
    }

    // Buscar dados da avaliação garantindo ownership
    const avaliacaoQuery = `
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
        la.titulo as lote_titulo,
        la.clinica_id as lote_clinica_id,
        la.contratante_id as lote_contratante_id
      FROM avaliacoes a
      JOIN funcionarios f ON a.funcionario_cpf = f.cpf
      LEFT JOIN empresas_clientes ec ON f.empresa_id = ec.id
      JOIN lotes_avaliacao la ON a.lote_id = la.id
      WHERE a.lote_id = $1
        AND a.funcionario_cpf = $2
        AND a.status = 'concluida'
        AND (
          ${ownershipField === 'clinica' ? '(f.clinica_id = $3 OR la.clinica_id = $3)' : '(f.contratante_id = $3 OR la.contratante_id = $3)'}
        )
    `;

    const avaliacaoResult = await query(avaliacaoQuery, [
      loteId,
      cpfFilter,
      ownerId,
    ]);

    console.debug(
      `[DEBUG] relatorio-individual: loteId=${loteId} cpf=${cpfFilter} owner=${ownershipField}:${ownerId} rows=${avaliacaoResult.rows.length}`
    );

    if (avaliacaoResult.rows.length === 0) {
      // Logs adicionais para diagnóstico
      try {
        const loteInfo = await query(
          `SELECT id, codigo, clinica_id, contratante_id FROM lotes_avaliacao WHERE id = $1`,
          [loteId]
        );
        const funcInfo = await query(
          `SELECT cpf, nome, contratante_id, clinica_id, empresa_id FROM funcionarios WHERE cpf = $1`,
          [cpfFilter]
        );
        const avaliacoesCheck = await query(
          `SELECT id, status, envio, inativada_em FROM avaliacoes WHERE lote_id = $1 AND funcionario_cpf = $2`,
          [loteId, cpfFilter]
        );

        console.warn(
          `[WARN] relatorio-individual: Avaliação não encontrada (lote=${loteId}, cpf=${cpfFilter}, owner=${ownershipField}:${ownerId})`
        );
        console.warn(
          `[WARN] relatorio-individual: loteInfo=${JSON.stringify(loteInfo.rows)}`
        );
        console.warn(
          `[WARN] relatorio-individual: funcionarioInfo=${JSON.stringify(funcInfo.rows)}`
        );
        console.warn(
          `[WARN] relatorio-individual: avaliacoesFound=${JSON.stringify(avaliacoesCheck.rows)}`
        );
      } catch (diagErr) {
        console.error(
          '[ERROR] relatorio-individual: erro durante diagnóstico adicional:',
          diagErr
        );
      }

      return NextResponse.json(
        { error: 'Avaliação não encontrada ou não concluída' },
        { status: 404 }
      );
    }

    const avaliacao = avaliacaoResult.rows[0] as Record<string, any>;

    // Buscar respostas
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

    // Agrupar respostas por grupo (filtrando respostas inválidas/legacy)
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

    // Gerar PDF com Puppeteer (garantir fechamento do browser em finally)
    let browser: any = null;
    let pdfBuffer: Buffer;

    try {
      const puppeteer = await getPuppeteerInstance();
      browser = await puppeteer.launch({
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
      await (page as any).setContent(html, { waitUntil: 'networkidle0' });

      pdfBuffer = await (page as any).pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '15mm', right: '12mm', bottom: '15mm', left: '12mm' },
      });
    } finally {
      if (browser) {
        try {
          await browser.close();
        } catch (err) {
          console.error('Erro ao fechar browser Puppeteer:', err);
        }
      }
    }

    // Persistir PDF no laudos (relatorio_individual) e gravar hash
    try {
      const hash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

      const updateResult = await query(
        `UPDATE laudos SET relatorio_individual = $1, hash_relatorio_individual = $2, atualizado_em = NOW() WHERE lote_id = $3 RETURNING id`,
        [pdfBuffer, hash, loteId]
      );

      if (updateResult.rowCount === 0) {
        await query(
          `INSERT INTO laudos (id, lote_id, emissor_cpf, status, relatorio_individual, hash_relatorio_individual, criado_em) VALUES ($1, $1, $2, 'rascunho', $3, $4, NOW())`,
          [loteId, session.cpf, pdfBuffer, hash]
        );
      }
    } catch (err: any) {
      // Detectar coluna inexistente (código 42703) e registrar instrução clara para desenvolvedores
      if (
        err &&
        (err.code === '42703' || err.message?.includes('relatorio_individual'))
      ) {
        console.error(
          'Erro ao salvar relatorio individual em laudos: coluna ausente (relatorio_individual). Verifique se as migrations foram aplicadas. Para corrigir localmente execute: pnpm db:migrate (ou node scripts/fix-missing-laudo-columns.js)'
        );
      } else {
        console.error('Erro ao salvar relatorio individual em laudos:', err);
      }
      // Não falhar a geração do PDF em caso de problema ao persistir - o PDF ainda será retornado ao usuário
    }

    // Retornar PDF
    const nomeArquivo = `relatorio-individual-${avaliacao.nome.replace(/\s+/g, '-')}-${avaliacao.lote_codigo}.pdf`;

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${nomeArquivo}"`,
      },
    });
  } catch (error) {
    console.error(
      'Erro ao gerar PDF do relatório individual (entidade):',
      error
    );

    const message = error instanceof Error ? error.message : String(error);

    // Erros relacionados ao Chromium normalmente indicam configuração/deploy incorreto
    if (
      message.includes('brotli') ||
      message.includes('@sparticuz') ||
      message.includes('Chromium não disponível') ||
      message.includes('CHROME_MISSING') ||
      message.includes('Could not find Chrome') ||
      message.includes('Could not find Chromium')
    ) {
      return NextResponse.json(
        {
          error: 'Serviço de geração de PDF temporariamente indisponível',
          details: message,
          hint:
            "Verifique se '@sparticuz/chromium' foi instalado durante o deploy (postinstall) ou execute a instalação do Chromium para Puppeteer durante o build (ex.: usar script 'vercel-build' que chama 'node scripts/install-puppeteer-chrome.js'). Alternativamente, defina SPARTICUZ_CHROMIUM_BIN ou PUPPETEER_EXECUTABLE_PATH apontando para o binário.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: 'Erro ao gerar PDF do relatório individual',
        details: message,
      },
      { status: 500 }
    );
  }
}
