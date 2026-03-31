// ── CJS rewrite: RH lote page.tsx ── Uses useDetalhesLote hook ──────────────

const fs = require('fs');
const path = require('path');

const TARGET = path.join(
  __dirname,
  '..',
  'app',
  'rh',
  'empresa',
  '[id]',
  'lote',
  '[loteId]',
  'page.tsx'
);

const content = `'use client';

import React from 'react';
import ModalInativarAvaliacao from '@/components/ModalInativarAvaliacao';
import ModalResetarAvaliacao from '@/components/ModalResetarAvaliacao';
import toast from 'react-hot-toast';
import {
  ModalConfirmacaoSolicitar,
  foiExibidaParaLote,
} from '@/components/ModalConfirmacaoSolicitar';
import FiltroColuna from '@/components/lote/FiltroColuna';
import {
  formatDate,
  formatarData,
  getClassificacaoStyle,
  getStatusBadgeInfo,
} from '@/lib/lote/utils';
import { useDetalhesLote } from './useDetalhesLote';

export default function DetalhesLotePage() {
  const hook = useDetalhesLote();

  const {
    router,
    empresaId,
    loteId,
    loading,
    permissionErrorHint,
    lote,
    estatisticas,
    funcionarios,
    funcionariosFiltrados,
    isPronto,
    // filters
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
    // modals
    modalInativar,
    setModalInativar,
    modalResetar,
    setModalResetar,
    modalEmissao,
    setModalEmissao,
    // actions
    loadLoteData,
    gerarRelatorioLote,
    gerarRelatorioFuncionario,
    solicitarEmissao,
    downloadLaudo,
    abrirModalInativar,
  } = hook;

  // ── Loading ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 bg-gray-50">
        <div className="text-center">
          <div
            role="status"
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"
          />
          <p className="text-gray-600">Carregando dados do lote...</p>
        </div>
      </div>
    );
  }

  // ── Permission error ───────────────────────────────────────────
  if (permissionErrorHint) {
    return (
      <div className="bg-gray-50">
        <main className="container mx-auto px-4 py-6">
          <div className="max-w-3xl mx-auto mt-6 p-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-yellow-700 font-semibold">Acesso restrito</div>
                <div className="flex-1 text-sm text-yellow-800">{permissionErrorHint}</div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                  onClick={() => router.push(\`/rh/empresa/\${empresaId}\`)}
                >
                  Voltar para empresa
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Not found ──────────────────────────────────────────────────
  if (!lote || !estatisticas) {
    return (
      <div className="flex items-center justify-center py-20 bg-gray-50">
        <div className="text-center bg-white rounded-lg shadow-sm p-8">
          <div className="text-6xl mb-4">{'\uD83D\uDCCB'}</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Lote n\u00E3o encontrado</h2>
          <p className="text-gray-600 mb-4">
            O lote solicitado n\u00E3o existe ou voc\u00EA n\u00E3o tem permiss\u00E3o para acess\u00E1-lo.
          </p>
          <button
            onClick={() => router.push(\`/rh/empresa/\${empresaId}\`)}
            className="bg-primary hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            \u2190 Voltar para Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <main className="container mx-auto px-4 py-6">
        {/* Header com breadcrumb */}
        <div className="mb-6">
          <button
            onClick={() => router.push(\`/rh/empresa/\${empresaId}\`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 text-sm"
          >
            \u2190 Voltar para Dashboard
          </button>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                <div className="mb-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Lote ID</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">{lote.id}</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700">
                  <div>
                    <span className="text-gray-500">Empresa:</span>{' '}
                    <span className="font-medium">{lote.empresa_nome}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Tipo:</span>{' '}
                    <span className="font-medium">
                      {lote.tipo === 'completo' ? 'Completo' : lote.tipo === 'operacional' ? 'Operacional' : 'Gest\u00E3o'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Liberado em:</span>{' '}
                    <span className="font-medium">{formatarData(lote.liberado_em)}</span>
                  </div>
                  {lote.liberado_por_nome && (
                    <div>
                      <span className="text-gray-500">Liberado por:</span>{' '}
                      <span className="font-medium">{lote.liberado_por_nome}</span>
                    </div>
                  )}
                </div>
                {lote.descricao && (
                  <p className="mt-3 text-sm text-gray-600 italic">{lote.descricao}</p>
                )}
              </div>

              <div className="w-full md:w-auto lg:w-72">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="w-full sm:w-44 md:w-48 flex-shrink-0 flex flex-col gap-2">
                    <button
                      onClick={gerarRelatorioLote}
                      disabled={!isPronto}
                      className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
                      aria-label="Gerar Relat\u00F3rio PDF do Lote"
                    >
                      {isPronto ? '\uD83D\uDCCA Gerar Relat\u00F3rio PDF' : '\u23F3 Aguardando conclus\u00E3o'}
                    </button>
                    {estatisticas.avaliacoes_inativadas > 0 && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                        <div className="flex items-start gap-2">
                          <span className="text-amber-600 text-sm">\u26A0\uFE0F</span>
                          <div>
                            <p className="font-medium mb-1">Avalia\u00E7\u00F5es inativadas</p>
                            <p className="text-xs">
                              {estatisticas.avaliacoes_inativadas} avalia\u00E7{estatisticas.avaliacoes_inativadas !== 1 ? '\u00F5es' : '\u00E3o'}{' '}
                              inativada{estatisticas.avaliacoes_inativadas !== 1 ? 's' : ''} n\u00E3o{' '}
                              {estatisticas.avaliacoes_inativadas !== 1 ? 'contam' : 'conta'} para a prontid\u00E3o do lote.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bot\u00E3o de Solicita\u00E7\u00E3o de Emiss\u00E3o */}
            <EmissaoSection
              lote={lote}
              estatisticas={estatisticas}
              loadLoteData={loadLoteData}
              setModalEmissao={setModalEmissao}
            />
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Buscar por nome, CPF, setor, fun\u00E7\u00E3o, matr\u00EDcula... (ignora acentos)"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {busca !== buscaDebouncedValue && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value as 'todos' | 'concluido' | 'pendente')}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="todos">Todos os status</option>
                <option value="concluido">Conclu\u00EDdas</option>
                <option value="pendente">Pendentes</option>
              </select>
              <button
                onClick={limparFiltrosColuna}
                className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                title="Limpar todos os filtros por coluna"
              >
                \uD83E\uDDF9 Limpar Filtros
              </button>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Mostrando {funcionariosFiltrados.length} de {funcionarios.length} funcion\u00E1rio(s)
            {busca !== buscaDebouncedValue && (
              <span className="ml-2 text-gray-500 italic">\u2022 Buscando...</span>
            )}
            {Object.values(filtrosColuna).some((arr) => arr.length > 0) && (
              <span className="ml-2 text-blue-600">
                \u2022 Filtros ativos: {Object.values(filtrosColuna).reduce((acc, arr) => acc + arr.length, 0)} aplicado(s)
              </span>
            )}
          </div>
        </div>

        {/* Tabela de Funcion\u00E1rios */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-20">ID</th>
                  {['nome', 'cpf', 'nivel_cargo', 'status'].map((col) => (
                    <th key={col} className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center justify-between">
                        <span>{col === 'nivel_cargo' ? 'N\u00EDvel' : col === 'status' ? 'Status' : col.toUpperCase()}</span>
                        <FiltroColuna
                          coluna={col as any}
                          titulo={col === 'nivel_cargo' ? 'N\u00EDvel' : col === 'nome' ? 'Nome' : col === 'cpf' ? 'CPF' : 'Status'}
                          filtrosColuna={filtrosColuna}
                          setFiltrosColuna={setFiltrosColuna}
                          getValoresUnicos={getValoresUnicos}
                          toggleFiltroColuna={toggleFiltroColuna}
                        />
                      </div>
                    </th>
                  ))}
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Data Conclus\u00E3o</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Data/Motivo Inativa\u00E7\u00E3o</th>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((g) => (
                    <th key={\`g\${g}\`} className="px-1 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider w-24">
                      <div className="flex flex-col items-center gap-1">
                        <span>G{g}</span>
                        <FiltroColuna
                          coluna={\`g\${g}\` as any}
                          titulo=""
                          filtrosColuna={filtrosColuna}
                          setFiltrosColuna={setFiltrosColuna}
                          getValoresUnicos={getValoresUnicos}
                          toggleFiltroColuna={toggleFiltroColuna}
                        />
                      </div>
                    </th>
                  ))}
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">A\u00E7\u00F5es</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {funcionariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={18} className="px-3 py-6 text-center text-gray-500 text-sm">
                      {busca || filtroStatus !== 'todos' || Object.values(filtrosColuna).some((arr) => arr.length > 0)
                        ? 'Nenhum funcion\u00E1rio encontrado com os filtros aplicados'
                        : 'Nenhum funcion\u00E1rio neste lote'}
                    </td>
                  </tr>
                ) : (
                  funcionariosFiltrados.map((func, idx) => <FuncionarioRow key={\`\${func.cpf}-\${func.avaliacao.id ?? idx}\`} func={func} lote={lote} abrirModalInativar={abrirModalInativar} setModalResetar={setModalResetar} gerarRelatorioFuncionario={gerarRelatorioFuncionario} />)
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modals */}
      {modalInativar && (
        <ModalInativarAvaliacao
          avaliacaoId={modalInativar.avaliacaoId}
          funcionarioNome={modalInativar.funcionarioNome}
          funcionarioCpf={modalInativar.funcionarioCpf}
          _loteId={loteId}
          contexto="rh"
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
          basePath="/api/rh"
          onClose={() => setModalResetar(null)}
          onSuccess={loadLoteData}
        />
      )}
      {modalEmissao && (
        <ModalConfirmacaoSolicitar
          isOpen={true}
          onClose={() => { setModalEmissao(null); void loadLoteData(); }}
          loteId={modalEmissao.loteId}
          gestorEmail={modalEmissao.gestorEmail}
          gestorCelular={modalEmissao.gestorCelular}
        />
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function EmissaoSection({ lote, estatisticas, loadLoteData, setModalEmissao }: {
  lote: any;
  estatisticas: any;
  loadLoteData: () => Promise<void>;
  setModalEmissao: (v: any) => void;
}) {
  const showSolicitar = lote.status === 'concluido' &&
    estatisticas.avaliacoes_concluidas + estatisticas.avaliacoes_pendentes > 0 &&
    estatisticas.avaliacoes_pendentes === 0 &&
    !lote.emissao_solicitada && !lote.tem_laudo;

  if (showSolicitar) {
    return (
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg">
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">\u2705</span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">Lote Conclu\u00EDdo</h4>
              <p className="text-sm text-gray-700">
                Todas as avalia\u00E7\u00F5es foram finalizadas. Voc\u00EA pode solicitar a emiss\u00E3o do laudo.
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              const confirmado = confirm(\`Confirma a solicita\u00E7\u00E3o de emiss\u00E3o do laudo para o lote \${lote.id}?\\n\\nO laudo ser\u00E1 gerado e enviado para o emissor respons\u00E1vel.\`);
              if (!confirmado) return;
              try {
                const response = await fetch(\`/api/lotes/\${lote.id}/solicitar-emissao\`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Erro ao solicitar emiss\u00E3o');
                toast.success('Emiss\u00E3o solicitada com sucesso!');
                if (!foiExibidaParaLote(lote.id)) {
                  const contato = data.gestor_contato as { email: string | null; celular: string | null } | undefined;
                  setModalEmissao({ loteId: lote.id, gestorEmail: contato?.email ?? null, gestorCelular: contato?.celular ?? null });
                } else {
                  setTimeout(() => loadLoteData(), 1500);
                }
              } catch (error: any) {
                toast.error(error.message || 'Erro ao solicitar emiss\u00E3o');
              }
            }}
            className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-semibold text-base flex items-center justify-center gap-2 shadow-md"
          >
            <span className="text-xl">\uD83D\uDE80</span>
            <span>Solicitar Emiss\u00E3o do Laudo</span>
          </button>
        </div>
      </div>
    );
  }

  if (lote.emissao_solicitada && !lote.tem_laudo) {
    return (
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">\uD83D\uDCCB</span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">Emiss\u00E3o Solicitada</h4>
              <p className="text-sm text-gray-700">
                A emiss\u00E3o do laudo foi solicitada em{' '}
                {lote.emissao_solicitado_em ? formatDate(lote.emissao_solicitado_em) : 'data n\u00E3o dispon\u00EDvel'}.
                O laudo est\u00E1 sendo processado pelo emissor.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (lote.tem_laudo) {
    return (
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 border-2 border-purple-300 rounded-lg">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">\u2705</span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">Laudo Emitido</h4>
              <p className="text-sm text-gray-700 mb-2">
                O laudo deste lote j\u00E1 foi emitido {lote.laudo_status === 'enviado' ? 'e enviado' : ''}.
                {lote.emitido_em && \` Emitido em \${formatDate(lote.emitido_em)}\`}
              </p>
              {lote.emissor_nome && <p className="text-xs text-purple-700">Emissor: {lote.emissor_nome}</p>}
            </div>
          </div>
          {lote.laudo_id && lote.arquivo_remoto_url && (
            <button
              onClick={async () => {
                try {
                  toast.loading('Baixando laudo...', { id: 'laudo-download' });
                  const response = await fetch(\`/api/rh/laudos/\${lote.laudo_id}/download\`);
                  if (!response.ok) throw new Error('Erro ao baixar laudo');
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = \`Laudo_\${lote.id}.pdf\`;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                  toast.success('Laudo baixado com sucesso!', { id: 'laudo-download' });
                } catch (err) {
                  console.error('Erro ao baixar laudo:', err);
                  toast.error('Erro ao baixar laudo', { id: 'laudo-download' });
                }
              }}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors mb-3 font-medium"
            >
              \uD83D\uDCC4 Ver Laudo / Baixar PDF
            </button>
          )}
          {lote.hash_pdf && lote.arquivo_remoto_url && (
            <div className="bg-white p-3 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-purple-800 uppercase">\uD83D\uDD12 Hash de Integridade (SHA-256)</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(lote.hash_pdf!).then(() => toast.success('Hash copiado!')).catch(() => toast.error('Erro ao copiar hash'));
                  }}
                  className="inline-flex items-center gap-1 bg-purple-600 text-white px-2 py-1 rounded text-xs hover:bg-purple-700"
                >
                  \uD83D\uDCCB Copiar
                </button>
              </div>
              <code className="text-[10px] font-mono text-gray-700 break-all block">{lote.hash_pdf}</code>
              <p className="text-xs text-purple-600 mt-2">Use este hash para verificar a autenticidade e integridade do PDF</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

function FuncionarioRow({ func, lote, abrirModalInativar, setModalResetar, gerarRelatorioFuncionario }: {
  func: any;
  lote: any;
  abrirModalInativar: (id: number, nome: string, cpf: string) => void;
  setModalResetar: (v: any) => void;
  gerarRelatorioFuncionario: (cpf: string, nome: string) => void;
}) {
  const statusInfo = getStatusBadgeInfo(func.avaliacao.status);

  return (
    <tr
      className={\`hover:bg-gray-50 \${
        func.avaliacao.status === 'inativada'
          ? 'bg-red-50 border-l-4 border-red-400'
          : func.avaliacao.status === 'concluida' || func.avaliacao.status === 'concluido'
            ? 'bg-green-50'
            : ''
      }\`}
    >
      <td className="px-3 py-2 text-sm text-gray-500 font-mono">#{func.avaliacao.id}</td>
      <td className="px-3 py-2 text-sm text-gray-900">
        <div className="flex items-center gap-2">
          {func.avaliacao.status === 'inativada' && (
            <span className="text-red-500 text-xs" title="Avalia\u00E7\u00E3o inativada">\u26A0\uFE0F</span>
          )}
          {func.nome}
        </div>
      </td>
      <td className="px-3 py-2 text-sm text-gray-600 font-mono">{func.cpf}</td>
      <td className="px-3 py-2 text-sm text-gray-600">
        {func.nivel_cargo === 'operacional' ? 'Operacional' : func.nivel_cargo === 'gestao' ? 'Gest\u00E3o' : '-'}
      </td>
      <td className="px-3 py-2 text-sm">
        <span className={\`px-2 py-1 text-xs rounded-full font-medium \${statusInfo.color}\`}>{statusInfo.label}</span>
      </td>
      <td className="px-3 py-2 text-sm text-gray-600">
        {func.avaliacao.status === 'concluido' || func.avaliacao.status === 'concluida'
          ? formatarData(func.avaliacao.data_conclusao) : '-'}
      </td>
      <td className="px-3 py-2 text-sm text-gray-600">
        {func.avaliacao.status === 'inativada' && func.avaliacao.data_inativacao ? (
          <div className="flex gap-2">
            <span>{formatarData(func.avaliacao.data_inativacao)}</span>
            {func.avaliacao.motivo_inativacao && (
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">{func.avaliacao.motivo_inativacao}</span>
            )}
          </div>
        ) : '-'}
      </td>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((g) => {
        const media = func.grupos?.[\`g\${g}\`];
        const style = getClassificacaoStyle(media, g);
        return (
          <td key={\`g\${g}\`} className="px-1 py-2 text-sm text-center">
            {style ? (
              <span className={\`px-2 py-1 text-xs rounded-full font-medium whitespace-nowrap \${style.colorClass}\`}>
                {style.label}
              </span>
            ) : null}
          </td>
        );
      })}
      <td className="px-3 py-2 text-sm text-center">
        <div className="flex gap-1 justify-center">
          {func.avaliacao.status !== 'concluida' && func.avaliacao.status !== 'concluido' &&
            func.avaliacao.status !== 'inativada' && !lote?.emissao_solicitada && !lote?.emitido_em && (
              <button
                onClick={() => abrirModalInativar(func.avaliacao.id, func.nome, func.cpf)}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
                title="Inativar avalia\u00E7\u00E3o"
              >
                \uD83D\uDEAB Inativar
              </button>
            )}
          {(func.avaliacao.status === 'iniciada' || func.avaliacao.status === 'em_andamento' ||
            func.avaliacao.status === 'concluida' || func.avaliacao.status === 'concluido') &&
            !lote?.emissao_solicitada && !lote?.emitido_em && (
              <button
                onClick={() => setModalResetar({ avaliacaoId: func.avaliacao.id, funcionarioNome: func.nome, funcionarioCpf: func.cpf })}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-amber-600 rounded hover:bg-amber-700 transition-colors"
                title="Resetar avalia\u00E7\u00E3o"
              >
                \u21BB Reset
              </button>
            )}
          <button
            onClick={() => gerarRelatorioFuncionario(func.cpf, func.nome)}
            disabled={func.avaliacao.status !== 'concluido' && func.avaliacao.status !== 'concluida'}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            title={func.avaliacao.status === 'concluido' || func.avaliacao.status === 'concluida' ? 'Gerar relat\u00F3rio PDF' : 'Relat\u00F3rio dispon\u00EDvel apenas para avalia\u00E7\u00F5es conclu\u00EDdas'}
          >
            \uD83D\uDCC4 PDF
          </button>
        </div>
      </td>
    </tr>
  );
}
`;

fs.writeFileSync(TARGET, content, 'utf8');
console.log(
  'OK: RH page.tsx rewritten (' + content.split('\\n').length + ' lines)'
);
