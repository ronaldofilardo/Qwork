import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatarDataCorrigida } from './timezone-helper';

interface Funcionario {
  nome: string;
  cpf: string;
  concluida_em: Date;
  status: string;
}

interface Lote {
  id: number;
  criado_em: Date;
  emitido_em: Date | null;
  hash_pdf: string | null;
  status: string;
}

interface DadosLote {
  lote: Lote;
  funcionarios: Funcionario[];
}

export function gerarRelatorioLotePDF(dados: DadosLote): Buffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 15;

  // Cores do design (verde/laranja)
  const corPrimaria: [number, number, number] = [76, 175, 80]; // Verde
  const corSecundaria: [number, number, number] = [255, 152, 0]; // Laranja

  // Título
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório de Lote de Avaliações', pageWidth / 2, yPos, {
    align: 'center',
  });
  yPos += 12;

  // Informações do lote
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const dataGeracaoFormatada = formatarDataCorrigida(new Date());
  const dataCriacaoFormatada = formatarDataCorrigida(dados.lote.criado_em);
  const statusFormatado = dados.lote.emitido_em
    ? `Concluído em ${formatarDataCorrigida(dados.lote.emitido_em)}`
    : 'Pendente';

  autoTable(doc, {
    startY: yPos,
    margin: { left: 15, right: 15 },
    head: [['Campo', 'Valor']],
    body: [
      ['ID do Lote', dados.lote.id.toString()],
      ['Data de Criação', dataCriacaoFormatada],
      ['Gerado em', dataGeracaoFormatada],
      ['Hash PDF', dados.lote.hash_pdf || 'Não disponível'],
      ['Status', statusFormatado],
    ],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: {
      fillColor: corPrimaria,
      textColor: 255,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Funcionários
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Funcionários Avaliados', 15, yPos);
  yPos += 8;

  const tableData = dados.funcionarios.map((f) => {
    const dataConclusaoFormatada = formatarDataCorrigida(f.concluida_em);
    return [f.nome, f.cpf, dataConclusaoFormatada];
  });

  autoTable(doc, {
    startY: yPos,
    margin: { left: 15, right: 15 },
    head: [['Nome', 'CPF', 'Data de Conclusão']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: {
      fillColor: corSecundaria,
      textColor: 255,
      fontStyle: 'bold',
    },
  });

  // Rodapé
  yPos = (doc as any).lastAutoTable.finalY + 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total de funcionários: ${dados.funcionarios.length}`, 15, yPos);
  doc.text(
    `Gerado em ${formatarDataCorrigida(new Date())}`,
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: 'center' }
  );

  return Buffer.from(doc.output('arraybuffer'));
}
