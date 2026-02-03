/**
 * Wrapper para Puppeteer - USO EXCLUSIVO PARA LAUDOS COMPLETOS
 *
 * IMPORTANTE: Este arquivo NÃO deve ser usado para relatórios individuais.
 * Relatórios individuais devem usar jsPDF diretamente.
 *
 * Suporta ambientes serverless (Vercel) via @sparticuz/chromium
 */

const isVercelProduction = process.env.VERCEL === '1';

/**
 * Retorna a instância correta do Puppeteer baseada no ambiente
 * USO: Apenas para laudos psicossociais completos
 */
export async function getPuppeteerInstance() {
  if (isVercelProduction) {
    // Ambiente serverless - usar @sparticuz/chromium
    const chromium = await import('@sparticuz/chromium');
    const puppeteerCore = await import('puppeteer-core');

    // Wrapper defensivo para executablePath
    try {
      const origExec = (chromium.default as any).executablePath.bind(
        chromium.default
      );
      (chromium.default as any).executablePath = (input?: any) => {
        if (input && typeof input !== 'string') {
          console.debug(
            '[DEBUG] chromium.executablePath: received non-string input, ignoring and using default behavior'
          );
          return origExec();
        }
        return origExec(input);
      };
    } catch (err) {
      console.warn('[WARN] Could not wrap chromium.executablePath:', err);
    }

    // Desabilitar graphics mode para melhor compatibilidade serverless
    if ((chromium.default as any).setGraphicsMode !== undefined) {
      (chromium.default as any).setGraphicsMode = false;
    }

    // Retornar wrapper que injeta executablePath e args do chromium
    return {
      launch: async (options?: any) => {
        const executablePath = await (chromium.default as any).executablePath();
        const chromiumArgs = chromium.default.args || [];
        const userArgs = options?.args || [];

        // Mesclar args, removendo duplicatas
        const mergedArgs = Array.from(new Set([...chromiumArgs, ...userArgs]));

        return puppeteerCore.default.launch({
          ...options,
          executablePath,
          args: mergedArgs,
        });
      },
    };
  } else {
    // Ambiente local/desenvolvimento - usar puppeteer normal
    const puppeteer = await import('puppeteer');
    return puppeteer.default;
  }
}

// Função de alto-nível para gerar PDFs (conveniência para scripts)
export type GerarPdfOptions = {
  tipo: 'recibo' | 'relatorio' | 'generic';
  html: string;
  filename?: string;
  includeHash?: boolean;
  saveToDisk?: boolean;
  storageSubpath?: string;
};

export async function gerarPdf(opts: GerarPdfOptions) {
  const { tipo, html, filename = 'document.pdf' } = opts;

  if (tipo === 'recibo' || tipo === 'relatorio' || tipo === 'generic') {
    const pdfMod = await import('@/lib/pdf-generator');

    if (tipo === 'recibo') {
      const numero = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
      return pdfMod.gerarPdfRecibo(html, numero);
    }

    if (tipo === 'relatorio' || tipo === 'generic') {
      return pdfMod.gerarPdfRelatorio(
        html,
        filename.replace(/[^a-zA-Z0-9.-]/g, '_')
      );
    }
  }

  throw new Error(
    'gerarPdf: tipo ' + String(tipo) + ' não suportado por este wrapper'
  );
}
