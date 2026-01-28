import jsPDF from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';

// Apply the autoTable plugin to jsPDF
applyPlugin(jsPDF);

// Extend jsPDF with autoTable plugin
declare module 'jspdf' {
  interface jsPDF {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    autoTable: (options: any) => jsPDF;
    lastAutoTable?: {
      finalY: number;
    };
  }
}

export interface RelatorioData {
  empresa: string;
  lote?: {
    id: string | number;
    codigo: string;
    titulo: string;
  };
  data?: string;
  total_avaliacoes: number;
  avaliacoes: Array<{
    id: number;
    funcionario: {
      cpf: string;
      nome: string;
      perfil: string;
    };
    envio: string;
    grupos: Array<{
      id: number;
      titulo: string;
      dominio: string;
      media: string;
      classificacao: string;
      corClassificacao: string;
      respostas: Array<{
        item: string;
        valor: number;
        texto: string;
      }>;
    }>;
  }>;
}

export interface DadosFuncionario {
  nome: string;
  cpf: string;
  perfil: string;
  empresa: string;
  setor?: string;
  funcao?: string;
  matricula?: string;
  lote?: {
    id: string | number;
    codigo: string;
    titulo: string;
  };
}

export interface Grupo {
  id: number;
  titulo: string;
  dominio: string;
  media: string;
  classificacao: string;
  corClassificacao: string;
  respostas: Array<{
    item: string;
    valor: number;
    texto: string;
  }>;
}

// Mapeamento de valores para texto de frequência
const frequenciaMap: { [key: number]: string } = {
  0: 'Nunca',
  25: 'Raramente',
  50: 'Às vezes',
  75: 'Muitas vezes',
  100: 'Sempre',
};

// Função auxiliar para desenhar um grupo no relatório
function desenharGrupo(
  doc: jsPDF,
  grupo: Grupo,
  x: number,
  y: number,
  width: number
): number {
  const margemInterna = 2;
  const alturaCabecalho = 10;
  const espacoEntreLinhas = 7;

  // Definir cor baseada na classificação
  let corClassificacao: [number, number, number] = [0, 0, 0];
  let textoClassificacao = grupo.classificacao;

  if (
    grupo.classificacao.includes('Excelente') ||
    grupo.classificacao.includes('Baixo Risco')
  ) {
    corClassificacao = [34, 197, 94]; // Verde
    textoClassificacao = 'Excelente (Baixo Risco)';
  } else if (
    grupo.classificacao.includes('Monitorar') ||
    grupo.classificacao.includes('Médio Risco')
  ) {
    corClassificacao = [251, 146, 60]; // Laranja
    textoClassificacao = 'Monitorar (Médio Risco)';
  } else if (
    grupo.classificacao.includes('Atenção') ||
    grupo.classificacao.includes('Alto Risco')
  ) {
    corClassificacao = [239, 68, 68]; // Vermelho
    textoClassificacao = 'Atenção (Alto Risco)';
  }

  // Desenhar borda do grupo
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);

  let alturaAtual = y;

  // Cabeçalho do grupo
  doc.setFillColor(245, 245, 245);
  doc.rect(x, alturaAtual, width, alturaCabecalho, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(grupo.titulo, x + margemInterna, alturaAtual + 4);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(
    corClassificacao[0],
    corClassificacao[1],
    corClassificacao[2]
  );
  doc.text(
    `Classificação de risco: ${textoClassificacao}`,
    x + margemInterna,
    alturaAtual + 8
  );

  alturaAtual += alturaCabecalho;

  // Desenhar perguntas e respostas (apenas respostas com valor numérico válido 0..100)
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');

  const respostasAtivas = (grupo.respostas || []).filter(
    (r) =>
      typeof r.valor === 'number' &&
      Number.isFinite(r.valor) &&
      r.valor >= 0 &&
      r.valor <= 100
  );

  if (respostasAtivas.length === 0) {
    // Indicar que não há respostas válidas para exibição (pode ser grupo sem respostas ativas)
    doc.setFontSize(6);
    doc.setTextColor(120);
    doc.text('Sem respostas válidas', x + margemInterna, alturaAtual + 3.5);
    alturaAtual += espacoEntreLinhas;
  } else {
    respostasAtivas.forEach((resposta, idx) => {
      const textoFrequencia =
        frequenciaMap[resposta.valor] || resposta.valor.toString();

      // Fundo alternado para melhor legibilidade
      if (idx % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(x, alturaAtual, width, espacoEntreLinhas, 'F');
      }

      // Texto da pergunta
      doc.setTextColor(0, 0, 0);
      const textoPergunta = doc.splitTextToSize(resposta.texto, width - 18);
      doc.text(textoPergunta, x + margemInterna, alturaAtual + 3.5);

      // Resposta com cor (SEM valor numérico sobreposto)
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0); // Todas as respostas em cor preta
      doc.text(textoFrequencia, x + width - 15, alturaAtual + 3.5);

      doc.setFont('helvetica', 'normal');
      alturaAtual += espacoEntreLinhas * textoPergunta.length;
    });
  }

  // Borda final do grupo
  const alturaTotal = alturaAtual - y;
  doc.setDrawColor(200, 200, 200);
  doc.rect(x, y, width, alturaTotal);

  return alturaAtual;
}

