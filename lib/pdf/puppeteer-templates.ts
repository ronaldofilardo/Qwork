/**
 * Templates Puppeteer para geração de PDFs
 * Inclui header/footer com logo e numeração de páginas
 */

import { QWORK_BRANDING } from '@/lib/config/branding';

/**
 * Template de header para PDFs
 * Inclui logo e título do documento
 */
export function getPDFHeaderTemplate(documentTitle: string): string {
  return `
    <div style="
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 20px;
      border-bottom: 2px solid #9ACD32;
      font-size: 9px;
      width: 100%;
      font-family: 'Segoe UI', sans-serif;
    ">
      <img 
        src="${QWORK_BRANDING.logo.base64}" 
        alt="QWork"
        style="height: 25px; width: auto;" 
      />
      <span style="
        color: #000000;
        font-weight: 600;
        font-size: 10px;
      ">
        ${documentTitle}
      </span>
      <span style="
        color: #666;
        font-size: 8px;
        font-weight: 500;
      ">
        Pág. <span class="pageNumber"></span> de <span class="totalPages"></span>
      </span>
    </div>
  `;
}

/**
 * Template de footer para PDFs
 * Inclui slogan e informações adicionais
 */
export function getPDFFooterTemplate(additionalInfo?: string): string {
  return `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 8px 20px;
      border-top: 1px solid #E5E7EB;
      font-size: 8px;
      width: 100%;
      font-family: 'Segoe UI', sans-serif;
      color: #6B7280;
    ">
      <div style="
        font-weight: 600;
        color: #9ACD32;
        letter-spacing: 0.05em;
        margin-bottom: 2px;
      ">
        ${QWORK_BRANDING.logo.slogan}
      </div>
      ${
        additionalInfo
          ? `
        <div style="font-size: 7px; color: #9CA3AF;">
          ${additionalInfo}
        </div>
      `
          : ''
      }
    </div>
  `;
}

/**
 * Template de logo como marca d'água
 * Para ser inserido no body do HTML
 */
export function getWatermarkTemplate(opacity: number = 0.1): string {
  return `
    <div style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: -1;
      opacity: ${opacity};
      pointer-events: none;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <img 
        src="${QWORK_BRANDING.logo.base64}" 
        alt="QWork"
        style="
          width: 400px;
          height: auto;
          object-fit: contain;
        "
      />
    </div>
  `;
}

/**
 * Template de logo para final de documento
 * Usado no Laudo Biopsicossocial abaixo da assinatura
 */
export function getLogoSignatureTemplate(): string {
  return `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #E5E7EB;
    ">
      <img 
        src="${QWORK_BRANDING.logo.base64}" 
        alt="QWork"
        style="
          width: 180px;
          height: auto;
          object-fit: contain;
          margin-bottom: 8px;
        "
      />
      <!-- slogan removido conforme solicitação -->
    </div>
  `;
}

/**
 * Configurações padrão de PDF para Puppeteer
 */
export const defaultPDFOptions = {
  format: 'A4' as const,
  printBackground: true,
  margin: {
    top: '50mm',
    right: '15mm',
    bottom: '20mm',
    left: '15mm',
  },
};

/**
 * Configurações de PDF com header/footer
 */
export function getPDFOptionsWithHeaderFooter(
  documentTitle: string,
  additionalInfo?: string
) {
  return {
    ...defaultPDFOptions,
    displayHeaderFooter: true,
    headerTemplate: getPDFHeaderTemplate(documentTitle),
    footerTemplate: getPDFFooterTemplate(additionalInfo),
  };
}

/**
 * Estilos CSS base para PDFs
 * Mantém consistência visual
 */
export const basePDFStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
    line-height: 1.5;
    color: #1F2937;
    background: white;
    font-size: 10pt;
  }

  h1, h2, h3, h4, h5, h6 {
    color: #000000;
    font-weight: 600;
  }

  h1 {
    font-size: 18pt;
    margin-bottom: 12px;
  }

  h2 {
    font-size: 14pt;
    margin-bottom: 10px;
  }

  h3 {
    font-size: 12pt;
    margin-bottom: 8px;
  }

  p {
    margin-bottom: 8px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
  }

  th, td {
    padding: 6px 8px;
    border: 1px solid #E5E7EB;
    text-align: left;
    font-size: 9pt;
  }

  th {
    background-color: #F3F4F6;
    font-weight: 600;
    color: #000000;
  }

  .page-break {
    page-break-after: always;
  }

  .no-break {
    page-break-inside: avoid;
  }

  .accent-color {
    color: #9ACD32;
  }

  .primary-color {
    color: #000000;
  }

  .accent-border {
    border-color: #9ACD32;
  }

  .accent-bg {
    background-color: #9ACD32;
    color: white;
  }

  @media print {
    body {
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }
  }
`;
