/**
 * Template HTML para Relatório de Lote
 * Gera PDF com todos os funcionários do lote
 * Logo apenas na primeira página + contador de páginas em todas
 */

import { QWORK_BRANDING } from '@/lib/config/branding';
import { basePDFStyles } from '@/lib/pdf/puppeteer-templates';

interface FuncionarioLote {
  nome: string;
  cpf: string;
  perfil: 'operacional' | 'gestao';
  setor?: string;
  funcao?: string;
  matricula?: string;
  envio: string;
  grupos: Array<{
    id: number;
    titulo: string;
    dominio: string;
    media: string;
    classificacao: 'verde' | 'amarelo' | 'vermelho';
  }>;
}

interface RelatorioLoteData {
  lote: {
    id?: number | string;
    codigo?: string;
    titulo: string;
  };
  empresa: string;
  totalFuncionarios: number;
  funcionarios: FuncionarioLote[];
}

export function gerarHTMLRelatorioLote(dados: RelatorioLoteData): string {
  const { lote, empresa, totalFuncionarios, funcionarios } = dados;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório do Lote ${lote.id}</title>
  <style>
    ${basePDFStyles}
    
    .capa {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
      text-align: center;
      page-break-after: always;
    }
    
    .capa-logo {
      margin-bottom: 40px;
    }
    
    .capa-logo img {
      width: 160px;
      height: auto;
    }
    
    .capa h1 {
      font-size: 28pt;
      color: #000000;
      margin-bottom: 15px;
    }
    
    .capa h2 {
      font-size: 18pt;
      color: #9ACD32;
      margin-bottom: 30px;
    }
    
    .capa-info {
      background: #F9FAFB;
      border: 2px solid #E5E7EB;
      border-radius: 12px;
      padding: 25px;
      margin-top: 30px;
      min-width: 400px;
    }
    
    .capa-info-item {
      display: flex;
      justify-content: space-between;
      margin: 10px 0;
      font-size: 12pt;
    }
    
    .capa-info-label {
      font-weight: 600;
      color: #6B7280;
    }
    
    .capa-info-value {
      font-weight: 700;
      color: #000000;
    }
    
    .capa-slogan {
      margin-top: 50px;
      font-size: 14pt;
      font-weight: 600;
      color: #9ACD32;
      letter-spacing: 0.1em;
    }
    
    .funcionario-section {
      page-break-before: always;
      margin-bottom: 30px;
    }
    
    .funcionario-header {
      background: linear-gradient(135deg, #000000 0%, #2d2d2d 100%);
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      margin-bottom: 15px;
    }
    
    .funcionario-nome {
      font-size: 14pt;
      font-weight: bold;
      margin-bottom: 8px;
    }
    
    .funcionario-info-linha {
      display: flex;
      gap: 20px;
      font-size: 9pt;
      flex-wrap: wrap;
    }
    
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 8pt;
      font-weight: 600;
      margin-left: 8px;
    }
    
    .badge-gestao {
      background: #E9D5FF;
      color: #6B21A8;
    }
    
    .badge-operacional {
      background: #DBEAFE;
      color: #1E40AF;
    }
    
    .grupos-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 15px;
      margin-top: 15px;
    }
    
    .grupo-mini {
      background: white;
      border: 2px solid #E5E7EB;
      border-radius: 6px;
      padding: 10px;
      text-align: center;
    }
    
    .grupo-mini-numero {
      font-size: 16pt;
      font-weight: bold;
      color: #9ACD32;
    }
    
    .grupo-mini-media {
      font-size: 15pt;
      font-weight: bold;
      margin: 8px 0;
    }
    
    .grupo-mini-classificacao {
      display: inline-block;
      width: 100%;
      padding: 4px;
      border-radius: 4px;
      font-size: 8pt;
      font-weight: 600;
    }
    
    .verde {
      background: #DCFCE7;
      color: #166534;
    }
    
    .amarelo {
      background: #FEF3C7;
      color: #854D0E;
    }
    
    .vermelho {
      background: #FEE2E2;
      color: #991B1B;
    }
  </style>
