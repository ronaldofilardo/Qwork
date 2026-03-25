'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Users,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Check,
  Loader2,
} from 'lucide-react';
import {
  CUSTO_POR_AVALIACAO,
  TIPO_CLIENTE_LABEL,
  MAX_PERCENTUAL_COMISSAO,
  calcularValoresComissao,
  calcularRequerAprovacao,
} from '@/lib/leads-config';
import type { TipoCliente } from '@/lib/leads-config';

interface LeadEquipe {
  id: number;
  cnpj: string | null;
  razao_social: string | null;
  contato_nome: string | null;
  status: string;
  origem: string | null;
  criado_em: string;
  data_expiracao: string | null;
  vendedor_id: number | null;
  vendedor_nome: string | null;
  valor_negociado: number | null;
  percentual_comissao_representante: number | null;
  percentual_comissao_vendedor: number | null;
  num_vidas_estimado: number | null;
  requer_aprovacao_comercial: boolean;
  tipo_cliente: TipoCliente | null;
}

interface VendedorGroup {
  vendedor_id: number;
  vendedor_nome: string;
  leads: LeadEquipe[];
}

export default function EquipeLeadsPage() {
  const [porVendedor, setPorVendedor] = useState<VendedorGroup[]>([]);
  const [diretos, setDiretos] = useState<LeadEquipe[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState<Set<number>>(new Set());
  const [statusFiltro, setStatusFiltro] = useState('');

  // Modal comissão
  const [modalLead, setModalLead] = useState<LeadEquipe | null>(null);
  const [percRepInput, setPercRepInput] = useState('');
  const [percVendInput, setPercVendInput] = useState('');
  const [salvandoComissao, setSalvandoComissao] = useState(false);
  const [erroComissao, setErroComissao] = useState('');
  const [sucesso, setSucesso] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFiltro) params.set('status', statusFiltro);
      const res = await fetch(
        `/api/representante/equipe/leads?${params.toString()}`
      );
      if (!res.ok) return;
      const data = await res.json();
      setPorVendedor(data.por_vendedor ?? []);
      setDiretos(data.diretos ?? []);
      setTotal(data.total ?? 0);
      // Expandir todos os vendedores que têm leads por padrão
      const ids = new Set<number>(
        (data.por_vendedor ?? []).map((v: VendedorGroup) => v.vendedor_id)
      );
      setExpandido(ids);
    } finally {
      setLoading(false);
    }
  }, [statusFiltro]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const toggleVendedor = (vid: number) => {
    setExpandido((prev) => {
      const next = new Set(prev);
      if (next.has(vid)) next.delete(vid);
      else next.add(vid);
      return next;
    });
  };

  const abrirModal = (lead: LeadEquipe) => {
    setModalLead(lead);
    setPercRepInput(
      lead.percentual_comissao_representante != null
        ? String(lead.percentual_comissao_representante)
        : ''
    );
    setPercVendInput(String(lead.percentual_comissao_vendedor ?? 0));
    setErroComissao('');
  };

  const definirComissao = async () => {
    if (!modalLead) return;
    const percRep = parseFloat(percRepInput.replace(',', '.'));
    if (isNaN(percRep) || percRep < 0) {
      setErroComissao('Informe um percentual válido para o representante.');
      return;
    }
    const percVend = parseFloat(percVendInput.replace(',', '.'));
    if (isNaN(percVend) || percVend < 0) {
      setErroComissao('Informe um percentual válido para o vendedor.');
      return;
    }
    if (percRep + percVend > MAX_PERCENTUAL_COMISSAO) {
      setErroComissao(
        `Total (${(percRep + percVend).toFixed(1)}%) excede o máximo de ${MAX_PERCENTUAL_COMISSAO}%.`
      );
      return;
    }
    setSalvandoComissao(true);
    setErroComissao('');
    try {
      const res = await fetch(
        `/api/representante/equipe/leads/${modalLead.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            percentual_comissao_representante: percRep,
            percentual_comissao_vendedor: percVend,
          }),
        }
      );
      const d = await res.json();
      if (!res.ok) {
        setErroComissao(d.error ?? 'Erro ao definir comissão.');
        return;
      }
      setSucesso(d.message ?? 'Comissão definida com sucesso.');
      setModalLead(null);
      setTimeout(() => setSucesso(''), 4000);
      await carregar();
    } catch {
      setErroComissao('Erro de conexão.');
    } finally {
      setSalvandoComissao(false);
    }
  };

  const fmtBRL = (v: number | null | undefined) =>
    v != null
      ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : '—';

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

  const STATUS_COR: Record<string, string> = {
    pendente: 'bg-blue-100 text-blue-700',
    convertido: 'bg-green-100 text-green-700',
    expirado: 'bg-gray-100 text-gray-500',
    rejeitado: 'bg-red-100 text-red-700',
  };

  const renderLead = (lead: LeadEquipe) => {
    const tipo = (lead.tipo_cliente ?? 'entidade') as TipoCliente;
    const percRep = Number(lead.percentual_comissao_representante ?? 0);
    const percVend = Number(lead.percentual_comissao_vendedor ?? 0);
    const valor = Number(lead.valor_negociado ?? 0);
    const temComissaoRep = percRep > 0;
    const bd =
      valor > 0
        ? calcularValoresComissao(valor, percRep, percVend, tipo)
        : null;

    return (
      <tr key={lead.id} className="hover:bg-gray-50 text-sm">
        <td className="px-4 py-3">
          <div className="font-medium text-gray-900">
            {lead.contato_nome ?? lead.razao_social ?? '—'}
          </div>
          {lead.cnpj && (
            <div className="text-xs text-gray-400 font-mono">{lead.cnpj}</div>
          )}
        </td>
        <td className="px-4 py-3 text-center">
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COR[lead.status] ?? 'bg-gray-100 text-gray-600'}`}
          >
            {lead.status}
          </span>
        </td>
        <td className="px-4 py-3 text-center">
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
              tipo === 'entidade'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-purple-100 text-purple-700'
            }`}
          >
            {TIPO_CLIENTE_LABEL[tipo]}
          </span>
        </td>
        <td className="px-4 py-3 text-right text-gray-700">{fmtBRL(valor)}</td>
        <td className="px-4 py-3 text-center">
          {lead.num_vidas_estimado != null ? (
            <span
              className={`text-xs font-medium ${lead.num_vidas_estimado >= 200 ? 'text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded' : 'text-gray-600'}`}
            >
              {lead.num_vidas_estimado}
              {lead.num_vidas_estimado >= 200 && ' (volume)'}
            </span>
          ) : (
            <span className="text-xs text-gray-400">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-center">
          <div className="text-xs space-y-0.5">
            <div
              className={
                temComissaoRep
                  ? 'text-gray-700'
                  : 'text-amber-600 font-semibold'
              }
            >
              Rep: {temComissaoRep ? `${percRep.toFixed(1)}%` : 'Pendente'}
            </div>
            {percVend > 0 && (
              <div className="text-purple-600">
                Vend: {percVend.toFixed(1)}%
              </div>
            )}
            {bd && (
              <div className="text-gray-400">
                Total: {bd.percentualTotal.toFixed(1)}%
              </div>
            )}
          </div>
        </td>
        <td className="px-4 py-3 text-center text-gray-500 text-xs">
          {fmtDate(lead.criado_em)}
        </td>
        <td className="px-4 py-3 text-center">
          {lead.status === 'pendente' && lead.vendedor_id != null && (
            <button
              onClick={() => abrirModal(lead)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                temComissaoRep
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {temComissaoRep ? 'Alterar %' : 'Definir %'}
            </button>
          )}
          {lead.requer_aprovacao_comercial && (
            <div className="text-xs text-amber-600 mt-1 flex items-center justify-center gap-1">
              <AlertTriangle size={12} /> Aprovação
            </div>
          )}
        </td>
      </tr>
    );
  };

  // Dados do preview no modal
  const modalPercRep = parseFloat(percRepInput.replace(',', '.')) || 0;
  const modalPercVend = parseFloat(percVendInput.replace(',', '.')) || 0;
  const modalValor = Number(modalLead?.valor_negociado ?? 0);
  const modalTipo = (modalLead?.tipo_cliente ?? 'entidade') as TipoCliente;
  const modalBd =
    modalValor > 0
      ? calcularValoresComissao(
          modalValor,
          modalPercRep,
          modalPercVend,
          modalTipo
        )
      : null;
  const modalRequer =
    modalValor > 0
      ? calcularRequerAprovacao(
          modalValor,
          modalPercRep,
          modalTipo,
          modalPercVend
        )
      : false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users size={20} className="text-blue-600" />
            Leads da Equipe
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} lead{total !== 1 ? 's' : ''} registrados
          </p>
        </div>
        <select
          value={statusFiltro}
          onChange={(e) => setStatusFiltro(e.target.value)}
          className="text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os status</option>
          <option value="pendente">Pendentes</option>
          <option value="convertido">Convertidos</option>
          <option value="expirado">Expirados</option>
        </select>
      </div>

      {sucesso && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">
          <Check size={16} /> {sucesso}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : total === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-sm">Nenhum lead encontrado.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Vendedores */}
          {porVendedor.map((grupo) => (
            <div
              key={grupo.vendedor_id}
              className="bg-white rounded-xl border overflow-hidden"
            >
              <button
                onClick={() => toggleVendedor(grupo.vendedor_id)}
                className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {expandido.has(grupo.vendedor_id) ? (
                    <ChevronDown size={16} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-400" />
                  )}
                  <span className="font-medium text-gray-900">
                    {grupo.vendedor_nome}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {grupo.leads.length} lead
                    {grupo.leads.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </button>
              {expandido.has(grupo.vendedor_id) && grupo.leads.length > 0 && (
                <div className="overflow-x-auto border-t">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-gray-500 uppercase tracking-wide bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">
                          Lead
                        </th>
                        <th className="px-4 py-2 text-center font-medium">
                          Status
                        </th>
                        <th className="px-4 py-2 text-center font-medium">
                          Tipo
                        </th>
                        <th className="px-4 py-2 text-right font-medium">
                          Valor
                        </th>
                        <th className="px-4 py-2 text-center font-medium">
                          Vidas
                        </th>
                        <th className="px-4 py-2 text-center font-medium">
                          Comissão
                        </th>
                        <th className="px-4 py-2 text-center font-medium">
                          Data
                        </th>
                        <th className="px-4 py-2 text-center font-medium">
                          Ação
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {grupo.leads.map(renderLead)}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}

          {/* Leads diretos */}
          {diretos.length > 0 && (
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="px-5 py-3 border-b">
                <span className="font-medium text-gray-900">
                  Leads Diretos (sem vendedor)
                </span>
                <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {diretos.length}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-gray-500 uppercase tracking-wide bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Lead</th>
                      <th className="px-4 py-2 text-center font-medium">
                        Status
                      </th>
                      <th className="px-4 py-2 text-center font-medium">
                        Tipo
                      </th>
                      <th className="px-4 py-2 text-right font-medium">
                        Valor
                      </th>
                      <th className="px-4 py-2 text-center font-medium">
                        Vidas
                      </th>
                      <th className="px-4 py-2 text-center font-medium">
                        Comissão
                      </th>
                      <th className="px-4 py-2 text-center font-medium">
                        Data
                      </th>
                      <th className="px-4 py-2 text-center font-medium">
                        Ação
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">{diretos.map(renderLead)}</tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Definir Comissão */}
      {modalLead && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900">Definir Comissão</h3>
              <button
                onClick={() => setModalLead(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {/* Info do lead */}
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                <p>
                  <span className="font-medium text-gray-700">Lead:</span>{' '}
                  {modalLead.contato_nome ?? modalLead.razao_social ?? '—'}
                </p>
                <p>
                  <span className="font-medium text-gray-700">CNPJ:</span>{' '}
                  {modalLead.cnpj ?? '—'}
                </p>
                <p>
                  <span className="font-medium text-gray-700">Valor:</span>{' '}
                  {fmtBRL(Number(modalLead.valor_negociado))}
                </p>
                {modalLead.num_vidas_estimado != null && (
                  <p>
                    <span className="font-medium text-gray-700">
                      Vidas estimadas:
                    </span>{' '}
                    {modalLead.num_vidas_estimado}
                  </p>
                )}
              </div>

              {/* Inputs de comissão */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    % Representante
                    <span className="ml-1 text-xs font-normal text-gray-400">
                      máx.{' '}
                      {Math.max(
                        0,
                        MAX_PERCENTUAL_COMISSAO - modalPercVend
                      ).toFixed(1)}
                      %
                    </span>
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={percRepInput}
                    onChange={(e) =>
                      setPercRepInput(e.target.value.replace(/[^\d.,]/g, ''))
                    }
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    % Vendedor
                    <span className="ml-1 text-xs font-normal text-gray-400">
                      máx.{' '}
                      {Math.max(
                        0,
                        MAX_PERCENTUAL_COMISSAO - modalPercRep
                      ).toFixed(1)}
                      %
                    </span>
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={percVendInput}
                    onChange={(e) =>
                      setPercVendInput(e.target.value.replace(/[^\d.,]/g, ''))
                    }
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Preview */}
              {modalBd && (modalPercRep > 0 || modalPercVend > 0) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 text-xs text-blue-700 space-y-1.5">
                  {/* Linha de totais: valor = rep + vend + QWork */}
                  <div className="flex items-center justify-between font-semibold text-blue-800 pb-1 border-b border-blue-200">
                    <span>Valor negociado</span>
                    <span>{fmtBRL(modalValor)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Rep ({modalPercRep.toFixed(1)}%)</span>
                    <span className="font-semibold text-green-700">
                      − {fmtBRL(modalBd.valorRep)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Vendedor ({modalPercVend.toFixed(1)}%)</span>
                    <span className="font-semibold text-purple-700">
                      − {fmtBRL(modalBd.valorVendedor)}
                    </span>
                  </div>
                  <div
                    className={`flex items-center justify-between border-t border-blue-200 pt-1 font-semibold ${modalBd.abaixoCusto ? 'text-amber-600' : 'text-blue-800'}`}
                  >
                    <span>QWork recebe</span>
                    <span>{fmtBRL(modalBd.valorQWork)}</span>
                  </div>
                  <p className="text-blue-400 pt-0.5">
                    Total comissões: {modalBd.percentualTotal.toFixed(1)}% ={' '}
                    {fmtBRL(modalBd.valorRep + modalBd.valorVendedor)} |
                    Custo/aval.: R$ {CUSTO_POR_AVALIACAO[modalTipo]},00
                  </p>
                </div>
              )}

              {modalRequer && (modalPercRep > 0 || modalPercVend > 0) && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                  <AlertTriangle
                    size={14}
                    className="text-amber-600 mt-0.5 shrink-0"
                  />
                  <p className="text-xs text-amber-700">
                    Margem abaixo do custo por avaliação — será encaminhado para
                    aprovação comercial.
                  </p>
                </div>
              )}

              {erroComissao && (
                <p className="text-sm text-red-600">{erroComissao}</p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalLead(null)}
                  className="flex-1 border px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={definirComissao}
                  disabled={salvandoComissao || !percRepInput}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {salvandoComissao ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Salvando...
                    </>
                  ) : (
                    'Confirmar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
