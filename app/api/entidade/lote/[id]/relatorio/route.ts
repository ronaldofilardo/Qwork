import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';
import jsPDF from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';

// Garantir que o plugin AutoTable seja aplicado ao jsPDF (servidor/SSG/SSR)
try {
  applyPlugin(jsPDF);
} catch (err) {
  // Em ambientes de teste ou bundlers diferentes, o plugin pode falhar ao aplicar; não bloquear a execução
  console.warn(
    'Aviso: não foi possível aplicar jspdf-autotable ao jsPDF:',
    err
  );
}

export const dynamic = 'force-dynamic';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable?: {
      finalY: number;
    };
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar sessão e perfil
    const session = getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    if (session.perfil !== 'gestor_entidade') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const loteId = parseInt(params.id);
    if (isNaN(loteId)) {
      return NextResponse.json(
        { error: 'ID do lote inválido' },
        { status: 400 }
      );
    }

    // Buscar informações do lote
    const loteResult = await query(
      `
      SELECT DISTINCT
        la.id,
        la.codigo,
        la.titulo,
        la.tipo,
        la.status,
        la.criado_em,
        la.liberado_em
      FROM lotes_avaliacao la
      JOIN avaliacoes a ON a.lote_id = la.id
      JOIN funcionarios f ON a.funcionario_cpf = f.cpf
      WHERE la.id = $1 AND f.contratante_id = $2
      LIMIT 1
    `,
      [loteId, session.contratante_id]
    );

    if (loteResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Lote não encontrado' },
        { status: 404 }
      );
    }

    const lote = loteResult.rows[0];

    // Buscar laudo (se existir) para obter timestamp de emissão e hash do arquivo
    const laudoResult = await query(
      `
      SELECT id, emitido_em
      FROM laudos
      WHERE lote_id = $1 AND status IN ('enviado', 'emitido')
      ORDER BY emitido_em DESC
      LIMIT 1
      `,
      [loteId]
    );

    const laudo = laudoResult.rows[0] || null;
    const emitidoEm = laudo ? laudo.emitido_em : null;
    let laudoHash: string | null = null;

    // Tentar ler metadados do arquivo salvo (storage/laudos/laudo-<id>.json)
    if (laudo && laudo.id) {
      try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const metaPath = path.join(
          process.cwd(),
          'storage',
          'laudos',
          `laudo-${laudo.id}.json`
        );
        const metaContent = await fs.readFile(metaPath, 'utf8');
        const meta = JSON.parse(metaContent);
        laudoHash = meta.hash || null;
      } catch (err) {
        // Se não encontrar metadados, manter laudoHash null
        console.error('Aviso: não foi possível ler metadados do laudo:', err);
      }
    }

    // Buscar funcionários que tinham avaliação concluída ATÉ a emissão (ou até agora se sem laudo)
    const cutoff = emitidoEm
      ? new Date(emitidoEm).toISOString()
      : new Date().toISOString();

    const funcionariosResult = await query(
      `
      SELECT
        f.nome,
        f.cpf,
        f.setor,
        f.funcao,
        f.nivel_cargo,
        a.status as avaliacao_status,
        a.envio as data_conclusao
      FROM funcionarios f
      JOIN avaliacoes a ON a.funcionario_cpf = f.cpf
      WHERE a.lote_id = $1 AND f.contratante_id = $2
        AND a.status = 'concluida'
        AND a.envio <= $3
        AND f.perfil <> 'gestor_entidade'
      ORDER BY f.nome ASC
    `,
      [loteId, session.contratante_id, cutoff]
    );

    // Gerar PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Título
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Ciclo de Coletas Avaliativas', pageWidth / 2, 20, {
      align: 'center',
    });

    // Informações do Lote
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Código: ${lote.codigo}`, 14, 35);
    doc.text(`Título: ${lote.titulo}`, 14, 42);
    doc.text(`Status: ${lote.status}`, 14, 56);

    // Emitido e hash do laudo (se disponível)
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const emitidoTexto = emitidoEm
      ? new Date(emitidoEm).toLocaleString('pt-BR')
      : '—';
    doc.text(`Emitido em: ${emitidoTexto}`, 14, 63);
    doc.text(`Hash: ${laudoHash || '—'}`, 14, 70);

    // Tabela de Funcionários (somente os que constam no laudo)
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Funcionários', 14, 86);

    const tableData = funcionariosResult.rows.map((row) => [
      row.nome,
      row.cpf,
      row.setor,
      row.funcao,
      row.nivel_cargo || '-',
      row.avaliacao_status === 'concluida' ? 'Concluída' : 'Pendente',
      row.data_conclusao
        ? new Date(row.data_conclusao).toLocaleDateString('pt-BR')
        : '-',
    ]);

    doc.autoTable({
      startY: 91,
      head: [
        ['Nome', 'CPF', 'Setor', 'Função', 'Nível', 'Status', 'Conclusão'],
      ],
      body: tableData,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [255, 107, 0], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { top: 91 },
    });

    // Rodapé
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Página ${i} de ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
      doc.text(
        `Gerado em ${new Date().toLocaleString('pt-BR')}`,
        pageWidth / 2,
        doc.internal.pageSize.height - 5,
        { align: 'center' }
      );
    }

    // Retornar PDF
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="relatorio-lote-${lote.codigo}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
