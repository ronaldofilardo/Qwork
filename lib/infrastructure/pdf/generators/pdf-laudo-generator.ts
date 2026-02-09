/**
 * Módulo para download de laudos PDF
 *
 * Como o laudo é gerado pelo emissor e armazenado no banco de forma imutável,
 * os demais usuários (clínica, tomador, empresa, RH) podem apenas
 * visualizar ou baixar o PDF existente através deste módulo.
 */

/**
 * Baixar PDF existente do laudo (armazenado no banco)
 *
 * @param pdfBuffer - Buffer do PDF armazenado no banco
 * @param nomeArquivo - Nome do arquivo para download
 */
export function downloadLaudoPDF(
  pdfBuffer: Uint8Array | ArrayBuffer | Buffer,
  nomeArquivo: string
): void {
  const array =
    pdfBuffer instanceof Uint8Array
      ? pdfBuffer
      : new Uint8Array(pdfBuffer as any);
  const blob = new Blob([array as any], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  link.style.position = 'absolute';
  link.style.left = '-9999px';
  document.body.appendChild(link);

  link.click();

  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}
