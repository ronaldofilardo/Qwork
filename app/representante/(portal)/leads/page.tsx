'use client';

import { useLeads } from './hooks/useLeads';
import NovoLeadModal from './components/NovoLeadModal';
import LeadsList from './components/LeadsList';

export default function LeadsRepresentante() {
  const {
    leads,
    total,
    page,
    setPage,
    statusFiltro,
    setStatusFiltro,
    loading,
    copiado,
    copiarCodigo,
    showNovo,
    setShowNovo,
    novoForm,
    setNovoForm,
    salvando,
    erro,
    sucesso,
    errosCampos,
    setErrosCampos,
    contagens,
    ordenacao,
    setOrdenacao,
    formValido,
    criarLead,
    handleCNPJChange,
    handleTelefoneChange,
    handleEmailChange,
    handleTipoClienteChange,
    requerAprovacao,
    custoAtual,
  } = useLeads();

  const totalLeads =
    contagens.pendente + contagens.convertido + contagens.expirado;
  const taxa =
    totalLeads > 0
      ? ((contagens.convertido / totalLeads) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-6">
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

      {showNovo && (
        <NovoLeadModal
          novoForm={novoForm}
          setNovoForm={setNovoForm}
          errosCampos={errosCampos}
          salvando={salvando}
          erro={erro}
          formValido={formValido}
          handleCNPJChange={handleCNPJChange}
          handleTelefoneChange={handleTelefoneChange}
          handleEmailChange={handleEmailChange}
          handleTipoClienteChange={handleTipoClienteChange}
          requerAprovacao={requerAprovacao}
          custoAtual={custoAtual}
          criarLead={criarLead}
          onClose={() => {
            setShowNovo(false);
            setErrosCampos({
              cnpj: '',
              contato_email: '',
              contato_telefone: '',
            });
          }}
        />
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          {
            label: 'Total',
            valor: totalLeads,
            cor: 'text-gray-900',
            labelCor: 'text-gray-400',
          },
          {
            label: 'Pendentes',
            valor: contagens.pendente,
            cor: 'text-yellow-700',
            labelCor: 'text-yellow-600',
          },
          {
            label: 'Convertidos',
            valor: contagens.convertido,
            cor: 'text-green-700',
            labelCor: 'text-green-600',
          },
          {
            label: 'Expirados',
            valor: contagens.expirado,
            cor: 'text-gray-500',
            labelCor: 'text-gray-400',
          },
          {
            label: 'Conversão',
            valor: `${taxa}%`,
            cor: 'text-blue-700',
            labelCor: 'text-blue-600',
          },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-xl border p-3">
            <p className={`text-[10px] ${c.labelCor} uppercase tracking-wide`}>
              {c.label}
            </p>
            <p className={`text-xl font-bold ${c.cor}`}>{c.valor}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {['', 'pendente', 'expirado'].map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatusFiltro(s);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${statusFiltro === s ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
          >
            {s === '' ? 'Todos' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <select
          value={ordenacao}
          onChange={(e) =>
            setOrdenacao(e.target.value as 'recente' | 'antigo' | 'expirando')
          }
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

      <LeadsList
        leads={leads}
        loading={loading}
        total={total}
        page={page}
        setPage={setPage}
        ordenacao={ordenacao}
        copiado={copiado}
        copiarCodigo={copiarCodigo}
      />
    </div>
  );
}
