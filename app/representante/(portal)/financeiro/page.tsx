'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';

interface CicloRow {
  mes_referencia: string;
  valor_total: string | number;
  valor_pago: string | number;
  qtd_comissoes: number;
  qtd_pagas: number;
}

interface Resumo {
  valor_total?: string | number;
  valor_pago?: string | number;
  qtd_meses?: number;
  qtd_pagas?: number;
}

function fmtBRL(v: string | number | null | undefined): string {
  const n = parseFloat(String(v ?? '0'));
  return isNaN(n)
    ? 'R$ —'
    : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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
  const [expandedMes, setExpandedMes] = useState<string | null>(null);

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

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Financeiro</h1>
        <p className="text-sm text-gray-500 mt-1">
          Acompanhe suas comissões por mês. O pagamento ocorre automaticamente
          quando o tomador paga a cobrança.
        </p>
      </div>

      {!loading &&
        (Number(resumo.valor_total ?? 0) > 0 ||
          Number(resumo.valor_pago ?? 0) > 0) && (
          <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            <ShieldCheck size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Repasse auditado no sistema</p>
              <p className="mt-1">
                Quando o tomador paga a cobrança, a comissão do representante é
                registrada e auditada automaticamente no fluxo financeiro do
                QWork.
              </p>
            </div>
          </div>
        )}

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
              label: 'Meses',
              value: String(resumo.qtd_meses ?? 0),
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

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-blue-500" size={28} />
        </div>
      ) : ciclos.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          Nenhuma comissão registrada ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {ciclos.map((c) => (
            <div
              key={c.mes_referencia}
              className="bg-white border rounded-xl overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpandedMes(
                    expandedMes === c.mes_referencia ? null : c.mes_referencia
                  )
                }
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <DollarSign size={14} className="text-green-600" />
                  <span className="font-semibold text-gray-800">
                    {fmtMesAno(c.mes_referencia)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-800">
                    {fmtBRL(c.valor_total)}
                  </span>
                  {expandedMes === c.mes_referencia ? (
                    <ChevronUp size={16} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400" />
                  )}
                </div>
              </button>

              {expandedMes === c.mes_referencia && (
                <div className="px-4 pb-4 border-t pt-3">
                  <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                    <div>
                      <span className="text-gray-400">Comissões:</span>
                      <p className="font-medium">{c.qtd_comissoes}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Pagas:</span>
                      <p className="font-medium">{c.qtd_pagas}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Valor pago:</span>
                      <p className="font-medium text-green-700">
                        {fmtBRL(c.valor_pago)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400">A receber:</span>
                      <p className="font-medium text-blue-700">
                        {fmtBRL(
                          parseFloat(String(c.valor_total ?? 0)) -
                            parseFloat(String(c.valor_pago ?? 0))
                        )}
                      </p>
                    </div>
                  </div>
                  {parseFloat(String(c.valor_pago ?? 0)) >=
                    parseFloat(String(c.valor_total ?? 0)) &&
                    parseFloat(String(c.valor_total ?? 0)) > 0 && (
                      <div className="flex items-center gap-2 bg-green-100 border border-green-300 text-green-800 rounded-lg px-3 py-2 text-xs mt-3">
                        <CheckCircle2 size={13} />
                        Todas as comissões deste mês foram pagas.
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
          Exibindo os 24 meses mais recentes.
        </p>
      )}
    </div>
  );
}
