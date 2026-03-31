'use client';

import { useEffect, useState, useCallback, useContext } from 'react';
import { RepContext } from '../rep-context';
import {
  normalizeCNPJ,
  validarCNPJ,
  validarTelefone,
  validarEmail,
} from '@/lib/validators';

interface Lead {
  id: number;
  cnpj: string;
  razao_social: string | null;
  contato_nome: string | null;
  contato_email: string | null;
  status: string;
  criado_em: string;
  data_expiracao: string;
  data_conversao: string | null;
  token_atual: string | null;
  token_expiracao: string | null;
  valor_negociado: number;
}

const STATUS_COR: Record<string, string> = {
  pendente: 'bg-blue-100 text-blue-700',
  convertido: 'bg-green-100 text-green-700',
  expirado: 'bg-gray-100 text-gray-500',
};

export default function LeadsRepresentante() {
  const { session: repSession } = useContext(RepContext);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFiltro, setStatusFiltro] = useState('');
  const [loading, setLoading] = useState(true);
  const [copiado, setCopiado] = useState<number | null>(null);
  const [showNovo, setShowNovo] = useState(false);
  const [novoForm, setNovoForm] = useState({
    cnpj: '',
    razao_social: '',
    contato_nome: '',
    contato_email: '',
    contato_telefone: '',
    valor_negociado: '',
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [errosCampos, setErrosCampos] = useState({
    cnpj: '',
    contato_email: '',
    contato_telefone: '',
  });
  const [contagens, setContagens] = useState<Record<string, number>>({
    pendente: 0,
    convertido: 0,
    expirado: 0,
  });
  const [ordenacao, setOrdenacao] = useState<
    'recente' | 'antigo' | 'expirando'
  >('recente');

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const copiarCodigo = async (lead: Lead) => {
    const codigo = repSession?.codigo ?? '';
    const texto =
      `Olá! Faça o cadastro da sua empresa no QWork:\n` +
      `${baseUrl}/login\n\n` +
      `Na etapa de confirmação, informe o código do representante: ${codigo}`;
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(lead.id);
      setTimeout(() => setCopiado(null), 2000);
    } catch {
      setErro('Não foi possível copiar. Tente manualmente.');
    }
  };

  const carregarLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFiltro) params.set('status', statusFiltro);
      const res = await fetch(`/api/representante/leads?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setLeads(data.leads ?? []);
      setTotal(data.total ?? 0);
      if (data.contagens) setContagens(data.contagens);
    } finally {
      setLoading(false);
    }
  }, [page, statusFiltro]);

  useEffect(() => {
    carregarLeads();
  }, [carregarLeads]);

  const aplicarMascaraCNPJ = (valor: string): string => {
    const digits = normalizeCNPJ(valor).slice(0, 14);
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length <= 8)
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    if (digits.length <= 12)
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  };

  const aplicarMascaraTelefone = (valor: string): string => {
    const digits = valor.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits.length ? `(${digits}` : '';
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10)
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleCNPJChange = (valor: string) => {
    const mascarado = aplicarMascaraCNPJ(valor);
    setNovoForm((p) => ({ ...p, cnpj: mascarado }));
    const limpo = normalizeCNPJ(mascarado);
    if (limpo.length === 0) {
      setErrosCampos((p) => ({ ...p, cnpj: '' }));
    } else if (limpo.length < 14) {
      setErrosCampos((p) => ({ ...p, cnpj: 'CNPJ incompleto' }));
    } else if (!validarCNPJ(limpo)) {
      setErrosCampos((p) => ({ ...p, cnpj: 'CNPJ inválido' }));
    } else {
      setErrosCampos((p) => ({ ...p, cnpj: '' }));
    }
  };

  const handleTelefoneChange = (valor: string) => {
    const mascarado = aplicarMascaraTelefone(valor);
    setNovoForm((p) => ({ ...p, contato_telefone: mascarado }));
    if (mascarado && !validarTelefone(mascarado)) {
      setErrosCampos((p) => ({ ...p, contato_telefone: 'Telefone inválido' }));
    } else {
      setErrosCampos((p) => ({ ...p, contato_telefone: '' }));
    }
  };

  const handleEmailChange = (valor: string) => {
    setNovoForm((p) => ({ ...p, contato_email: valor }));
    if (valor && !validarEmail(valor)) {
      setErrosCampos((p) => ({ ...p, contato_email: 'E-mail inválido' }));
    } else {
      setErrosCampos((p) => ({ ...p, contato_email: '' }));
    }
  };

  const valorNegociadoNum = parseFloat(
    novoForm.valor_negociado.replace(/[^\d,]/g, '').replace(',', '.')
  );

  const formValido =
    normalizeCNPJ(novoForm.cnpj).length === 14 &&
    validarCNPJ(normalizeCNPJ(novoForm.cnpj)) &&
    !errosCampos.contato_email &&
    !errosCampos.contato_telefone &&
    !isNaN(valorNegociadoNum) &&
    valorNegociadoNum > 0;

  const criarLead = async (e: React.FormEvent) => {
    e.preventDefault();
    const cnpjLimpo = normalizeCNPJ(novoForm.cnpj);
    if (!validarCNPJ(cnpjLimpo)) {
      setErrosCampos((p) => ({ ...p, cnpj: 'CNPJ inválido' }));
      return;
    }
    if (novoForm.contato_email && !validarEmail(novoForm.contato_email)) {
      setErrosCampos((p) => ({ ...p, contato_email: 'E-mail inválido' }));
      return;
    }
    if (
      novoForm.contato_telefone &&
      !validarTelefone(novoForm.contato_telefone)
    ) {
      setErrosCampos((p) => ({ ...p, contato_telefone: 'Telefone inválido' }));
      return;
    }
    setSalvando(true);
    setErro('');
    try {
      const res = await fetch('/api/representante/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cnpj: cnpjLimpo,
          razao_social: novoForm.razao_social || null,
          contato_nome: novoForm.contato_nome || null,
          contato_email: novoForm.contato_email || null,
          contato_telefone: novoForm.contato_telefone || null,
          valor_negociado: valorNegociadoNum,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao criar lead');
        return;
      }
      setShowNovo(false);
      setNovoForm({
        cnpj: '',
        razao_social: '',
        contato_nome: '',
        contato_email: '',
        contato_telefone: '',
        valor_negociado: '',
      });
      setErrosCampos({ cnpj: '', contato_email: '', contato_telefone: '' });
      setSucesso('Lead registrado com sucesso!');
      setTimeout(() => setSucesso(''), 3000);
      await carregarLeads();
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Título + ação */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Meus Leads</h1>
        <button
          onClick={() => setShowNovo(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Novo Lead
        </button>
      </div>
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
          {erro}
        </div>
      )}
      {sucesso && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">
          {sucesso}
        </div>
      )}

      {/* Modal novo lead */}
      {showNovo && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-semibold text-gray-900">
                Registrar Nova Indicação
              </h2>
              <button
                onClick={() => setShowNovo(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={criarLead} className="px-6 py-4 space-y-4">
              {/* CNPJ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CNPJ *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="00.000.000/0001-00"
                  value={novoForm.cnpj}
                  onChange={(e) => handleCNPJChange(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                    errosCampos.cnpj
                      ? 'border-red-400 focus:ring-red-400'
                      : normalizeCNPJ(novoForm.cnpj).length === 14 &&
                          !errosCampos.cnpj
                        ? 'border-green-400 focus:ring-green-400'
                        : 'focus:ring-blue-500'
                  }`}
                  required
                />
                {errosCampos.cnpj && (
                  <p className="mt-1 text-xs text-red-500">
                    {errosCampos.cnpj}
                  </p>
                )}
                {!errosCampos.cnpj &&
                  normalizeCNPJ(novoForm.cnpj).length === 14 && (
                    <p className="mt-1 text-xs text-green-600">CNPJ válido ✓</p>
                  )}
              </div>

              {/* Razão Social */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Razão Social
                </label>
                <input
                  type="text"
                  value={novoForm.razao_social}
                  onChange={(e) =>
                    setNovoForm((p) => ({
                      ...p,
                      razao_social: e.target.value,
                    }))
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Nome do Contato + Telefone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Contato
                  </label>
                  <input
                    type="text"
                    value={novoForm.contato_nome}
                    onChange={(e) =>
                      setNovoForm((p) => ({
                        ...p,
                        contato_nome: e.target.value,
                      }))
                    }
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="(11) 91234-5678"
                    value={novoForm.contato_telefone}
                    onChange={(e) => handleTelefoneChange(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                      errosCampos.contato_telefone
                        ? 'border-red-400 focus:ring-red-400'
                        : 'focus:ring-blue-500'
                    }`}
                  />
                  {errosCampos.contato_telefone && (
                    <p className="mt-1 text-xs text-red-500">
                      {errosCampos.contato_telefone}
                    </p>
                  )}
                </div>
              </div>

              {/* E-mail */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail do Contato
                </label>
                <input
                  type="text"
                  inputMode="email"
                  placeholder="contato@empresa.com.br"
                  value={novoForm.contato_email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                    errosCampos.contato_email
                      ? 'border-red-400 focus:ring-red-400'
                      : 'focus:ring-blue-500'
                  }`}
                />
                {errosCampos.contato_email && (
                  <p className="mt-1 text-xs text-red-500">
                    {errosCampos.contato_email}
                  </p>
                )}
              </div>

              {/* Valor Negociado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor Negociado (R$) *
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="R$ 0,00"
                  value={novoForm.valor_negociado}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d]/g, '');
                    if (!raw) {
                      setNovoForm((p) => ({ ...p, valor_negociado: '' }));
                      return;
                    }
                    const formatted = (Number(raw) / 100).toLocaleString(
                      'pt-BR',
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    );
                    setNovoForm((p) => ({
                      ...p,
                      valor_negociado: `R$ ${formatted}`,
                    }));
                  }}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="mt-1 text-xs text-gray-400">
                  Valor acordado com a empresa para o serviço
                </p>
              </div>

              {erro && <p className="text-sm text-red-600">{erro}</p>}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowNovo(false);
                    setErrosCampos({
                      cnpj: '',
                      contato_email: '',
                      contato_telefone: '',
                    });
                  }}
                  className="flex-1 border px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando || !formValido}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {salvando ? 'Salvando...' : 'Registrar Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cards de resumo */}
      {(() => {
        const totalLeads =
          contagens.pendente + contagens.convertido + contagens.expirado;
        const taxa =
          totalLeads > 0
            ? ((contagens.convertido / totalLeads) * 100).toFixed(1)
            : '0.0';
        return (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-white rounded-xl border p-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                Total
              </p>
              <p className="text-xl font-bold text-gray-900">{totalLeads}</p>
            </div>
            <div className="bg-white rounded-xl border p-3">
              <p className="text-[10px] text-yellow-600 uppercase tracking-wide">
                Pendentes
              </p>
              <p className="text-xl font-bold text-yellow-700">
                {contagens.pendente}
              </p>
            </div>
            <div className="bg-white rounded-xl border p-3">
              <p className="text-[10px] text-green-600 uppercase tracking-wide">
                Convertidos
              </p>
              <p className="text-xl font-bold text-green-700">
                {contagens.convertido}
              </p>
            </div>
            <div className="bg-white rounded-xl border p-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                Expirados
              </p>
              <p className="text-xl font-bold text-gray-500">
                {contagens.expirado}
              </p>
            </div>
            <div className="bg-white rounded-xl border p-3">
              <p className="text-[10px] text-blue-600 uppercase tracking-wide">
                Conversão
              </p>
              <p className="text-xl font-bold text-blue-700">{taxa}%</p>
            </div>
          </div>
        );
      })()}

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        {['', 'pendente', 'convertido', 'expirado'].map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatusFiltro(s);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                ${statusFiltro === s ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
          >
            {s === '' ? 'Todos' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <select
          value={ordenacao}
          onChange={(e) => setOrdenacao(e.target.value as any)}
          className="ml-auto border rounded-lg px-2 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="recente">Mais recente</option>
          <option value="antigo">Mais antigo</option>
          <option value="expirando">Próximo a expirar</option>
        </select>
        <span className="text-sm text-gray-500">
          {total} {total === 1 ? 'lead' : 'leads'}
        </span>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <div className="text-5xl mb-4">🎯</div>
          <p className="text-lg font-medium">Nenhum lead encontrado</p>
          <p className="text-sm mt-1">
            Clique em <strong>+ Novo Lead</strong> para registrar sua primeira
            indicação.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {[...leads]
            .sort((a, b) => {
              if (ordenacao === 'antigo')
                return (
                  new Date(a.criado_em).getTime() -
                  new Date(b.criado_em).getTime()
                );
              if (ordenacao === 'expirando')
                return (
                  new Date(a.data_expiracao).getTime() -
                  new Date(b.data_expiracao).getTime()
                );
              return (
                new Date(b.criado_em).getTime() -
                new Date(a.criado_em).getTime()
              );
            })
            .map((lead) => {
              const expiraSoon =
                lead.status === 'pendente' &&
                new Date(lead.data_expiracao).getTime() - Date.now() <
                  7 * 24 * 60 * 60 * 1000;
              return (
                <div
                  key={lead.id}
                  className={`bg-white rounded-xl border p-5 hover:shadow-sm transition-shadow ${
                    expiraSoon ? 'border-l-4 border-l-orange-400' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {lead.razao_social && (
                          <span className="font-semibold text-gray-900">
                            {lead.razao_social}
                          </span>
                        )}
                        <span className="font-mono text-xs text-gray-400">
                          {lead.cnpj}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COR[lead.status] ?? 'bg-gray-100 text-gray-600'}`}
                        >
                          {lead.status}
                        </span>
                        {lead.valor_negociado > 0 && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                            R${' '}
                            {Number(lead.valor_negociado).toLocaleString(
                              'pt-BR',
                              { minimumFractionDigits: 2 }
                            )}
                          </span>
                        )}
                      </div>
                      {lead.contato_nome && (
                        <p className="text-sm text-gray-500 mt-1">
                          Contato: {lead.contato_nome}
                          {lead.contato_email ? ` · ${lead.contato_email}` : ''}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span>
                          Criado:{' '}
                          {new Date(lead.criado_em).toLocaleDateString('pt-BR')}
                        </span>
                        {lead.status === 'convertido' ? (
                          <span className="text-green-600 font-medium">
                            📋 Cadastrado em:{' '}
                            {lead.data_conversao
                              ? new Date(
                                  lead.data_conversao
                                ).toLocaleDateString('pt-BR')
                              : '—'}
                          </span>
                        ) : (
                          <span>
                            Expira:{' '}
                            {new Date(lead.data_expiracao).toLocaleDateString(
                              'pt-BR'
                            )}
                          </span>
                        )}
                        {expiraSoon && (
                          <span className="text-orange-500 font-medium">
                            ⚠ Expira em{' '}
                            {Math.max(
                              0,
                              Math.ceil(
                                (new Date(lead.data_expiracao).getTime() -
                                  Date.now()) /
                                  (1000 * 60 * 60 * 24)
                              )
                            )}{' '}
                            dias
                          </span>
                        )}
                      </div>
                    </div>

                    {lead.status === 'pendente' && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => copiarCodigo(lead)}
                          className="flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                        >
                          {copiado === lead.id ? (
                            <span>✅ Copiado!</span>
                          ) : (
                            <span>📋 Compartilhar</span>
                          )}
                        </button>
                      </div>
                    )}
                    {lead.status === 'convertido' && (
                      <span className="text-green-600 text-sm font-medium">
                        ✅ Convertido
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Paginação */}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            ← Anterior
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-600">
            Pág. {page} de {Math.ceil(total / 20)}
          </span>
          <button
            disabled={page >= Math.ceil(total / 20)}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}
