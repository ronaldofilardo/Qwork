'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Upload,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileText,
  DollarSign,
} from 'lucide-react';

interface CicloRow {
  id: number;
  mes_referencia: string;
  valor_total: string | number;
  qtd_comissoes: number;
  status: string;
  nf_path?: string | null;
  nf_nome_arquivo?: string | null;
  nf_enviada_em?: string | null;
  nf_aprovada_em?: string | null;
  nf_rejeitada_em?: string | null;
  nf_motivo_rejeicao?: string | null;
  data_pagamento?: string | null;
  fechado_em?: string | null;
}

interface Resumo {
  valor_total?: string | number;
  valor_pago?: string | number;
  qtd_ciclos?: number;
  qtd_pagos?: number;
}

const STATUS_LABEL: Record<string, string> = {
  aberto: 'Em andamento',
  fechado: 'Enviar NF/RPA',
  nf_enviada: 'NF/RPA Enviada',
  nf_aprovada: 'Aprovada',
  pago: 'Pago',
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  aberto: <Clock size={14} className="text-blue-500" />,
  fechado: <AlertTriangle size={14} className="text-yellow-500" />,
  nf_enviada: <FileText size={14} className="text-purple-500" />,
  nf_aprovada: <CheckCircle2 size={14} className="text-green-500" />,
  pago: <DollarSign size={14} className="text-green-600" />,
};

const STATUS_COR: Record<string, string> = {
  aberto: 'bg-blue-100 text-blue-700',
  fechado: 'bg-yellow-100 text-yellow-700',
  nf_enviada: 'bg-purple-100 text-purple-700',
  nf_aprovada: 'bg-green-100 text-green-700',
  pago: 'bg-green-200 text-green-800',
};

function fmtBRL(v: string | number | null | undefined): string {
  const n = parseFloat(String(v ?? '0'));
  return isNaN(n)
    ? 'R$ —'
    : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR');
}

function fmtMesAno(mesAno: string): string {
  const [ano, mes] = mesAno.split('-');
  const meses = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez',
  ];
  const m = parseInt(mes, 10);
  return `${meses[m - 1] ?? mes}/${ano}`;
}

