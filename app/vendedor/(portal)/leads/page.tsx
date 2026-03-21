'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, X, Loader2, AlertCircle } from 'lucide-react';

interface Lead {
  id: number;
  status: string;
  contato_nome: string;
  contato_email: string | null;
  contato_telefone: string | null;
  cnpj: string | null;
  valor_negociado: string | null;
  criado_em: string;
  data_conversao: string | null;
  representante_id: number;
  representante_nome: string;
  representante_codigo: string;
}

// ---------------------------------------------------------------------------
// Modal Novo Lead
// ---------------------------------------------------------------------------

interface NovoLeadForm {
  contato_nome: string;
  contato_email: string;
  contato_telefone: string;
  cnpj: string;
  valor_negociado: string;
  percentual_comissao: string;
  observacoes: string;
}

function NovoLeadModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<NovoLeadForm>({
    contato_nome: '',
    contato_email: '',
    contato_telefone: '',
    cnpj: '',
    valor_negociado: '',
    percentual_comissao: '',
    observacoes: '',
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const salvar = async () => {
    if (!form.contato_nome.trim()) {
      setErro('Nome do contato é obrigatório.');
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      const body: Record<string, unknown> = {
        contato_nome: form.contato_nome.trim(),
      };
      if (form.contato_email.trim())
        body.contato_email = form.contato_email.trim();
      if (form.contato_telefone.trim())
        body.contato_telefone = form.contato_telefone.trim();
      if (form.cnpj.trim()) body.cnpj = form.cnpj.trim();
      if (form.valor_negociado.trim())
        body.valor_negociado = parseFloat(form.valor_negociado);
      if (form.percentual_comissao.trim())
        body.percentual_comissao = parseFloat(form.percentual_comissao);
      if (form.observacoes.trim()) body.observacoes = form.observacoes.trim();

      const res = await fetch('/api/vendedor/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error ?? 'Erro ao salvar');
      }
      onSuccess();
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-bold text-gray-900">Novo Lead</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-3 max-h-[70vh] overflow-y-auto">
          {erro && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              <AlertCircle size={14} className="shrink-0" />
              {erro}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Nome do contato <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.contato_nome}
              onChange={(e) =>
                setForm((f) => ({ ...f, contato_nome: e.target.value }))
              }
              placeholder="Nome da empresa ou pessoa"
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400"
            />
          </div>

          {[
            {
              key: 'contato_email',
              label: 'E-mail do contato',
              type: 'email',
              placeholder: 'email@empresa.com.br',
            },
            {
              key: 'contato_telefone',
              label: 'Telefone',
              type: 'tel',
              placeholder: '(11) 99999-9999',
            },
            {
              key: 'cnpj',
              label: 'CNPJ (se disponível)',
              type: 'text',
              placeholder: '00.000.000/0000-00',
            },
            {
              key: 'valor_negociado',
              label: 'Valor negociado (R$)',
              type: 'number',
              placeholder: '0,00',
            },
            {
              key: 'percentual_comissao',
              label: 'Comissão (%)',
              type: 'number',
              placeholder: '0',
            },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {label}
              </label>
              <input
                type={type}
                value={form[key as keyof NovoLeadForm]}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [key]: e.target.value }))
                }
                placeholder={placeholder}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400"
              />
            </div>
          ))}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Observações
            </label>
            <textarea
              value={form.observacoes}
              onChange={(e) =>
                setForm((f) => ({ ...f, observacoes: e.target.value }))
              }
              rows={3}
              placeholder="Informações adicionais sobre o lead..."
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 resize-none"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t flex gap-3">
          <button
            onClick={onClose}
            disabled={salvando}
            className="flex-1 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={salvar}
            disabled={salvando}
            className="flex-1 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {salvando ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}
            {salvando ? 'Enviando...' : 'Enviar Lead'}
          </button>
        </div>
      </div>
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = {
  pendente: 'Pendente',
  em_analise: 'Em análise',
  aprovado: 'Aprovado',
  convertido: 'Convertido',
  expirado: 'Expirado',
  rejeitado: 'Rejeitado',
};

const STATUS_COLORS: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-700',
  em_analise: 'bg-blue-100 text-blue-700',
  aprovado: 'bg-green-100 text-green-700',
  convertido: 'bg-emerald-100 text-emerald-700',
  expirado: 'bg-gray-100 text-gray-500',
  rejeitado: 'bg-red-100 text-red-700',
};

const STATUS_OPTS = [
  '',
  'pendente',
  'em_analise',
  'aprovado',
  'convertido',
  'expirado',
  'rejeitado',
];

