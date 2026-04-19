/**
 * lib/tomador/gerar-contrato-pdf.ts
 *
 * Lógica compartilhada de geração de contrato PDF para tomadores.
 * Usada por:
 *   - GET /api/tomador/contrato-pdf  (gestor / rh)
 *   - GET /api/suporte/contratos/[tomadorId]/pdf  (suporte)
 */
import { query } from '@/lib/db';
import jsPDF from 'jspdf';
import fs from 'fs';
import path from 'path';

// ─── Design Tokens QWork ─────────────────────────────────────────────────────
const COR_PRIMARIA: [number, number, number] = [0, 0, 0];
const COR_ESCURA: [number, number, number] = [30, 30, 30];
const COR_MEDIA: [number, number, number] = [80, 80, 80];
const COR_CLARA: [number, number, number] = [220, 220, 220];
const COR_BG_VERDE: [number, number, number] = [248, 248, 248];

// ─── Cláusulas do Contrato ────────────────────────────────────────────────────
const CLAUSULAS: Array<{ titulo: string; paragrafos: string[] }> = [
  {
    titulo: 'CLÁUSULA 1 – DO OBJETO',
    paragrafos: [
      'O presente contrato tem por objeto a disponibilização da plataforma digital QWORK, destinada à aplicação de questionário estruturado de avaliação psicossocial organizacional, com posterior geração de relatório analítico consolidado, voltado à gestão preventiva de riscos psicossociais no ambiente de trabalho.',
      'Parágrafo único. A ferramenta possui finalidade exclusivamente organizacional, estatística e preventiva, em conformidade com as diretrizes da Norma Regulamentadora n° 1 (NR-1), não possuindo caráter clínico ou assistencial.',
    ],
  },
  {
    titulo: 'CLÁUSULA 2 – DA NATUREZA DO SERVIÇO',
    paragrafos: [
      'A CONTRATANTE declara ciência de que:',
      'I – a plataforma não realiza diagnóstico psicológico ou psiquiátrico individual;',
      'II – não realiza atendimento clínico, terapêutico ou médico;',
      'III – não substitui avaliação profissional individualizada;',
      'IV – os relatórios gerados possuem natureza exclusivamente organizacional, coletiva e estatística.',
    ],
  },
  {
    titulo: 'CLÁUSULA 3 – DO FUNCIONAMENTO DA PLATAFORMA',
    paragrafos: [
      'A utilização da plataforma ocorrerá mediante:',
      'I – cadastro da empresa CONTRATANTE;',
      'II – inclusão dos colaboradores pela própria CONTRATANTE;',
      'III – acesso individual mediante autenticação por CPF e data de nascimento;',
      'IV – preenchimento do questionário psicossocial;',
      'V – consolidação e tratamento dos dados coletados.',
    ],
  },
  {
    titulo: 'CLÁUSULA 4 – DA EVOLUÇÃO DA PLATAFORMA',
    paragrafos: [
      'A CONTRATADA poderá, a seu critério, promover atualizações, melhorias e modificações na plataforma, sem que isso implique alteração da natureza do serviço contratado.',
    ],
  },
  {
    titulo: 'CLÁUSULA 5 – DA ADESÃO MÍNIMA E EMISSÃO DE RELATÓRIO',
    paragrafos: [
      'A CONTRATANTE declara ciência de que a geração do relatório organizacional consolidado está condicionada à participação mínima de 70% (setenta por cento) dos colaboradores cadastrados.',
      'Parágrafo primeiro. O percentual mínimo estabelecido visa garantir consistência estatística e validade técnica dos dados.',
      'Parágrafo segundo. O faturamento será realizado com base na totalidade dos colaboradores cadastrados, independentemente do percentual de adesão efetivamente atingido.',
      'Parágrafo terceiro. A não obtenção do percentual mínimo de adesão não configura inadimplemento da CONTRATADA.',
      'Parágrafo quarto. Compete exclusivamente à CONTRATANTE promover o engajamento dos colaboradores.',
      'Decorridos 90 (noventa) dias da ativação da plataforma, caso não haja emissão de relatórios, será devida cobrança mínima no valor de R$ 250,00 (duzentos e cinquenta reais). A cobrança independe da efetiva utilização da plataforma, considerando a disponibilização do serviço.',
    ],
  },
  {
    titulo: 'CLÁUSULA 6 – DAS RESPONSABILIDADES DA CONTRATANTE',
    paragrafos: [
      'Compete à CONTRATANTE:',
      'I – fornecer dados corretos e atualizados;',
      'II – comunicar adequadamente seus colaboradores;',
      'III – garantir autenticidade das respostas;',
      'IV – utilizar os relatórios exclusivamente para fins organizacionais;',
      'V – adotar medidas internas decorrentes da análise dos resultados.',
    ],
  },
  {
    titulo: 'CLÁUSULA 7 – DAS RESPONSABILIDADES DA QWORK',
    paragrafos: [
      'Compete à CONTRATADA:',
      'I – disponibilizar a plataforma em funcionamento regular;',
      'II – adotar medidas técnicas razoáveis de segurança da informação;',
      'III – processar os dados e gerar relatório consolidado;',
      'IV – observar a legislação aplicável.',
    ],
  },
  {
    titulo: 'CLÁUSULA 8 – DA LIMITAÇÃO DE RESPONSABILIDADE',
    paragrafos: [
      'A QWORK não se responsabiliza por:',
      'I – decisões administrativas da CONTRATANTE;',
      'II – dados incorretos fornecidos;',
      'III – uso inadequado das informações;',
      'IV – ausência de adesão dos colaboradores;',
      'V – resultados interpretativos adotados pela CONTRATANTE.',
    ],
  },
  {
    titulo: 'CLÁUSULA 9 – DA GESTÃO OPERACIONAL E COMERCIAL',
    paragrafos: [
      'A CONTRATANTE declara ciência de que a gestão operacional, comercial e administrativa da plataforma poderá ser realizada pela empresa MEUCLUBE.ONLINE BENEFÍCIOS E VANTAGENS LTDA, integrante do mesmo grupo econômico da CONTRATADA, sem que isso implique transferência de responsabilidade técnica ou jurídica pela prestação do serviço.',
    ],
  },
  {
    titulo: 'CLÁUSULA 10 – DA SUSPENSÃO DE ACESSO',
    paragrafos: [
      'A CONTRATADA poderá suspender o acesso à plataforma em caso de inadimplemento, uso indevido ou descumprimento contratual.',
      'A suspensão não afasta a obrigação de pagamento dos valores contratados.',
    ],
  },
  {
    titulo:
      'CLÁUSULA 11 – DA RESPONSABILIDADE PELO TRATAMENTO DE DADOS E SEGURANÇA DAS INFORMAÇÕES',
    paragrafos: [
      'A CONTRATANTE declara, para todos os fins, que atua na condição de Controladora dos dados pessoais de seus colaboradores, sendo integralmente responsável pela coleta, base legal, veracidade, legitimidade e segurança das informações inseridas na plataforma.',
      'Parágrafo primeiro. Compete exclusivamente à CONTRATANTE adotar medidas administrativas, técnicas e organizacionais adequadas para garantir a proteção dos dados pessoais sob sua responsabilidade, especialmente no que se refere ao acesso, compartilhamento interno, armazenamento e uso das informações.',
      'Parágrafo segundo. A CONTRATADA não será responsável por incidentes de segurança, vazamentos, acessos indevidos ou qualquer forma de uso inadequado dos dados que decorram de falha, negligência, imprudência ou descumprimento das obrigações legais por parte da CONTRATANTE.',
      'Parágrafo terceiro. A CONTRATANTE se responsabiliza integralmente por quaisquer danos, prejuízos, sanções administrativas ou reclamações judiciais decorrentes do tratamento indevido dos dados sob sua responsabilidade, obrigando-se a ressarcir a CONTRATADA por eventuais prejuízos que venha a sofrer em razão de tais ocorrências.',
      'Parágrafo quarto. A CONTRATADA compromete-se a adotar medidas técnicas razoáveis de segurança da informação no âmbito da plataforma, limitadas à sua atuação como operadora, nos termos da Lei n° 13.709/2018.',
    ],
  },
  {
    titulo: 'CLÁUSULA 12 – DA NATUREZA JURÍDICA',
    paragrafos: [
      'O presente contrato possui natureza estritamente civil, inexistindo vínculo trabalhista, societário ou de representação entre as partes.',
    ],
  },
  {
    titulo: 'CLÁUSULA 13 – DA VIGÊNCIA E RESCISÃO',
    paragrafos: [
      'O contrato terá vigência mínima de 90 (noventa) dias.',
      'A rescisão antecipada por iniciativa da CONTRATANTE antes do prazo mínimo implicará pagamento de multa equivalente ao valor restante do período contratado.',
      'A utilização da plataforma sem a correspondente emissão de relatórios ou cumprimento da finalidade contratada não afasta a obrigação de pagamento.',
    ],
  },
  {
    titulo: 'CLÁUSULA 14 – DA PROPRIEDADE INTELECTUAL',
    paragrafos: [
      'A plataforma QWORK, incluindo seu código-fonte, estrutura, metodologia, banco de dados, layout, fluxos operacionais e relatórios, constitui propriedade exclusiva da CONTRATADA.',
      'É expressamente vedado à CONTRATANTE:',
      'I – copiar, reproduzir, modificar ou adaptar a plataforma;',
      'II – realizar engenharia reversa, descompilação ou qualquer tentativa de acesso à estrutura interna do sistema;',
      'III – utilizar as informações, metodologia ou lógica da plataforma para desenvolvimento de soluções concorrentes;',
      'IV – ceder, sublicenciar ou disponibilizar o sistema a terceiros fora das condições contratadas.',
      'O descumprimento desta cláusula sujeitará a CONTRATANTE ao pagamento de multa equivalente a 10 (dez) vezes o valor total contratado, sem prejuízo de perdas e danos.',
    ],
  },
  {
    titulo: 'CLÁUSULA 15 – DO ACEITE ELETRÔNICO',
    paragrafos: [
      'A adesão ao presente contrato ocorrerá mediante aceite eletrônico realizado pela CONTRATANTE na plataforma, por meio de ação inequívoca, como seleção de checkbox ou clique em botão de confirmação.',
      'Tal aceite constitui manifestação válida de vontade, produzindo todos os efeitos legais, nos termos da legislação vigente.',
      'A CONTRATANTE declara que teve acesso prévio ao contrato e concorda integralmente com seus termos.',
    ],
  },
  {
    titulo: 'CLÁUSULA 16 – DA ASSINATURA DIGITAL',
    paragrafos: [
      'As partes reconhecem como válida a assinatura eletrônica, nos termos da MP n° 2.200-2/2001 e Lei n° 14.063/2020.',
    ],
  },
  {
    titulo: 'CLÁUSULA 17 – DO FORO',
    paragrafos: [
      'Fica eleito o foro da comarca de Curitiba/PR, com renúncia expressa de qualquer outro, por mais privilegiado que seja.',
    ],
  },
];

