/**
 * lib/pdf-generator.ts
 * Serviço unificado de geração de PDFs usando Puppeteer
 *
 * Gera PDFs para:
 * - Recibos de pagamento
 * - Laudos psicossociais (futuro)
 * - Relatórios administrativos (futuro)
 *
 * Funcionalidades:
 * - Geração de PDF binário (BYTEA)
 * - Cálculo de hash SHA-256
 * - Inclusão do hash no rodapé do PDF
 * - Salvamento de cópia local em ./storage/
 * - Suporte a ambientes serverless (Vercel) via @sparticuz/chromium
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

// ============================================================================
// DETECÇÃO DE AMBIENTE E CONFIGURAÇÃO DE PUPPETEER
// ============================================================================

const isVercelProduction = process.env.VERCEL === '1';

/**
 * Retorna a instância correta do Puppeteer baseada no ambiente
 */
export async function getPuppeteerInstance() {
  if (isVercelProduction) {
    // Ambiente serverless - usar @sparticuz/chromium (binários incluídos no pacote)
    const chromium = await import('@sparticuz/chromium');
    const puppeteerCore = await import('puppeteer-core');

    return {
      launch: async (options: Record<string, unknown>) => {
        // @sparticuz/chromium fornece executablePath e args otimizados para Lambda/Vercel
        const executablePath = await chromium.default.executablePath();
        const chromiumArgs = chromium.default.args;

        const launchOptions: Record<string, unknown> = {
          ...options,
          executablePath,
        };

        // Merge chromium args com args fornecidos
        if (Array.isArray(launchOptions.args)) {
          launchOptions.args = [...(launchOptions.args as string[]), ...chromiumArgs];
        } else {
          launchOptions.args = chromiumArgs;
        }

        return puppeteerCore.default.launch(launchOptions);
      },
    };
  } else {
    // Ambiente local - usar puppeteer padrão
    const puppeteer = await import('puppeteer');
    return puppeteer.default;
  }
}

// ============================================================================
// INTERFACES
// ============================================================================

export interface PdfGenerationOptions {
  tipo: 'recibo' | 'laudo' | 'relatorio';
  html: string;
  filename: string;
  includeHash?: boolean;
  saveToDisk?: boolean;
  storageSubpath?: string; // Ex: 'recibos/2025/12-dezembro'
}

export interface PdfGenerationResult {
  pdfBuffer: Buffer;
  hash: string;
  localPath?: string;
  size: number;
}

// ============================================================================
// CONFIGURAÇÕES DE GERAÇÃO DE PDF
// ============================================================================

const PDF_CONFIG = {
  format: 'A4' as const,
  printBackground: true,
  margin: {
    top: '15mm',
    right: '15mm',
    bottom: '15mm',
    left: '15mm',
  },
  preferCSSPageSize: false,
};

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Salva PDF no sistema de arquivos local (./storage/)
 */
