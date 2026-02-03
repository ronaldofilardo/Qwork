export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole, requireClinica, requireEntity } from '@/lib/session';
import jsPDF from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';
import { grupos } from '@/lib/questoes';

// Garantir que o plugin AutoTable seja aplicado ao jsPDF
try {
  applyPlugin(jsPDF);
} catch (err) {
  console.warn(
    'Aviso: não foi possível aplicar jspdf-autotable ao jsPDF:',
    err
  );
}

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable?: {
      finalY: number;
    };
  }
}

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
        la.id as lote_id,
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
          `SELECT id, clinica_id, contratante_id FROM lotes_avaliacao WHERE id = $1`,
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
        titulo: avaliacao.lote_titulo,
      },
      envio: avaliacao.envio,
      grupos: gruposProcessados.sort((a, b) => a.id - b.id),
    };

    // Gerar PDF com jsPDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPos = 20;

    // Título principal
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório Individual de Avaliação', pageWidth / 2, yPos, {
      align: 'center',
    });
    yPos += 15;

    // Informações do Funcionário
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Dados do Funcionário', 14, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nome: ${dadosRelatorio.funcionario.nome}`, 14, yPos);
    yPos += 5;
    doc.text(`CPF: ${dadosRelatorio.funcionario.cpf}`, 14, yPos);
    yPos += 5;
    doc.text(
      `Matrícula: ${dadosRelatorio.funcionario.matricula || '-'}`,
      14,
      yPos
    );
    yPos += 5;
    doc.text(`Empresa: ${dadosRelatorio.funcionario.empresa || '-'}`, 14, yPos);
    yPos += 5;
    doc.text(`Setor: ${dadosRelatorio.funcionario.setor || '-'}`, 14, yPos);
    yPos += 5;
    doc.text(`Função: ${dadosRelatorio.funcionario.funcao || '-'}`, 14, yPos);
    yPos += 5;
    doc.text(`Nível: ${dadosRelatorio.funcionario.perfil}`, 14, yPos);
    yPos += 10;

    // Informações do Lote
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Dados da Avaliação', 14, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Lote #${dadosRelatorio.lote.id}`, 14, yPos);
    yPos += 5;
    doc.text(`Título: ${dadosRelatorio.lote.titulo}`, 14, yPos);
    yPos += 5;
    const dataEnvio = dadosRelatorio.envio
      ? new Date(dadosRelatorio.envio).toLocaleString('pt-BR')
      : '-';
    doc.text(`Data de Conclusão: ${dataEnvio}`, 14, yPos);
    yPos += 12;

    // Resultados por Grupo (compacto - apenas resumo)
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Resultados por Domínio', 14, yPos);
    yPos += 8;

    // Mostrar grupos de forma compacta (sem tabelas detalhadas)
    for (const grupo of dadosRelatorio.grupos) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');

      // Texto do grupo
      const textoGrupo = `${grupo.dominio} - Grupo ${grupo.id} - ${grupo.titulo}`;
      doc.text(textoGrupo, 14, yPos);
      yPos += 5;

      // Classificação com cor
      doc.setFont('helvetica', 'normal');
      const classificacaoTexto = grupo.classificacao.toUpperCase();

      // Converter cor hex para RGB
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
          ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
            }
          : { r: 0, g: 0, b: 0 };
      };

      const rgb = hexToRgb(grupo.corClassificacao);
      doc.setTextColor(rgb.r, rgb.g, rgb.b);
      doc.text(`Média: ${grupo.media} - ${classificacaoTexto}`, 14, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 7;
    }

    // Rodapé simples (uma página)
    doc.setPage(1);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Gerado em ${new Date().toLocaleString('pt-BR')}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
    doc.setTextColor(0, 0, 0);

    // Gerar buffer do PDF
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    // Retornar PDF
    const nomeArquivo = `relatorio-individual-${avaliacao.nome.replace(/\s+/g, '-')}-${avaliacao.lote_codigo}.pdf`;

    return new NextResponse(pdfBuffer, {
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

    return NextResponse.json(
      {
        error: 'Erro ao gerar PDF do relatório individual',
        details: message,
      },
      { status: 500 }
    );
  }
}
