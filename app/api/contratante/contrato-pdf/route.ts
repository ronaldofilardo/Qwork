import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import jsPDF from 'jspdf';

export const dynamic = 'force-dynamic';

/**
 * API para gerar e baixar contrato em PDF
 * GET /api/contratante/contrato-pdf
 */
export async function GET() {
  try {
    const session = await requireRole(['gestor_entidade', 'rh']);

    // Buscar contrato ativo do contratante
    const result = await query(
      `SELECT
        c.id as numero_contrato,
        c.conteudo,
        c.hash_sha256,
        c.aceito,
        c.data_aceite,
        c.ip_aceite,
        COALESCE(ct.nome, cl.nome) as contratante_nome,
        COALESCE(ct.cnpj, cl.cnpj) as contratante_cnpj,
        COALESCE(ct.responsavel_nome, cl.responsavel_nome) as responsavel_nome,
        p.nome as plano_nome
      FROM contratos c
      LEFT JOIN contratantes ct ON c.contratante_id = ct.id
      LEFT JOIN clinicas cl ON c.clinica_id = cl.id
      LEFT JOIN contratos_planos cp ON cp.contratante_id = c.contratante_id OR cp.clinica_id = c.clinica_id
      LEFT JOIN planos p ON cp.plano_id = p.id
      WHERE c.contratante_id = $1 OR c.clinica_id = $1
      AND c.aceito = true
      ORDER BY c.created_at DESC
      LIMIT 1`,
      [session.contratante_id],
      session
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Contrato não encontrado',
        },
        { status: 404 }
      );
    }

    const contrato = result.rows[0];

    // Gerar PDF usando jsPDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;

    // Cabeçalho
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('CONTRATO DE PRESTAÇÃO DE SERVIÇOS', pageWidth / 2, 20, {
      align: 'center',
    });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('QWORK - Sistema de Avaliação Psicossocial', pageWidth / 2, 28, {
      align: 'center',
    });

    // Linha separadora
    doc.setLineWidth(0.5);
    doc.line(margin, 32, pageWidth - margin, 32);

    // Informações do contrato
    let yPosition = 40;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `Número do Contrato: ${contrato.numero_contrato}`,
      margin,
      yPosition
    );
    yPosition += 6;

    doc.setFont('helvetica', 'normal');
    doc.text(`Contratante: ${contrato.contratante_nome}`, margin, yPosition);
    yPosition += 6;
    doc.text(`CNPJ: ${contrato.contratante_cnpj}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Responsável: ${contrato.responsavel_nome}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Plano: ${contrato.plano_nome}`, margin, yPosition);
    yPosition += 10;

    // Linha separadora
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    // Conteúdo do contrato
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(contrato.conteudo, maxWidth);

    for (let i = 0; i < lines.length; i++) {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(lines[i], margin, yPosition);
      yPosition += 5;
    }

    // Informações de aceite (se aceito)
    if (contrato.aceito && contrato.data_aceite) {
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = margin;
      }

      yPosition += 10;
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;

      doc.setFont('helvetica', 'bold');
      doc.text('ACEITE DIGITAL', margin, yPosition);
      yPosition += 6;

      doc.setFont('helvetica', 'normal');
      doc.text(
        `Data/Hora: ${new Date(contrato.data_aceite).toLocaleString('pt-BR')}`,
        margin,
        yPosition
      );
      yPosition += 6;
      doc.text(`IP: ${contrato.ip_aceite}`, margin, yPosition);
    }

    // Rodapé
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 10, {
        align: 'center',
      });
      doc.text(
        'Documento gerado eletronicamente pelo sistema QWork',
        pageWidth / 2,
        pageHeight - 6,
        { align: 'center' }
      );
    }

    // Gerar PDF como buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    // Retornar PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="contrato-${contrato.numero_contrato}.pdf"`,
      },
    });
  } catch (error) {
    console.error('[API Contrato PDF] Erro ao gerar PDF:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao gerar PDF do contrato',
      },
      { status: 500 }
    );
  }
}
