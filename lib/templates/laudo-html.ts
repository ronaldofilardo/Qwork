// Template HTML para geração de laudos psicossociais
// Extração do HTML inline para facilitar manutenção

import {
  DadosGeraisEmpresa,
  ScoreGrupo,
  InterpretacaoRecomendacoes,
  ObservacoesConclusao,
} from '../laudo-tipos';
import { getLogoSignatureTemplate } from '../pdf/puppeteer-templates';
import { formatarDataCorrigida, formatarDataApenasData, formatarHora } from '../pdf/timezone-helper';

export interface LaudoDadosCompletos {
  loteId: number; // ID do lote (alinhado com laudo.id)
  etapa1: DadosGeraisEmpresa;
  etapa2?: ScoreGrupo[];
  etapa3?: InterpretacaoRecomendacoes;
  etapa4?: ObservacoesConclusao;
  emitidoEm?: Date | string;
}

function gerarEstilosCSS(): string {
  return `
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
        line-height: 1.4;
        color: #1f2937;
        background: white;
        padding: 0;
        margin: 0;
        font-size: 9pt;
      }

      .container {
        max-width: 100%;
        margin: 0;
        background: white;
        padding: 15mm;
      }

      .header {
        text-align: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 2px solid #e5e7eb;
      }

      .header h1 {
        font-size: 18pt;
        font-weight: bold;
        color: #111827;
        margin-bottom: 4px;
      }

      .header h2 {
        font-size: 11pt;
        color: #4b5563;
        margin-bottom: 4px;
      }

      .header p {
        font-size: 9pt;
        color: #6b7280;
        font-weight: 500;
      }

      .section {
        margin-bottom: 20px;
        page-break-inside: avoid;
      }

      .section-title {
        font-size: 12pt;
        font-weight: bold;
        color: #111827;
        margin-bottom: 10px;
        padding-bottom: 4px;
        border-bottom: 2px solid #4b5563;
      }

      .subsection-title {
        font-size: 13pt;
        font-weight: 600;
        color: #111827;
        margin-bottom: 12px;
        margin-top: 20px;
      }

      .empresa-info {
        background-color: #f9fafb;
        padding: 10px;
        border-radius: 4px;
        margin-bottom: 10px;
      }

      .empresa-info p {
        margin-bottom: 4px;
        line-height: 1.4;
        font-size: 8pt;
      }

      .empresa-info strong {
        color: #6b7280;
        font-size: 7pt;
        font-weight: 600;
        display: inline;
        margin-right: 4px;
      }

      .empresa-info span {
        color: #111827;
        font-size: 8pt;
        font-weight: 500;
      }

      .info-box {
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 20px;
        border-left: 4px solid;
      }

      .info-box-azul {
        background: linear-gradient(to right, #dbeafe, #bfdbfe);
        border-color: #3b82f6;
      }

      .info-box p {
        font-size: 10pt;
        line-height: 1.7;
      }

      .resumo-grid {
        display: flex;
        flex-direction: row;
        gap: 20px;
        margin-top: 20px;
        flex-wrap: wrap;
      }

      .resumo-card {
        padding: 18px;
      }

      .resumo-card-verde {
      }

      .resumo-card-amarelo {
      }

      .resumo-card-vermelho {
      }

      .conclusao {
        margin-top: 30px;
        font-weight: 500;
        text-align: justify;
        line-height: 1.8;
      }

      .assinatura-gov {
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 20px;
        margin: 20px auto;
        max-width: 500px;
        text-align: center;
      }

      .footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #e5e7eb;
        font-size: 9pt;
        text-align: center;
        color: #6b7280;
      }

      .legenda {
        background: #dbeafe;
        padding: 12px 16px;
        border-radius: 8px;
        margin-top: 15px;
        border-left: 4px solid #3b82f6;
      }

      /* Estilos compactos para a tabela de scores (ajusta altura para caber na página 1) */
      .compact-table th, .compact-table td {
        padding: 2px 4px !important;
        font-size: 6.5pt !important;
        line-height: 1 !important;
        vertical-align: middle !important;
      }

      .compact-table td .grupo-badge {
        display: inline-block; width: 16px; height: 16px; line-height: 16px; border-radius: 50%; font-size: 6pt; font-weight: bold; text-align: center;
      }

      @page {
        margin: 15mm 10mm 15mm 10mm;
        size: A4;
        
        @bottom-center {
          content: "Página " counter(page) " de " counter(pages) " | Lote #${'{{LOTE_ID}}'} | Data de Emissão: ${'{{DATA_EMISSAO}}'}";
          font-size: 8pt;
          color: #6b7280;
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
        }
      }

      @media print {
        body {
          background: white;
        }
        .container {
          padding: 0;
        }
        p, li {
          text-align: justify;
          orphans: 3;
          widows: 3;
        }
        .section {
          break-inside: avoid;
        }
        table {
          break-inside: avoid;
        }
      }
    </style>
  `;
}