// Função para gerar relatório individual seguindo o modelo da imagem
export function gerarRelatorioFuncionarioPDF(
  dadosFuncionario: DadosFuncionario,
  grupos: Grupo[]
): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margemLateral = 10;
  const larguraColunaGrupo = (pageWidth - margemLateral * 3) / 2;

  let yPosition = 15;

  // ===== CABEÇALHO =====
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(
    margemLateral,
    yPosition,
    pageWidth - margemLateral * 2,
    22,
    2,
    2,
    'F'
  );

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(
    'Detalhes da Avaliação - ' + dadosFuncionario.nome,
    margemLateral + 3,
    yPosition + 5
  );

  yPosition += 8;

  // Linha com informações
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  // Nº avaliação (vamos usar parte do CPF como ID)
  const numeroAvaliacao = dadosFuncionario.cpf.substring(0, 3);
  doc.setFont('helvetica', 'bold');
  doc.text('Nº', margemLateral + 3, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(numeroAvaliacao, margemLateral + 10, yPosition);

  // CPF
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 255);
  doc.text('CPF:', margemLateral + 25, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 255);
  const cpfFormatado = dadosFuncionario.cpf.replace(
    /(\d{3})(\d{3})(\d{3})(\d{2})/,
    '$1.$2.$3-$4'
  );
  doc.text(cpfFormatado, margemLateral + 35, yPosition);

  // Setor
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Setor:', margemLateral + 75, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(dadosFuncionario.setor || 'N/A', margemLateral + 85, yPosition);

  // Função
  doc.setFont('helvetica', 'bold');
  doc.text('Função:', margemLateral + 110, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(dadosFuncionario.funcao || 'N/A', margemLateral + 125, yPosition);

  yPosition += 5;

  // Matricula e Nível
  doc.setFont('helvetica', 'bold');
  doc.text('Matrícula:', margemLateral + 3, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(dadosFuncionario.matricula || 'N/A', margemLateral + 20, yPosition);

  // Nível (gestao)
  doc.setFont('helvetica', 'bold');
  doc.text('Nível:', margemLateral + 50, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(dadosFuncionario.perfil, margemLateral + 60, yPosition);

  // Data de conclusão
  doc.setFont('helvetica', 'bold');
  doc.text('Concluída em:', margemLateral + 120, yPosition);
  doc.setFont('helvetica', 'normal');
  const dataAtual = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const horaAtual = new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`${dataAtual} ${horaAtual}`, margemLateral + 150, yPosition);

  yPosition += 8;

  // ===== GRUPOS EM 2 COLUNAS (5 grupos por coluna = 10 grupos total) =====
  const gruposOrdenados = [...grupos].sort((a, b) => a.id - b.id);
  const gruposPorPagina = 10;

  for (let i = 0; i < gruposOrdenados.length; i += gruposPorPagina) {
    if (i > 0) {
      doc.addPage();
      yPosition = 15;
    }

    const gruposNestaPagina = gruposOrdenados.slice(i, i + gruposPorPagina);
    const gruposColuna1 = gruposNestaPagina.slice(0, 5);
    const gruposColuna2 = gruposNestaPagina.slice(5, 10);

    let yColuna1 = yPosition;
    let yColuna2 = yPosition;

    // Coluna 1 (esquerda)
    gruposColuna1.forEach((grupo) => {
      yColuna1 =
        desenharGrupo(doc, grupo, margemLateral, yColuna1, larguraColunaGrupo) +
        5;
    });

    // Coluna 2 (direita)
    gruposColuna2.forEach((grupo) => {
      yColuna2 =
        desenharGrupo(
          doc,
          grupo,
          margemLateral * 2 + larguraColunaGrupo,
          yColuna2,
          larguraColunaGrupo
        ) + 5;
    });
  }

  // Footer com número de página
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 10, {
      align: 'center',
    });
  }

  // Download
  const nomeArquivo = `relatorio-${dadosFuncionario.nome.replace(/\s+/g, '-').toLowerCase()}.pdf`;
  doc.save(nomeArquivo);
}

