/**
 * Template HTML para Relatório Individual
 * Usa Puppeteer para gerar PDF server-side
 */

import { QWORK_BRANDING } from '@/lib/config/branding';
import { basePDFStyles } from '@/lib/pdf/puppeteer-templates';

interface FuncionarioData {
  nome: string;
  cpf: string;
  perfil: 'operacional' | 'gestao';
  empresa: string;
  setor?: string;
  funcao?: string;
  matricula?: string;
}

interface GrupoData {
  id: number;
  titulo: string;
  dominio: string;
  media: string;
  classificacao: 'verde' | 'amarelo' | 'vermelho';
  corClassificacao: string;
  respostas: Array<{
    item: string;
    valor: number;
    texto: string;
  }>;
}

interface RelatorioIndividualData {
  funcionario: FuncionarioData;
  lote?: {
    id: string | number;
    codigo: string;
    titulo: string;
  };
  envio: string;
  grupos: GrupoData[];
}

export function gerarHTMLRelatorioIndividual(
  dados: RelatorioIndividualData
): string {
  const { funcionario, lote, envio, grupos } = dados;

  const cpfFormatado = funcionario.cpf.replace(
    /(\d{3})(\d{3})(\d{3})(\d{2})/,
    '$1.$2.$3-$4'
  );
  const dataEnvio = new Date(envio);
  const dataFormatada = dataEnvio.toLocaleDateString('pt-BR');
  const horaFormatada = dataEnvio.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório Individual - ${funcionario.nome}</title>
  <style>
    ${basePDFStyles}
    
    .relatorio-header {
      background: linear-gradient(135deg, #0b1220 0%, #1f2937 100%);
      color: white;
      padding: 8px;
      border-radius: 6px;
      margin-bottom: 8px;
    }
    
    .relatorio-header h1 {
      color: white;
      font-size: 12pt;
      margin-bottom: 4px;
      font-weight: 700;
    }
    
    .relatorio-header .info-linha {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      align-items: center;
      font-size: 8pt;
    }
    
    .info-badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 7.5pt;
      font-weight: 600;
      margin-left: 8px;
    }
    
    .info-box {
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 6px;
      padding: 8px;
      margin-bottom: 10px;
      font-size: 8.5pt;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    
    .grupos-container {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin: 12px 0;
      grid-auto-rows: 1fr;
      /* Tentar evitar quebra entre páginas para a grid inteira */
      page-break-inside: avoid;
    }
    
    .grupo-card {
      background: white;
      border: 1px solid #E5E7EB;
      border-radius: 6px;
      padding: 6px;
      min-height: 120px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: stretch;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    
    .grupo-header {
      display: flex;
      gap: 8px;
      align-items: center;
      justify-content: space-between;
    }
    
    .grupo-numero {
      font-size: 11pt;
      font-weight: 700;
      color: #9ACD32;
      line-height: 1;
      margin-right: 6px;
    }
    
    .grupo-titulo {
      font-size: 8.5pt;
      font-weight: 700;
      color: #000000;
      margin: 0;
      text-align: left;
    }
    
    .grupo-dominio {
      font-size: 7pt;
      color: #6B7280;
      font-style: italic;
    }
    
    .grupo-media {
      text-align: center;
      margin: 4px 0 6px 0;
    }
    
    .media-valor {
      font-size: 17pt;
      font-weight: 700;
      color: #000000;
      line-height: 1;
      display: inline-block;
      vertical-align: middle;
    }

    .percent {
      font-size: 11pt;
      margin-left: 6px;
      color: #6B7280;
      font-weight: 700;
      vertical-align: middle;
    }
    
    .media-label {
      font-size: 7.5pt;
      color: #6B7280;
      margin-top: 2px;
    }
    
    .classificacao-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 8.5pt;
      font-weight: 700;
      margin-top: 6px;
      text-transform: none;
    }
    
    .verde { background: #DCFCE7; color: #166534; }
    .amarelo { background: #FEF3C7; color: #854D0E; }
    .vermelho { background: #FEE2E2; color: #991B1B; }
    
    .rodape-logo {
      margin-top: 18px;
      padding-top: 8px;
      border-top: 1px solid #E5E7EB;
      display: flex;
      justify-content: center;
      align-items: center;
      opacity: 1;
    }
  </style>
</head>
<body>
  
  <div class="relatorio-header">
    <h1>Detalhes da Avaliação - ${funcionario.nome}</h1>
    <div class="info-linha">
      <div>
        <strong>CPF:</strong> ${cpfFormatado}
        <span class="info-badge ${funcionario.perfil === 'gestao' ? 'badge-gestao' : 'badge-operacional'}">
          ${funcionario.perfil === 'gestao' ? 'GESTÃO' : 'OPERACIONAL'}
        </span>
      </div>
      <div>
        <strong>Concluída em:</strong> ${dataFormatada} ${horaFormatada}
      </div>
    </div>
  </div>

  <div class="info-box">
    <div class="info-grid">
      <div class="info-item">
        <label>Empresa</label>
        <value>${funcionario.empresa}</value>
      </div>
      ${
        funcionario.setor
          ? `
        <div class="info-item">
          <label>Setor</label>
          <value>${funcionario.setor}</value>
        </div>
      `
          : ''
      }
      ${
        funcionario.funcao
          ? `
        <div class="info-item">
          <label>Função</label>
          <value>${funcionario.funcao}</value>
        </div>
      `
          : ''
      }
      ${
        funcionario.matricula
          ? `
        <div class="info-item">
          <label>Matrícula</label>
          <value>${funcionario.matricula}</value>
        </div>
      `
          : ''
      }
      ${
        lote
          ? `
        <div class="info-item">
          <label>Lote</label>
          <value>${lote.codigo}</value>
        </div>
      `
          : ''
      }
    </div>
  </div>

  <h2 style="margin: 20px 0 15px 0; color: #000000;">Resultados por Dimensão COPSOQ</h2>

  <div class="grupos-container">
    ${grupos
      .map(
        (grupo) => `
      <div class="grupo-card no-break">
        <div class="grupo-header">
          <div style="display:flex; align-items:center; gap:8px;">
            <div class="grupo-numero">G${grupo.id}</div>
            <div class="grupo-titulo">${String(grupo.titulo).replace(/^Grupo\s+\d+\s*-\s*/i, '')}</div>
          </div>
          <div style="text-align:right;">
            <div class="classificacao-small" style="font-size:9pt; font-weight:700; color: ${grupo.corClassificacao};">${grupo.classificacao === 'verde' ? 'Baixo' : grupo.classificacao === 'amarelo' ? 'Moderado' : 'Elevado'}</div>
          </div>
        </div>
        <div class="grupo-media" style="margin-top: 6px; text-align: center;">
          <div class="media-valor">${grupo.media}<span class="percent">%</span></div>
          <div class="media-label">Pontuação média</div>
        </div>
        <div style="text-align: center; margin-top: 6px;">
          <span class="classificacao-badge ${grupo.classificacao}">${(grupo.classificacao === 'verde' ? 'Baixo' : grupo.classificacao === 'amarelo' ? 'Moderado' : 'Elevado').toUpperCase()}</span>
        </div>
      </div>
    `
      )
      .join('')}

  <div style="text-align:center; margin-top: 12px;">
    <img src="${QWORK_BRANDING.logo.base64}" alt="QWork" style="width: 120px; opacity: 1; display: inline-block; max-height: 60px; object-fit: contain;" />
  </div>

  <div style="
    margin-top: 12px;
    padding-top: 15px;
    border-top: 1px solid #E5E7EB;
    text-align: right;
    padding-right: 8px;
    font-size: 8pt;
    color: #9CA3AF;
  ">
    <p style="margin-top: 4px;">Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
  </div>
</body>
</html>
  `;
}
