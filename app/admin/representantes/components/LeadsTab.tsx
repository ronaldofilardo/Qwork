'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import type { Lead } from '../types';
import { LEAD_STATUS_BADGE, LEAD_STATUS_OPTIONS, fmtData } from '../constants';

interface LeadsTabProps {
  leads: Lead[];
  leadsTotal: number;
  leadsPage: number;
  setLeadsPage: (p: number | ((prev: number) => number)) => void;
  leadsStatusFiltro: string;
  setLeadsStatusFiltro: (v: string) => void;
  leadsBusca: string;
  setLeadsBusca: (v: string) => void;
  leadsLoading: boolean;
  leadActionLoading: string | null;
  leadDocsLoading: Record<string, boolean>;
  openLeadDoc: (
    leadId: string,
    docType: 'cpf' | 'cnpj' | 'cpf_resp'
  ) => Promise<void>;
  onAprovarLead: (lead: Lead) => Promise<void>;
  onRejeitarLead: (lead: Lead, motivo: string) => Promise<void>;
  onConverterLead: (lead: Lead) => Promise<void>;
}

export function LeadsTab({
  leads,
  leadsTotal,
  leadsPage,
  setLeadsPage,
  leadsStatusFiltro,
  setLeadsStatusFiltro,
  leadsBusca,
  setLeadsBusca,
  leadsLoading,
  leadActionLoading,
  leadDocsLoading,
  openLeadDoc,
  onAprovarLead,
  onRejeitarLead,
  onConverterLead,
}: LeadsTabProps) {
  const [leadDetalhes, setLeadDetalhes] = useState<Lead | null>(null);
  const [leadRejeicaoMotivo, setLeadRejeicaoMotivo] = useState('');
  const [leadRejeicaoModal, setLeadRejeicaoModal] = useState<Lead | null>(null);
  const [leadConverterModal, setLeadConverterModal] = useState<Lead | null>(
    null
  );
  const [conviteLinkCopiado, setConviteLinkCopiado] = useState<string | null>(
    null
  );

  return (
    <>
      {/* Modal Rejeição */}
      {leadRejeicaoModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Rejeitar Candidato</h2>
            <p className="text-sm text-gray-600">
              Rejeitar <strong>{leadRejeicaoModal.nome}</strong>?
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo da rejeição *
              </label>
              <textarea
                value={leadRejeicaoMotivo}
                onChange={(e) => setLeadRejeicaoMotivo(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                rows={3}
                placeholder="Ex.: Documentação ilegível, CPF divergente..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setLeadRejeicaoModal(null);
                  setLeadRejeicaoMotivo('');
                }}
                className="flex-1 border px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await onRejeitarLead(leadRejeicaoModal, leadRejeicaoMotivo);
                  setLeadRejeicaoModal(null);
                  setLeadRejeicaoMotivo('');
                  setLeadDetalhes(null);
                }}
                disabled={leadActionLoading !== null}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {leadActionLoading ? 'Rejeitando...' : 'Rejeitar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Conversão */}
      {leadConverterModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">
              Converter em Representante
            </h2>
            <p className="text-sm text-gray-600">
              Deseja converter <strong>{leadConverterModal.nome}</strong> em
              representante oficial?
            </p>
            <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800 space-y-1">
              <p>Isso irá:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Criar registro na tabela de representantes</li>
                <li>Gerar código automático (XXXX-XXXX)</li>
                <li>Definir status como &quot;apto&quot;</li>
                <li>Marcar este lead como &quot;convertido&quot;</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setLeadConverterModal(null)}
                className="flex-1 border px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await onConverterLead(leadConverterModal);
                  setLeadConverterModal(null);
                  setLeadDetalhes(null);
                }}
                disabled={leadActionLoading !== null}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {leadActionLoading ? 'Convertendo...' : 'Converter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer detalhes do lead */}
      {leadDetalhes && (
        <div
          className="fixed inset-0 bg-black/40 flex items-start justify-end z-40"
          onClick={() => setLeadDetalhes(null)}
        >
          <div
            className="bg-white h-full w-full max-w-md shadow-xl p-6 space-y-5 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">
                {leadDetalhes.nome}
              </h2>
              <button
                onClick={() => setLeadDetalhes(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <span
              className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${LEAD_STATUS_BADGE[leadDetalhes.status] ?? 'bg-gray-100 text-gray-600'}`}
            >
              {leadDetalhes.status.replace(/_/g, ' ')}
            </span>

            <div className="space-y-3 text-sm">
              {[
                ['Tipo', leadDetalhes.tipo_pessoa.toUpperCase()],
                ['E-mail', leadDetalhes.email],
                ['Telefone', leadDetalhes.telefone],
                leadDetalhes.cpf ? ['CPF', leadDetalhes.cpf] : null,
                leadDetalhes.cnpj ? ['CNPJ', leadDetalhes.cnpj] : null,
                leadDetalhes.razao_social
                  ? ['Razão Social', leadDetalhes.razao_social]
                  : null,
                leadDetalhes.cpf_responsavel
                  ? ['CPF Responsável', leadDetalhes.cpf_responsavel]
                  : null,
                ['Cadastrado em', fmtData(leadDetalhes.criado_em)],
                leadDetalhes.verificado_em
                  ? ['Verificado em', fmtData(leadDetalhes.verificado_em)]
                  : null,
                leadDetalhes.convertido_em
                  ? ['Convertido em', fmtData(leadDetalhes.convertido_em)]
                  : null,
                leadDetalhes.motivo_rejeicao
                  ? ['Motivo rejeição', leadDetalhes.motivo_rejeicao]
                  : null,
                leadDetalhes.ip_origem
                  ? ['IP Origem', leadDetalhes.ip_origem]
                  : null,
              ]
                .filter(Boolean)
                .map((item) => {
                  const [l, v] = item as [string, string];
                  return (
                    <div
                      key={l}
                      className="flex items-start justify-between border-b pb-2"
                    >
                      <span className="text-gray-500 shrink-0">{l}</span>
                      <span className="font-medium text-gray-900 text-right ml-4 break-all">
                        {v}
                      </span>
                    </div>
                  );
                })}
            </div>

            {/* Ações */}
            <div>
              <h3 className="text-xs font-semibold uppercase text-gray-500 mb-2">
                Ações
              </h3>
              <div className="space-y-2">
                {leadDetalhes.status === 'pendente_verificacao' && (
                  <>
                    <button
                      onClick={async () => {
                        await onAprovarLead(leadDetalhes);
                        setLeadDetalhes(null);
                      }}
                      disabled={leadActionLoading !== null}
                      className="w-full text-left px-3 py-2 border rounded-lg text-sm hover:bg-blue-50 hover:border-blue-300 transition-colors disabled:opacity-50"
                    >
                      ✅ Aprovar Documentação
                    </button>
                    <button
                      onClick={() => setLeadRejeicaoModal(leadDetalhes)}
                      disabled={leadActionLoading !== null}
                      className="w-full text-left px-3 py-2 border rounded-lg text-sm hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50"
                    >
                      ❌ Rejeitar
                    </button>
                  </>
                )}
                {leadDetalhes.status === 'verificado' && (
                  <>
                    {leadDetalhes.cpf_conflict && (
                      <div className="px-3 py-2 border border-amber-200 bg-amber-50 rounded-lg text-sm text-amber-700">
                        ⚠️ CPF já cadastrado como{' '}
                        <strong>
                          {leadDetalhes.cpf_conflict.tipo_usuario}
                        </strong>{' '}
                        em {leadDetalhes.cpf_conflict.origem}
                      </div>
                    )}
                    <button
                      onClick={() => setLeadConverterModal(leadDetalhes)}
                      disabled={
                        leadActionLoading !== null ||
                        !!leadDetalhes.cpf_conflict
                      }
                      className="w-full text-left px-3 py-2 border border-green-200 bg-green-50 rounded-lg text-sm font-medium text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
                    >
                      🚀 Converter em Representante
                    </button>
                    <button
                      onClick={() => setLeadRejeicaoModal(leadDetalhes)}
                      disabled={leadActionLoading !== null}
                      className="w-full text-left px-3 py-2 border rounded-lg text-sm hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50"
                    >
                      ❌ Rejeitar
                    </button>
                  </>
                )}
                {(leadDetalhes.status === 'rejeitado' ||
                  leadDetalhes.status === 'convertido') && (
                  <p className="text-sm text-gray-400 italic">
                    Nenhuma ação disponível (status terminal)
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Buscar nome, e-mail, CPF ou CNPJ..."
          value={leadsBusca}
          onChange={(e) => {
            setLeadsBusca(e.target.value);
            setLeadsPage(1);
          }}
          className="border rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={leadsStatusFiltro}
          onChange={(e) => {
            setLeadsStatusFiltro(e.target.value);
            setLeadsPage(1);
          }}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {LEAD_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === '' ? 'Todos os status' : s.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Tabela de leads */}
      {leadsLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 rounded-full border-4 border-amber-500 border-t-transparent" />
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          Nenhum candidato encontrado.
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Candidato</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-center">Docs</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Data</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {leads.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{l.nome}</div>
                    <div className="text-xs text-gray-400">{l.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                      {l.tipo_pessoa.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {l.tipo_pessoa === 'pf' ? (
                        <button
                          onClick={() => openLeadDoc(l.id, 'cpf')}
                          disabled={leadDocsLoading[l.id]}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 disabled:opacity-50"
                        >
                          {leadDocsLoading[l.id] ? '...' : '📄 Doc'}
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => openLeadDoc(l.id, 'cnpj')}
                            disabled={leadDocsLoading[l.id]}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 disabled:opacity-50"
                          >
                            {leadDocsLoading[l.id] ? '...' : '📄 CNPJ'}
                          </button>
                          <button
                            onClick={() => openLeadDoc(l.id, 'cpf_resp')}
                            disabled={leadDocsLoading[l.id]}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 disabled:opacity-50"
                          >
                            {leadDocsLoading[l.id] ? '...' : '📄 CPF Resp.'}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${LEAD_STATUS_BADGE[l.status] ?? 'bg-gray-100 text-gray-600'}`}
                    >
                      {l.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {fmtData(l.criado_em)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setLeadDetalhes(l)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Detalhes
                      </button>
                      {l.status === 'pendente_verificacao' && (
                        <button
                          onClick={() => onAprovarLead(l)}
                          disabled={leadActionLoading !== null}
                          className="text-green-600 hover:underline text-sm disabled:opacity-50"
                        >
                          Aprovar
                        </button>
                      )}
                      {l.status === 'verificado' && (
                        <button
                          onClick={() => setLeadConverterModal(l)}
                          disabled={leadActionLoading !== null}
                          className="text-green-700 hover:underline text-sm font-medium disabled:opacity-50"
                        >
                          Converter
                        </button>
                      )}
                      {l.status === 'convertido' &&
                        !l.aceite_termos &&
                        l.convite_token && (
                          <button
                            onClick={() => {
                              const baseUrl =
                                typeof window !== 'undefined'
                                  ? window.location.origin
                                  : 'http://localhost:3000';
                              const conviteUrl = `${baseUrl}/representante/criar-senha?token=${l.convite_token}`;
                              navigator.clipboard
                                .writeText(conviteUrl)
                                .then(() => {
                                  setConviteLinkCopiado(l.id);
                                  setTimeout(
                                    () => setConviteLinkCopiado(null),
                                    2000
                                  );
                                });
                            }}
                            className={`flex items-center gap-1 text-sm font-medium transition-all ${
                              conviteLinkCopiado === l.id
                                ? 'text-green-600'
                                : 'text-blue-600 hover:text-blue-700'
                            }`}
                          >
                            {conviteLinkCopiado === l.id ? (
                              <>
                                <Check size={14} />
                                Copiado
                              </>
                            ) : (
                              <>
                                <Copy size={14} />
                                Copiar Link
                              </>
                            )}
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginação leads */}
      {leadsTotal > 30 && (
        <div className="flex justify-center gap-2">
          <button
            disabled={leadsPage === 1}
            onClick={() => setLeadsPage((p) => p - 1)}
            className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            ← Anterior
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-600">
            Pág. {leadsPage} de {Math.ceil(leadsTotal / 30)}
          </span>
          <button
            disabled={leadsPage >= Math.ceil(leadsTotal / 30)}
            onClick={() => setLeadsPage((p) => p + 1)}
            className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            Próxima →
          </button>
        </div>
      )}
    </>
  );
}