export interface TomadorDataParaPdf {
  nome: string;
  cnpj: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  responsavel_nome: string;
  responsavel_cpf: string;
  responsavel_cargo?: string;
}

export interface ContratoDataParaPdf {
  id: number;
  aceito: boolean;
  data_aceite: string | null;
  ip_aceite: string | null;
  criado_em: string;
}

export type TipoTomador = 'clinica' | 'entidade';

/**
 * Busca dados do tomador e contrato aceito pelo banco.
 * Retorna null se não encontrar contrato aceito.
 */
export async function buscarDadosTomador(
  tomadorId: number,
  tipo: TipoTomador
): Promise<{
  tomadorData: TomadorDataParaPdf;
  contrato: ContratoDataParaPdf;
} | null> {
  const tabela = tipo === 'clinica' ? 'clinicas' : 'entidades';
  const tomadorResult = await query(
    `SELECT nome, cnpj, endereco, cidade, estado, cep,
            responsavel_nome, responsavel_cpf, responsavel_cargo
     FROM ${tabela} WHERE id = $1`,
    [tomadorId]
  );
  if (tomadorResult.rows.length === 0) return null;

  const contratoResult = await query(
    `SELECT id, aceito, data_aceite, ip_aceite, criado_em
     FROM contratos
     WHERE tomador_id = $1 AND aceito = true
     ORDER BY criado_em DESC LIMIT 1`,
    [tomadorId]
  );
  if (contratoResult.rows.length === 0) return null;

  return {
    tomadorData: tomadorResult.rows[0] as TomadorDataParaPdf,
    contrato: contratoResult.rows[0] as ContratoDataParaPdf,
  };
}

