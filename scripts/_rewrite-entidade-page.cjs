// ── CJS rewrite: Entidade lote page.tsx ── Uses useDetalhesLoteEntidade hook ──

const fs = require('fs');
const path = require('path');

const TARGET = path.join(
  __dirname,
  '..',
  'app',
  'entidade',
  'lote',
  '[id]',
  'page.tsx'
);

const content = `'use client';

import React from 'react';
import { ArrowLeft, FileText, Filter } from 'lucide-react';
import ModalInativarAvaliacao from '@/components/ModalInativarAvaliacao';
import ModalResetarAvaliacao from '@/components/ModalResetarAvaliacao';
import { ModalConfirmacaoSolicitar } from '@/components/ModalConfirmacaoSolicitar';
import FiltroColuna from '@/components/lote/FiltroColuna';
import { formatDate, getClassificacaoStyle } from '@/lib/lote/utils';
import { useDetalhesLoteEntidade } from './useDetalhesLoteEntidade';
import EntidadeStatCards from './components/EntidadeStatCards';
import EntidadeLoteActions from './components/EntidadeLoteActions';
import type { GruposData } from './types';

// ── Inline helpers ──────────────────────────────────────────────────────────

function ClassificacaoBadge({ media, grupo }: { media: number | undefined; grupo: number }) {
  if (media === undefined) return <span className="text-gray-400">-</span>;
  const info = getClassificacaoStyle(media, grupo);
  if (!info) return <span className="text-gray-400">-</span>;
  return (
    <span className={\`px-1 py-0.5 text-[11px] rounded-full font-medium whitespace-nowrap \${info.colorClass}\`}>
      {info.label}
    </span>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function DetalhesLotePage() {
  const {
    router,
    loteId,
    loading,
    lote,
    estatisticas,
    funcionarios,
    pagamentoSincronizando,
    pagamentoSincronizado,
    sincronizarPagamento,
    busca,
    setBusca,
    buscaDebouncedValue,
    filtroStatus,
    setFiltroStatus,
    filtrosColuna,
    setFiltrosColuna,
    getValoresUnicos,
    toggleFiltroColuna,
    limparFiltrosColuna,
    funcionariosFiltrados,
    modalInativar,
    setModalInativar,
    modalResetar,
    setModalResetar,
    modalEmissao,
    setModalEmissao,
    loadLoteData,
    handleDownloadLaudo,
    handleDownloadReport,
    gerarRelatorioFuncionario,
    solicitarEmissao,
    abrirModalInativar,
  } = useDetalhesLoteEntidade();

  // ── Early returns ──

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-gray-600">Carregando detalhes do lote...</p>
        </div>
      </div>
    );
  }

  if (!lote || !estatisticas) {
    return (
      <div className="flex items-center justify-center py-20 bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Lote n\\u00E3o encontrado</p>
          <button
            onClick={() => router.push('/entidade/lotes')}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
          >
            Voltar para Lotes
          </button>
        </div>
      </div>
    );
  }

  const filterProps = { filtrosColuna, setFiltrosColuna, getValoresUnicos, toggleFiltroColuna };

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-screen-2xl mx-auto px-4 py-6">
          <button
            onClick={() => router.push('/entidade/lotes')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            Voltar para Lotes
          </button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-800">Lote ID: {lote.id}</h1>
                <span
                  className={\`px-3 py-1 rounded-full text-sm font-medium \${
                    lote.status === 'concluido'
                      ? 'bg-green-100 text-green-800'
                      : lote.status === 'enviado'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                  }\`}
                >
                  {lote.status}
                </span>
              </div>
              <p className="text-gray-600">C\\u00F3digo: {lote.id}</p>
              <p className="text-sm text-gray-500 mt-1">
                Tipo: {lote.tipo} | Criado em: {formatDate(lote.criado_em)}
              </p>

              {/* Payment pending banner */}
              {lote.status_pagamento === 'aguardando_pagamento' && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  {pagamentoSincronizando ? (
                    <>
                      <svg className="w-4 h-4 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Verificando pagamento...</span>
                    </>
                  ) : pagamentoSincronizado ? (
                    <span className="text-green-600 font-semibold">\\u2705 Pagamento confirmado!</span>
                  ) : (
                    <>
                      <span>\\uD83D\\uDCB3 Aguardando confirma\\u00E7\\u00E3o de pagamento</span>
                      <button
                        onClick={sincronizarPagamento}
                        className="ml-2 underline text-amber-700 hover:text-amber-900 text-xs font-medium"
                      >
                        Verificar agora
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => loadLoteData(true)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Atualizar dados"
              >
                <svg
                  className={\`w-5 h-5 \${loading ? 'animate-spin' : ''}\`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Atualizar
              </button>
              <button
                onClick={handleDownloadReport}
                disabled={lote.status === 'criado'}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText size={18} />
                Gerar Relat\\u00F3rio
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-2xl mx-auto px-4 py-8">
        <EntidadeStatCards estatisticas={estatisticas} />

        <EntidadeLoteActions
          lote={lote}
          estatisticas={estatisticas}
          handleDownloadReport={handleDownloadReport}
          handleDownloadLaudo={handleDownloadLaudo}
          solicitarEmissao={solicitarEmissao}
        />

        {/* Filtros e Busca */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar Funcion\\u00E1rio
              </label>
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Nome, CPF, setor ou fun\\u00E7\\u00E3o... (ignora acentos)"
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {busca !== buscaDebouncedValue && (
                <div className="absolute right-3 top-10 transform">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="inline mr-1" size={16} />
                Filtrar por Status
              </label>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value as 'todos' | 'concluido' | 'pendente')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="todos">Todos</option>
                <option value="concluido">Conclu\\u00EDdas</option>
                <option value="pendente">Pendentes</option>
              </select>
            </div>

            <div className="self-end">
              <button
                onClick={limparFiltrosColuna}
                className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                title="Limpar todos os filtros por coluna"
              >
                \\uD83E\\uDDF9 Limpar Filtros
              </button>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Exibindo {funcionariosFiltrados.length} de {funcionarios.length}{' '}
            funcion\\u00E1rios
            {busca !== buscaDebouncedValue && (
              <span className="ml-2 text-gray-500 italic">\\u2022 Buscando...</span>
            )}
            {Object.values(filtrosColuna).some((arr) => arr.length > 0) && (
              <span className="ml-2 text-blue-600">
                \\u2022 Filtros ativos:{' '}
                {Object.values(filtrosColuna).reduce((acc, arr) => acc + arr.length, 0)} aplicado(s)
              </span>
            )}
          </div>
        </div>

        {/* Tabela de Funcion\\u00E1rios */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-16">ID</th>
                  {(['nome', 'cpf', 'nivel_cargo', 'status'] as const).map((col) => (
                    <th key={col} className="px-2 py-1 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center justify-between">
                        <span>
                          {col === 'nivel_cargo' ? 'N\\u00EDvel' : col === 'status' ? 'Status' : col === 'nome' ? 'Nome' : 'CPF'}
                        </span>
                        <FiltroColuna
                          coluna={col}
                          titulo={col === 'nivel_cargo' ? 'N\\u00EDvel' : col === 'status' ? 'Status' : col === 'nome' ? 'Nome' : 'CPF'}
                          {...filterProps}
                        />
                      </div>
                    </th>
                  ))}
                  <th className="px-2 py-1 text-center text-xs font-medium text-gray-700 uppercase tracking-wider w-28">
                    <div className="flex items-center justify-center"><span>Inativar</span></div>
                  </th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Data Conclus\\u00E3o</th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Motivo Inativa\\u00E7\\u00E3o</th>
                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Data Inativa\\u00E7\\u00E3o</th>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((g) => (
                    <th key={\`g\${g}\`} className="px-1 py-1 text-center text-xs font-medium text-gray-700 uppercase tracking-wider w-12">
                      <div className="flex flex-col items-center gap-1">
                        <span>G{g}</span>
                        <FiltroColuna coluna={\`g\${g}\` as keyof typeof filtrosColuna} titulo="" {...filterProps} />
                      </div>
                    </th>
                  ))}
                  <th className="px-2 py-1 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">A\\u00E7\\u00F5es</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {funcionariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={20} className="px-6 py-12 text-center text-gray-500">
                      {busca || filtroStatus !== 'todos' || Object.values(filtrosColuna).some((arr) => arr.length > 0)
                        ? 'Nenhum funcion\\u00E1rio encontrado com os filtros aplicados'
                        : 'Nenhum funcion\\u00E1rio neste lote'}
                    </td>
                  </tr>
                ) : (
                  funcionariosFiltrados.map((func, idx) => (
                    <tr
                      key={\`\${func.cpf}-\${func.avaliacao.id ?? idx}\`}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-2 py-1 text-sm text-gray-600 font-mono">#{func.avaliacao.id}</td>
                      <td className="px-2 py-1 text-sm text-gray-900 max-w-[240px] truncate" title={func.nome}>
                        {func.nome}
                      </td>
                      <td className="px-2 py-1 text-sm text-gray-500">{func.cpf}</td>
                      <td className="px-2 py-1 text-sm text-gray-500">
                        {func.nivel_cargo === 'operacional' ? 'Operacional' : func.nivel_cargo === 'gestao' ? 'Gest\\u00E3o' : '-'}
                      </td>
                      <td className="px-2 py-1 text-sm">
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={\`inline-flex px-1 py-0.5 text-[11px] font-semibold rounded-full \${
                              func.avaliacao.status === 'concluida' || func.avaliacao.status === 'concluido'
                                ? 'bg-green-100 text-green-800'
                                : func.avaliacao.status === 'em_andamento'
                                  ? 'bg-blue-100 text-blue-800'
                                  : func.avaliacao.status === 'inativada'
                                    ? 'bg-red-100 text-red-800'
                                    : func.avaliacao.status === 'iniciada'
                                      ? 'bg-blue-50 text-blue-700'
                                      : 'bg-yellow-100 text-yellow-800'
                            }\`}
                          >
                            {func.avaliacao.status === 'concluida' || func.avaliacao.status === 'concluido'
                              ? 'Conclu\\u00EDda'
                              : func.avaliacao.status === 'em_andamento'
                                ? 'Em Andamento'
                                : func.avaliacao.status === 'inativada'
                                  ? 'Inativada'
                                  : func.avaliacao.status === 'iniciada'
                                    ? 'Iniciada'
                                    : 'Pendente'}
                          </span>
                          {func.avaliacao.status !== 'concluida' &&
                            func.avaliacao.status !== 'concluido' &&
                            func.avaliacao.status !== 'inativada' &&
                            func.avaliacao.total_respostas !== undefined && (
                              <span className="text-[10px] text-gray-600">
                                {func.avaliacao.total_respostas}/37 respostas
                              </span>
                            )}
                        </div>
                      </td>
                      <td className="px-2 py-1 text-sm text-center">
                        <div className="flex gap-1 justify-center">
                          {func.avaliacao.status !== 'concluida' &&
                            func.avaliacao.status !== 'concluido' &&
                            func.avaliacao.status !== 'inativada' &&
                            !lote?.emissao_solicitada &&
                            !lote?.emitido_em && (
                              <button
                                onClick={() => abrirModalInativar(func.avaliacao.id, func.nome, func.cpf)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                                title="Inativar avalia\\u00E7\\u00E3o"
                              >
                                \\uD83D\\uDEAB Inativar
                              </button>
                            )}
                          {func.avaliacao.status !== 'inativada' &&
                            func.avaliacao.status !== 'concluida' &&
                            func.avaliacao.status !== 'concluido' &&
                            !lote?.emissao_solicitada &&
                            !lote?.emitido_em && (
                              <button
                                onClick={() =>
                                  setModalResetar({
                                    avaliacaoId: func.avaliacao.id,
                                    funcionarioNome: func.nome,
                                    funcionarioCpf: func.cpf,
                                  })
                                }
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-600 text-white rounded text-xs hover:bg-amber-700 transition-colors"
                                title="Resetar avalia\\u00E7\\u00E3o (apagar todas as respostas)"
                              >
                                \\u21BB Reset
                              </button>
                            )}
                        </div>
                      </td>
                      <td className="px-2 py-1 text-sm text-gray-500">{formatDate(func.avaliacao.data_conclusao)}</td>
                      <td className="px-2 py-1 text-sm text-gray-500 max-w-[200px] truncate" title={func.avaliacao.motivo_inativacao || ''}>
                        {func.avaliacao.motivo_inativacao || '-'}
                      </td>
                      <td className="px-2 py-1 text-sm text-gray-500">{formatDate(func.avaliacao.inativada_em)}</td>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((g) => (
                        <td key={\`g\${g}\`} className="px-1 py-1 text-center text-xs">
                          <ClassificacaoBadge media={func.grupos?.[\`g\${g}\` as keyof GruposData]} grupo={g} />
                        </td>
                      ))}
                      <td className="px-2 py-1 text-center">
                        {(func.avaliacao.status === 'concluida' || func.avaliacao.status === 'concluido') && (
                          <button
                            onClick={() => gerarRelatorioFuncionario(func.cpf, func.nome)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                            title="Gerar PDF"
                          >
                            <FileText size={14} />
                            PDF
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {modalInativar && (
        <ModalInativarAvaliacao
          avaliacaoId={modalInativar.avaliacaoId}
          funcionarioNome={modalInativar.funcionarioNome}
          funcionarioCpf={modalInativar.funcionarioCpf}
          _loteId={loteId}
          contexto="entidade"
          onClose={() => setModalInativar(null)}
          onSuccess={loadLoteData}
        />
      )}
      {modalResetar && (
        <ModalResetarAvaliacao
          avaliacaoId={modalResetar.avaliacaoId}
          loteId={loteId}
          funcionarioNome={modalResetar.funcionarioNome}
          funcionarioCpf={modalResetar.funcionarioCpf}
          basePath="/api/entidade"
          onClose={() => setModalResetar(null)}
          onSuccess={loadLoteData}
        />
      )}
      {modalEmissao && (
        <ModalConfirmacaoSolicitar
          isOpen={true}
          onClose={() => {
            setModalEmissao(null);
            window.location.reload();
          }}
          loteId={modalEmissao.loteId}
          gestorEmail={modalEmissao.gestorEmail}
          gestorCelular={modalEmissao.gestorCelular}
        />
      )}
    </div>
  );
}
`;

fs.writeFileSync(TARGET, content, 'utf8');
console.log(
  'OK: Entidade page.tsx rewritten (' + content.split('\n').length + ' lines)'
);
