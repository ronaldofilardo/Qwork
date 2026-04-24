'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react';

interface CicloRow {
  id: number;
  representante_id: number;
  representante_nome: string;
  representante_email: string;
  representante_codigo: string;
  mes_ano: string;
  valor_total_recebido: string | number;
  status: string;
  nf_rpa_path?: string | null;
  nf_rpa_nome_arquivo?: string | null;
  data_envio_nf_rpa?: string | null;
  data_validacao_suporte?: string | null;
  data_bloqueio?: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  aberto: 'Aberto',
  aguardando_nf_rpa: 'Aguardando NF/RPA',
  nf_rpa_enviada: 'NF/RPA Enviada',
  validado: 'Validado',
  vencido: 'Vencido',
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

export default function CiclosComissaoContent() {
  const [ciclos, setCiclos] = useState<CicloRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [acao, setAcao] = useState<{
    id: number;
    tipo: 'validar' | 'rejeitar';
  } | null>(null);
  const [motivo, setMotivo] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const limit = 20;

  const load = useCallback(async (p: number, s: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(p),
        limit: String(limit),
      });
      if (s) params.set('status', s);
      const res = await fetch(`/api/suporte/comissionamento/ciclos?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setCiclos(data.ciclos ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page, statusFilter);
  }, [load, page, statusFilter]);

  const executarAcao = async () => {
    if (!acao) return;
    setSalvando(true);
    setErro('');
    try {
      const res = await fetch(
        `/api/suporte/comissionamento/ciclos/${acao.id}/validar`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            acao: acao.tipo,
            motivo: motivo || undefined,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao processar');
        return;
      }
      setSucesso(data.message ?? 'Operação realizada.');
      setTimeout(() => setSucesso(''), 4000);
      setAcao(null);
      setMotivo('');
      await load(page, statusFilter);
    } finally {
      setSalvando(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Ciclos de Comissão
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Gestão de NF/RPA mensal dos representantes
          </p>
        </div>
        <button
          onClick={() => load(page, statusFilter)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
        >
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      {/* Filtro de status */}
      <div className="flex gap-2 flex-wrap">
        {[
          '',
          'nf_rpa_enviada',
          'aguardando_nf_rpa',
          'vencido',
          'validado',
          'aberto',
        ].map((s) => (
          <button
            key={s}
            onClick={() => {
              setPage(1);
              setStatusFilter(s);
            }}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${statusFilter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            {s ? (STATUS_LABEL[s] ?? s) : 'Todos'}
          </button>
        ))}
      </div>

      {sucesso && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
          <CheckCircle2 size={16} /> {sucesso}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-blue-500" size={28} />
        </div>
      ) : ciclos.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          Nenhum ciclo encontrado.
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Representante</th>
                <th className="px-4 py-3 text-left">Mês/Ano</th>
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">NF Enviada em</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {ciclos.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">
                      {c.representante_nome}
                    </p>
                    <p className="text-xs text-gray-400">
                      {c.representante_email}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-700">
                    {c.mes_ano}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-800">
                    {fmtBRL(c.valor_total_recebido)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COR[c.status] ?? 'bg-gray-100 text-gray-600'}`}
                    >
                      {STATUS_LABEL[c.status] ?? c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {fmtDate(c.data_envio_nf_rpa)}
                    {c.nf_rpa_nome_arquivo && (
                      <p className="text-gray-400 truncate max-w-[150px]">
                        {c.nf_rpa_nome_arquivo}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {c.status === 'nf_rpa_enviada' && (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setAcao({ id: c.id, tipo: 'validar' })}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                          title="Validar NF/RPA"
                        >
                          <CheckCircle2 size={12} /> Validar
                        </button>
                        <button
                          onClick={() =>
                            setAcao({ id: c.id, tipo: 'rejeitar' })
                          }
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                          title="Rejeitar NF/RPA"
                        >
                          <XCircle size={12} /> Rejeitar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-gray-500">{total} ciclos</p>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 text-xs rounded ${page === p ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modal de confirmação */}
      {acao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle
                size={20}
                className={
                  acao.tipo === 'validar' ? 'text-green-600' : 'text-red-600'
                }
              />
              <h3 className="text-base font-semibold text-gray-900">
                {acao.tipo === 'validar' ? 'Validar NF/RPA' : 'Rejeitar NF/RPA'}
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {acao.tipo === 'validar'
                ? 'Confirma que a NF/RPA está correta e o repasse pode ser liberado?'
                : 'A NF/RPA será rejeitada e o representante deverá reenviar.'}
            </p>
            {acao.tipo === 'rejeitar' && (
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Motivo da rejeição (opcional)"
                rows={3}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 mb-4"
              />
            )}
            {erro && <p className="text-sm text-red-600 mb-3">{erro}</p>}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setAcao(null);
                  setMotivo('');
                  setErro('');
                }}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => void executarAcao()}
                disabled={salvando}
                className={`flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50 ${acao.tipo === 'validar' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {salvando && <Loader2 size={14} className="animate-spin" />}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