</head>
<body>
  <!-- CAPA -->
  <div class="capa">
    <div class="capa-logo">
      <img src="${QWORK_BRANDING.logo.base64}" alt="QWork" />
    </div>
    
    <h1>Relatório de Avaliações</h1>
    <h2>Lote ${lote.id}</h2>
    
    <div class="capa-info">
      <div class="capa-info-item">
        <span class="capa-info-label">Empresa:</span>
        <span class="capa-info-value">${empresa}</span>
      </div>
      <div class="capa-info-item">
        <span class="capa-info-label">Título do Lote:</span>
        <span class="capa-info-value">ID {lote.id}</span>
      </div>
      <div class="capa-info-item">
        <span class="capa-info-label">Total de Avaliações:</span>
        <span class="capa-info-value">${totalFuncionarios}</span>
      </div>
      <div class="capa-info-item">
        <span class="capa-info-label">Data de Geração:</span>
        <span class="capa-info-value">${new Date().toLocaleDateString('pt-BR')}</span>
      </div>
    </div>
    
    <div class="capa-slogan">
      Avaliação de Saúde e Bem-Estar
    </div>
  </div>

  <!-- FUNCIONÁRIOS -->
  ${funcionarios
    .map((func, index) => {
      const cpfFormatado = func.cpf.replace(
        /(\d{3})(\d{3})(\d{3})(\d{2})/,
        '$1.$2.$3-$4'
      );
      const dataEnvio = new Date(func.envio);
      const dataFormatada = dataEnvio.toLocaleDateString('pt-BR');

      return `
      <div class="funcionario-section">
        <div class="funcionario-header">
          <div class="funcionario-nome">
            ${index + 1}. ${func.nome}
            <span class="badge ${func.perfil === 'gestao' ? 'badge-gestao' : 'badge-operacional'}">
              ${func.perfil === 'gestao' ? 'GESTÃO' : 'OPERACIONAL'}
            </span>
          </div>
          <div class="funcionario-info-linha">
            <span><strong>CPF:</strong> ${cpfFormatado}</span>
            ${func.matricula ? `<span><strong>Matrícula:</strong> ${func.matricula}</span>` : ''}
            ${func.setor ? `<span><strong>Setor:</strong> ${func.setor}</span>` : ''}
            ${func.funcao ? `<span><strong>Função:</strong> ${func.funcao}</span>` : ''}
            <span><strong>Concluída:</strong> ${dataFormatada}</span>
          </div>
        </div>

        <h3 style="color: #000000; margin-bottom: 10px; font-size: 11pt;">
          Resultados COPSOQ - 10 Dimensões
        </h3>

        <div class="grupos-grid">
          ${func.grupos
            .map(
              (grupo) => `
            <div class="grupo-mini">
              <div class="grupo-mini-numero">G${grupo.id}</div>
              <div class="grupo-mini-media">${grupo.media}<span class="percent">%</span></div>
              <div class="grupo-mini-classificacao ${grupo.classificacao}">
                ${
                  grupo.classificacao === 'verde'
                    ? 'BAIXO'
                    : grupo.classificacao === 'amarelo'
                      ? 'MÉDIO'
                      : 'ALTO'
                }
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;
    })
    .join('')}

  <!-- RODAPÉ FINAL -->
  <div style="
    margin-top: 40px;
    padding-top: 20px;
    border-top: 2px solid #E5E7EB;
    text-align: center;
  ">
    <p style="font-size: 10pt; color: #6B7280;">
      Este relatório contém ${totalFuncionarios} avaliação${totalFuncionarios !== 1 ? 'ões' : ''} completa${totalFuncionarios !== 1 ? 's' : ''}
    </p>
    <p style="font-size: 8pt; color: #9CA3AF; margin-top: 8px;">
      Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
    </p>
  </div>
</body>
</html>
  `;
}