export default function FinanceiroRepresentantePage() {
  const [ciclos, setCiclos] = useState<CicloRow[]>([]);
  const [total, setTotal] = useState(0);
  const [resumo, setResumo] = useState<Resumo>({});
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [uploading, setUploading] = useState<number | null>(null);
  const [uploadErro, setUploadErro] = useState('');
  const [uploadSucesso, setUploadSucesso] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingCicloId, setPendingCicloId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/representante/ciclos?limit=24');
      if (!res.ok) return;
      const data = await res.json();
      setCiclos(data.ciclos ?? []);
      setTotal(data.total ?? 0);
      setResumo(data.resumo ?? {});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpload = async (cicloId: number, file: File) => {
    setUploading(cicloId);
    setUploadErro('');
    setUploadSucesso('');
    try {
      const fd = new FormData();
      fd.append('nf', file);
      const res = await fetch(`/api/representante/ciclos/${cicloId}/nf`, {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadErro(data.error ?? 'Erro ao enviar arquivo');
        return;
      }
      setUploadSucesso('NF/RPA enviada! Aguardando validação do Suporte.');
      setTimeout(() => setUploadSucesso(''), 5000);
      await load();
    } finally {
      setUploading(null);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || pendingCicloId == null) return;
    void handleUpload(pendingCicloId, file);
    e.target.value = '';
    setPendingCicloId(null);
  };

  const triggerUpload = (cicloId: number) => {
    setPendingCicloId(cicloId);
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Financeiro</h1>
        <p className="text-sm text-gray-500 mt-1">
          Acompanhe seus repasses mensais e envie NF/RPA para liberação.
        </p>
      </div>

      {/* Cards resumo */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: 'Total',
              value: fmtBRL(resumo.valor_total),
              cor: 'text-blue-700',
              bg: 'bg-blue-50 border-blue-200',
            },
            {
              label: 'Pago',
              value: fmtBRL(resumo.valor_pago),
              cor: 'text-green-700',
              bg: 'bg-green-50 border-green-200',
            },
            {
              label: 'Ciclos',
              value: String(resumo.qtd_ciclos ?? 0),
              cor: 'text-gray-700',
              bg: 'bg-gray-50 border-gray-200',
            },
          ].map((c) => (
            <div key={c.label} className={`border rounded-xl p-4 ${c.bg}`}>
              <p className="text-xs text-gray-500">{c.label}</p>
              <p className={`text-lg font-bold mt-0.5 ${c.cor}`}>{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {uploadErro && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" /> {uploadErro}
        </div>
      )}
      {uploadSucesso && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
          <CheckCircle2 size={15} /> {uploadSucesso}
        </div>
      )}

      {/* Input invisível para upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={onFileChange}
      />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-blue-500" size={28} />
        </div>
      ) : ciclos.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          Nenhum ciclo de repasse encontrado ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {ciclos.map((c) => (
            <div
              key={c.id}
              className="bg-white border rounded-xl overflow-hidden"
            >
              {/* Header do ciclo */}
              <button
                onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {STATUS_ICON[c.status] ?? <Clock size={14} />}
                  <span className="font-semibold text-gray-800">
                    {fmtMesAno(c.mes_referencia)}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COR[c.status] ?? 'bg-gray-100 text-gray-600'}`}
                  >
                    {STATUS_LABEL[c.status] ?? c.status}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-800">
                    {fmtBRL(c.valor_total)}
                  </span>
                  {expandedId === c.id ? (
                    <ChevronUp size={16} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400" />
                  )}
                </div>
              </button>

              {/* Detalhes expandidos */}
              {expandedId === c.id && (
                <div className="px-4 pb-4 border-t pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                    <div>
                      <span className="text-gray-400">Comissões:</span>
                      <p className="font-medium">{c.qtd_comissoes}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Fechado em:</span>
                      <p className="font-medium">{fmtDate(c.fechado_em)}</p>
                    </div>
                    {c.nf_enviada_em && (
                      <div>
                        <span className="text-gray-400">NF enviada em:</span>
                        <p className="font-medium">
                          {fmtDate(c.nf_enviada_em)}
                        </p>
                      </div>
                    )}
                    {c.nf_aprovada_em && (
                      <div>
                        <span className="text-gray-400">NF aprovada em:</span>
                        <p className="font-medium">
                          {fmtDate(c.nf_aprovada_em)}
                        </p>
                      </div>
                    )}
                    {c.nf_nome_arquivo && (
                      <div className="col-span-2">
                        <span className="text-gray-400">Arquivo:</span>
                        <p className="font-medium truncate">
                          {c.nf_nome_arquivo}
                        </p>
                      </div>
                    )}
                    {c.data_pagamento && (
                      <div className="col-span-2">
                        <span className="text-green-500">Pago em:</span>
                        <p className="font-medium text-green-700">
                          {fmtDate(c.data_pagamento)}
                        </p>
                      </div>
                    )}
                    {c.nf_motivo_rejeicao && (
                      <div className="col-span-2">
                        <span className="text-red-500">Motivo rejeição:</span>
                        <p className="font-medium text-red-600">
                          {c.nf_motivo_rejeicao}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Ação de upload — status fechado = aguardando envio de NF */}
                  {c.status === 'fechado' && (
                    <button
                      onClick={() => triggerUpload(c.id)}
                      disabled={uploading === c.id}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors w-full justify-center"
                    >
                      {uploading === c.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Upload size={14} />
                      )}
                      {uploading === c.id ? 'Enviando...' : 'Enviar NF/RPA'}
                    </button>
                  )}

                  {c.status === 'nf_enviada' && (
                    <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg px-3 py-2 text-xs">
                      <FileText size={13} />
                      NF/RPA enviada. Aguardando validação do Suporte.
                    </div>
                  )}

                  {c.status === 'nf_aprovada' && (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-3 py-2 text-xs">
                      <CheckCircle2 size={13} />
                      NF/RPA aprovada. Pagamento em processamento.
                    </div>
                  )}

                  {c.status === 'pago' && (
                    <div className="flex items-center gap-2 bg-green-100 border border-green-300 text-green-800 rounded-lg px-3 py-2 text-xs">
                      <DollarSign size={13} />
                      Pagamento confirmado.
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {total > 24 && (
        <p className="text-center text-xs text-gray-400">
          Exibindo os 24 ciclos mais recentes de {total} no total.
        </p>
      )}
    </div>
  );
}
