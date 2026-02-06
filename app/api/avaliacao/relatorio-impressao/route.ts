import { NextResponse, NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import { grupos, getTextoQuestao, escalasResposta } from '@/lib/questoes';
import { getPuppeteerInstance } from '@/lib/infrastructure/pdf/generators/pdf-generator';

export const dynamic = 'force-dynamic';

// Função para gerar HTML do relatório
function gerarHTMLRelatorio(dados: any): string {
  const { empresa, data: _data, avaliacoes } = dados;

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Relatório de Avaliação COPSOQ - ${empresa}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.1;
          color: #333;
          background-color: #fff;
          padding: 4px;
        }
        
        .page-container {
          max-width: 100%;
          margin: 0 auto;
          page-break-after: always;
          height: 100vh;
          display: flex;
          flex-direction: column;
        }
        
        .page-container:last-child {
          page-break-after: avoid;
        }
        
        /* Cabeçalho */
        .page-header {
          background-color: #f8f9fa;
          padding: 6px 10px;
          margin-bottom: 6px;
          border-radius: 3px;
          border: 1px solid #e0e0e0;
          position: relative;
        }
        
        .page-header::after {
          content: '×';
          position: absolute;
          top: 6px;
          right: 10px;
          font-size: 20px;
          color: #999;
          line-height: 1;
          cursor: pointer;
        }
        
        .page-title {
          font-size: 12px;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 4px;
        }
        
        .page-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          font-size: 10px;
        }
        
        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .meta-label {
          color: #666;
        }
        
        .meta-value {
          font-weight: 600;
          color: #1a1a1a;
        }
        
        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 10px;
          font-weight: 500;
        }
        
        .badge-operacional {
          background-color: #dbeafe;
          color: #1e40af;
        }
        
        .badge-gestao {
          background-color: #f3e8ff;
          color: #6b21a8;
        }
        
        /* Grid de grupos */
        .grupos-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
          grid-auto-rows: auto;
          gap: 6px;
        }
        
        .grupo-card {
          background-color: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 3px;
          padding: 6px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.03);
          min-height: 0;
          display: block;
        }
        
        .grupo-header {
          padding-bottom: 3px;
          margin-bottom: 3px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .grupo-titulo {
          font-size: 11px;
          font-weight: 600;
          color: #1a1a1a;
          line-height: 1.2;
        }
        
        .questao-item {
          margin-bottom: 4px;
          padding-bottom: 3px;
          border-bottom: 1px solid #f3f4f6;
        }
        
        .questao-item:last-child {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }
        
        .questao-texto {
          font-size: 8.5px;
          color: #4b5563;
          margin-bottom: 2px;
          line-height: 1.1;
        }
        
        .questao-resposta {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .resposta-label {
          font-size: 8.5px;
          font-weight: 600;
          color: #059669;
        }
        
        .resposta-valor {
          font-size: 8.5px;
          font-weight: 600;
          color: #6b7280;
          background-color: #f3f4f6;
          padding: 1px 3px;
          border-radius: 2px;
        }
        
        @media print {
          body {
            padding: 0;
            background-color: #fff;
          }
          
          .page-container {
            page-break-after: always;
            margin-bottom: 0;
            /* evitar altura fixa para permitir conteúdo fluido */
            page-break-after: avoid;
          }
          
          .page-header::after {
            display: none;
          }
          
          .grupo-card {
            page-break-inside: avoid;
          }
        }
        
        @page {
          margin: 8mm;
          size: A4;
        }
      </style>
    </head>
    <body>
      ${avaliacoes
        .map(
          (avaliacao: any) => `
        <div class="page-container">
          <div class="page-header">
            <div class="page-title">Detalhes da Avaliação - ${
              avaliacao.funcionario.nome
            }</div>
            <div class="page-meta">
              <div class="meta-item">
                <span class="meta-label">N°</span>
                <span class="meta-value">${avaliacao.id}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">CPF:</span>
                <span class="meta-value">${avaliacao.funcionario.cpf}</span>
              </div>
              <div class="meta-item">
                <span class="badge ${
                  avaliacao.funcionario.perfil === 'operacional'
                    ? 'badge-operacional'
                    : 'badge-gestao'
                }">
                  ${avaliacao.funcionario.perfil}
                </span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Concluída em:</span>
                <span class="meta-value">${new Date(
                  avaliacao.envio
                ).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })} ${new Date(avaliacao.envio).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}</span>
              </div>
            </div>
          </div>
          
          <div class="grupos-container">
            ${avaliacao.grupos
              .map(
                (grupo: any) => `
              <div class="grupo-card">
                <div class="grupo-header">
                  <div class="grupo-titulo">${(grupo.titulo || '').replace(/^Grupo\s*\d+\s*-?\s*/i, '')}</div>
                  <div style="margin-top:6px; text-align:center;">
                    <div style="font-size:16px; font-weight:700;">${grupo.media}<span class="percent">%</span></div>
                    <div class="grupo-classificacao" style="color: ${
                      grupo.corClassificacao
                    }; font-weight: 600; font-size: 12px; margin-top: 4px;">
                      ${grupo.classificacao}
                    </div>
                  </div>
                </div>
                <div class="questoes-lista">
                  ${grupo.respostas
                    .map((resposta: any) => {
                      // Garantir que zero seja tratado corretamente
                      const valor = resposta.valor ?? 0;
                      const valorTexto =
                        Object.keys(escalasResposta).find(
                          (key) => (escalasResposta as any)[key] === valor
                        ) || 'Resposta';
                      return `
                      <div class="questao-item">
                        <div class="questao-texto">${resposta.texto}</div>
                        <div class="questao-resposta">
                          <span class="resposta-label">${valorTexto}</span>
                          <span class="resposta-valor">${valor}</span>
                        </div>
                      </div>
                    `;
                    })
                    .join('')}
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      `
        )
        .join('')}
    </body>
    </html>
  `;

  return html;
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole('rh');
    const searchParams = request.nextUrl.searchParams;
    const dataParam = searchParams.get('data');
    const loteIdParam = searchParams.get('lote_id');
    const empresaIdParam = searchParams.get('empresa_id');
    const cpfFilter = searchParams.get('cpf_filter'); // Novo parâmetro para filtrar por CPF
    const formato = searchParams.get('formato') || 'json';

    if ((!dataParam && !loteIdParam) || !empresaIdParam) {
      return NextResponse.json(
        { error: 'Parâmetros (data OU lote_id) e empresa_id são obrigatórios' },
        { status: 400 }
      );
    }

    if (!['json', 'pdf'].includes(formato)) {
      return NextResponse.json(
        { error: 'Formato deve ser json ou pdf' },
        { status: 400 }
      );
    }

    // Validar formato da data apenas se data foi fornecida
    if (dataParam) {
      const _data = new Date(dataParam + 'T00:00:00.000Z');
      if (isNaN(_data.getTime())) {
        return NextResponse.json(
          { error: 'Formato de data inválido. Use YYYY-MM-DD' },
          { status: 400 }
        );
      }
    }

    // Obter clínica do RH
    const rhResult = await query(
      'SELECT clinica_id FROM funcionarios WHERE cpf = $1',
      [session.cpf]
    );

    if (rhResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuário RH não encontrado' },
        { status: 404 }
      );
    }

    const clinicaId = (rhResult.rows[0] as Record<string, any>).clinica_id;

    // Verificar se empresa pertence à clínica
    const empresaResult = await query(
      'SELECT id, nome FROM empresas_clientes WHERE id = $1 AND clinica_id = $2 AND ativa = true',
      [empresaIdParam, clinicaId]
    );

    if (empresaResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Empresa não encontrada ou não pertence à sua clínica' },
        { status: 404 }
      );
    }

    const empresa = empresaResult.rows[0] as Record<string, any>;

    // Buscar avaliações concluídas na data especificada ou do lote especificado para a empresa
    let queryParams: any[] = [];
    let whereClause =
      "a.status = 'concluido' AND f.empresa_id = $1 AND f.clinica_id = $2";

    if (loteIdParam) {
      // Filtrar por lote específico
      whereClause += ' AND a.lote_id = $3';
      queryParams = [empresaIdParam, clinicaId, loteIdParam];

      // Se cpf_filter foi fornecido, adicionar filtro adicional
      if (cpfFilter) {
        whereClause += ' AND f.cpf = $4';
        queryParams.push(cpfFilter);
      }
    } else {
      // Filtrar por data
      whereClause += ' AND DATE(a.envio) = $3';
      queryParams = [empresaIdParam, clinicaId, dataParam];

      // Se cpf_filter foi fornecido, adicionar filtro adicional
      if (cpfFilter) {
        whereClause += ' AND f.cpf = $4';
        queryParams.push(cpfFilter);
      }
    }

    const avaliacoesResult = await query(
      `
      SELECT
        a.id,
        a.envio,
        f.cpf,
        f.nome,
        f.perfil,
        f.nivel_cargo,
        f.setor,
        f.funcao,
        f.matricula
      FROM avaliacoes a
      JOIN funcionarios f ON a.funcionario_cpf = f.cpf
      WHERE ${whereClause}
      ORDER BY f.nome
    `,
      queryParams
    );

    if (avaliacoesResult.rows.length === 0) {
      const responseData: any = {
        empresa: empresa.nome,
        avaliacoes: [],
      };

      if (loteIdParam) {
        // Armazenar apenas o ID do lote (codigo e titulo foram removidos)
        responseData.lote = {
          id: loteIdParam,
        };
      } else {
        responseData.data = dataParam;
      }

      return NextResponse.json(responseData);
    }

    // Para cada avaliação, buscar respostas e organizar por grupo
    const avaliacoesCompletas = await Promise.all(
      avaliacoesResult.rows.map(async (avaliacao: any) => {
        const respostasResult = await query(
          `
          SELECT DISTINCT ON (r.grupo, r.item) r.grupo, r.item, r.valor
          FROM respostas r
          WHERE r.avaliacao_id = $1
          ORDER BY r.grupo, r.item, r.id DESC
        `,
          [avaliacao.id]
        );

        // Organizar respostas por grupo
        const respostasPorGrupo = new Map<
          number,
          Array<{ item: string; valor: number; texto: string }>
        >();

        respostasResult.rows.forEach((resposta: any) => {
          if (!respostasPorGrupo.has(resposta.grupo)) {
            respostasPorGrupo.set(resposta.grupo, []);
          }

          // Encontrar o texto da questão
          const grupo = grupos.find((g) => g.id === resposta.grupo);
          const questao = grupo?.itens.find((q) => q.id === resposta.item);
          const textoQuestao = questao
            ? getTextoQuestao(questao, avaliacao.perfil)
            : resposta.item;

          respostasPorGrupo.get(resposta.grupo)!.push({
            item: resposta.item,
            valor: resposta.valor,
            texto: textoQuestao,
          });
        });

        // Converter para array de grupos com cálculo de média e classificação
        const gruposComRespostas = Array.from(respostasPorGrupo.entries()).map(
          ([grupoId, respostas]) => {
            const grupoInfo = grupos.find((g) => g.id === grupoId);

            // Calcular média do grupo
            const somaValores = respostas.reduce((acc, r) => acc + r.valor, 0);
            const media =
              respostas.length > 0 ? somaValores / respostas.length : 0;

            // Classificar risco baseado na média
            const gruposPositivos = [2, 3, 5, 6];
            const isPositivo = gruposPositivos.includes(grupoId);

            let classificacao = '';
            let corClassificacao = '';

            if (isPositivo) {
              // Grupos positivos: maior é melhor
              if (media > 66) {
                classificacao = 'Excelente (Baixo Risco)';
                corClassificacao = '#10b981'; // green-500
              } else if (media >= 33) {
                classificacao = 'Monitorar (Médio Risco)';
                corClassificacao = '#f59e0b'; // amber-500
              } else {
                classificacao = 'Atenção (Alto Risco)';
                corClassificacao = '#ef4444'; // red-500
              }
            } else {
              // Grupos negativos: menor é melhor
              if (media < 33) {
                classificacao = 'Excelente (Baixo Risco)';
                corClassificacao = '#10b981'; // green-500
              } else if (media <= 66) {
                classificacao = 'Monitorar (Médio Risco)';
                corClassificacao = '#f59e0b'; // amber-500
              } else {
                classificacao = 'Atenção (Alto Risco)';
                corClassificacao = '#ef4444'; // red-500
              }
            }

            return {
              id: grupoId,
              titulo: grupoInfo?.titulo || `Grupo ${grupoId}`,
              dominio: grupoInfo?.dominio || '',
              respostas,
              media: media.toFixed(1),
              classificacao,
              corClassificacao,
            };
          }
        );

        return {
          id: avaliacao.id,
          funcionario: {
            cpf: avaliacao.cpf,
            nome: avaliacao.nome,
            perfil:
              avaliacao.nivel_cargo === 'gestao' ? 'gestao' : 'operacional',
            setor: avaliacao.setor,
            funcao: avaliacao.funcao,
            matricula: avaliacao.matricula,
          },
          envio: avaliacao.envio,
          grupos: gruposComRespostas,
        };
      })
    );

    const dadosRelatorio: any = {
      empresa: empresa.nome,
      total_avaliacoes: avaliacoesCompletas.length,
      avaliacoes: avaliacoesCompletas,
    };

    if (loteIdParam) {
      // Buscar informações do lote
      const loteResult = await query(
        'SELECT id, titulo FROM lotes_avaliacao WHERE id = $1',
        [loteIdParam]
      );
      if (loteResult.rows.length > 0) {
        dadosRelatorio.lote = {
          id: loteIdParam,
          titulo: (loteResult.rows[0] as Record<string, any>).titulo,
        };
      }
    } else {
      dadosRelatorio.data = dataParam;
    }

    if (formato === 'pdf') {
      // Gerar PDF
      const html = gerarHTMLRelatorio(dadosRelatorio);

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
      await (page as any).setContent(html, { waitUntil: 'networkidle0' });

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

      // Nome do arquivo baseado em lote ou data
      const nomeArquivo = loteIdParam
        ? `relatorio-avaliacoes-${empresa.nome}-lote-${loteIdParam}.pdf`
        : `relatorio-avaliacoes-${empresa.nome}-${dataParam}.pdf`;

      return new NextResponse(Buffer.from(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${nomeArquivo}"`,
        },
      });
    }

    return NextResponse.json(dadosRelatorio);
  } catch (error) {
    console.error('Erro ao gerar relatório de impressão:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar relatório' },
      { status: 500 }
    );
  }
}
