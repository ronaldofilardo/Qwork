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
} from 'lucide-react';

interface CicloRow {
  id: number;
  mes_ano: string;
  valor_total_recebido: string | number;
  status: string;
  nf_rpa_path?: string | null;
  nf_rpa_nome_arquivo?: string | null;
  data_envio_nf_rpa?: string | null;
  data_validacao_suporte?: string | null;
  data_bloqueio?: string | null;
}

interface Resumo {
  valor_pendente?: string | number;
  valor_validado?: string | number;
  valor_total?: string | number;
}

const STATUS_LABEL: Record<string, string> = {
  aberto: 'Em andamento',
  aguardando_nf_rpa: 'Enviar NF/RPA',
  nf_rpa_enviada: 'NF/RPA Enviada',
  validado: 'Validado',
  vencido: 'Vencido',
};

const STATUS_ICON = {
  aberto: <Clock size={14} className="text-blue-500" />,
  aguardando_nf_rpa: <AlertTriangle size={14} className="text-yellow-500" />,
  nf_rpa_enviada: <FileText size={14} className="text-purple-500" />,
  validado: <CheckCircle2 size={14} className="text-green-500" />,
  vencido: <AlertTriangle size={14} className="text-red-500" />,
};

const STATUS_COR: Record<string, string> = {
  aberto: 'bg-blue-100 text-blue-700',
  aguardando_nf_rpa: 'bg-yellow-100 text-yellow-700',
  nf_rpa_enviada: 'bg-purple-100 text-purple-700',
  validado: 'bg-green-100 text-green-700',
  vencido: 'bg-red-100 text-red-700',
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
      const res = await fetch('/api/representante/financeiro/ciclos?limit=24');
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
      fd.append('ciclo_id', String(cicloId));
      fd.append('arquivo', file);
      const res = await fetch('/api/representante/financeiro/nf-rpa', {
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
              label: 'Pendente',
              value: fmtBRL(resumo.valor_pendente),
              cor: 'text-yellow-700',
              bg: 'bg-yellow-50 border-yellow-200',
            },
            {
              label: 'Validado',
              value: fmtBRL(resumo.valor_validado),
              cor: 'text-green-700',
              bg: 'bg-green-50 border-green-200',
            },
            {
              label: 'Total Acumulado',
              value: fmtBRL(resumo.valor_total),
              cor: 'text-blue-700',
              bg: 'bg-blue-50 border-blue-200',
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
                  {STATUS_ICON[c.status as keyof typeof STATUS_ICON] ?? (
                    <Clock size={14} />
                  )}
                  <span className="font-semibold text-gray-800">
                    {fmtMesAno(c.mes_ano)}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COR[c.status] ?? 'bg-gray-100 text-gray-600'}`}
                  >
                    {STATUS_LABEL[c.status] ?? c.status}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-800">
                    {fmtBRL(c.valor_total_recebido)}
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
                      <span className="text-gray-400">NF/RPA enviada em:</span>
                      <p className="font-medium">
                        {fmtDate(c.data_envio_nf_rpa)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">Validado em:</span>
                      <p className="font-medium">
                        {fmtDate(c.data_validacao_suporte)}
                      </p>
                    </div>
                    {c.nf_rpa_nome_arquivo && (
                      <div className="col-span-2">
                        <span className="text-gray-400">Arquivo:</span>
                        <p className="font-medium truncate">
                          {c.nf_rpa_nome_arquivo}
                        </p>
                      </div>
                    )}
                    {c.data_bloqueio && (
                      <div className="col-span-2">
                        <span className="text-red-500">Bloqueado em:</span>
                        <p className="font-medium text-red-600">
                          {fmtDate(c.data_bloqueio)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Ação de upload */}
                  {c.status === 'aguardando_nf_rpa' && (
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

                  {c.status === 'nf_rpa_enviada' && (
                    <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg px-3 py-2 text-xs">
                      <FileText size={13} />
                      NF/RPA enviada. Aguardando validação do Suporte.
                    </div>
                  )}

                  {c.status === 'validado' && (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-3 py-2 text-xs">
                      <CheckCircle2 size={13} />
                      NF/RPA validada. Repasse confirmado.
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