function gerarCabecalho(): string {
  return `
    <div class="header">
      <h1>Laudo de Identificação e Mapeamento de Riscos Psicossociais (NR-1 / GRO)</h1>
      <h2>Avaliação de Saúde Mental no Trabalho</h2>
      <p>Baseada no instrumento COPSOQ III</p>
    </div>
  `;
}

function gerarSecaoEtapa1(etapa1: DadosGeraisEmpresa): string {
  return `
    <div class="section">
      <div class="section-title">1. DADOS GERAIS DA EMPRESA AVALIADA</div>
      <div class="empresa-info">
        <p><strong>Empresa Avaliada:</strong> <span>${etapa1.empresaAvaliada}</span></p>
        <p><strong>CNPJ:</strong> <span>${etapa1.cnpj}</span></p>
        <p><strong>Endereço:</strong> <span>${etapa1.endereco}</span></p>
        <p><strong>Período das Avaliações Consideradas:</strong> <span>${etapa1.periodoAvaliacoes.dataLiberacao} a ${etapa1.periodoAvaliacoes.dataUltimaConclusao}</span></p>
        <p><strong>Total de Funcionários Avaliados:</strong> <span>${etapa1.totalFuncionariosAvaliados} (${etapa1.percentualConclusao}% das avaliações ativas foram concluídas)</span></p>
        <p><strong>Amostra:</strong> <span>${etapa1.amostra.operacional} funcionários do nível Operacional + ${etapa1.amostra.gestao} do nível Gestão</span></p>
      </div>
    </div>
  `;
}

