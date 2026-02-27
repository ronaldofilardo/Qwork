import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { dadosRelatorio } from '@/lib/relatorio-dados';
import { formatarDataCorrigida } from './timezone-helper';

interface RespostaAvaliacao {
  grupo: number;
  valor: number;
}

interface GrupoRelatorio {
  grupoId: number;
  grupoNome: string;
  dominio: string;
  descricao: string;
  tipo: 'positiva' | 'negativa';
  media: number;
  categoriaRisco: 'baixo' | 'medio' | 'alto';
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

// Metadados estáticos dos 10 grupos COPSOQ III
const GRUPOS_META: Record<
  number,
  { dominio: string; descricao: string; tipo: 'positiva' | 'negativa' }
> = {
  1: {
    dominio: 'Demandas no Trabalho',
    descricao: 'Avaliação das exigências quantitativas e ritmo de trabalho',
    tipo: 'negativa',
  },
  2: {
    dominio: 'Organização e Conteúdo do Trabalho',
    descricao:
      'Influência, desenvolvimento de habilidades e significado do trabalho',
    tipo: 'positiva',
  },
  3: {
    dominio: 'Relações Sociais e Liderança',
    descricao: 'Apoio social, feedback e reconhecimento no trabalho',
    tipo: 'positiva',
  },
  4: {
    dominio: 'Interface Trabalho-Indivíduo',
    descricao: 'Insegurança no trabalho e conflito trabalho-família',
    tipo: 'negativa',
  },
  5: {
    dominio: 'Valores Organizacionais',
    descricao: 'Confiança, justiça e respeito mútuo na organização',
    tipo: 'positiva',
  },
  6: {
    dominio: 'Traços de Personalidade',
    descricao: 'Autoeficácia e autoconfiança',
    tipo: 'positiva',
  },
  7: {
    dominio: 'Saúde e Bem-Estar',
    descricao: 'Avaliação de estresse, burnout e sintomas somáticos',
    tipo: 'negativa',
  },
  8: {
    dominio: 'Comportamentos Ofensivos',
    descricao: 'Exposição a assédio e violência no trabalho',
    tipo: 'negativa',
  },
  9: {
    dominio: 'Comportamento de Jogo',
    descricao: 'Avaliação de comportamentos relacionados a Jogos de Apostas',
    tipo: 'negativa',
  },
  10: {
    dominio: 'Endividamento Financeiro',
    descricao: 'Avaliação do nível de endividamento e estresse financeiro',
    tipo: 'negativa',
  },
};

// Determina categoria de risco por tercis fixos (escala 0-100)
function determinarCategoriaRisco(
  media: number,
  tipo: 'positiva' | 'negativa'
): 'baixo' | 'medio' | 'alto' {
  if (tipo === 'positiva') {
    if (media > 66) return 'baixo';
    if (media >= 33) return 'medio';
    return 'alto';
  } else {
    if (media < 33) return 'baixo';
    if (media <= 66) return 'medio';
    return 'alto';
  }
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
  medio: [180, 83, 9], // âmbar escuro (legível sobre fundo branco)
  alto: [220, 38, 38], // vermelho
};

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

  // Calcular médias e montar resultado com metadados COPSOQ
  const resultado: GrupoRelatorio[] = [];
  for (const [grupoId, valores] of grupos.entries()) {
    const media = valores.reduce((a, b) => a + b, 0) / valores.length;
    const dadosGrupo = dadosRelatorio.find((g) => g.id === grupoId);
    const meta = GRUPOS_META[grupoId] ?? {
      dominio: dadosGrupo?.nome ?? `Grupo ${grupoId}`,
      descricao: '',
      tipo: (dadosGrupo?.polaridade ?? 'positiva') as 'positiva' | 'negativa',
    };
    const mediaArredondada = Math.round(media * 10) / 10;

    resultado.push({
      grupoId,
      grupoNome: meta.dominio,
      dominio: meta.dominio,
      descricao: meta.descricao,
      tipo: meta.tipo,
      media: mediaArredondada,
      categoriaRisco: determinarCategoriaRisco(mediaArredondada, meta.tipo),
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

  const timestampConclusao = formatarDataCorrigida(dataConclusion);

  // Timestamp atual de geração do relatório
  const timestampGeracao = formatarDataCorrigida(new Date());

  // Desenhar box com dados (sem cabeçalhos)
  autoTable(doc, {
    startY: yPos,
    margin: { left: 15, right: 15 },
    body: [
      ['Nome', dados.avaliacao.nome],
      ['CPF', dados.avaliacao.cpf],
      ['Concluída em', timestampConclusao],
      ['Relatório gerado em', timestampGeracao],
    ],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [240, 240, 240], textColor: 0 },
      1: { textColor: 0 },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Resultados por grupo
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Resultados por Grupo', 15, yPos, { maxWidth: 180 });
  yPos += 8;

  const grupos = buildGruposFromRespostas(dados.respostas);
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
        // Texto colorido, fundo branco (sem cor de fundo)
        data.cell.styles.textColor = COR_CATEGORIA[grupo.categoriaRisco];
        data.cell.styles.fontStyle = 'bold';
      }
      if (data.section === 'body' && data.column.index === 3) {
        const grupo = grupos[data.row.index];
        data.cell.styles.textColor =
          grupo.tipo === 'positiva' ? [2, 132, 199] : [220, 38, 38];
      }
    },
  });

  // Rodapé com data de geração do relatório
  yPos = (doc as any).lastAutoTable.finalY + 5;
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

export { buildGruposFromRespostas };
