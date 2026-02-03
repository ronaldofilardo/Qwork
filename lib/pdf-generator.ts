import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { jsPDF as JsPDF } from 'jspdf';

export type PdfGenerationResult = {
  pdfBuffer: Buffer;
  hash: string;
  localPath: string | null;
  size: number;
};

export type PdfGenerationOptions = {
  filename?: string;
  storageDir?: string;
};

export function calcularHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function stripHtml(input: string) {
  return input
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function gerarPdfRecibo(
  html: string,
  numeroRecibo: string
): Promise<PdfGenerationResult> {
  // Geração simples usando jsPDF (texto plano do HTML)
  const doc = new JsPDF({ unit: 'pt', format: 'a4' } as any);
  const text = stripHtml(html).slice(0, 20000);
  const lines = doc.splitTextToSize(text, 560);
  doc.setFontSize(11);
  doc.text(lines, 40, 40);

  const pdfArray = doc.output('arraybuffer');
  const pdfBuffer = Buffer.from(pdfArray);

  const hash = calcularHash(pdfBuffer);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.toLocaleString('pt-BR', { month: 'long' });
  const storageDir = path.join(
    process.cwd(),
    'storage',
    'recibos',
    String(year),
    month.toLowerCase()
  );
  const filename = `recibo-${numeroRecibo}.pdf`;
  const localPath = path.join(storageDir, filename);

  try {
    await fs.mkdir(storageDir, { recursive: true });
    await fs.writeFile(localPath, pdfBuffer);
  } catch (err) {
    console.warn('[pdf-generator] Falha ao salvar PDF no storage:', err);
  }

  return {
    pdfBuffer,
    hash,
    localPath,
    size: pdfBuffer.length,
  };
}

export async function gerarPdfFromUrl(
  url: string,
  filename = 'document.pdf'
): Promise<PdfGenerationResult> {
  // Fetch HTML and generate a PDF
  // Use global fetch if available
  let res: any;
  if (typeof fetch === 'function') {
    res = await fetch(url);
  } else {
    const fetchModule = await import('node-fetch');
    res = await fetchModule.default(url);
  }

  if (!res || !res.ok) throw new Error(`Failed to fetch URL: ${url}`);
  const html = await res.text();

  // Reuse gerarPdfRecibo logic (but no receipt number)
  const result = await gerarPdfRecibo(
    html,
    filename.replace(/[^a-zA-Z0-9.-]/g, '_')
  );
  return result;
}

export async function gerarPdfRelatorio(
  html: string,
  filename = 'relatorio.pdf'
): Promise<PdfGenerationResult> {
  return gerarPdfRecibo(html, filename.replace(/[^a-zA-Z0-9.-]/g, '_'));
}

export function verificarHash(buffer: Buffer, hash: string): boolean {
  return calcularHash(buffer) === hash;
}

export function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}