/**
 * Gera o PDF do contrato e retorna o Buffer.
 */
export function gerarPdfContrato(
  tomadorData: TomadorDataParaPdf,
  contrato: ContratoDataParaPdf
): Buffer {
  let logoBase64: string | null = null;
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo-qwork.png');
    logoBase64 = fs.readFileSync(logoPath).toString('base64');
  } catch {
    // Logo não disponível — continua sem ele
  }

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const M = 18;
  const CW = PW - M * 2;
  let y = 0;

  function addRunningHeader(): number {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COR_MEDIA);
    doc.text('CONTRATO DE PRESTAÇÃO DE SERVIÇOS – QWORK', M, 9);
    doc.setDrawColor(...COR_CLARA);
    doc.setLineWidth(0.25);
    doc.line(M, 11, PW - M, 11);
    doc.setTextColor(...COR_ESCURA);
    return 18;
  }

  function checkPage(needed = 8): void {
    if (y + needed > PH - 22) {
      doc.addPage();
      y = addRunningHeader();
    }
  }

  function addSectionTitle(text: string): void {
    checkPage(14);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COR_PRIMARIA);
    doc.text(text, M, y);
    y += 2;
    const titleW = Math.min(doc.getTextWidth(text) + 4, CW * 0.65);
    doc.setDrawColor(...COR_PRIMARIA);
    doc.setLineWidth(0.5);
    doc.line(M, y, M + titleW, y);
    doc.setDrawColor(...COR_CLARA);
    doc.setLineWidth(0.25);
    doc.line(M + titleW + 1, y, PW - M, y);
    y += 5;
    doc.setTextColor(...COR_ESCURA);
  }

  function addParagraph(text: string, italic = false): void {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', italic ? 'italic' : 'normal');
    doc.setTextColor(...COR_ESCURA);
    const lines = doc.splitTextToSize(text, CW) as string[];
    for (const line of lines) {
      checkPage(5);
      doc.text(line, M, y);
      y += 4.5;
    }
    y += 0.5;
  }

  function addField(label: string, value: string): void {
    if (!value) return;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COR_MEDIA);
    doc.text(label, M, y);
    const labelW = doc.getTextWidth(label + ' ');
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COR_ESCURA);
    const maxW = CW - labelW;
    if (doc.getTextWidth(value) <= maxW) {
      doc.text(value, M + labelW, y);
      y += 5;
    } else {
      const lines = doc.splitTextToSize(value, maxW) as string[];
      lines.forEach((line, i) => {
        if (i > 0) checkPage(5);
        doc.text(line, M + labelW, y);
        y += 5;
      });
    }
  }

  function addClauseSeparator(): void {
    y += 3;
    doc.setDrawColor(...COR_CLARA);
    doc.setLineWidth(0.25);
    doc.line(M, y, PW - M, y);
    y += 5;
  }

  // ═══════════════════════════════════════════════════════════════
  // PÁGINA 1: CAPA
  // ═══════════════════════════════════════════════════════════════

  if (logoBase64) {
    doc.addImage(
      `data:image/png;base64,${logoBase64}`,
      'PNG',
      PW / 2 - 28,
      12,
      56,
      18
    );
  } else {
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COR_PRIMARIA);
    doc.text('QWork', PW / 2, 22, { align: 'center' });
  }

  y = 52;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COR_ESCURA);
  doc.text('CONTRATO DE PRESTAÇÃO DE SERVIÇOS', PW / 2, y, { align: 'center' });
  y += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COR_MEDIA);
  doc.text(
    'Plataforma QWork – Avaliação de Risco Psicossocial Organizacional',
    PW / 2,
    y,
    { align: 'center' }
  );
  y += 14;

  // Card CONTRATANTE
  const cardContrY = y;
  const cardContrH = 52;
  doc.setFillColor(...COR_BG_VERDE);
  doc.roundedRect(M - 3, cardContrY - 4, CW + 6, cardContrH, 1, 1, 'F');
  doc.setDrawColor(...COR_PRIMARIA);
  doc.setLineWidth(0.4);
  doc.roundedRect(M - 3, cardContrY - 4, CW + 6, cardContrH, 1, 1, 'S');
  doc.setFillColor(...COR_PRIMARIA);
  doc.roundedRect(M - 3, cardContrY - 4, 3, cardContrH, 0.5, 0.5, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COR_PRIMARIA);
  doc.text('CONTRATANTE', M + 2, y);
  y += 6;

  addField('Razão Social:', tomadorData.nome);
  addField('CNPJ:', tomadorData.cnpj);
  if (tomadorData.endereco) {
    const endFull = [
      tomadorData.endereco,
      tomadorData.cidade,
      tomadorData.estado,
    ]
      .filter(Boolean)
      .join(', ');
    addField(
      'Endereço:',
      tomadorData.cep ? `${endFull}, CEP ${tomadorData.cep}` : endFull
    );
  }
  addField('Representante Legal:', tomadorData.responsavel_nome);
  addField('CPF:', tomadorData.responsavel_cpf);
  if (tomadorData.responsavel_cargo)
    addField('Cargo:', tomadorData.responsavel_cargo);

  y = cardContrY + cardContrH + 8;

  // Card DADOS DO ACEITE
  const cardAceiteY = y;
  const cardAceiteH = 38;
  doc.setFillColor(...COR_BG_VERDE);
  doc.roundedRect(M - 3, cardAceiteY - 4, CW + 6, cardAceiteH, 2, 2, 'F');
  doc.setDrawColor(...COR_PRIMARIA);
  doc.setLineWidth(0.4);
  doc.roundedRect(M - 3, cardAceiteY - 4, CW + 6, cardAceiteH, 2, 2, 'S');
  doc.setFillColor(...COR_PRIMARIA);
  doc.roundedRect(M - 3, cardAceiteY - 4, 3, cardAceiteH, 1, 1, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COR_PRIMARIA);
  doc.text('DADOS DO ACEITE ELETRÔNICO', M + 2, y);
  y += 6;

  addField('Contrato N°:', `#${contrato.id}`);
  if (contrato.data_aceite) {
    const dataAceite = new Date(contrato.data_aceite).toLocaleDateString(
      'pt-BR',
      {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }
    );
    const horaAceite = new Date(contrato.data_aceite).toLocaleTimeString(
      'pt-BR',
      {
        timeZone: 'America/Sao_Paulo',
        hour12: false,
      }
    );
    addField('Data de Aceite:', `${dataAceite} às ${horaAceite}`);
  }
  if (contrato.ip_aceite) addField('IP de Aceite:', contrato.ip_aceite);
  addField(
    'Modalidade:',
    'Aceite eletrônico via checkbox e confirmação na plataforma'
  );

  const notaY = PH - 26;
  doc.setDrawColor(...COR_CLARA);
  doc.setLineWidth(0.25);
  doc.line(M, notaY, PW - M, notaY);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...COR_MEDIA);
  doc.text(
    'Este documento tem validade jurídica nos termos da MP n° 2.200-2/2001 e Lei n° 14.063/2020.',
    PW / 2,
    notaY + 5,
    { align: 'center' }
  );
  doc.text(
    'O aceite eletrônico constitui manifestação válida de vontade, produzindo todos os efeitos legais.',
    PW / 2,
    notaY + 10,
    { align: 'center' }
  );

  // ═══════════════════════════════════════════════════════════════
  // PÁGINAS 2+: CONTEÚDO DO CONTRATO
  // ═══════════════════════════════════════════════════════════════

  doc.addPage();
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COR_PRIMARIA);
  doc.text('CONTRATO DE PRESTAÇÃO DE SERVIÇOS – QWORK', PW / 2, 22, {
    align: 'center',
  });
  y = 32;

  addParagraph(
    'Pelo presente instrumento particular, de um lado, QWORK TECNOLOGIA E ' +
      'GESTÃO DE RISCOS LTDA, doravante denominada CONTRATADA, e, na qualidade ' +
      'de interveniente gestora, MEUCLUBE.ONLINE BENEFÍCIOS E VANTAGENS LTDA, ' +
      'pessoa jurídica de direito privado, inscrita no CNPJ sob nº 21.020.277/0001-56, ' +
      'com sede na Rua Barão do Serro Azul, nº 198, 5º andar, Centro, Curitiba/PR, ' +
      'doravante denominada GESTORA, e, de outro lado, a CONTRATANTE, pessoa jurídica ' +
      'que realiza cadastro e contratação da plataforma mediante aceite eletrônico, ' +
      'têm entre si justo e acordado o presente contrato, que se regerá pelas cláusulas seguintes:'
  );
  y += 3;

  addSectionTitle('QUALIFICAÇÃO DA CONTRATANTE');
  addField('Razão Social:', tomadorData.nome);
  addField('CNPJ:', tomadorData.cnpj);
  if (tomadorData.endereco) {
    const endFull = [
      tomadorData.endereco,
      tomadorData.cidade,
      tomadorData.estado,
    ]
      .filter(Boolean)
      .join(', ');
    addField(
      'Endereço:',
      tomadorData.cep ? `${endFull}, CEP ${tomadorData.cep}` : endFull
    );
  }
  addField('Representante Legal:', tomadorData.responsavel_nome);
  addField('CPF:', tomadorData.responsavel_cpf);
  if (tomadorData.responsavel_cargo)
    addField('Cargo:', tomadorData.responsavel_cargo);
  y += 5;

  for (let i = 0; i < CLAUSULAS.length; i++) {
    addSectionTitle(CLAUSULAS[i].titulo);
    for (const paragrafo of CLAUSULAS[i].paragrafos) {
      addParagraph(paragrafo);
    }
    if (i < CLAUSULAS.length - 1) addClauseSeparator();
  }

  // ═══════════════════════════════════════════════════════════════
  // ASSINATURAS + LOGO FINAL
  // ═══════════════════════════════════════════════════════════════

  y += 8;
  checkPage(65);
  addSectionTitle('ASSINATURAS');

  if (contrato.data_aceite) {
    const dataAssinatura = new Date(contrato.data_aceite).toLocaleDateString(
      'pt-BR',
      {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }
    );
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COR_MEDIA);
    doc.text(`Curitiba/PR, ${dataAssinatura}`, M, y);
    y += 10;
  }

  const boxW = (CW - 10) / 2;
  const boxH = 30;
  const boxR = M + boxW + 10;

  doc.setFillColor(...COR_BG_VERDE);
  doc.roundedRect(M, y, boxW, boxH + 8, 1, 1, 'F');
  doc.setDrawColor(...COR_PRIMARIA);
  doc.setLineWidth(0.35);
  doc.roundedRect(M, y, boxW, boxH + 8, 1, 1, 'S');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COR_PRIMARIA);
  doc.text('CONTRATANTE', M + boxW / 2, y + 5.5, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COR_ESCURA);
  doc.text(tomadorData.nome, M + boxW / 2, y + 12, {
    align: 'center',
    maxWidth: boxW - 4,
  });
  doc.setFontSize(7.5);
  doc.setTextColor(...COR_ESCURA);
  doc.text(
    `Responsável: ${tomadorData.responsavel_nome}`,
    M + boxW / 2,
    y + 18,
    { align: 'center', maxWidth: boxW - 4 }
  );
  doc.text(`CPF: ${tomadorData.responsavel_cpf}`, M + boxW / 2, y + 23, {
    align: 'center',
  });
  if (contrato.data_aceite) {
    const dataAceiteStr = new Date(contrato.data_aceite).toLocaleString(
      'pt-BR',
      { timeZone: 'America/Sao_Paulo' }
    );
    doc.setFontSize(7);
    doc.setTextColor(...COR_MEDIA);
    doc.text(`Aceite em: ${dataAceiteStr}`, M + boxW / 2, y + 29, {
      align: 'center',
    });
  }

  doc.setFillColor(...COR_BG_VERDE);
  doc.roundedRect(boxR, y, boxW, boxH + 8, 1, 1, 'F');
  doc.setDrawColor(...COR_PRIMARIA);
  doc.roundedRect(boxR, y, boxW, boxH + 8, 1, 1, 'S');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COR_PRIMARIA);
  doc.text('CONTRATADA', boxR + boxW / 2, y + 5.5, { align: 'center' });
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COR_ESCURA);
  doc.text(
    'QWORK TECNOLOGIA E GESTÃO DE RISCOS LTDA',
    boxR + boxW / 2,
    y + 12,
    { align: 'center', maxWidth: boxW - 4 }
  );
  doc.setTextColor(...COR_MEDIA);
  doc.text('CNPJ: [●]', boxR + boxW / 2, y + 20, { align: 'center' });
  doc.text('Curitiba/PR', boxR + boxW / 2, y + 26, { align: 'center' });

  y += boxH + 22;

  checkPage(28);
  if (logoBase64) {
    doc.addImage(
      `data:image/png;base64,${logoBase64}`,
      'PNG',
      PW / 2 - 26,
      y,
      52,
      17
    );
    y += 21;
  }

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...COR_MEDIA);
  doc.text(
    'Contrato gerado e assinado eletronicamente pela plataforma QWork.',
    PW / 2,
    y,
    { align: 'center' }
  );

  // Rodapé em todas as páginas
  const totalPages =
    (
      doc.internal as { getNumberOfPages?: () => number }
    ).getNumberOfPages?.() ?? 1;
  const geradoEm = new Date().toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
  });

  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(...COR_CLARA);
    doc.setLineWidth(0.25);
    doc.line(M, PH - 12, PW - M, PH - 12);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COR_MEDIA);
    doc.text('QWork – Avalie. Previna. Proteja.', M, PH - 7);
    doc.text(`Página ${p} de ${totalPages}`, PW / 2, PH - 7, {
      align: 'center',
    });
    doc.text(`Gerado em ${geradoEm}`, PW - M, PH - 7, { align: 'right' });
  }

  return Buffer.from(doc.output('arraybuffer'));
}
