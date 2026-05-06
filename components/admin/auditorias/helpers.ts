export function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('pt-BR');
}

export function formatDuration(duration: unknown): string {
  if (!duration) return '-';

  if (typeof duration === 'object' && duration !== null) {
    if ('seconds' in (duration as Record<string, unknown>)) {
      const d = duration as { seconds?: number; milliseconds?: number };
      const totalSeconds = (d.seconds || 0) + (d.milliseconds || 0) / 1000;
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = Math.floor(totalSeconds % 60);

      if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
      if (minutes > 0) return `${minutes}m ${seconds}s`;
      return `${seconds}s`;
    }
    try {
      return JSON.stringify(duration);
    } catch {
      return '(duração desconhecida)';
    }
  }

  return typeof duration === 'string' || typeof duration === 'number'
    ? String(duration)
    : '(duração desconhecida)';
}

// ── Export Functions ──────────────────────────────────────────────────────

import type { AuditoriaAvaliacao } from './types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function formatCpfForDisplay(cpf: string | null | undefined): string {
  if (!cpf) return '—';
  const digits = cpf.replace(/\D/g, '').trim();
  if (digits.length !== 11) return cpf?.trim() ?? '—';
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function generateAvaliacoesReportTxt(data: AuditoriaAvaliacao[]): void {
  if (data.length === 0) {
    alert('Nenhuma avaliação para exportar.');
    return;
  }

  const now = new Date();
  const dataHora = now.toLocaleString('pt-BR');

  // Contadores por status
  const statusCounts: Record<string, number> = {};
  data.forEach((a) => {
    statusCounts[a.avaliacao_status] =
      (statusCounts[a.avaliacao_status] || 0) + 1;
  });

  let txt = '';
  txt += '═'.repeat(80) + '\n';
  txt += '                    RELATÓRIO DE AVALIAÇÕES - QWork\n';
  txt += '═'.repeat(80) + '\n\n';
  txt += `Data de Geração: ${dataHora}\n`;
  txt += `Total de Registros: ${data.length}\n`;
  txt += '\n';

  txt += '─ RESUMO POR STATUS '.padEnd(80, '─') + '\n';
  Object.entries(statusCounts)
    .sort()
    .forEach(([status, count]) => {
      txt += `  ${status.padEnd(30)}: ${count} avaliação(ões)\n`;
    });
  txt += '\n';

  txt += '─ LISTA DE AVALIAÇÕES '.padEnd(80, '─') + '\n\n';
  txt +=
    'CPF            | Lote       | Status            | Liberado em         | Concluído em\n';
  txt += '─'.repeat(80) + '\n';

  data.forEach((a) => {
    const cpfFormatado = formatCpfForDisplay(a.cpf);
    const lote = (a.lote || '—').padEnd(10);
    const status = (a.avaliacao_status || '—').padEnd(17);
    const liberado = formatDate(a.liberado_em).padEnd(19);
    const concluido = formatDate(a.concluida_em);

    txt += `${cpfFormatado.padEnd(14)} | ${lote} | ${status} | ${liberado} | ${concluido}\n`;
  });

  txt += '\n' + '═'.repeat(80) + '\n';
  txt += 'Fim do relatório\n';
  txt += '═'.repeat(80) + '\n';

  // Criar blob e download
  const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `avaliacoes_${now.toISOString().split('T')[0]}.txt`
  );
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateAvaliacoesPDF(data: AuditoriaAvaliacao[]): void {
  if (data.length === 0) {
    alert('Nenhuma avaliação para exportar.');
    return;
  }

  try {
    const doc = new jsPDF();
    const now = new Date();
    const dataHora = now.toLocaleString('pt-BR');

    // Cabeçalho
    doc.setFontSize(16);
    doc.text('Relatório de Avaliações — QWork', 14, 15);

    doc.setFontSize(10);
    doc.text(`Data de Geração: ${dataHora}`, 14, 23);
    doc.text(`Total de Registros: ${data.length}`, 14, 29);

    // Tabela de dados
    const tableData = data.map((a) => [
      formatCpfForDisplay(a.cpf),
      a.lote || '—',
      a.avaliacao_status || '—',
      formatDate(a.liberado_em),
      formatDate(a.concluida_em),
    ]);

    autoTable(doc, {
      head: [['CPF', 'Lote', 'Status', 'Liberado em', 'Concluído em']],
      body: tableData,
      startY: 35,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: { top: 35, right: 14, bottom: 14, left: 14 },
      didDrawPage: (pageData) => {
        // Rodapé
        doc.setFontSize(8);
        doc.text(
          `Página ${pageData.pageNumber}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      },
    });

    // Download
    doc.save(`avaliacoes_${now.toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    alert('Erro ao gerar PDF. Verifique o console.');
  }
}