function gerarSecaoEtapa2(etapa2: ScoreGrupo[]): string {
  const linhasTabela = etapa2
    .map((score, index) => {
      const bgColor = index % 2 === 0 ? '#f9fafb' : '#ffffff';
      const badgeColor =
        score.classificacaoSemaforo === 'verde'
          ? '#dcfce7'
          : score.classificacaoSemaforo === 'amarelo'
            ? '#fef9c3'
            : '#fee2e2';
      const badgeTextColor =
        score.classificacaoSemaforo === 'verde'
          ? '#15803d'
          : score.classificacaoSemaforo === 'amarelo'
            ? '#a16207'
            : '#b91c1c';
      const badgeText =
        score.categoriaRisco === 'baixo'
          ? 'Excelente'
          : score.categoriaRisco === 'medio'
            ? 'Monitorar'
            : 'Atenção Necessária';

      return `
      <tr style="background-color: ${bgColor};">
        <td style="border: 1px solid #d1d5db; padding: 4px 6px; text-align: center; font-size: 7pt;">
          <div class="grupo-badge" style="background-color: #e5e7eb; color: #1f2937;">${score.grupo}</div>
        </td>
        <td style="border: 1px solid #d1d5db; font-size: 6.5pt; color: #111827;">${score.dominio}</td>
        <td style="border: 1px solid #d1d5db; font-size: 6.5pt; color: #4b5563;">${score.descricao}</td>
        <td style="border: 1px solid #d1d5db; text-align: center; font-size: 6.5pt;">
          <span style="display: inline-block; padding: 2px 6px; font-size: 6pt; font-weight: bold; border-radius: 3px; background-color: ${score.tipo === 'positiva' ? '#dbeafe' : '#f3e8ff'}; color: ${score.tipo === 'positiva' ? '#1e40af' : '#6b21a8'};">
            ${score.tipo === 'positiva' ? 'Positiva' : 'Negativa'}
          </span>
        </td>
        <td style="border: 1px solid #d1d5db; text-align: center; font-size: 6.5pt; color: #4b5563;">${score.mediaMenosDP.toFixed(1)}</td>
        <td style="border: 1px solid #d1d5db; text-align: center; font-size: 6.5pt; font-weight: bold; color: #111827;">${score.media.toFixed(1)}</td>
        <td style="border: 1px solid #d1d5db; text-align: center; font-size: 6.5pt; color: #4b5563;">${score.mediaMaisDP.toFixed(1)}</td>
        <td style="border: 1px solid #d1d5db; padding: 3px 6px; text-align: center;">
          <span style="display: inline-block; padding: 2px 6px; font-size: 6pt; font-weight: bold; border-radius: 3px; background-color: ${badgeColor}; color: ${badgeTextColor};">
            ${badgeText}
          </span>
        </td>
      </tr>
    `;
    })
    .join('');

  return `
    <div class="section">
      <div class="section-title">2. SCORES MÉDIOS POR GRUPO DE QUESTÕES (escala 0-100)</div>
      
      <table class="compact-table" style="width: 100%; border-collapse: collapse; font-size: 7pt; margin-top: 6px;">
        <thead>
          <tr style="background: linear-gradient(to right, #1f2937, #374151);">
            <th style="border: 1px solid #6b7280; text-align: center; color: white; font-weight: bold; font-size: 6.5pt; min-width: 36px;">Grupo</th>
            <th style="border: 1px solid #6b7280; text-align: left; color: white; font-weight: bold; font-size: 6.5pt;">Domínio</th>
            <th style="border: 1px solid #6b7280; text-align: left; color: white; font-weight: bold; font-size: 6.5pt;">Descrição</th>
            <th style="border: 1px solid #6b7280; text-align: center; color: white; font-weight: bold; font-size: 6.5pt;">Tipo</th>
            <th style="border: 1px solid #6b7280; text-align: center; color: white; font-weight: bold; font-size: 6.5pt;">x̄ - s</th>
            <th style="border: 1px solid #6b7280; text-align: center; color: white; font-weight: bold; font-size: 6.5pt;">Média Geral</th>
            <th style="border: 1px solid #6b7280; text-align: center; color: white; font-weight: bold; font-size: 6.5pt;">x̄ + s</th>
            <th style="border: 1px solid #6b7280; text-align: center; color: white; font-weight: bold; font-size: 6.5pt;">Categoria de Risco</th>
          </tr>
        </thead>
        <tbody>
          ${linhasTabela}
        </tbody>
      </table>

      <div class="legenda" style="margin-top: 8px; padding: 6px 10px;">
        <p style="font-size: 7pt;"><strong>x̄</strong> = média, <strong>s</strong> = desvio-padrão</p>
      </div>

      <div style="margin-top: 15px; padding: 10px; background-color: #f9fafb; border-radius: 4px; border-left: 4px solid #6b7280;">
        <p style="font-size: 9pt; line-height: 1.4; color: #374151; text-align: justify;">
          A amostragem acima descrita foi submetida à avaliação psicossocial para verificação de seu estado de saúde mental, como condição necessária à realização do trabalho. Durante o período da avaliação, foi possível identificar os pontos acima descritos.
        </p>
      </div>
    </div>
  `;
}

function gerarSecaoEtapa3(etapa3: InterpretacaoRecomendacoes): string {
  // Somente o título e o box de interpretação (aparece na página 1). Os cartões detalhados são gerados separadamente em páginas seguintes.
  return `
    <div class="section">
      <div class="section-title">3. INTERPRETAÇÃO E RECOMENDAÇÕES</div>
      <div class="info-box info-box-azul">
        <p>${etapa3.conclusao}</p>
      </div>
    </div>
  `;
}

