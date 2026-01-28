/**
 * lib/infrastructure/pdf/index.ts
 *
 * Exportações centralizadas do módulo PDF
 *
 * Generators:
 * - receipt-generator: Geração de recibos de pagamento
 * - pdf-generator: Funções core de PDF (Puppeteer)
 * - pdf-laudo-generator: Geração de laudos psicossociais
 * - pdf-relatorio-generator: Relatórios administrativos
 *
 * Templates:
 * - recibo-template: HTML template para recibos
 */

// ============================================================================
// GENERATORS
// ============================================================================

export {
  gerarRecibo,
  gerarHtmlRecibo,
  buscarRecibo,
  buscarReciboPorNumero,
  cancelarRecibo,
  listarRecibosPorContratante,
  // Exportar alias para manter compatibilidade com código legado
  listarRecibosPorContratante as buscarRecibosPorContratante,
  type ReciboData,
  type ReciboCompleto,
} from './generators/receipt-generator';

export {
  gerarPdfRecibo,
  gerarPdfFromUrl,
  gerarPdfRelatorio,
  calcularHash,
  verificarHash,
  formatarTamanho,
  type PdfGenerationOptions,
  type PdfGenerationResult,
} from './generators/pdf-generator';

export { downloadLaudoPDF } from './generators/pdf-laudo-generator';

export {
  gerarRelatorioFuncionarioPDF,
  gerarRelatorioLotePDF,
  type RelatorioData,
} from './generators/pdf-relatorio-generator';

// ============================================================================
// TEMPLATES
// ============================================================================

export {
  gerarHtmlReciboTemplate,
  type ReciboTemplateData,
} from './templates/recibo-template';
