import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { dadosRelatorio } from '@/lib/relatorio-dados';

interface RespostaAvaliacao {
  grupo: number;
  valor: number;
}

interface GrupoRelatorio {
  grupoId: number;
  grupoNome: string;
  media: number;
  classificacao: 'verde' | 'amarelo' | 'vermelho';
  polaridade: 'positiva' | 'negativa';
}

interface DadosRelatorio {
  avaliacao: {
    id: number;
    nome: string;
    cpf: string;
    matricula: string | null;
    funcao: string | null;
    nivel_cargo: string | null;
    setor: string | null;
    empresa_nome: string;
    concluida_em: Date | string;
  };
  respostas: RespostaAvaliacao[];
}

function calcularClassificacao(
  media: number,
  polaridade: 'positiva' | 'negativa'
): 'verde' | 'amarelo' | 'vermelho' {
  // Para polaridade positiva: quanto maior, melhor
  // Para polaridade negativa: quanto menor, melhor
  if (polaridade === 'positiva') {
    if (media > 6.6) return 'verde';
    if (media >= 3.3) return 'amarelo';
    return 'vermelho';
  } else {
    if (media < 3.3) return 'verde';
    if (media <= 6.6) return 'amarelo';
    return 'vermelho';
  }
}

function buildGruposFromRespostas(
  respostas: RespostaAvaliacao[]
): GrupoRelatorio[] {
  const grupos = new Map<number, number[]>();

  // Agrupar respostas por grupo
  for (const resposta of respostas) {
    if (!grupos.has(resposta.grupo)) {
      grupos.set(resposta.grupo, []);
    }
    grupos.get(resposta.grupo)!.push(resposta.valor);
  }

  // Calcular médias e montar resultado
  const resultado: GrupoRelatorio[] = [];
  for (const [grupoId, valores] of grupos.entries()) {
    const media = valores.reduce((a, b) => a + b, 0) / valores.length;
    const dadosGrupo = dadosRelatorio.find((g) => g.id === grupoId);
    const polaridade = (dadosGrupo?.polaridade || 'positiva') as
      | 'positiva'
      | 'negativa';
    const classificacao = calcularClassificacao(media, polaridade);

    resultado.push({
      grupoId,
      grupoNome: dadosGrupo?.nome || `Grupo ${grupoId}`,
      media: Math.round(media * 100) / 100,
      classificacao,
      polaridade,
    });
  }

  return resultado.sort((a, b) => a.grupoId - b.grupoId);
}

export function gerarRelatorioIndividualPDF(dados: DadosRelatorio): Buffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 15;

  // Título
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório Individual de Avaliação', pageWidth / 2, yPos, {
    align: 'center',
  });
  yPos += 12;

  // Dados do funcionário (simplificado)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Converter concluida_em para Date corretamente
  const dataConclusion = (() => {
    const valor = dados.avaliacao.concluida_em;
    if (valor instanceof Date) {
      return valor;
    }
    if (typeof valor === 'string') {
      return new Date(valor);
    }
    return new Date();
  })();

  const dataFormatada = dataConclusion.toLocaleString('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // Formatar data e hora separadamente
  const dataConclusao = dataConclusion.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const horaConclusao = dataConclusion.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  autoTable(doc, {
    startY: yPos,
    margin: { left: 15, right: 15 },
    head: [['Campo', 'Valor']],
    body: [
      ['Nome', dados.avaliacao.nome],
      ['CPF', dados.avaliacao.cpf],
      ['Data de Conclusão', dataConclusao],
      ['Hora de Conclusão', horaConclusao],
      ['Timestamp da Conclusão', dataFormatada],
    ],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: 255,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: {},
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Resultados por grupo
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Resultados por Grupo', 15, yPos, { maxWidth: 180 });
  yPos += 8;

  const grupos = buildGruposFromRespostas(dados.respostas);
  const tableData = grupos.map((g) => {
    const classificacaoLabel = {
      verde: 'Baixo',
      amarelo: 'Médio',
      vermelho: 'Alto',
    }[g.classificacao];
    return [g.grupoNome, g.media.toFixed(2), classificacaoLabel];
  });

  autoTable(doc, {
    startY: yPos,
    margin: { left: 15, right: 15 },
    head: [['Grupo', 'Média', 'Classificação']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: {
      fillColor: [76, 175, 80],
      textColor: 255,
      fontStyle: 'bold',
    },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'center' },
    },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 2) {
        const grupo = grupos[data.row.index];
        let cor: [number, number, number];

        if (grupo.classificacao === 'verde') {
          cor = [76, 175, 80]; // Verde - Baixo
        } else if (grupo.classificacao === 'amarelo') {
          cor = [255, 193, 7]; // Amarelo - Médio
        } else {
          cor = [244, 67, 54]; // Vermelho - Alto
        }

        // Aplicar cor de fundo
        data.cell.styles.fillColor = cor;
        data.cell.styles.textColor =
          grupo.classificacao === 'amarelo' ? 0 : 255;
      }
    },
  });

  // Rodapé
  yPos = (doc as any).lastAutoTable.finalY + 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Gerado em ${new Date().toLocaleString('pt-BR')}`,
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: 'center', maxWidth: 180 }
  );

  return Buffer.from(doc.output('arraybuffer'));
}

export { buildGruposFromRespostas };
