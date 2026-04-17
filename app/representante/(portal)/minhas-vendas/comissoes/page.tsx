'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Upload,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import type {
  Comissao,
  Resumo,
} from '@/app/representante/(portal)/comissoes/types';
import {
  fmt,
  STATUS_BADGE,
} from '@/app/representante/(portal)/comissoes/types';
import ComissoesTable from '@/app/representante/(portal)/comissoes/components/ComissoesTable';

interface CicloNF {
  id: number;
  mes_referencia: string;
  valor_total: string | number;
  status: string;
  nf_enviada_em?: string | null;
  nf_aprovada_em?: string | null;
  nf_rejeitada_em?: string | null;
  nf_motivo_rejeicao?: string | null;
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
  return `${meses[parseInt(mes, 10) - 1] ?? mes}/${ano}`;
}

function BannerNF({
  ciclos,
  onUpload,
  uploading,
  uploadErro,
  uploadSucesso,
}: {
  ciclos: CicloNF[];
  onUpload: (cicloId: number, file: File) => void;
  uploading: number | null;
  uploadErro: string;
  uploadSucesso: string;
}) {
  const hoje = new Date();
  const diaDoMes = hoje.getDate();
  const dentroJanela = diaDoMes >= 1 && diaDoMes <= 5;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);

  const ciclosPendentes = ciclos.filter((c) =>
    ['fechado', 'nf_enviada'].includes(c.status)
  );
  const ciclosAprovados = ciclos.filter((c) => c.status === 'nf_aprovada');

  if (ciclosPendentes.length === 0 && ciclosAprovados.length === 0) return null;

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || pendingId == null) return;
    onUpload(pendingId, file);
    e.target.value = '';
    setPendingId(null);
  };

  const triggerUpload = (cicloId: number) => {
    setPendingId(cicloId);
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={onFileChange}
      />

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

      {ciclosPendentes.map((c) => (
        <div
          key={c.id}
          className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            {c.status === 'nf_enviada' ? (
              <FileText size={18} className="text-purple-500 mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle
                size={18}
                className="text-yellow-500 mt-0.5 shrink-0"
              />
            )}
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {fmtMesAno(c.mes_referencia)} — {fmt(c.valor_total)}
              </p>
              {c.status === 'nf_enviada' ? (
                <p className="text-xs text-purple-700 mt-0.5">
                  NF/RPA enviada — aguardando validação do Suporte.
                </p>
              ) : dentroJanela ? (
                <p className="text-xs text-yellow-700 mt-0.5">
                  Janela de envio: dias 1–5. Envie sua NF/RPA para liberação.
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-0.5">
                  Envio de NF/RPA disponível nos dias 1–5 do mês.
                </p>
              )}
            </div>
          </div>
          {dentroJanela && (
            <button
              onClick={() => triggerUpload(c.id)}
              disabled={uploading === c.id}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-yellow-600 text-white hover:bg-yellow-700 disabled:opacity-50 transition-colors"
            >
              {uploading === c.id ? (
                <Clock size={13} className="animate-spin" />
              ) : (
                <Upload size={13} />
              )}
              {c.status === 'nf_enviada' ? 'Reenviar' : 'Enviar NF/RPA'}
            </button>
          )}
        </div>
      ))}

      {ciclosAprovados.map((c) => (
        <div
          key={c.id}
          className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3"
        >
          <CheckCircle2 size={18} className="text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {fmtMesAno(c.mes_referencia)} — NF/RPA aprovada
            </p>
            <p className="text-xs text-green-700 mt-0.5">
              Pagamento previsto para o dia 15.
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MinhasVendasComissoesPage() {
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFiltro, setStatusFiltro] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [ciclos, setCiclos] = useState<CicloNF[]>([]);
  const [uploading, setUploading] = useState<number | null>(null);
  const [uploadErro, setUploadErro] = useState('');
  const [uploadSucesso, setUploadSucesso] = useState('');

  const carregarCiclos = useCallback(async () => {
    try {
      const res = await fetch('/api/representante/ciclos?limit=6');
      if (!res.ok) return;
      const data = (await res.json()) as { ciclos?: CicloNF[] };
      setCiclos(data.ciclos ?? []);
    } catch {
      // best-effort
    }
  }, []);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (statusFiltro) params.set('status', statusFiltro);
      const res = await fetch(
        `/api/representante/minhas-vendas/comissoes?${params.toString()}`
      );
      if (!res.ok) {
        const errData = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setErro(
          `Erro ao carregar comissões (${res.status}): ${errData.error ?? res.statusText}`
        );
        return;
      }
      const data = (await res.json()) as {
        comissoes?: Comissao[];
        resumo?: Resumo;
        total?: number;
      };
      setComissoes(data.comissoes ?? []);
      setResumo(data.resumo ?? null);
      setTotal(data.total ?? 0);
    } catch (e) {
      setErro(
        `Falha de rede ao carregar comissões: ${e instanceof Error ? e.message : String(e)}`
      );
    } finally {
      setLoading(false);
    }
  }, [page, statusFiltro]);

  useEffect(() => {
    void carregar();
    void carregarCiclos();
  }, [carregar, carregarCiclos]);

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
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setUploadErro(data.error ?? 'Erro ao enviar arquivo');
        return;
      }
      setUploadSucesso('NF/RPA enviada! Aguardando validação do Suporte.');
      setTimeout(() => setUploadSucesso(''), 5000);
      void carregarCiclos();
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          Comissões — Vendas Diretas
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Comissões geradas a partir dos seus leads diretos (sem intermediação
          de vendedores).
        </p>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-4 text-sm text-red-700">
          {erro}
        </div>
      )}

      <BannerNF
        ciclos={ciclos}
        onUpload={handleUpload}
        uploading={uploading}
        uploadErro={uploadErro}
        uploadSucesso={uploadSucesso}
      />

      {resumo && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
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
          {['retida', 'liberada', 'paga'].map((s, i, arr) => (
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
          ))}
          <span className="text-gray-200 mx-2">|</span>
          {['congelada_aguardando_admin', 'cancelada'].map((s) => (
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
