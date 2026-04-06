import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import jsPDF from 'jspdf';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * API para gerar e baixar contrato em PDF
 * GET /api/tomador/contrato-pdf
 */
export async function GET() {
  try {
    const session = await requireRole(['gestor', 'rh', 'admin']);
    const tomadorId = session.tomador_id;

    if (!tomadorId) {
      return NextResponse.json(
        { success: false, error: 'Sessão inválida: tomador não identificado' },
        { status: 401 }
      );
    }

    // Busca dados do contrato e do tomador (clínica ou entidade)
    const result = await query(
      `SELECT
        c.id AS numero_contrato,
        c.aceito,
        c.data_aceite,
        c.ip_aceite,
        c.hash_contrato,
        COALESCE(c.conteudo, c.conteudo_gerado) AS conteudo,
        t.nome AS tomador_nome,
        t.cnpj AS tomador_cnpj,
        t.email AS tomador_email,
        t.responsavel_nome,
        t.responsavel_cpf,
        t.responsavel_email,
        t.tipo AS tomador_tipo,
        COALESCE(e.cartao_cnpj_path, cl.cartao_cnpj_path) AS cartao_cnpj_path,
        COALESCE(e.contrato_social_path, cl.contrato_social_path) AS contrato_social_path,
        COALESCE(e.doc_identificacao_path, cl.doc_identificacao_path) AS doc_identificacao_path,
        COALESCE(e.telefone, cl.telefone, '') AS tomador_telefone,
        COALESCE(e.endereco, cl.endereco, '') AS tomador_endereco,
        COALESCE(e.cidade, cl.cidade, '') AS tomador_cidade,
        COALESCE(e.estado, cl.estado, '') AS tomador_estado
      FROM contratos c
      JOIN tomadores t ON t.id = c.tomador_id
      LEFT JOIN clinicas cl ON t.tipo = 'clinica' AND cl.id = t.id
      LEFT JOIN entidades e ON t.tipo = 'entidade' AND e.id = t.id
      WHERE c.tomador_id = $1
        AND c.aceito = true
      ORDER BY c.data_aceite DESC
      LIMIT 1`,
      [tomadorId],
      session
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Contrato não encontrado' },
        { status: 404 }
      );
    }

    const contrato = result.rows[0];

    // ── Calcular hashes dos documentos enviados ─────────────────────────
    const baseStorageDir = resolve(process.cwd(), 'storage');
    const docLabels: [string, string | null][] = [
      ['Cartão CNPJ', contrato.cartao_cnpj_path],
      ['Contrato Social', contrato.contrato_social_path],
      ['Doc. de Identificação', contrato.doc_identificacao_path],
    ];

    interface DocInfo {
      label: string;
      filename: string;
      hash: string;
      size: string;
    }
    const docsComHash: DocInfo[] = [];

    for (const [label, filePath] of docLabels) {
      if (!filePath) continue;

      // Remove a barra inicial se houver para evitar caminhos absolutos errados no resolve
      const relativePath = filePath.startsWith('/')
        ? filePath.slice(1)
        : filePath;

      // AJUSTE CRÍTICO: O banco já salva o caminho incluindo "storage/" em alguns casos
      // ou o resolve está duplicando a pasta storage.
      // Se o relativePath começar com "storage/", removemos para usar o baseStorageDir corretamente.
      const cleanPath = relativePath.startsWith('storage/')
        ? relativePath.replace('storage/', '')
        : relativePath;

      const fullPath = resolve(baseStorageDir, cleanPath);

      try {
        const buf = await readFile(fullPath);
        const hash = crypto.createHash('sha256').update(buf).digest('hex');
        const filename = cleanPath.split('/').pop() ?? cleanPath;

        // Formatação de tamanho
        const sizeInBytes = buf.length;
        const sizeFormatted =
          sizeInBytes > 1024 * 1024
            ? `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`
            : `${(sizeInBytes / 1024).toFixed(2)} KB`;

        docsComHash.push({ label, filename, hash, size: sizeFormatted });
      } catch (err) {
        console.error(`Erro ao processar hash do arquivo ${fullPath}:`, err);
      }
    }

    // ── Configuração do PDF ──────────────────────────────────────────────
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let y = 20;

    const checkPage = (heightNeeded: number) => {
      if (y + heightNeeded > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    };

    const writeText = (
      text: string,
      fontSize = 10,
      isBold = false,
      align: 'left' | 'center' | 'justify' = 'left'
    ) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      const lines = doc.splitTextToSize(text, maxWidth);
      lines.forEach((line: string) => {
        checkPage(fontSize * 0.5);
        doc.text(line, align === 'center' ? pageWidth / 2 : margin, y, {
          align: align === 'center' ? 'center' : 'left',
          maxWidth: align === 'justify' ? maxWidth : undefined,
        });
        y += fontSize * 0.5;
      });
      y += 2;
    };

    // ── Página 1: Capa e Aceite ─────────────────────────────────────────
    writeText(
      'FOLHA DE ROSTO E REGISTRO DE ACEITE DIGITAL',
      14,
      true,
      'center'
    );
    y += 5;

    const tipoLabel =
      contrato.tomador_tipo === 'clinica' ? 'Clínica' : 'Entidade';
    const dataAceite = contrato.data_aceite
      ? new Date(contrato.data_aceite).toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
        })
      : '—';

    const infoSociais = [
      ['Nº Contrato:', String(contrato.numero_contrato)],
      ['Tipo:', tipoLabel],
      ['Razão Social:', contrato.tomador_nome],
      ['CNPJ:', contrato.tomador_cnpj],
      ['Responsável:', contrato.responsavel_nome],
      ['CPF:', contrato.responsavel_cpf],
      ['E-mail/Login:', contrato.tomador_email],
      ['Data Aceite:', dataAceite],
      ['IP do Aceite:', contrato.ip_aceite ?? '—'],
    ];

    infoSociais.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(String(value ?? '—'), margin + 45, y);
      y += 6;
    });

    y += 8;
    writeText(
      'DOCUMENTOS ENVIADOS E HASHES DE INTEGRIDADE (SHA-256)',
      11,
      true
    );
    y += 2;

    if (docsComHash.length === 0) {
      writeText('Nenhum documento digital anexado no momento do aceite.', 9);
    } else {
      docsComHash.forEach((docInfo) => {
        writeText(
          `${docInfo.label}: ${docInfo.filename} (${docInfo.size})`,
          9,
          true
        );
        writeText(`SHA-256: ${docInfo.hash}`, 8);
        y += 2;
      });
    }

    y += 10;
    // Caixa de Aceite Verde
    doc.setDrawColor(34, 197, 94);
    doc.setFillColor(240, 253, 244);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin - 2, y, maxWidth + 4, 35, 2, 2, 'FD');

    y += 8;
    doc.setTextColor(21, 128, 61);
    writeText('ACEITE DIGITAL REGISTRADO', 11, true, 'center');
    writeText(
      'Este documento confirma que a CONTRATANTE leu e aceitou integralmente os termos deste contrato e as políticas de privacidade da plataforma QWORK.',
      9,
      false,
      'center'
    );
    doc.setTextColor(0);

    y += 20;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    const declaracaoTexto =
      'O aceite acima foi registrado eletronicamente pelo responsável legal do tomador, tendo plena validade jurídica nos termos do art. 10 da MP 2.200-2/2001 e da Lei 14.063/2020.';
    const declaracaoLines = doc.splitTextToSize(declaracaoTexto, maxWidth);
    doc.text(declaracaoLines, margin, y);

    // ── Página 2 em diante: Conteúdo do Contrato ────────────────────────
    doc.addPage();
    y = margin;
    writeText('CONTRATO DE PRESTAÇÃO DE SERVIÇOS', 14, true, 'center');
    writeText(
      'PLATAFORMA QWORK – AVALIAÇÃO DE RISCO PSICOSSOCIAL ORGANIZACIONAL',
      11,
      true,
      'center'
    );
    y += 8;

    writeText(
      'CONTRATADA: QWORK TECNOLOGIA E GESTÃO DE RISCOS LTDA, pessoa jurídica de direito privado, inscrita no CNPJ sob nº [●], com sede em [●], doravante denominada CONTRATADA.',
      10,
      true
    );
    writeText(
      'GESTORA (interveniente): MEUCLUBE.ONLINE BENEFÍCIOS E VANTAGENS LTDA, inscrita no CNPJ sob nº 21.020.277/0001-56, com sede na Rua Barão do Serro Azul, nº 198, 5º andar, Centro, Curitiba/PR, doravante denominada GESTORA.',
      10,
      true
    );
    writeText(
      `CONTRATANTE: ${contrato.tomador_nome}, inscrito no CNPJ sob nº ${contrato.tomador_cnpj}, com sede em ${contrato.tomador_endereco}, ${contrato.tomador_cidade}/${contrato.tomador_estado}.`,
      10,
      true
    );
    y += 5;

    // Conteúdo Principal
    if (contrato.conteudo) {
      const cleanContent = contrato.conteudo.replace(/<[^>]*>?/gm, '');
      writeText(cleanContent, 10, false, 'justify');
    } else {
      writeText('CLÁUSULA 1 – DO OBJETO', 11, true);
      writeText(
        'O presente contrato tem por objeto a disponibilização da plataforma digital QWORK, destinada à aplicação de questionário estruturado de avaliação psicossocial organizacional, com posterior geração de relatório analítico consolidado, voltado à gestão preventiva de riscos psicossociais no ambiente de trabalho.',
        10,
        false,
        'justify'
      );
      writeText(
        'Parágrafo único. A ferramenta possui finalidade exclusivamente organizacional, estatística e preventiva, em conformidade com as diretrizes da Norma Regulamentadora nº 1 (NR-1), não possuindo caráter clínico ou assistencial.',
        10,
        false,
        'justify'
      );

      writeText('CLÁUSULA 2 – DA NATUREZA DO SERVIÇO', 11, true);
      writeText(
        'A CONTRATANTE declara ciência de que: I – a plataforma não realiza diagnóstico psicológico ou psiquiátrico individual; II – não realiza atendimento clínico, terapêutico ou médico; III – não substitui avaliação profissional individualizada; IV – os relatórios gerados possuem natureza exclusivamente organizacional, coletiva e estatística.',
        10,
        false,
        'justify'
      );

      writeText('CLÁUSULA 3 – DO FUNCIONAMENTO DA PLATAFORMA', 11, true);
      writeText(
        'A utilização da plataforma ocorrerá mediante: I – cadastro da empresa CONTRATANTE; II – inclusão dos colaboradores pela própria CONTRATANTE; III – acesso individual mediante autenticação por CPF e data de nascimento; IV – preenchimento do questionário psicossocial; V – consolidação e tratamento dos dados coletados.',
        10,
        false,
        'justify'
      );

      writeText('CLÁUSULA 4 – DA ADESÃO MÍNIMA E EMISSÃO DE RELATÓRIO', 11, true);
      writeText(
        'A CONTRATANTE declara ciência de que a geração do relatório organizacional consolidado está condicionada à participação mínima de 70% (setenta por cento) dos colaboradores cadastrados.',
        10,
        false,
        'justify'
      );
      writeText(
        'Parágrafo primeiro. O percentual mínimo estabelecido visa garantir consistência estatística e validade técnica dos dados. Parágrafo segundo. O faturamento será realizado com base na totalidade dos colaboradores cadastrados, independentemente do percentual de adesão efetivamente atingido. Parágrafo terceiro. A não obtenção do percentual mínimo de adesão não configura inadimplemento da CONTRATADA. Parágrafo quarto. Compete exclusivamente à CONTRATANTE promover o engajamento dos colaboradores.',
        10,
        false,
        'justify'
      );

      writeText('CLÁUSULA 5 – DAS RESPONSABILIDADES DA CONTRATANTE', 11, true);
      writeText(
        'Compete à CONTRATANTE: I – fornecer dados corretos e atualizados; II – comunicar adequadamente seus colaboradores; III – garantir autenticidade das respostas; IV – utilizar os relatórios exclusivamente para fins organizacionais; V – adotar medidas internas decorrentes da análise dos resultados.',
        10,
        false,
        'justify'
      );

      writeText('CLÁUSULA 6 – DAS RESPONSABILIDADES DA QWORK', 11, true);
      writeText(
        'Compete à CONTRATADA: I – disponibilizar a plataforma em funcionamento regular; II – adotar medidas técnicas razoáveis de segurança da informação; III – processar os dados e gerar relatório consolidado; IV – observar a legislação aplicável.',
        10,
        false,
        'justify'
      );

      writeText('CLÁUSULA 7 – DA LIMITAÇÃO DE RESPONSABILIDADE', 11, true);
      writeText(
        'A QWORK não se responsabiliza por: I – decisões administrativas da CONTRATANTE; II – dados incorretos fornecidos; III – uso inadequado das informações; IV – ausência de adesão dos colaboradores; V – resultados interpretativos adotados pela CONTRATANTE.',
        10,
        false,
        'justify'
      );

      writeText('CLÁUSULA 8 – DA GESTÃO OPERACIONAL E COMERCIAL', 11, true);
      writeText(
        'A CONTRATANTE declara ciência de que a gestão operacional, comercial e administrativa da plataforma poderá ser realizada pela empresa MEUCLUBE.ONLINE BENEFÍCIOS E VANTAGENS LTDA, integrante do mesmo grupo econômico da CONTRATADA, sem que isso implique transferência de responsabilidade técnica ou jurídica pela prestação do serviço.',
        10,
        false,
        'justify'
      );

      writeText('CLÁUSULA 9 – DA RESPONSABILIDADE PELO TRATAMENTO DE DADOS E SEGURANÇA DAS INFORMAÇÕES', 11, true);
      writeText(
        'A CONTRATANTE declara, para todos os fins, que atua na condição de Controladora dos dados pessoais de seus colaboradores, sendo integralmente responsável pela coleta, base legal, veracidade, legitimidade e segurança das informações inseridas na plataforma.',
        10,
        false,
        'justify'
      );
      writeText(
        'Parágrafo primeiro. Compete exclusivamente à CONTRATANTE adotar medidas administrativas, técnicas e organizacionais adequadas para garantir a proteção dos dados pessoais sob sua responsabilidade. Parágrafo segundo. A CONTRATADA não será responsável por incidentes de segurança que decorram de falha ou descumprimento das obrigações legais por parte da CONTRATANTE. Parágrafo terceiro. A CONTRATANTE se responsabiliza integralmente por quaisquer danos decorrentes do tratamento indevido dos dados sob sua responsabilidade. Parágrafo quarto. A CONTRATADA compromete-se a adotar medidas técnicas razoáveis de segurança da informação, limitadas à sua atuação como operadora, nos termos da Lei nº 13.709/2018.',
        10,
        false,
        'justify'
      );

      writeText('CLÁUSULA 10 – DA NATUREZA JURÍDICA', 11, true);
      writeText(
        'O presente contrato possui natureza estritamente civil, inexistindo vínculo trabalhista, societário ou de representação entre as partes.',
        10,
        false,
        'justify'
      );

      writeText('CLÁUSULA 11 – DO ACEITE ELETRÔNICO', 11, true);
      writeText(
        'O presente contrato será considerado integralmente aceito no momento do primeiro acesso à plataforma.',
        10,
        false,
        'justify'
      );

      writeText('CLÁUSULA 12 – DA ASSINATURA DIGITAL', 11, true);
      writeText(
        'As partes reconhecem como válida a assinatura eletrônica, nos termos da MP nº 2.200-2/2001 e Lei nº 14.063/2020.',
        10,
        false,
        'justify'
      );

      writeText('CLÁUSULA 13 – DO FORO', 11, true);
      writeText(
        'Fica eleito o foro da comarca de Curitiba/PR, com renúncia expressa de qualquer outro, por mais privilegiado que seja.',
        10,
        false,
        'justify'
      );
    }

    // ── Logo QWork na última página ───────────────────────────────────
    let logoBase64: string | null = null;
    try {
      const logoPath = resolve(process.cwd(), 'public', 'logo-qwork.png');
      const logoBuffer = await readFile(logoPath);
      logoBase64 = logoBuffer.toString('base64');
    } catch {
      // Logo não encontrada — continua sem ela
    }

    const totalPages = doc.getNumberOfPages();

    if (logoBase64) {
      doc.setPage(totalPages);
      const logoWidth = 45;
      const logoHeight = 14;
      const logoX = (pageWidth - logoWidth) / 2;
      const logoY = pageHeight - 28;
      doc.addImage(logoBase64, 'PNG', logoX, logoY, logoWidth, logoHeight);
    }

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text(
        `Página ${i} de ${totalPages} | Documento gerado eletronicamente pelo sistema QWork`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="contrato-${contrato.numero_contrato}.pdf"`,
      },
    });
  } catch (error) {
    console.error('[API Contrato PDF] Erro ao gerar PDF:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao gerar PDF do contrato' },
      { status: 500 }
    );
  }
}
