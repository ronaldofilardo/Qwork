import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatarDataCorrigida } from './timezone-helper';
import { buildGruposFromRespostas } from './relatorio-individual';

interface RespostaSetor {
  grupo: number;
  valor: number;
}

export interface DadosRelatorioSetor {
  setor: string;
  empresa_nome: string;
  lote_id: number;
  total_funcionarios: number;
  respostas: RespostaSetor[];
}

// Mapeia categoria de risco para rótulo textual
const ROTULO_CATEGORIA: Record<'baixo' | 'medio' | 'alto', string> = {
  baixo: 'Excelente',
  medio: 'Monitorar',
  alto: 'Atenção Necessária',
};

// Mapeia categoria para cor RGB [r,g,b]
const COR_CATEGORIA: Record<
  'baixo' | 'medio' | 'alto',
  [number, number, number]
> = {
  baixo: [76, 175, 80], // verde
  medio: [180, 83, 9], // âmbar escuro
  alto: [220, 38, 38], // vermelho
};

export function gerarRelatorioSetorPDF(dados: DadosRelatorioSetor): Buffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 15;

  // Título
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(
    'Relatório por Setor — Avaliação Psicossocial',
    pageWidth / 2,
    yPos,
    {
      align: 'center',
    }
  );
  yPos += 12;

  // Timestamp de geração
  const timestampGeracao = formatarDataCorrigida(new Date());

  // Box de informações do setor
  autoTable(doc, {
    startY: yPos,
    margin: { left: 15, right: 15 },
    body: [
      ['Setor', dados.setor],
      ['Empresa / Entidade', dados.empresa_nome],
      ['Ciclo (Lote)', String(dados.lote_id)],
      ['Funcionários avaliados', String(dados.total_funcionarios)],
      ['Relatório gerado em', timestampGeracao],
    ],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [240, 240, 240], textColor: 0 },
      1: { textColor: 0 },
    },
  });

  yPos = ((doc as any).lastAutoTable?.finalY ?? yPos + 45) + 10;

  // Nota metodológica
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(80, 80, 80);
  doc.text(
    'Os valores abaixo representam as médias das respostas de todos os funcionários do setor com avaliação concluída.',
    15,
    yPos,
    { maxWidth: 180 }
  );
  yPos += 10;

  // Resultados por grupo
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Resultados por Grupo', 15, yPos, { maxWidth: 180 });
  yPos += 8;

  const grupos = buildGruposFromRespostas(dados.respostas);

  if (grupos.length === 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text('Nenhum dado disponível para este setor.', 15, yPos);
  } else {
    const tableData = grupos.map((g) => [
      String(g.grupoId),
      g.dominio,
      g.descricao,
      g.tipo === 'positiva' ? 'Positiva' : 'Negativa',
      g.media.toFixed(1),
      ROTULO_CATEGORIA[g.categoriaRisco],
    ]);

    autoTable(doc, {
      startY: yPos,
      margin: { left: 10, right: 10 },
      head: [
        [
          'Grupo',
          'Domínio',
          'Descrição',
          'Tipo',
          'Média Geral',
          'Categoria de Risco',
        ],
      ],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 2.5, overflow: 'linebreak' },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 13 },
        1: { cellWidth: 38 },
        2: { cellWidth: 58 },
        3: { halign: 'center', cellWidth: 17 },
        4: { halign: 'center', cellWidth: 20 },
        5: { halign: 'center', cellWidth: 28 },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 5) {
          const grupo = grupos[data.row.index];
          if (grupo) {
            data.cell.styles.textColor = COR_CATEGORIA[grupo.categoriaRisco];
            data.cell.styles.fontStyle = 'bold';
          }
        }
        if (data.section === 'body' && data.column.index === 3) {
          const grupo = grupos[data.row.index];
          if (grupo) {
            data.cell.styles.textColor =
              grupo.tipo === 'positiva' ? [2, 132, 199] : [220, 38, 38];
          }
        }
      },
    });
  }

  // Rodapé
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Documento gerado em ${formatarDataCorrigida(new Date())}`,
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: 'center', maxWidth: 180 }
  );

  return Buffer.from(doc.output('arraybuffer'));
}