async function salvarPdfLocal(
  pdfBuffer: Buffer,
  filename: string,
  subpath: string
): Promise<string> {
  // Salvar sempre localmente
  try {
    // Caminho base do projeto (assumindo que lib/ está na raiz)
    const projectRoot = path.resolve(__dirname, '..');
    const storagePath = path.join(projectRoot, 'storage', subpath);

    // Criar diretório se não existir
    await fs.mkdir(storagePath, { recursive: true });

    // Caminho completo do arquivo
    const filePath = path.join(storagePath, filename);

    // Salvar arquivo
    await fs.writeFile(filePath, pdfBuffer);

    // Retornar caminho relativo (para armazenar no banco)
    const relativePath = path.relative(projectRoot, filePath);
    return relativePath.replace(/\\/g, '/'); // Normalizar barras para Linux/Mac
  } catch (error) {
    console.error('Erro ao salvar PDF local:', error);
    throw new Error(
      `Falha ao salvar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
}

// ============================================================================
// FUNÇÃO PRINCIPAL DE GERAÇÃO DE PDF
// ============================================================================

/**
 * Gera PDF usando Puppeteer com hash SHA-256 e salvamento opcional
 */
export async function gerarPdf(
  options: PdfGenerationOptions
): Promise<PdfGenerationResult> {
  let browser: unknown = null;
  let page: unknown = null;

  try {
    // 1. Obter instância correta do Puppeteer baseada no ambiente
    const puppeteer = await getPuppeteerInstance();

    // 2. Inicializar browser com configurações apropriadas
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
      ],
    });

    page = await (browser as any).newPage();
    // Aumentar timeout para evitar erro de navigation timeout em HTMLs complexos durante backfills
    if (typeof (page as any).setDefaultNavigationTimeout === 'function') {
      (page as any).setDefaultNavigationTimeout(120000);
    } else if (typeof (page as any).setDefaultTimeout === 'function') {
      (page as any).setDefaultTimeout(120000);
    }

    // 3. Preparar HTML com hash provisório (será substituído após geração)
    let htmlContent = options.html;
    if (options.includeHash !== false) {
      htmlContent = htmlContent.replace(
        '{{HASH_PDF}}',
        'CALCULANDO_HASH_APOS_GERACAO'
      );
    }

    // 4. Carregar HTML na página
    await (page as any).setContent(htmlContent, {
      waitUntil: 'networkidle0',
      timeout: 120000, // 2 minutos para HTMLs complexos
    });

    // 5. Gerar PDF como buffer
    const pdfBuffer = await (page as any).pdf(PDF_CONFIG);

    // 6. Calcular hash SHA-256 do PDF binário
    const hash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

    // 7. Se includeHash=true, regenerar PDF com hash real no rodapé (com fallback)
    let finalPdfBuffer = pdfBuffer;
    if (options.includeHash !== false) {
      const htmlWithHash = options.html.replace('{{HASH_PDF}}', hash);
      try {
        // Usar nova página para reduzir footprint de memória (evita problemas em páginas grandes)
        const pageWithHash = await (browser as any).newPage();
        try {
          if (
            typeof (pageWithHash as any).setDefaultNavigationTimeout ===
            'function'
          ) {
            (pageWithHash as any).setDefaultNavigationTimeout(120000);
          } else if (
            typeof (pageWithHash as any).setDefaultTimeout === 'function'
          ) {
            (pageWithHash as any).setDefaultTimeout(120000);
          }
        } catch {}

        await (pageWithHash as any).setContent(htmlWithHash, {
          waitUntil: 'networkidle0',
          timeout: 120000,
        });
        finalPdfBuffer = await (pageWithHash as any).pdf(PDF_CONFIG);
        try {
          await (pageWithHash as any).close();
        } catch {}
      } catch (e) {
        // Fallback: se a regeneração falhar (ex.: memory, timeout), usar o PDF inicial
        console.warn(
          '[PDF-GENERATOR] Falha ao regenerar PDF com hash no rodapé; usando PDF inicial como fallback:',
          e instanceof Error ? e.message : String(e)
        );
        // continuar com finalPdfBuffer já definido como pdfBuffer
      }

      // Recalcular hash do PDF final (não usado atualmente, mas mantido para futuro)
      // const finalHash = crypto
      //   .createHash('sha256')
      //   .update(finalPdfBuffer)
      //   .digest('hex');

      // Nota: O hash muda após incluir ele mesmo no PDF.
      // Para verificação, use o hash ANTES de incluir no rodapé (primeira geração)
      // Ou considere assinar apenas os dados, não o PDF renderizado
    }

    // 8. Salvar cópia local se solicitado (desabilitado em produção serverless)
    let localPath: string | undefined;
    if (options.saveToDisk !== false && !isVercelProduction) {
      localPath = await salvarPdfLocal(
        Buffer.from(finalPdfBuffer),
        options.filename,
        options.storageSubpath || options.tipo
      );
    }

    // 9. Fechar browser
    await (browser as any).close();

    return {
      pdfBuffer: Buffer.from(finalPdfBuffer),
      hash,
      localPath,
      size: finalPdfBuffer.length,
    };
  } catch (error) {
    if (browser) {
      await (browser as any).close();
    }
    console.error('Erro ao gerar PDF:', error);
    throw new Error(
      `Falha na geração de PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Calcula hash SHA-256 de um buffer
 */
export function calcularHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Verifica se um hash corresponde a um buffer
 */
export function verificarHash(buffer: Buffer, hashEsperado: string): boolean {
  const hashCalculado = calcularHash(buffer);
  return hashCalculado === hashEsperado;
}

/**
 * Formata tamanho de arquivo em KB/MB
 */
export function formatarTamanho(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}

// ============================================================================
// FUNÇÕES ESPECÍFICAS POR TIPO DE PDF
// ============================================================================

/**
 * Gera PDF de recibo de pagamento
 */
export async function gerarPdfRecibo(
  html: string,
  numeroRecibo: string
): Promise<PdfGenerationResult> {
  const dataAtual = new Date();
  const ano = dataAtual.getFullYear();
  const mes = String(dataAtual.getMonth() + 1).padStart(2, '0');
  const mesNome = [
    'janeiro',
    'fevereiro',
    'marco',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro',
  ][dataAtual.getMonth()];

  return gerarPdf({
    tipo: 'recibo',
    html,
    filename: `recibo-${numeroRecibo}.pdf`,
    includeHash: true,
    saveToDisk: true,
    storageSubpath: `recibos/${ano}/${mes}-${mesNome}`,
  });
}

/**
 * Gera PDF a partir de uma URL pública (ex: http://localhost:3000/recibo/REC-2025-00001)
 * Processo: navega até a página, gera PDF inicial para calcular hash SHA-256,
 * injeta o hash na página e gera o PDF final que será salvo.
 */
export async function gerarPdfFromUrl(
  url: string,
  filename: string
): Promise<PdfGenerationResult> {
  let browser: unknown = null;
  let page: unknown = null;

  try {
    // 1. Obter instância correta do Puppeteer
    const puppeteer = await getPuppeteerInstance();

    // 2. Inicializar browser
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
      ],
    });

    page = await (browser as any).newPage();
    // timeout maior para páginas complexas
    if (typeof (page as any).setDefaultNavigationTimeout === 'function') {
      (page as any).setDefaultNavigationTimeout(120000);
    } else if (typeof (page as any).setDefaultTimeout === 'function') {
      (page as any).setDefaultTimeout(120000);
    }

    // 3) Navegar até a URL e aguardar carregamento
    await (page as any).goto(url, {
      waitUntil: 'networkidle0',
      timeout: 120000,
    });

    // 4) Gerar PDF inicial (hash será baseado neste PDF)
    const initialBuffer = await (page as any).pdf(PDF_CONFIG);
    const hash = crypto
      .createHash('sha256')
      .update(initialBuffer)
      .digest('hex');

    // 5) Injetar hash no DOM (procura elemento com classe 'hash-value' ou id 'hash-section')
    try {
      await (page as any).evaluate((h: string) => {
        const el = document.querySelector('.hash-value');
        if (el) {
          el.textContent = h;
          return;
        }
        const sec = document.querySelector('.hash-section');
        if (sec) {
          sec.textContent = h;
        }
      }, hash);
    } catch (e) {
      // Não fatal: basta prosseguir
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.warn('Não foi possível injetar hash no DOM:', errorMessage);
    }

    // 6) Gerar PDF final com hash visível
    const finalBuffer = await (page as any).pdf(PDF_CONFIG);

    let localPath: string | undefined;
    if (!isVercelProduction) {
      try {
        localPath = await salvarPdfLocal(
          Buffer.from(finalBuffer),
          filename,
          'recibos'
        );
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.warn('Falha ao salvar PDF localmente:', errorMessage);
      }
    }

    await (browser as any).close();

    return {
      pdfBuffer: Buffer.from(finalBuffer),
      hash,
      localPath,
      size: finalBuffer.length,
    };
  } catch (error) {
    if (browser) await (browser as any).close();
    console.error('Erro ao gerar PDF from URL:', error);
    throw new Error(
      `Falha na geração de PDF a partir da URL: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
}

// Função de geração de PDF de laudo removida - a geração de laudos deve ser feita
// exclusivamente pelo emissor utilizando o fluxo de emissão (ver `lib/laudo-auto.ts`)
// e o template único `lib/templates/laudo-html.ts -> gerarHTMLLaudoCompleto()`.
// Se necessário reabilitar, utilize o serviço `gerarPdf` genérico com cuidado.

/**
 * Gera PDF de relatório administrativo (futuro)
 */
export async function gerarPdfRelatorio(
  html: string,
  tipoRelatorio: string,
  identificador: string
): Promise<PdfGenerationResult> {
  return gerarPdf({
    tipo: 'relatorio',
    html,
    filename: `relatorio-${tipoRelatorio}-${identificador}.pdf`,
    includeHash: false,
    saveToDisk: true,
    storageSubpath: `relatorios/${tipoRelatorio}`,
  });
}
