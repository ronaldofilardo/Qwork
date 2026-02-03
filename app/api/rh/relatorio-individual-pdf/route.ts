/**
 * API para gerar PDF de relatório individual
 * Usa jsPDF para geração rápida e simplificada
 */

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import jsPDF from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';

// Garantir que o plugin AutoTable seja aplicado ao jsPDF
try {
  applyPlugin(jsPDF);
} catch (err) {
  console.warn('Aviso: não foi possível aplicar jspdf-autotable ao jsPDF:', err);
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
    doc.text(`Matrícula: ${dadosRelatorio.funcionario.matricula || '-'}`, 14, yPos);
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
    doc.text(`Código do Lote: ${dadosRelatorio.lote.codigo}`, 14, yPos);
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
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
      };
      
      const rgb = hexToRgb(grupo.corClassificacao);
      doc.setTextColor(rgb.r, rgb.g, rgb.b);
      doc.text(`Média: ${grupo.media} - ${classificacaoTexto}`, 14, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 7;
    }

    // Rodapé
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
    const nomeArquivo = `relatorio-individual-${avaliacao.nome.replace(
      /\s+/g,
      '-'
    )}-${avaliacao.lote_codigo}.pdf`;

    return new NextResponse(pdfBuffer, {
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
