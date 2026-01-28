/**
 * Componente client-side para geração de PDFs de relatórios individuais
 * Usa jsPDF + html2canvas para renderizar HTML no navegador
 * Solução temporária para Vercel Free Tier (evita Puppeteer server-side)
 */

'use client';

import { useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface RelatorioDownloadClientProps {
  htmlContent: string;
  filename?: string;
  funcionarioNome?: string;
  className?: string;
}

export function RelatorioDownloadClient({
  htmlContent,
  filename = 'relatorio-individual',
  funcionarioNome,
  className = '',
}: RelatorioDownloadClientProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gerarPDF = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Criar iframe temporário com o HTML do relatório
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = '210mm'; // A4 width
      iframe.style.height = '297mm'; // A4 height
      document.body.appendChild(iframe);

      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) {
        throw new Error('Não foi possível criar o documento temporário');
      }

      doc.open();
      doc.write(htmlContent);
      doc.close();

      // Aguardar renderização completa (fontes, imagens base64)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Garantir que imagens base64 foram carregadas
      const images = doc.querySelectorAll('img');
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete) {
                resolve(true);
              } else {
                img.onload = () => resolve(true);
                img.onerror = () => resolve(false);
              }
            })
        )
      );

      // Capturar canvas do HTML renderizado
      const canvas = await html2canvas(doc.body, {
        scale: 2, // Alta qualidade
        useCORS: true,
        allowTaint: true,
        logging: false,
        windowWidth: 794, // A4 width em pixels (210mm @ 96dpi)
        windowHeight: 1123, // A4 height em pixels (297mm @ 96dpi)
      });

      // Configurar PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Calcular dimensões mantendo aspect ratio
      const imgWidth = 210; // A4 width em mm
      const pageHeight = 297; // A4 height em mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;
      const imgData = canvas.toDataURL('image/png');

      // Adicionar imagem ao PDF (com paginação se necessário)
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Salvar PDF
      const timestamp = new Date().toISOString().slice(0, 10);
      const sanitizedNome = funcionarioNome
        ?.replace(/[^a-zA-Z0-9]/g, '-')
        .toLowerCase();
      const finalFilename = `${filename}${sanitizedNome ? `-${sanitizedNome}` : ''}-${timestamp}.pdf`;
      pdf.save(finalFilename);

      // Limpar iframe
      document.body.removeChild(iframe);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      setError(
        err instanceof Error ? err.message : 'Erro desconhecido ao gerar PDF'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={className}>
      <button
        onClick={gerarPDF}
        disabled={isGenerating}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isGenerating ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Gerando PDF...
          </>
        ) : (
          <>
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
              />
            </svg>
            Baixar Relatório (PDF)
          </>
        )}
      </button>

      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
          <strong>Erro:</strong> {error}
        </div>
      )}

      <p className="text-xs text-gray-500 mt-2">
        💡 PDF gerado no seu navegador (sem enviar dados ao servidor)
      </p>
    </div>
  );
}