function gerarCardsEtapa3(etapa3: InterpretacaoRecomendacoes): string {
  const cardsGrupos: string[] = [];

  if (etapa3.gruposExcelente && etapa3.gruposExcelente.length > 0) {
    cardsGrupos.push(`
      <div style="page-break-before: always;">
        <div class="resumo-card resumo-card-verde">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 16pt; margin-right: 8px;">🟢</span>
            <h4 style="color: #15803d;">1. Risco Psicossocial Baixo (menor que 33%)</h4>
          </div>
          <p style="color: #166534; font-weight: 600; margin-bottom: 8px;">Consideração final detalhada:</p>
          <p style="color: #166534; font-size: 9pt; line-height: 1.4; margin-bottom: 8px;">
            Os resultados obtidos no Questionário Psicossocial de Copenhague (COPSOQ) indicam um baixo risco psicossocial no ambiente de trabalho, correspondendo ao tertil inferior de exposição a fatores de risco. Isso significa que, de modo geral, as condições organizacionais favorecem o bem-estar e a saúde mental dos trabalhadores. Os fatores psicossociais avaliados — como demandas quantitativas, emocionais, apoio social, influência no trabalho, reconhecimento e equilíbrio entre vida pessoal e profissional — estão sendo geridos de forma adequada, sem evidências de impactos negativos relevantes.
          </p>
          <p style="color: #166534; font-size: 9pt; line-height: 1.4; margin-bottom: 8px;">
            De acordo com a NR-01, um cenário de baixo risco não elimina a necessidade de monitoramento contínuo, mas demonstra que as ações preventivas e de promoção à saúde mental estão sendo eficazes. Recomenda-se que a organização mantenha as boas práticas atuais, como:
          </p>
          <ul style="color: #166534; font-size: 8pt; line-height: 1.4; margin-left: 16px; margin-bottom: 8px;">
            <li>• Comunicação aberta entre equipes e gestores;</li>
            <li>• Políticas de reconhecimento e valorização profissional;</li>
            <li>• Programas de qualidade de vida e equilíbrio emocional;</li>
            <li>• Incentivo ao diálogo e à escuta ativa em todos os níveis hierárquicos.</li>
          </ul>
          <p style="color: #166534; font-size: 9pt; line-height: 1.4; margin-bottom: 12px;">
            Mesmo em ambientes com baixo risco, a manutenção do clima organizacional e da motivação depende de atenção constante. Sugere-se incluir este resultado no Inventário de Riscos do Programa de Gerenciamento de Riscos (PGR), assegurando que as condições favoráveis atuais sejam acompanhadas e mantidas de forma sistemática, alinhando-se às diretrizes do COPSOQ para avaliações periódicas.
          </p>
          <p style="color: #166534; font-weight: 600; margin-bottom: 8px;">Grupos identificados:</p>
          ${etapa3.gruposExcelente
            .map(
              (g) => `
            <div style="margin-bottom: 8px; page-break-inside: avoid;">
              <p style="color: #15803d; font-size: 9pt; font-weight: bold; margin-bottom: 2px;">${g.grupo}. ${g.dominio}</p>
              <p style="color: #15803d; font-size: 8pt; line-height: 1.3;">${g.acaoRecomendada}</p>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `);
  }

  if (etapa3.gruposMonitoramento && etapa3.gruposMonitoramento.length > 0) {
    cardsGrupos.push(`
      <div style="page-break-before: always;">
        <div class="resumo-card resumo-card-amarelo">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 16pt; margin-right: 8px;">🟡</span>
            <h4 style="color: #a16207;">2. Risco Psicossocial Moderado (entre 33% e 66%)</h4>
          </div>
          <p style="color: #a16207; font-weight: 600; margin-bottom: 8px;">Consideração final detalhada:</p>
          <p style="color: #a16207; font-size: 9pt; line-height: 1.4; margin-bottom: 8px;">
            O resultado do Questionário Psicossocial de Copenhague (COPSOQ) aponta para um nível moderado de risco psicossocial, correspondendo ao tertil médio de exposição, indicando que o ambiente de trabalho apresenta algumas situações ou percepções que merecem atenção preventiva. Isso pode envolver fatores como demandas moderadas de trabalho, falhas na comunicação interna, falta de clareza nas metas, períodos de estresse temporário ou desafios pontuais no relacionamento entre equipes e gestores.
          </p>
          <p style="color: #a16207; font-size: 9pt; line-height: 1.4; margin-bottom: 8px;">
            Conforme a NR-01, cabe à organização identificar as causas desses resultados e implantar ações de controle e prevenção antes que se agravem. As medidas podem incluir:
          </p>
          <ul style="color: #a16207; font-size: 8pt; line-height: 1.4; margin-left: 16px; margin-bottom: 8px;">
            <li>• Reuniões de alinhamento sobre papéis e responsabilidades;</li>
            <li>• Adequação das cargas e jornadas de trabalho;</li>
            <li>• Programas de apoio psicológico ou rodas de conversa internas;</li>
            <li>• Treinamentos voltados à gestão empática e ao fortalecimento do trabalho em equipe.</li>
          </ul>
          <p style="color: #a16207; font-size: 9pt; line-height: 1.4; margin-bottom: 12px;">
            É essencial que essas ações sejam documentadas e acompanhadas no Programa de Gerenciamento de Riscos (PGR), com reavaliações periódicas para medir a eficácia das melhorias implementadas, utilizando os benchmarks do COPSOQ como referência. Embora o risco moderado não represente uma situação crítica, ele sinaliza pontos de atenção que, se não tratados, podem evoluir para um risco elevado no futuro.
          </p>
          <p style="color: #a16207; font-weight: 600; margin-bottom: 8px;">Grupos identificados:</p>
          ${etapa3.gruposMonitoramento
            .map(
              (g) => `
            <div style="margin-bottom: 8px; page-break-inside: avoid;">
              <p style="color: #a16207; font-size: 9pt; font-weight: bold; margin-bottom: 2px;">${g.grupo}. ${g.dominio}</p>
              <p style="color: #a16207; font-size: 8pt; line-height: 1.3;">${g.acaoRecomendada}</p>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `);
  }

  if (etapa3.gruposAltoRisco && etapa3.gruposAltoRisco.length > 0) {
    cardsGrupos.push(`
      <div style="page-break-before: always;">
        <div class="resumo-card resumo-card-vermelho">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 16pt; margin-right: 8px;">🔴</span>
            <h4 style="color: #b91c1c;">3. Risco Psicossocial Elevado (maior que 66%)</h4>
          </div>
          <p style="color: #b91c1c; font-weight: 600; margin-bottom: 8px;">Consideração final detalhada:</p>
          <p style="color: #b91c1c; font-size: 9pt; line-height: 1.4; margin-bottom: 8px;">
            O resultado do Questionário Psicossocial de Copenhague (COPSOQ) indica um risco psicossocial elevado, correspondendo ao tertil superior de exposição, o que significa que há fatores importantes interferindo na saúde mental e emocional dos trabalhadores. Esse cenário pode estar relacionado a demandas altas de trabalho, falta de reconhecimento, pressão excessiva, ausência de apoio da liderança, conflitos interpessoais ou ambiente organizacional desgastante, potencialmente levando a condições como ansiedade, depressão ou burnout.
          </p>
          <p style="color: #b91c1c; font-size: 9pt; line-height: 1.4; margin-bottom: 8px;">
            Segundo a NR-01, quando um risco é classificado como elevado, a empresa deve agir de forma estruturada e imediata, buscando identificar as causas raiz e implantar medidas corretivas e preventivas eficazes. Essas medidas podem incluir:
          </p>
          <ul style="color: #b91c1c; font-size: 8pt; line-height: 1.4; margin-left: 16px; margin-bottom: 8px;">
            <li>• Implementação de programas de apoio psicológico e escuta ativa;</li>
            <li>• Revisão de processos organizacionais e distribuição de tarefas;</li>
            <li>• Capacitação de gestores em liderança humanizada e prevenção de assédio moral;</li>
            <li>• Melhoria na comunicação interna e nos canais de feedback;</li>
            <li>• Promoção de ações voltadas à saúde mental e ao equilíbrio entre trabalho e vida pessoal, com intervenção prioritária.</li>
          </ul>
          <p style="color: #b91c1c; font-size: 9pt; line-height: 1.4; margin-bottom: 12px;">
            Esse nível de risco exige registro detalhado no inventário de riscos do PGR, bem como acompanhamento contínuo por parte da alta gestão e dos responsáveis pelo SESMT ou equipe de saúde e segurança, alinhando-se aos critérios de risco do COPSOQ. A ausência de ações concretas pode gerar adoecimento ocupacional, absenteísmo e queda de produtividade, devendo a organização priorizar planos de intervenção imediata para mitigar os impactos.
          </p>
          <p style="color: #b91c1c; font-weight: 600; margin-bottom: 8px;">Grupos identificados:</p>
          ${etapa3.gruposAltoRisco
            .map(
              (g) => `
            <div style="margin-bottom: 8px; page-break-inside: avoid;">
              <p style="color: #b91c1c; font-size: 9pt; font-weight: bold; margin-bottom: 2px;">${g.grupo}. ${g.dominio}</p>
              <p style="color: #b91c1c; font-size: 8pt; line-height: 1.3;">${g.acaoRecomendada}</p>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `);
  }

  return cardsGrupos.join('');
}

function gerarSecaoEtapa4(
  etapa4: ObservacoesConclusao,
  formattedHeaderDate: string,
  formattedDataAssinatura: string
): string {
  return `
    <div style="page-break-before: always;">
      <div class="section">
        <div class="section-title">4. OBSERVAÇÕES E CONCLUSÃO</div>

        ${
          etapa4.observacoesLaudo
            ? `
          <div class="info-box info-box-azul">
            <p>${etapa4.observacoesLaudo.replace(/\n/g, '<br>')}</p>
          </div>
        `
            : ''
        }

        <div class="subsection-title">Conclusão</div>
        <div style="background: white; border: 2px solid #e5e7eb; border-radius: 8px; padding: 24px;">
          <div class="conclusao">
            <p>${etapa4.textoConclusao.replace(/\n/g, '<br>')}</p>
          </div>

          <div class="assinatura-gov">
            <div class="assinatura-header">São Paulo, ${formattedHeaderDate}</div>
            
            <div class="logo-section">
              <img src="https://www.gov.br/++theme++padrao_govbr/img/govbr-logo-large.png" alt="gov.br" class="logo-gov">
              <span class="status-assinatura">Documento assinado digitalmente</span>
            </div>
            
            <div class="nome-assinante">${etapa4.assinatura.nome.toUpperCase()}</div>
            <div class="data-assinatura">Data: ${formattedDataAssinatura}</div>
            <div class="verificador">Verifique em https://verificador.iti.br</div>
            <div class="cargo">Coordenador Responsável Técnico – Qwork</div>
          </div>

          <!-- Logo QWork -->
          ${getLogoSignatureTemplate()}
        </div>
      </div>
    </div>
  `;
}

function gerarRodape(): string {
  const dataAtual = formatarDataApenasData(new Date());
  const horaAtual = formatarHora(new Date());
  return `
    <div class="footer">
      <p>Documento gerado automaticamente pelo Sistema Qwork</p>
      <p style="margin-top: 4px;">Data de geração: ${dataAtual} às ${horaAtual}</p>
    </div>
  `;
}

export function gerarHTMLLaudoCompleto(
  laudoPadronizado: LaudoDadosCompletos
): string {
  const { loteId, etapa1, etapa2, etapa3, etapa4, emitidoEm } =
    laudoPadronizado;

  const date = emitidoEm ? new Date(emitidoEm) : new Date();
  const dateCorrigida = formatarDataCorrigida(date);
  const dateApenasData = formatarDataApenasData(date);
  const hora = formatarHora(date);
  
  const formattedHeaderDate =
    new Date(dateCorrigida).getDate() +
    ' de ' +
    new Date(dateCorrigida).toLocaleDateString('pt-BR', { month: 'long' }) +
    ' de ' +
    new Date(dateCorrigida).getFullYear();
  const formattedDataAssinatura = `${dateApenasData} ${hora} -0300`;
  const formattedDataEmissao = `${dateApenasData} ${hora}`;

  let html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Laudo de Identificação e Mapeamento de Riscos Psicossociais (NR-1 / GRO) - ${etapa1.empresaAvaliada}</title>
      ${gerarEstilosCSS()}
    </head>
    <body>
      <div class="container">
        ${gerarCabecalho()}
        ${gerarSecaoEtapa1(etapa1)}
        ${etapa2 ? gerarSecaoEtapa2(etapa2) : ''}
        ${etapa3 ? gerarSecaoEtapa3(etapa3) + gerarCardsEtapa3(etapa3) : ''}
        ${etapa4 ? gerarSecaoEtapa4(etapa4, formattedHeaderDate, formattedDataAssinatura) : ''}
        ${gerarRodape()}
      </div>
    </body>
    </html>
  `;

  // Substituir placeholders no CSS com valores reais
  html = html.replace('{{LOTE_ID}}', loteId?.toString() || '');
  html = html.replace('{{DATA_EMISSAO}}', formattedDataEmissao);

  return html;
}
