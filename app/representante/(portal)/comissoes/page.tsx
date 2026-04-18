'use client';

import { useState, useCallback } from 'react';
import { useComissoes } from './hooks/useComissoes';
import { fmt, STATUS_BADGE } from './types';
import ComissoesTable from './components/ComissoesTable';
import { Upload, CheckCircle2, Loader2, AlertCircle, FileText } from 'lucide-react';

export default function ComissoesRepresentante() {
  const {
    comissoes,
    resumo,
    total,
    page,
    setPage,
    statusFiltro,
    setStatusFiltro,
    loading,
    erro,
  } = useComissoes();

  // NF Upload
  const [nfUploading, setNfUploading] = useState(false);
  const [nfMes, setNfMes] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [nfErro, setNfErro] = useState<string | null>(null);
  const [nfSucesso, setNfSucesso] = useState<string | null>(null);

  const handleNfUpload = useCallback(async (file: File) => {
    setNfUploading(true);
    setNfErro(null);
    setNfSucesso(null);
    try {
      const fd = new FormData();
      fd.append('mes', nfMes);
      fd.append('arquivo', file);
      const res = await fetch('/api/representante/comissoes/nf-upload', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok) {
        setNfErro(data.error ?? 'Erro ao enviar NF.');
      } else {
        setNfSucesso('NF enviada com sucesso! Aguardando análise.');
      }
    } catch {
      setNfErro('Erro de conexão.');
    }
    setNfUploading(false);
  }, [nfMes]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Minhas Comissões</h1>

      {erro && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-4 text-sm text-red-700">
          {erro}
        </div>
      )}

      {resumo && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              label: 'Provisionado',
              value: fmt(resumo.valor_futuro),
              icon: '📋',
              cor: 'text-amber-700',
              bg: 'bg-amber-50',
              borderCor: 'border-amber-200',
              title: 'Comissões retidas aguardando pagamento da parcela pelo cliente',
            },
            {
              label: 'A Receber',
              value: fmt(resumo.valor_pendente),
              icon: '⏳',
              cor: 'text-blue-700',
              bg: 'bg-blue-50',
              borderCor: 'border-blue-200',
              title: 'Parcelas pagas aguardando consolidação em ciclo',
            },
            {
              label: 'Liberado',
              value: fmt(resumo.valor_liberado),
              icon: '🟢',
              cor: 'text-purple-700',
              bg: 'bg-purple-50',
              borderCor: 'border-purple-200',
              title: 'NF do ciclo aprovada, aguardando pagamento no dia 15',
            },
            {
              label: 'Total Pago',
              value: fmt(resumo.valor_pago_total),
              icon: '✅',
              cor: 'text-green-700',
              bg: 'bg-green-50',
              borderCor: 'border-green-200',
              title: 'Valor histórico de comissões pagas',
            },
          ].map((c) => (
            <div
              key={c.label}
              className={`${c.bg} ${c.borderCor} rounded-2xl border-2 p-6 shadow-sm hover:shadow-md transition-shadow duration-200`}
              title={c.title}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-gray-600 text-sm font-semibold mb-3 tracking-wide">
                    {c.label}
                  </div>
                  <div className={`text-3xl font-bold ${c.cor}`}>{c.value}</div>
                </div>
                <span className="text-4xl ml-3">{c.icon}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Pipeline de Pagamento
        </h2>
        <div className="flex items-center gap-1 flex-wrap">
          {['retida', 'liberada', 'paga'].map(
            (s, i, arr) => (
              <div key={s} className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setStatusFiltro(statusFiltro === s ? '' : s);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${STATUS_BADGE[s]?.cor ?? 'bg-gray-100 text-gray-600'} ${statusFiltro === s ? 'ring-2 ring-offset-1 ring-blue-400' : 'opacity-70 hover:opacity-100'}`}
                >
                  {STATUS_BADGE[s]?.label}
                </button>
                {i < arr.length - 1 && (
                  <span className="text-gray-300 text-xs">→</span>
                )}
              </div>
            )
          )}
          <span className="text-gray-200 mx-2">|</span>
          {[
            'congelada_aguardando_admin',
            'cancelada',
          ].map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFiltro(statusFiltro === s ? '' : s);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${STATUS_BADGE[s]?.cor ?? 'bg-gray-100 text-gray-600'} ${statusFiltro === s ? 'ring-2 ring-offset-1 ring-blue-400' : 'opacity-70 hover:opacity-100'}`}
            >
              {STATUS_BADGE[s]?.label}
            </button>
          ))}
          {statusFiltro && (
            <button
              onClick={() => setStatusFiltro('')}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Limpar filtro
            </button>
          )}
        </div>
      </div>

      {/* NF Mensal Upload */}
      <div className="bg-white rounded-xl border p-5 space-y-3">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-blue-600" />
          <h2 className="text-sm font-semibold text-gray-700">Nota Fiscal Mensal</h2>
        </div>
        <p className="text-xs text-gray-500">
          Envie a NF referente às comissões do mês para compliance.
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="month"
            value={nfMes}
            onChange={(e) => setNfMes(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm"
          />
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              disabled={nfUploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleNfUpload(f);
                e.target.value = '';
              }}
            />
            <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
              nfUploading
                ? 'bg-gray-100 text-gray-400 border-gray-200'
                : 'border-blue-200 text-blue-600 hover:bg-blue-50'
            }`}>
              {nfUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              Enviar NF (PDF)
            </span>
          </label>
        </div>
        {nfErro && (
          <div className="flex items-center gap-2 text-xs text-red-600">
            <AlertCircle size={13} /> {nfErro}
          </div>
        )}
        {nfSucesso && (
          <div className="flex items-center gap-2 text-xs text-green-600">
            <CheckCircle2 size={13} /> {nfSucesso}
          </div>
        )}
      </div>

      <ComissoesTable
        comissoes={comissoes}
        total={total}
        page={page}
        setPage={setPage}
        loading={loading}
      />
    </div>
  );
}