// Função para gerar relatório do lote (conjunto de relatórios individuais)
export function gerarRelatorioLotePDF(dados: RelatorioData): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margemLateral = 10;
  const larguraColunaGrupo = (pageWidth - margemLateral * 3) / 2;

  dados.avaliacoes.forEach((avaliacao, indexAvaliacao) => {
    if (indexAvaliacao > 0) {
      doc.addPage();
    }

    let yPosition = 15;

    // ===== CABEÇALHO =====
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(
      margemLateral,
      yPosition,
      pageWidth - margemLateral * 2,
      22,
      2,
      2,
      'F'
    );

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(
      'Detalhes da Avaliação - ' + avaliacao.funcionario.nome,
      margemLateral + 3,
      yPosition + 5
    );

    yPosition += 8;

    // Linha com informações
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    // Nº avaliação
    const numeroAvaliacao = avaliacao.id.toString();
    doc.setFont('helvetica', 'bold');
    doc.text('Nº', margemLateral + 3, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(numeroAvaliacao, margemLateral + 10, yPosition);

    // CPF
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 255);
    doc.text('CPF:', margemLateral + 25, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 255);
    const cpfFormatado = avaliacao.funcionario.cpf.replace(
      /(\d{3})(\d{3})(\d{3})(\d{2})/,
      '$1.$2.$3-$4'
    );
    doc.text(cpfFormatado, margemLateral + 35, yPosition);

    // Perfil (gestao)
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('gestao', margemLateral + 75, yPosition);

    // Data de conclusão
    doc.setFont('helvetica', 'bold');
    doc.text('Concluída em:', margemLateral + 120, yPosition);
    doc.setFont('helvetica', 'normal');
    const dataConclusao = new Date(avaliacao.envio).toLocaleDateString(
      'pt-BR',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }
    );
    const horaConclusao = new Date(avaliacao.envio).toLocaleTimeString(
      'pt-BR',
      {
        hour: '2-digit',
        minute: '2-digit',
      }
    );
    doc.text(
      `${dataConclusao} ${horaConclusao}`,
      margemLateral + 150,
      yPosition
    );

    yPosition += 10;

    // ===== GRUPOS EM 2 COLUNAS (5 grupos por coluna = 10 grupos total) =====
    const gruposOrdenados = [...avaliacao.grupos].sort((a, b) => a.id - b.id);
    const gruposPorPagina = 10;

    for (let i = 0; i < gruposOrdenados.length; i += gruposPorPagina) {
      if (i > 0) {
        doc.addPage();
        yPosition = 15;
      }

      const gruposNestaPagina = gruposOrdenados.slice(i, i + gruposPorPagina);
      const gruposColuna1 = gruposNestaPagina.slice(0, 5);
      const gruposColuna2 = gruposNestaPagina.slice(5, 10);

      let yColuna1 = yPosition;
      let yColuna2 = yPosition;

      // Coluna 1 (esquerda)
      gruposColuna1.forEach((grupo) => {
        yColuna1 =
          desenharGrupo(
            doc,
            grupo,
            margemLateral,
            yColuna1,
            larguraColunaGrupo
          ) + 3;
      });

      // Coluna 2 (direita)
      gruposColuna2.forEach((grupo) => {
        yColuna2 =
          desenharGrupo(
            doc,
            grupo,
            margemLateral * 2 + larguraColunaGrupo,
            yColuna2,
            larguraColunaGrupo
          ) + 3;
      });
    }
  });

  // Footer com número de página
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 10, {
      align: 'center',
    });
  }

  // Download
  const nomeArquivo = `relatorio-lote-${dados.lote?.codigo || 'geral'}.pdf`;
  doc.save(nomeArquivo);
}