export default function VendedorLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNovoLead, setShowNovoLead] = useState(false);
  const [semRepresentante, setSemRepresentante] = useState(false);

  const load = useCallback(async (p: number, s: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (s) params.set('status', s);
      const res = await fetch(`/api/vendedor/leads?${params.toString()}`);
      if (res.ok) {
        const d = (await res.json()) as {
          leads?: Lead[];
          total?: number;
          sem_representante?: boolean;
        };
        setLeads(d.leads ?? []);
        setTotal(d.total ?? 0);
        setSemRepresentante(d.total === 0 && !!d.sem_representante);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page, statusFilter);
  }, [load, page, statusFilter]);

  const handleStatusChange = (s: string) => {
    setStatusFilter(s);
    setPage(1);
  };

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('pt-BR') : '—';

  const fmtBRL = (v: string | null) =>
    v
      ? parseFloat(v).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        })
      : '—';

  const totalPages = Math.ceil(total / 30);

  // Agrupar por representante para exibição segregada
  const byRep: Record<number, { nome: string; codigo: string; leads: Lead[] }> =
    {};
  for (const l of leads) {
    if (!byRep[l.representante_id]) {
      byRep[l.representante_id] = {
        nome: l.representante_nome,
        codigo: l.representante_codigo,
        leads: [],
      };
    }
    byRep[l.representante_id].leads.push(l);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Meus Leads</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} lead{total !== 1 ? 's' : ''} submetido
            {total !== 1 ? 's' : ''} por você
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filtro status */}
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Todos os status</option>
            {STATUS_OPTS.filter(Boolean).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s] ?? s}
              </option>
            ))}
          </select>

          {!semRepresentante && (
            <button
              onClick={() => setShowNovoLead(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              <Plus size={15} />
              Novo Lead
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin h-8 w-8 rounded-full border-4 border-green-500 border-t-transparent" />
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <div className="text-4xl mb-4">📋</div>
          {semRepresentante ? (
            <>
              <p className="text-gray-500 text-sm font-medium">
                Você precisa estar vinculado a um representante para cadastrar
                leads.
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Aguarde o seu representante vincular você à equipe.
              </p>
            </>
          ) : (
            <>
              <p className="text-gray-500 text-sm">Nenhum lead encontrado.</p>
              <p className="text-gray-400 text-xs mt-1">
                Seus leads aparecerão aqui assim que forem submetidos.
              </p>
              <button
                onClick={() => setShowNovoLead(true)}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors font-semibold mx-auto"
              >
                <Plus size={15} /> Cadastrar primeiro lead
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byRep).map(
            ([repId, { nome, codigo, leads: repLeads }]) => (
              <div key={repId} className="bg-white rounded-xl border">
                {/* Cabeçalho do representante */}
                <div className="px-5 py-3 bg-gray-50 border-b rounded-t-xl flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-gray-800 text-sm">
                      {nome}
                    </span>
                    <span className="ml-2 text-xs text-gray-400">
                      #{codigo}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {repLeads.length} lead{repLeads.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Tabela de leads do representante */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-gray-500 uppercase tracking-wide">
                      <tr>
                        <th className="px-5 py-3 text-left font-medium">
                          Contato
                        </th>
                        <th className="px-4 py-3 text-left font-medium">
                          CNPJ
                        </th>
                        <th className="px-4 py-3 text-center font-medium">
                          Status
                        </th>
                        <th className="px-4 py-3 text-right font-medium">
                          Valor
                        </th>
                        <th className="px-4 py-3 text-center font-medium">
                          Enviado em
                        </th>
                        <th className="px-4 py-3 text-center font-medium">
                          Convertido em
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {repLeads.map((lead) => (
                        <tr
                          key={lead.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-5 py-3">
                            <p className="font-medium text-gray-900">
                              {lead.contato_nome}
                            </p>
                            {lead.contato_email && (
                              <p className="text-xs text-gray-400">
                                {lead.contato_email}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm font-mono text-gray-600">
                            {lead.cnpj ? (
                              lead.cnpj.replace(
                                /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
                                '$1.$2.$3/$4-$5'
                              )
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                STATUS_COLORS[lead.status] ??
                                'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {STATUS_LABEL[lead.status] ?? lead.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700">
                            {fmtBRL(lead.valor_negociado)}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-500">
                            {fmtDate(lead.criado_em)}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-500">
                            {fmtDate(lead.data_conversao)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-600">
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Próxima
          </button>
        </div>
      )}

      {showNovoLead && (
        <NovoLeadModal
          onClose={() => setShowNovoLead(false)}
          onSuccess={() => {
            setShowNovoLead(false);
            void load(1, statusFilter);
            setPage(1);
          }}
        />
      )}
    </div>
  );
}
